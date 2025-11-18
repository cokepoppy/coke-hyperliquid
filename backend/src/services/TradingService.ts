import { v4 as uuidv4 } from 'uuid'
import { OrderModel } from '../models/Order'
import { PositionModel } from '../models/Position'
import { AssetModel } from '../models/Asset'
import { TradingPairModel } from '../models/TradingPair'
import { Order, CreateOrderRequest, Position } from '../types'
import { createError } from '../utils/response'
import { verifySignature } from '../utils/signature'
import { OrderExecutionService } from './OrderExecutionService'
import logger from '../utils/logger'

/**
 * Trading Service - Business logic for trading operations
 */
export class TradingService {
  /**
   * Create a new order
   */
  static async createOrder(userId: number, request: CreateOrderRequest): Promise<Order> {
    // Verify trading pair exists
    const pair = await TradingPairModel.findBySymbol(request.symbol)
    if (!pair) {
      throw createError.marketNotFound(request.symbol)
    }

    // Validate order parameters
    this.validateOrder(request, pair)

    // Verify signature
    const isValidSignature = await verifySignature(
      userId,
      request,
      request.signature
    )
    if (!isValidSignature) {
      throw createError.invalidSignature()
    }

    // Calculate required balance
    const requiredBalance = this.calculateRequiredBalance(request, pair)

    // Lock balance
    const asset = pair.quoteAsset // For now, always use quote asset (USDC)
    await AssetModel.getOrCreate(userId, asset)

    try {
      // Get current balance for debugging
      const userAsset = await AssetModel.findByUserAndAsset(userId, asset)
      logger.info('Order balance check', {
        userId,
        asset,
        requiredBalance,
        availableBalance: userAsset?.free || '0',
        symbol: request.symbol,
        side: request.side,
        price: request.price,
        quantity: request.quantity
      })

      await AssetModel.lock(userId, asset, requiredBalance)
    } catch (error: any) {
      logger.error('Failed to lock balance', {
        userId,
        asset,
        requiredBalance,
        error: error.message
      })
      throw createError.insufficientBalance(error.message)
    }

    // Create order
    const orderId = uuidv4()
    const order = await OrderModel.create({
      orderId,
      userId,
      symbol: request.symbol,
      side: request.side,
      type: request.type,
      price: request.price,
      stopPrice: request.stopPrice,
      quantity: request.quantity,
      timeInForce: request.timeInForce || 'GTC',
      reduceOnly: request.reduceOnly || false,
      postOnly: request.postOnly || false,
      signature: request.signature,
    })

    // Execute order immediately (for demo purposes)
    // In production, this would be handled by a separate matching engine
    try {
      await OrderExecutionService.executeOrder(order)
    } catch (error: any) {
      logger.error('Order execution failed', { orderId, error: error.message })
      // Order will remain in OPEN or CANCELLED state
    }

    // Fetch updated order to return latest status
    const updatedOrder = await OrderModel.findById(orderId)
    return updatedOrder || order
  }

  /**
   * Cancel an order
   */
  static async cancelOrder(userId: number, orderId: string): Promise<void> {
    const order = await OrderModel.findById(orderId)

    if (!order) {
      throw createError.notFound('Order not found')
    }

    if (order.userId !== userId) {
      throw createError.forbidden('Not authorized to cancel this order')
    }

    if (order.status !== 'OPEN' && order.status !== 'PARTIALLY_FILLED') {
      throw createError.badRequest('Order cannot be cancelled')
    }

    // Release locked balance
    const pair = await TradingPairModel.findBySymbol(order.symbol)
    if (pair) {
      const asset = pair.quoteAsset
      const lockedAmount = this.calculateLockedAmount(order)
      await AssetModel.unlock(userId, asset, lockedAmount)
    }

    // Cancel order
    await OrderModel.cancel(orderId)
  }

  /**
   * Cancel all orders for a user
   */
  static async cancelAllOrders(userId: number, symbol?: string): Promise<number> {
    const orders = await OrderModel.findOpenByUserId(userId, symbol)

    // Release locked balances
    for (const order of orders) {
      const pair = await TradingPairModel.findBySymbol(order.symbol)
      if (pair) {
        const asset = pair.quoteAsset
        const lockedAmount = this.calculateLockedAmount(order)
        try {
          await AssetModel.unlock(userId, asset, lockedAmount)
        } catch (error) {
          // Continue even if unlock fails
        }
      }
    }

    const cancelledCount = await OrderModel.cancelAllByUserId(userId, symbol)
    return cancelledCount
  }

  /**
   * Get user's open orders
   */
  static async getOpenOrders(userId: number, symbol?: string): Promise<Order[]> {
    return await OrderModel.findOpenByUserId(userId, symbol)
  }

