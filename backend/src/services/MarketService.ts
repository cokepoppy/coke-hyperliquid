import { TradingPairModel } from '../models/TradingPair'
import { query, queryOne } from '../config/database'
import { TradingPair, Ticker, OrderBook, Trade, Kline, OrderBookLevel } from '../types'
import { createError } from '../utils/response'

/**
 * Market Service - Business logic for market data
 */
export class MarketService {
  /**
   * Get all trading pairs
   */
  static async getTradingPairs(): Promise<TradingPair[]> {
    return await TradingPairModel.findAll()
  }

  /**
   * Get trading pair by symbol
   */
  static async getTradingPair(symbol: string): Promise<TradingPair> {
    const pair = await TradingPairModel.findBySymbol(symbol)
    if (!pair) {
      throw createError.marketNotFound(symbol)
    }
    return pair
  }

  /**
   * Get ticker for a symbol
   */
  static async getTicker(symbol: string): Promise<Ticker> {
    // Verify symbol exists
    await this.getTradingPair(symbol)

    const row = await queryOne<any>(
      'SELECT * FROM tickers WHERE symbol = ?',
      [symbol]
    )

    if (!row) {
      throw createError.marketNotFound(symbol)
    }

    return {
      symbol: row.symbol,
      lastPrice: row.last_price.toString(),
      change24h: row.change_24h.toString(),
      high24h: row.high_24h.toString(),
      low24h: row.low_24h.toString(),
      volume24h: row.volume_24h.toString(),
      quoteVolume24h: row.quote_volume_24h.toString(),
      openPrice: row.open_price.toString(),
      timestamp: new Date(row.updated_at).getTime(),
    }
  }

  /**
   * Get all tickers
   */
  static async getAllTickers(): Promise<Ticker[]> {
    const rows = await query<any[]>('SELECT * FROM tickers')

    return rows.map(row => ({
      symbol: row.symbol,
      lastPrice: row.last_price.toString(),
      change24h: row.change_24h.toString(),
      high24h: row.high_24h.toString(),
      low24h: row.low_24h.toString(),
      volume24h: row.volume_24h.toString(),
      quoteVolume24h: row.quote_volume_24h.toString(),
      openPrice: row.open_price.toString(),
      timestamp: new Date(row.updated_at).getTime(),
    }))
  }

  /**
   * Get order book for a symbol
   * This is a simplified implementation - in production, this would be cached in Redis
   */
  static async getOrderBook(symbol: string, depth: number = 20): Promise<OrderBook> {
    // Verify symbol exists
    await this.getTradingPair(symbol)

    // In a real implementation, this would come from a real-time order book engine
    // For now, we'll generate mock data based on current ticker
    const ticker = await this.getTicker(symbol)
    const lastPrice = parseFloat(ticker.lastPrice)

    // Generate mock bids (buy orders)
    const bids: OrderBookLevel[] = []
    for (let i = 0; i < depth; i++) {
      const price = (lastPrice * (1 - (i + 1) * 0.0001)).toFixed(2)
      const quantity = (Math.random() * 10 + 0.5).toFixed(4)
      bids.push({
        price,
        quantity,
        total: (parseFloat(price) * parseFloat(quantity)).toFixed(2),
      })
    }

    // Generate mock asks (sell orders)
    const asks: OrderBookLevel[] = []
    for (let i = 0; i < depth; i++) {
      const price = (lastPrice * (1 + (i + 1) * 0.0001)).toFixed(2)
      const quantity = (Math.random() * 10 + 0.5).toFixed(4)
      asks.push({
        price,
        quantity,
        total: (parseFloat(price) * parseFloat(quantity)).toFixed(2),
      })
    }

    return {
      symbol,
      bids,
      asks,
      timestamp: Date.now(),
    }
  }

  /**
   * Get recent trades for a symbol
   */
  static async getRecentTrades(symbol: string, limit: number = 50): Promise<Trade[]> {
    // Verify symbol exists
    await this.getTradingPair(symbol)

    // Get recent trades from database
    const rows = await query<any[]>(
      `SELECT trade_id, symbol, side, price, quantity, created_at
       FROM trades
       WHERE symbol = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [symbol, limit]
    )

    return rows.map(row => ({
      tradeId: row.trade_id,
      symbol: row.symbol,
      price: row.price.toString(),
      quantity: row.quantity.toString(),
      side: row.side,
      timestamp: new Date(row.created_at).getTime(),
    }))
  }

  /**
   * Get K-line (candlestick) data
   * This is a simplified mock implementation
   */
  static async getKlines(
    symbol: string,
    interval: string,
    limit: number = 500
  ): Promise<Kline[]> {
    // Verify symbol exists
    await this.getTradingPair(symbol)

    // Get ticker for base price
    const ticker = await this.getTicker(symbol)
    const basePrice = parseFloat(ticker.lastPrice)

    // Generate mock klines
    const klines: Kline[] = []
    const intervalMs = this.getIntervalMs(interval)
    const now = Date.now()

    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - i * intervalMs
      const volatility = 0.02 // 2% volatility

      const open = basePrice * (1 + (Math.random() - 0.5) * volatility)
      const close = basePrice * (1 + (Math.random() - 0.5) * volatility)
      const high = Math.max(open, close) * (1 + Math.random() * volatility / 2)
      const low = Math.min(open, close) * (1 - Math.random() * volatility / 2)
      const volume = (Math.random() * 100 + 10).toFixed(4)

      klines.push({
        timestamp,
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume,
        closeTime: timestamp + intervalMs - 1,
      })
    }

    return klines
  }

  /**
   * Convert interval string to milliseconds
   */
  private static getIntervalMs(interval: string): number {
    const intervals: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1H': 60 * 60 * 1000,
      '4H': 4 * 60 * 60 * 1000,
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
    }
    return intervals[interval] || intervals['1H']
  }

  /**
   * Get funding rate (for perpetual markets)
   */
  static async getFundingRate(symbol: string): Promise<{ symbol: string; rate: string; timestamp: number }> {
    // Verify it's a perpetual market
    const pair = await this.getTradingPair(symbol)
    if (pair.type !== 'PERPETUAL') {
      throw createError.badRequest('Funding rate is only available for perpetual markets')
    }

    // Get latest funding rate
    const row = await queryOne<any>(
      `SELECT * FROM funding_rates
       WHERE symbol = ?
       ORDER BY timestamp DESC
       LIMIT 1`,
      [symbol]
    )

    if (!row) {
      // Return default 0 funding rate if none exists
      return {
        symbol,
        rate: '0.0001',
        timestamp: Date.now(),
      }
    }

    return {
      symbol: row.symbol,
      rate: row.rate.toString(),
      timestamp: new Date(row.timestamp).getTime(),
    }
  }
}
