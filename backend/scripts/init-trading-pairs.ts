import { TradingPairModel } from '../src/models/TradingPair'
import { query, initDatabase, closeDatabase } from '../src/config/database'
import logger from '../src/utils/logger'

/**
 * Initialize trading pairs in database
 */
async function initTradingPairs() {
  try {
    // Initialize database connection
    await initDatabase()
    logger.info('Database connected')

    logger.info('Initializing trading pairs...')

    // Check if trading pairs already exist
    const existing = await TradingPairModel.findAll()
    if (existing.length > 0) {
      logger.info(`Found ${existing.length} existing trading pairs`)
      return
    }

    // Insert default trading pairs
    const pairs = [
      { symbol: 'BTC/USDC', baseAsset: 'BTC', quoteAsset: 'USDC', type: 'SPOT', minOrderSize: '0.0001', maxOrderSize: '1000', tickSize: '0.01' },
      { symbol: 'ETH/USDC', baseAsset: 'ETH', quoteAsset: 'USDC', type: 'SPOT', minOrderSize: '0.001', maxOrderSize: '10000', tickSize: '0.01' },
      { symbol: 'BTC-PERP', baseAsset: 'BTC', quoteAsset: 'USDC', type: 'PERPETUAL', minOrderSize: '0.0001', maxOrderSize: '1000', tickSize: '0.01' },
      { symbol: 'ETH-PERP', baseAsset: 'ETH', quoteAsset: 'USDC', type: 'PERPETUAL', minOrderSize: '0.001', maxOrderSize: '10000', tickSize: '0.01' },
    ]

    for (const pair of pairs) {
      await query(
        `INSERT INTO trading_pairs (symbol, base_asset, quote_asset, type, min_order_size, max_order_size, tick_size, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
         ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
        [pair.symbol, pair.baseAsset, pair.quoteAsset, pair.type, pair.minOrderSize, pair.maxOrderSize, pair.tickSize]
      )
      logger.info(`Inserted trading pair: ${pair.symbol}`)
    }

    logger.info('Trading pairs initialized successfully')
  } catch (error: any) {
    logger.error('Failed to initialize trading pairs', {
      error: error.message || error,
      stack: error.stack
    })
    console.error('Full error:', error)
    throw error
  }
}

// Run if executed directly
if (require.main === module) {
  initTradingPairs()
    .then(async () => {
      logger.info('Done')
      await closeDatabase()
      process.exit(0)
    })
    .catch(async (error) => {
      logger.error('Error:', error)
      await closeDatabase()
      process.exit(1)
    })
}

export default initTradingPairs
