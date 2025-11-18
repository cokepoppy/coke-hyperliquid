import { query, queryOne, transaction } from '../config/database'
import { Asset } from '../types'
import type { PoolConnection } from 'mysql2/promise'

export interface AssetRow {
  id: number
  user_id: number
  asset: string
  free: string
  locked: string
  created_at: Date
  updated_at: Date
}

/**
 * Asset Model
 */
export class AssetModel {
  /**
   * Get user's assets
   */
  static async findByUserId(userId: number): Promise<Asset[]> {
    const rows = await query<AssetRow[]>(
      'SELECT * FROM assets WHERE user_id = ? ORDER BY asset',
      [userId]
    )
    return rows.map(row => this.toAsset(row))
  }

  /**
   * Get specific asset for user
   */
  static async findByUserAndAsset(userId: number, asset: string): Promise<Asset | null> {
    const row = await queryOne<AssetRow>(
      'SELECT * FROM assets WHERE user_id = ? AND asset = ?',
      [userId, asset]
    )
    return row ? this.toAsset(row) : null
  }

  /**
   * Create or get user asset
   */
  static async getOrCreate(userId: number, asset: string): Promise<Asset> {
    let userAsset = await this.findByUserAndAsset(userId, asset)

    if (!userAsset) {
      await query(
        'INSERT INTO assets (user_id, asset, free, locked) VALUES (?, ?, ?, ?)',
        [userId, asset, '0', '0']
      )
      userAsset = await this.findByUserAndAsset(userId, asset)
    }

    if (!userAsset) {
      throw new Error('Failed to create asset')
    }

    return userAsset
  }

  /**
   * Update free balance
   */
  static async updateFree(userId: number, asset: string, amount: string): Promise<void> {
    await query(
      `UPDATE assets
       SET free = ?, updated_at = NOW()
       WHERE user_id = ? AND asset = ?`,
      [amount, userId, asset]
    )
  }

  /**
   * Lock balance (for orders)
   */
  static async lock(userId: number, asset: string, amount: string): Promise<void> {
    await transaction(async (conn: PoolConnection) => {
      // Get current balance with lock
      const [rows] = await conn.execute(
        'SELECT * FROM assets WHERE user_id = ? AND asset = ? FOR UPDATE',
        [userId, asset]
      )
      const row = (rows as AssetRow[])[0]

      if (!row) {
        throw new Error('Asset not found')
      }

      const free = parseFloat(row.free)
      const locked = parseFloat(row.locked)
      const lockAmount = parseFloat(amount)

      if (free < lockAmount) {
        throw new Error('Insufficient balance')
      }

      const newFree = (free - lockAmount).toFixed(8)
      const newLocked = (locked + lockAmount).toFixed(8)

      await conn.execute(
        `UPDATE assets
         SET free = ?, locked = ?, updated_at = NOW()
         WHERE user_id = ? AND asset = ?`,
        [newFree, newLocked, userId, asset]
      )
    })
  }

  /**
   * Unlock balance (cancel order)
   */
  static async unlock(userId: number, asset: string, amount: string): Promise<void> {
    await transaction(async (conn: PoolConnection) => {
      const [rows] = await conn.execute(
        'SELECT * FROM assets WHERE user_id = ? AND asset = ? FOR UPDATE',
        [userId, asset]
      )
      const row = (rows as AssetRow[])[0]

      if (!row) {
        throw new Error('Asset not found')
      }

      const free = parseFloat(row.free)
      const locked = parseFloat(row.locked)
      const unlockAmount = parseFloat(amount)

      if (locked < unlockAmount) {
        throw new Error('Insufficient locked balance')
      }

      const newFree = (free + unlockAmount).toFixed(8)
      const newLocked = (locked - unlockAmount).toFixed(8)

      await conn.execute(
        `UPDATE assets
         SET free = ?, locked = ?, updated_at = NOW()
         WHERE user_id = ? AND asset = ?`,
        [newFree, newLocked, userId, asset]
      )
    })
  }

  /**
   * Transfer from locked to free (partial fill)
   */
  static async unlockPartial(
    userId: number,
    asset: string,
    amount: string
  ): Promise<void> {
    await this.unlock(userId, asset, amount)
  }

  /**
   * Deduct locked balance (order fill)
   */
  static async deductLocked(userId: number, asset: string, amount: string): Promise<void> {
    await transaction(async (conn: PoolConnection) => {
      const [rows] = await conn.execute(
        'SELECT * FROM assets WHERE user_id = ? AND asset = ? FOR UPDATE',
        [userId, asset]
      )
      const row = (rows as AssetRow[])[0]

      if (!row) {
        throw new Error('Asset not found')
      }

      const locked = parseFloat(row.locked)
      const deductAmount = parseFloat(amount)

      if (locked < deductAmount) {
        throw new Error('Insufficient locked balance')
      }

      const newLocked = (locked - deductAmount).toFixed(8)

      await conn.execute(
        `UPDATE assets
         SET locked = ?, updated_at = NOW()
         WHERE user_id = ? AND asset = ?`,
        [newLocked, userId, asset]
      )
    })
  }

  /**
   * Add to free balance (receive payment)
   */
  static async addFree(userId: number, asset: string, amount: string): Promise<void> {
    await transaction(async (conn: PoolConnection) => {
      const [rows] = await conn.execute(
        'SELECT * FROM assets WHERE user_id = ? AND asset = ? FOR UPDATE',
        [userId, asset]
      )
      const row = (rows as AssetRow[])[0]

      if (!row) {
        throw new Error('Asset not found')
      }

      const free = parseFloat(row.free)
      const addAmount = parseFloat(amount)
      const newFree = (free + addAmount).toFixed(8)

      await conn.execute(
        `UPDATE assets
         SET free = ?, updated_at = NOW()
         WHERE user_id = ? AND asset = ?`,
        [newFree, userId, asset]
      )
    })
  }

  /**
   * Get total balance (free + locked)
   */
  static getTotalBalance(asset: Asset): string {
    const free = parseFloat(asset.free)
    const locked = parseFloat(asset.locked)
    return (free + locked).toFixed(8)
  }

  /**
   * Convert database row to Asset object
   */
  private static toAsset(row: AssetRow): Asset {
    return {
      asset: row.asset,
      free: row.free,
      locked: row.locked,
      total: this.getTotalBalance({ asset: row.asset, free: row.free, locked: row.locked, total: '0' }),
    }
  }
}
