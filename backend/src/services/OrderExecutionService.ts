import { v4 as uuidv4 } from 'uuid'
import { OrderModel } from '../models/Order'
import { PositionModel } from '../models/Position'
import { AssetModel } from '../models/Asset'
import { TradingPairModel } from '../models/TradingPair'
import { Order, PositionSide } from '../types'
import { HyperliquidService } from './HyperliquidService'
import { createError } from '../utils/response'
import logger from '../utils/logger'

/**
 * Order Execution Service - Handles order matching and execution
 */
export class OrderExecutionService {
  /**
   * Execute an order immediately (for demo purposes)
   * In production, this would be handled by a matching engine
   */
  static async executeOrder(order: Order): Promise<void> {
    try {
      logger.info('Executing order', { orderId: order.orderId, symbol: order.symbol, side: order.side, type: order.type })

      // Get trading pair
      const pair = await TradingPairModel.findBySymbol(order.symbol)
      if (!pair) {
        throw createError.marketNotFound(order.symbol)
      }

      // Determine execution price
      const executionPrice = await this.getExecutionPrice(order, pair)

      // Execute based on market type
      if (pair.type === 'SPOT') {
        await this.executeSpotOrder(order, pair, executionPrice)
      } else if (pair.type === 'PERPETUAL') {
        await this.executePerpetualOrder(order, pair, executionPrice)
      }

      logger.info('Order executed successfully', { orderId: order.orderId, executionPrice })
    } catch (error: any) {
      logger.error('Failed to execute order', { orderId: order.orderId, error: error.message })
      // Update order status to FAILED or REJECTED
      await OrderModel.updateStatus(order.orderId, 'CANCELLED')
      throw error
    }
  }

  /**
   * Get execution price for order
   */
  private static async getExecutionPrice(order: Order, pair: any): Promise<string> {
    if (order.type === 'MARKET') {
      // For market orders, use current market price
      try {
        const coin = HyperliquidService.symbolToCoin(order.symbol)
        const ticker = await HyperliquidService.getTicker(coin)
        return ticker.lastPrice
      } catch (error) {
        logger.warn('Failed to get market price, using fallback', { symbol: order.symbol })
        // Fallback prices
        if (order.symbol.includes('BTC')) return '98000'
        if (order.symbol.includes('ETH')) return '3500'
        return '0'
      }
    } else {
      // For limit orders, use the order price
      return order.price || '0'
    }
  }

  /**
   * Execute spot order (buying/selling assets)
   */
  private static async executeSpotOrder(order: Order, pair: any, executionPrice: string): Promise<void> {
    const quantity = parseFloat(order.quantity)
    const price = parseFloat(executionPrice)
    const totalCost = quantity * price

    if (order.side === 'BUY') {
      // Buying: USDC -> BTC/ETH
      // 1. Deduct locked USDC (money was already locked when order was created)
      await AssetModel.deductLocked(order.userId, pair.quoteAsset, totalCost.toFixed(8))

      // 2. Add base asset (BTC/ETH) to free balance
      await AssetModel.getOrCreate(order.userId, pair.baseAsset)
      await AssetModel.addFree(order.userId, pair.baseAsset, quantity.toFixed(8))
    } else {
      // Selling: BTC/ETH -> USDC
      // 1. Deduct locked base asset (asset was already locked when order was created)
      await AssetModel.deductLocked(order.userId, pair.baseAsset, quantity.toFixed(8))

      // 2. Add USDC to free balance
      await AssetModel.getOrCreate(order.userId, pair.quoteAsset)
      await AssetModel.addFree(order.userId, pair.quoteAsset, totalCost.toFixed(8))
    }

    // 3. Mark order as filled
    await OrderModel.updateFill(order.orderId, order.quantity, '0')

    logger.info('Spot order executed', {
      orderId: order.orderId,
      side: order.side,
      quantity,
      price,
      totalCost,
    })
  }

  /**
   * Execute perpetual order (opening/closing positions)
   */
  private static async executePerpetualOrder(order: Order, pair: any, executionPrice: string): Promise<void> {
    const quantity = parseFloat(order.quantity)
    const price = parseFloat(executionPrice)
    const leverage = 10 // Default leverage, should come from user settings

    // Calculate margin required
    const notionalValue = quantity * price
    const margin = notionalValue / leverage

    // Determine position side
    const positionSide: PositionSide = order.side === 'BUY' ? 'LONG' : 'SHORT'

    // Check if user has existing position for this symbol
    const existingPosition = await PositionModel.findByUserAndSymbol(
      order.userId,
      order.symbol,
      positionSide
    )

    if (existingPosition) {
      // Update existing position (increase size)
      const existingQty = parseFloat(existingPosition.quantity)
      const existingEntry = parseFloat(existingPosition.entryPrice)
      const existingMargin = parseFloat(existingPosition.margin)

      // Calculate new average entry price
      const totalQty = existingQty + quantity
      const totalCost = (existingQty * existingEntry) + (quantity * price)
      const avgEntryPrice = totalCost / totalQty

      // Update position
      await PositionModel.updateQuantity(
        existingPosition.positionId,
        totalQty.toFixed(8),
        avgEntryPrice.toFixed(8)
      )

      // Update margin
      const newTotalMargin = existingMargin + margin
      // Note: We should also update the margin in the database, but the current model doesn't have this method
    } else {
      // Create new position
      const positionId = uuidv4()
      await PositionModel.create({
        positionId,
        userId: order.userId,
        symbol: order.symbol,
        side: positionSide,
        quantity: quantity.toFixed(8),
        entryPrice: price.toFixed(8),
        leverage,
        margin: margin.toFixed(8),
        marginMode: 'CROSS',
      })
    }

    // Deduct margin from locked balance
    // Note: The order creation already locked the full notional value,
    // we only need the margin, so we unlock the excess and deduct the margin
    const lockedAmount = parseFloat(order.price || executionPrice) * quantity
    const excessLocked = lockedAmount - margin

    if (excessLocked > 0) {
      // Unlock the excess that we don't need
      await AssetModel.unlock(order.userId, pair.quoteAsset, excessLocked.toFixed(8))
    }

    // Deduct the margin from locked balance
    await AssetModel.deductLocked(order.userId, pair.quoteAsset, margin.toFixed(8))

    // Mark order as filled
    await OrderModel.updateFill(order.orderId, order.quantity, '0')

    logger.info('Perpetual order executed', {
      orderId: order.orderId,
      side: order.side,
      positionSide,
      quantity,
      price,
      leverage,
      margin,
    })
  }
}
