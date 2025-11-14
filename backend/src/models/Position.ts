import { query, queryOne } from '../config/database'
import { Position, PositionSide } from '../types'

export interface PositionRow {
  position_id: string
  user_id: number
  symbol: string
  side: PositionSide
  quantity: string
  entry_price: string
  mark_price: string
  liquidation_price: string
  leverage: number
  margin: string
  unrealized_pnl: string
  realized_pnl: string
  margin_mode: 'CROSS' | 'ISOLATED'
  created_at: Date
  updated_at: Date
}

/**
 * Position Model
 */
export class PositionModel {
  /**
   * Find position by ID
   */
  static async findById(positionId: string): Promise<Position | null> {
    const row = await queryOne<PositionRow>(
      'SELECT * FROM positions WHERE position_id = ?',
      [positionId]
    )
    return row ? this.toPosition(row) : null
  }

  /**
   * Find user's positions
   */
  static async findByUserId(userId: number, symbol?: string): Promise<Position[]> {
    let sql = 'SELECT * FROM positions WHERE user_id = ? ORDER BY created_at DESC'
    const params: any[] = [userId]

    if (symbol) {
      sql = 'SELECT * FROM positions WHERE user_id = ? AND symbol = ? ORDER BY created_at DESC'
      params.push(symbol)
    }

    const rows = await query<PositionRow[]>(sql, params)
    return rows.map(this.toPosition)
  }

  /**
   * Find position by user and symbol
   */
  static async findByUserAndSymbol(
    userId: number,
    symbol: string,
    side: PositionSide
  ): Promise<Position | null> {
    const row = await queryOne<PositionRow>(
      'SELECT * FROM positions WHERE user_id = ? AND symbol = ? AND side = ?',
      [userId, symbol, side]
    )
    return row ? this.toPosition(row) : null
  }

  /**
   * Create new position
   */
  static async create(data: {
    positionId: string
    userId: number
    symbol: string
    side: PositionSide
    quantity: string
    entryPrice: string
    leverage: number
    margin: string
    marginMode: 'CROSS' | 'ISOLATED'
  }): Promise<Position> {
    await query(
      `INSERT INTO positions
       (position_id, user_id, symbol, side, quantity, entry_price, mark_price,
        liquidation_price, leverage, margin, unrealized_pnl, realized_pnl, margin_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.positionId,
        data.userId,
        data.symbol,
        data.side,
        data.quantity,
        data.entryPrice,
        data.entryPrice, // Initial mark price = entry price
        '0', // Liquidation price to be calculated
        data.leverage,
        data.margin,
        '0',
        '0',
        data.marginMode,
      ]
    )

    const position = await this.findById(data.positionId)
    if (!position) {
      throw new Error('Failed to create position')
    }

    return position
  }

  /**
   * Update position quantity
   */
  static async updateQuantity(
    positionId: string,
    quantity: string,
    entryPrice: string
  ): Promise<void> {
    await query(
      `UPDATE positions
       SET quantity = ?, entry_price = ?, updated_at = NOW()
       WHERE position_id = ?`,
      [quantity, entryPrice, positionId]
    )
  }

  /**
   * Update position mark price and PnL
   */
  static async updateMarkPrice(
    positionId: string,
    markPrice: string,
    unrealizedPnl: string,
    liquidationPrice: string
  ): Promise<void> {
    await query(
      `UPDATE positions
       SET mark_price = ?, unrealized_pnl = ?, liquidation_price = ?, updated_at = NOW()
       WHERE position_id = ?`,
      [markPrice, unrealizedPnl, liquidationPrice, positionId]
    )
  }

  /**
   * Update position leverage
   */
  static async updateLeverage(
    userId: number,
    symbol: string,
    leverage: number
  ): Promise<void> {
    await query(
      `UPDATE positions
       SET leverage = ?, updated_at = NOW()
       WHERE user_id = ? AND symbol = ?`,
      [leverage, userId, symbol]
    )
  }

  /**
   * Update realized PnL
   */
  static async updateRealizedPnl(positionId: string, realizedPnl: string): Promise<void> {
    await query(
      `UPDATE positions
       SET realized_pnl = ?, updated_at = NOW()
       WHERE position_id = ?`,
      [realizedPnl, positionId]
    )
  }

  /**
   * Close position
   */
  static async close(positionId: string): Promise<void> {
    await query('DELETE FROM positions WHERE position_id = ?', [positionId])
  }

  /**
   * Get total margin used by user
   */
  static async getTotalMarginByUserId(userId: number): Promise<string> {
    const row = await queryOne<{ total: string }>(
      'SELECT COALESCE(SUM(CAST(margin AS DECIMAL(20,8))), 0) as total FROM positions WHERE user_id = ?',
      [userId]
    )
    return row ? row.total : '0'
  }

  /**
   * Get total unrealized PnL by user
   */
  static async getTotalUnrealizedPnlByUserId(userId: number): Promise<string> {
    const row = await queryOne<{ total: string }>(
      'SELECT COALESCE(SUM(CAST(unrealized_pnl AS DECIMAL(20,8))), 0) as total FROM positions WHERE user_id = ?',
      [userId]
    )
    return row ? row.total : '0'
  }

  /**
   * Convert database row to Position object
   */
  private static toPosition(row: PositionRow): Position {
    return {
      positionId: row.position_id,
      userId: row.user_id,
      symbol: row.symbol,
      side: row.side,
      quantity: row.quantity,
      entryPrice: row.entry_price,
      markPrice: row.mark_price,
      liquidationPrice: row.liquidation_price,
      leverage: row.leverage,
      margin: row.margin,
      unrealizedPnl: row.unrealized_pnl,
      realizedPnl: row.realized_pnl,
      marginMode: row.margin_mode,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
