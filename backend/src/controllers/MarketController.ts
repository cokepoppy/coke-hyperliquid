import { Request, Response } from 'express'
import { MarketService } from '../services/MarketService'
import { sendSuccess } from '../utils/response'
import { asyncHandler } from '../middleware/errorHandler'

/**
 * Market Controller - Handle market data requests
 */
export class MarketController {
  /**
   * GET /api/market/pairs
   * Get all trading pairs
   */
  static getTradingPairs = asyncHandler(async (req: Request, res: Response) => {
    const pairs = await MarketService.getTradingPairs()
    sendSuccess(res, pairs)
  })

  /**
   * GET /api/market/pair/:symbol
   * Get specific trading pair
   */
  static getTradingPair = asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params
    const pair = await MarketService.getTradingPair(symbol)
    sendSuccess(res, pair)
  })

  /**
   * GET /api/market/ticker/:symbol
   * Get ticker for a symbol
   */
  static getTicker = asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params
    const ticker = await MarketService.getTicker(symbol)
    sendSuccess(res, ticker)
  })

  /**
   * GET /api/market/tickers
   * Get all tickers
   */
  static getAllTickers = asyncHandler(async (req: Request, res: Response) => {
    const tickers = await MarketService.getAllTickers()
    sendSuccess(res, tickers)
  })

  /**
   * GET /api/market/orderbook/:symbol
   * Get order book for a symbol
   */
  static getOrderBook = asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params
    const depth = parseInt(req.query.depth as string) || 20

    if (depth < 1 || depth > 100) {
      throw new Error('Depth must be between 1 and 100')
    }

    const orderbook = await MarketService.getOrderBook(symbol, depth)
    sendSuccess(res, orderbook)
  })

  /**
   * GET /api/market/trades/:symbol
   * Get recent trades
   */
  static getRecentTrades = asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params
    const limit = parseInt(req.query.limit as string) || 50

    if (limit < 1 || limit > 500) {
      throw new Error('Limit must be between 1 and 500')
    }

    const trades = await MarketService.getRecentTrades(symbol, limit)
    sendSuccess(res, trades)
  })

  /**
   * GET /api/market/klines/:symbol
   * Get K-line data
   */
  static getKlines = asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params
    const interval = (req.query.interval as string) || '1H'
    const limit = parseInt(req.query.limit as string) || 500

    if (limit < 1 || limit > 1000) {
      throw new Error('Limit must be between 1 and 1000')
    }

    const validIntervals = ['1m', '5m', '15m', '1H', '4H', '1D', '1W']
    if (!validIntervals.includes(interval)) {
      throw new Error(`Invalid interval. Must be one of: ${validIntervals.join(', ')}`)
    }

    const klines = await MarketService.getKlines(symbol, interval, limit)
    sendSuccess(res, klines)
  })

  /**
   * GET /api/market/funding/:symbol
   * Get funding rate for perpetual markets
   */
  static getFundingRate = asyncHandler(async (req: Request, res: Response) => {
    const { symbol } = req.params
    const fundingRate = await MarketService.getFundingRate(symbol)
    sendSuccess(res, fundingRate)
  })
}
