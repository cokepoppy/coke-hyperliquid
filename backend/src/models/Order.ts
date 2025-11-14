import { query, queryOne } from '../config/database'
import { Order, OrderSide, OrderType, OrderStatus, TimeInForce } from '../types'

export interface OrderRow {
  order_id: string
  user_id: number
  symbol: string
  side: OrderSide
  type: OrderType
  price: string | null
  stop_price: string | null
  quantity: string
  filled_quantity: string
  remaining_quantity: string
  status: OrderStatus
  time_in_force: TimeInForce
  reduce_only: number
  post_only: number
  signature: string
  created_at: Date
  updated_at: Date
}

/**
 * Order Model
 */
export class OrderModel {
  /**
   * Find order by ID
   */
  static async findById(orderId: string): Promise<Order | null> {
    const row = await queryOne<OrderRow>(
      'SELECT * FROM orders WHERE order_id = ?',
      [orderId]
    )
    return row ? this.toOrder(row) : null
  }

  /**
   * Find user's open orders
   */
  static async findOpenByUserId(userId: number, symbol?: string): Promise<Order[]> {
    let sql = 'SELECT * FROM orders WHERE user_id = ? AND status IN (?, ?) ORDER BY created_at DESC'
    const params: any[] = [userId, 'OPEN', 'PARTIALLY_FILLED']

    if (symbol) {
      sql = 'SELECT * FROM orders WHERE user_id = ? AND symbol = ? AND status IN (?, ?) ORDER BY created_at DESC'
      params.splice(1, 0, symbol)
    }

    const rows = await query<OrderRow[]>(sql, params)
    return rows.map(this.toOrder)
  }

  /**
   * Find user's order history
   */
  static async findByUserId(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<Order[]> {
    const rows = await query<OrderRow[]>(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    )
    return rows.map(this.toOrder)
  }

  /**
   * Create new order
   */
  static async create(data: {
    orderId: string
    userId: number
    symbol: string
    side: OrderSide
    type: OrderType
    price?: string
    stopPrice?: string
    quantity: string
    timeInForce: TimeInForce
    reduceOnly: boolean
    postOnly: boolean
    signature: string
  }): Promise<Order> {
    await query(
      `INSERT INTO orders
       (order_id, user_id, symbol, side, type, price, stop_price, quantity,
        filled_quantity, remaining_quantity, status, time_in_force, reduce_only, post_only, signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.orderId,
        data.userId,
        data.symbol,
        data.side,
        data.type,
        data.price || null,
        data.stopPrice || null,
        data.quantity,
        '0',
        data.quantity,
        'OPEN',
        data.timeInForce,
        data.reduceOnly ? 1 : 0,
        data.postOnly ? 1 : 0,
        data.signature,
      ]
    )

    const order = await this.findById(data.orderId)
    if (!order) {
      throw new Error('Failed to create order')
    }

    return order
  }

  /**
   * Update order status
   */
  static async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    await query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE order_id = ?',
      [status, orderId]
    )
  }

  /**
   * Update order fill
   */
  static async updateFill(
    orderId: string,
    filledQuantity: string,
    remainingQuantity: string
  ): Promise<void> {
    const status = parseFloat(remainingQuantity) === 0 ? 'FILLED' : 'PARTIALLY_FILLED'

    await query(
      `UPDATE orders
       SET filled_quantity = ?, remaining_quantity = ?, status = ?, updated_at = NOW()
       WHERE order_id = ?`,
      [filledQuantity, remainingQuantity, status, orderId]
    )
  }

  /**
   * Cancel order
   */
  static async cancel(orderId: string): Promise<void> {
    await this.updateStatus(orderId, 'CANCELLED')
  }

  /**
   * Cancel all open orders for user
   */
  static async cancelAllByUserId(userId: number, symbol?: string): Promise<number> {
    let sql = `UPDATE orders
               SET status = ?, updated_at = NOW()
               WHERE user_id = ? AND status IN (?, ?)`
    const params: any[] = ['CANCELLED', userId, 'OPEN', 'PARTIALLY_FILLED']

    if (symbol) {
      sql += ' AND symbol = ?'
      params.push(symbol)
    }

    const result = await query<any>(sql, params)
    return result.affectedRows || 0
  }

  /**
   * Convert database row to Order object
   */
  private static toOrder(row: OrderRow): Order {
    return {
      orderId: row.order_id,
      userId: row.user_id,
      symbol: row.symbol,
      side: row.side,
      type: row.type,
      price: row.price || undefined,
      stopPrice: row.stop_price || undefined,
      quantity: row.quantity,
      filledQuantity: row.filled_quantity,
      remainingQuantity: row.remaining_quantity,
      status: row.status,
      timeInForce: row.time_in_force,
      reduceOnly: row.reduce_only === 1,
      postOnly: row.post_only === 1,
      signature: row.signature,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
