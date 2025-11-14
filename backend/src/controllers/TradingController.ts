import { Request, Response } from 'express'
import { TradingService } from '../services/TradingService'
import { sendSuccess } from '../utils/response'
import { asyncHandler } from '../middleware/errorHandler'
import { CreateOrderRequest } from '../types'

/**
 * Trading Controller - Handle trading operations
 */
export class TradingController {
  /**
   * POST /api/trade/order
   * Create a new order
   */
  static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id // Will be set by auth middleware
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const request: CreateOrderRequest = {
      symbol: req.body.symbol,
      side: req.body.side,
      type: req.body.type,
      price: req.body.price,
      stopPrice: req.body.stopPrice,
      quantity: req.body.quantity,
      timeInForce: req.body.timeInForce,
      reduceOnly: req.body.reduceOnly,
      postOnly: req.body.postOnly,
      signature: req.body.signature,
    }

    const order = await TradingService.createOrder(userId, request)
    sendSuccess(res, order, 201)
  })

  /**
   * DELETE /api/trade/order/:orderId
   * Cancel an order
   */
  static cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const { orderId } = req.params
    await TradingService.cancelOrder(userId, orderId)

    sendSuccess(res, { message: 'Order cancelled successfully' })
  })

  /**
   * DELETE /api/trade/orders/all
   * Cancel all open orders
   */
  static cancelAllOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const symbol = req.query.symbol as string | undefined
    const cancelledCount = await TradingService.cancelAllOrders(userId, symbol)

    sendSuccess(res, {
      message: `${cancelledCount} orders cancelled`,
      count: cancelledCount,
    })
  })

  /**
   * GET /api/trade/orders/open
   * Get user's open orders
   */
  static getOpenOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const symbol = req.query.symbol as string | undefined
    const orders = await TradingService.getOpenOrders(userId, symbol)

    sendSuccess(res, orders)
  })

  /**
   * GET /api/trade/orders/history
   * Get user's order history
   */
  static getOrderHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    if (limit < 1 || limit > 500) {
      throw new Error('Limit must be between 1 and 500')
    }

    const orders = await TradingService.getOrderHistory(userId, limit, offset)
    sendSuccess(res, orders)
  })

  /**
   * GET /api/trade/order/:orderId
   * Get order details
   */
  static getOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const { orderId } = req.params
    const order = await TradingService.getOrder(userId, orderId)

    sendSuccess(res, order)
  })

  /**
   * POST /api/trade/leverage
   * Set leverage for a symbol
   */
  static setLeverage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const { symbol, leverage } = req.body

    if (!symbol || !leverage) {
      throw new Error('Symbol and leverage are required')
    }

    await TradingService.setLeverage(userId, symbol, leverage)

    sendSuccess(res, {
      message: 'Leverage updated successfully',
      symbol,
      leverage,
    })
  })
}