  /**
   * Get user's order history
   */
  static async getOrderHistory(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<Order[]> {
    return await OrderModel.findByUserId(userId, limit, offset)
  }

  /**
   * Get order by ID
   */
  static async getOrder(userId: number, orderId: string): Promise<Order> {
    const order = await OrderModel.findById(orderId)

    if (!order) {
      throw createError.notFound('Order not found')
    }

    if (order.userId !== userId) {
      throw createError.forbidden('Not authorized to view this order')
    }

    return order
  }

  /**
   * Set leverage for a symbol
   */
  static async setLeverage(
    userId: number,
    symbol: string,
    leverage: number
  ): Promise<void> {
    // Verify trading pair exists and is perpetual
    const pair = await TradingPairModel.findBySymbol(symbol)
    if (!pair) {
      throw createError.marketNotFound(symbol)
    }

    if (pair.type !== 'PERPETUAL') {
      throw createError.badRequest('Leverage is only available for perpetual markets')
    }

    // Validate leverage
    if (leverage < 1 || leverage > 100) {
      throw createError.badRequest('Leverage must be between 1 and 100')
    }

    // Check if user has open positions
    const positions = await PositionModel.findByUserId(userId, symbol)
    if (positions.length > 0) {
      throw createError.badRequest('Cannot change leverage with open positions')
    }

    // Update leverage (would be stored in user_settings table in production)
    // For now, this is a no-op, leverage would be applied when creating new positions
  }

  /**
   * Validate order parameters
   */
  private static validateOrder(request: CreateOrderRequest, pair: any): void {
    const quantity = parseFloat(request.quantity)

    // Validate quantity
    if (isNaN(quantity) || quantity <= 0) {
      throw createError.invalidOrder('Invalid quantity')
    }

    const minOrderSize = parseFloat(pair.minOrderSize)
    const maxOrderSize = parseFloat(pair.maxOrderSize)

    if (quantity < minOrderSize) {
      throw createError.invalidOrder(
        `Order size too small. Minimum: ${minOrderSize}`,
        { minOrderSize }
      )
    }

    if (quantity > maxOrderSize) {
      throw createError.invalidOrder(
        `Order size too large. Maximum: ${maxOrderSize}`,
        { maxOrderSize }
      )
    }

    // Validate price for limit orders
    if (request.type === 'LIMIT' || request.type === 'STOP_LIMIT') {
      if (!request.price) {
        throw createError.invalidOrder('Price is required for limit orders')
      }

      const price = parseFloat(request.price)
      if (isNaN(price) || price <= 0) {
        throw createError.invalidOrder('Invalid price')
      }

      // Validate tick size
      const tickSize = parseFloat(pair.tickSize)
      // Use rounding to avoid floating point precision issues
      const roundedPrice = Math.round(price / tickSize) * tickSize
      if (Math.abs(price - roundedPrice) > 0.0000001) {
        throw createError.invalidOrder(
          `Price must be a multiple of tick size ${tickSize}`
        )
      }
    }

    // Validate stop price for stop orders
    if (request.type === 'STOP_LIMIT' || request.type === 'STOP_MARKET') {
      if (!request.stopPrice) {
        throw createError.invalidOrder('Stop price is required for stop orders')
      }

      const stopPrice = parseFloat(request.stopPrice)
      if (isNaN(stopPrice) || stopPrice <= 0) {
        throw createError.invalidOrder('Invalid stop price')
      }
    }
  }

  /**
   * Calculate required balance for an order
   */
  private static calculateRequiredBalance(request: CreateOrderRequest, pair: any): string {
    const quantity = parseFloat(request.quantity)

    if (request.type === 'MARKET') {
      // For market orders, estimate with a buffer
      // In production, this would use the orderbook to estimate
      return (quantity * 1.01).toFixed(8) // 1% buffer
    } else {
      // For limit orders, use the specified price
      const price = parseFloat(request.price!)
      if (request.side === 'BUY') {
        return (price * quantity).toFixed(8)
      } else {
        // For SELL orders, lock the base asset quantity
        return quantity.toFixed(8)
      }
    }
  }

  /**
   * Calculate locked amount from order
   */
  private static calculateLockedAmount(order: Order): string {
    const remainingQty = parseFloat(order.remainingQuantity)

    if (order.type === 'MARKET') {
      return (remainingQty * 1.01).toFixed(8)
    } else if (order.price) {
      const price = parseFloat(order.price)
      if (order.side === 'BUY') {
        return (price * remainingQty).toFixed(8)
      } else {
        return remainingQty.toFixed(8)
      }
    }

    return '0'
  }
}
