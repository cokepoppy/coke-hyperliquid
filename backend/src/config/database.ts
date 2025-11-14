import mysql from 'mysql2/promise'
import config from './index'
import logger from '../utils/logger'

/**
 * MySQL connection pool
 */
let pool: mysql.Pool | null = null

/**
 * Initialize database connection pool
 */
export const initDatabase = async (): Promise<mysql.Pool> => {
  try {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      connectionLimit: config.database.connectionLimit,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Timezone
      timezone: '+00:00',
      // Charset
      charset: 'utf8mb4',
    })

    // Test connection
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()

    logger.info('Database connected successfully', {
      host: config.database.host,
      database: config.database.name,
    })

    return pool
  } catch (error) {
    logger.error('Failed to connect to database', { error })
    throw error
  }
}

/**
 * Get database pool instance
 */
export const getPool = (): mysql.Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDatabase() first.')
  }
  return pool
}

/**
 * Execute a query
 */
export const query = async <T = any>(
  sql: string,
  params?: any[]
): Promise<T> => {
  const connection = await getPool().getConnection()
  try {
    const [rows] = await connection.execute(sql, params)
    return rows as T
  } finally {
    connection.release()
  }
}

/**
 * Execute a query and return the first row
 */
export const queryOne = async <T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> => {
  const rows = await query<T[]>(sql, params)
  return rows.length > 0 ? rows[0] : null
}

/**
 * Execute multiple queries in a transaction
 */
export const transaction = async <T = any>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await getPool().getConnection()
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/**
 * Close database pool
 */
export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    pool = null
    logger.info('Database connection closed')
  }
}
