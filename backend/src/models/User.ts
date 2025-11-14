import { query, queryOne } from '../config/database'
import { User } from '../types'

export interface UserRow {
  id: number
  wallet_address: string | null
  email: string | null
  google_id: string | null
  name: string | null
  avatar: string | null
  created_at: Date
  updated_at: Date
}

/**
 * User Model
 */
export class UserModel {
  /**
   * Find user by ID
   */
  static async findById(id: number): Promise<User | null> {
    const row = await queryOne<UserRow>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    )
    return row ? this.toUser(row) : null
  }

  /**
   * Find user by wallet address
   */
  static async findByWalletAddress(walletAddress: string): Promise<User | null> {
    const row = await queryOne<UserRow>(
      'SELECT * FROM users WHERE wallet_address = ?',
      [walletAddress.toLowerCase()]
    )
    return row ? this.toUser(row) : null
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const row = await queryOne<UserRow>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )
    return row ? this.toUser(row) : null
  }

  /**
   * Find user by Google ID
   */
  static async findByGoogleId(googleId: string): Promise<User | null> {
    const row = await queryOne<UserRow>(
      'SELECT * FROM users WHERE google_id = ?',
      [googleId]
    )
    return row ? this.toUser(row) : null
  }

  /**
   * Create new user
   */
  static async create(walletAddress: string, email?: string): Promise<User> {
    const result = await query<any>(
      'INSERT INTO users (wallet_address, email) VALUES (?, ?)',
      [walletAddress.toLowerCase(), email || null]
    )

    const user = await this.findById(result.insertId)
    if (!user) {
      throw new Error('Failed to create user')
    }

    return user
  }

  /**
   * Create new user with Google info
   */
  static async createWithGoogle(data: {
    email: string
    googleId: string
    name?: string
    avatar?: string
  }): Promise<User> {
    const result = await query<any>(
      'INSERT INTO users (email, google_id, name, avatar) VALUES (?, ?, ?, ?)',
      [data.email, data.googleId, data.name || null, data.avatar || null]
    )

    const user = await this.findById(result.insertId)
    if (!user) {
      throw new Error('Failed to create user')
    }

    return user
  }

  /**
   * Update user email
   */
  static async updateEmail(id: number, email: string): Promise<void> {
    await query(
      'UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?',
      [email, id]
    )
  }

  /**
   * Check if wallet address exists
   */
  static async existsByWalletAddress(walletAddress: string): Promise<boolean> {
    const row = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE wallet_address = ?',
      [walletAddress.toLowerCase()]
    )
    return row ? row.count > 0 : false
  }

  /**
   * Convert database row to User object
   */
  private static toUser(row: UserRow): User {
    return {
      id: row.id,
      walletAddress: row.wallet_address || undefined,
      email: row.email || undefined,
      googleId: row.google_id || undefined,
      name: row.name || undefined,
      avatar: row.avatar || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
