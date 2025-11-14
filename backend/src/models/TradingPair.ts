import { query, queryOne } from '../config/database'
import { TradingPair, PairType } from '../types'

export interface TradingPairRow {
  id: number
  symbol: string
  base_asset: string
  quote_asset: string
  type: PairType
  min_order_size: string
  max_order_size: string
  tick_size: string
  status: 'ACTIVE' | 'INACTIVE' | 'DELISTED'
  created_at: Date
  updated_at: Date
}

/**
 * Trading Pair Model
 */
export class TradingPairModel {
  /**
   * Get all active trading pairs
   */
  static async findAll(): Promise<TradingPair[]> {
    const rows = await query<TradingPairRow[]>(
      'SELECT * FROM trading_pairs WHERE status = ? ORDER BY symbol',
      ['ACTIVE']
    )
    return rows.map(this.toTradingPair)
  }

  /**
   * Find trading pair by symbol
   */
  static async findBySymbol(symbol: string): Promise<TradingPair | null> {
    const row = await queryOne<TradingPairRow>(
      'SELECT * FROM trading_pairs WHERE symbol = ? AND status = ?',
      [symbol, 'ACTIVE']
    )
    return row ? this.toTradingPair(row) : null
  }

  /**
   * Get trading pairs by type
   */
  static async findByType(type: PairType): Promise<TradingPair[]> {
    const rows = await query<TradingPairRow[]>(
      'SELECT * FROM trading_pairs WHERE type = ? AND status = ? ORDER BY symbol',
      [type, 'ACTIVE']
    )
    return rows.map(this.toTradingPair)
  }

  /**
   * Create new trading pair
   */
  static async create(data: {
    symbol: string
    baseAsset: string
    quoteAsset: string
    type: PairType
    minOrderSize: string
    maxOrderSize: string
    tickSize: string
  }): Promise<TradingPair> {
    const result = await query<any>(
      `INSERT INTO trading_pairs
       (symbol, base_asset, quote_asset, type, min_order_size, max_order_size, tick_size)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.symbol,
        data.baseAsset,
        data.quoteAsset,
        data.type,
        data.minOrderSize,
        data.maxOrderSize,
        data.tickSize,
      ]
    )

    const pair = await this.findBySymbol(data.symbol)
    if (!pair) {
      throw new Error('Failed to create trading pair')
    }

    return pair
  }

  /**
   * Update trading pair status
   */
  static async updateStatus(
    symbol: string,
    status: 'ACTIVE' | 'INACTIVE' | 'DELISTED'
  ): Promise<void> {
    await query(
      'UPDATE trading_pairs SET status = ?, updated_at = NOW() WHERE symbol = ?',
      [status, symbol]
    )
  }

  /**
   * Check if symbol exists
   */
  static async existsBySymbol(symbol: string): Promise<boolean> {
    const row = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM trading_pairs WHERE symbol = ?',
      [symbol]
    )
    return row ? row.count > 0 : false
  }

  /**
   * Convert database row to TradingPair object
   */
  private static toTradingPair(row: TradingPairRow): TradingPair {
    return {
      symbol: row.symbol,
      baseAsset: row.base_asset,
      quoteAsset: row.quote_asset,
      type: row.type,
      minOrderSize: row.min_order_size,
      maxOrderSize: row.max_order_size,
      tickSize: row.tick_size,
      status: row.status,
    }
  }
}
