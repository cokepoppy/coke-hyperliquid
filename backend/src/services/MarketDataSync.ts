import { HyperliquidService } from './HyperliquidService'
import { query } from '../config/database'
import logger from '../utils/logger'

/**
 * Market Data Sync Service
 * Syncs data from Hyperliquid to local database
 */
export class MarketDataSync {
  private static syncInterval: NodeJS.Timeout | null = null
  private static readonly SYNC_INTERVAL_MS = 60000 // Sync every 60 seconds to avoid rate limiting

  /**
   * Start syncing market data
   */
  static async start() {
    logger.info('Starting market data sync')

    // Initial sync
    await this.syncAllData()

    // Schedule periodic sync
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncAllData()
      } catch (error) {
        logger.error('Failed to sync market data', { error })
      }
    }, this.SYNC_INTERVAL_MS)
  }

  /**
   * Stop syncing
   */
  static stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
      logger.info('Market data sync stopped')
    }
  }

  /**
   * Sync all market data
   */
  private static async syncAllData() {
    try {
      await Promise.all([
        this.syncTickers(),
        // Add more sync methods as needed
      ])
    } catch (error) {
      logger.error('Error in syncAllData', { error })
      throw error
    }
  }

  /**
   * Sync ticker data from Hyperliquid
   */
  private static async syncTickers() {
    try {
      // Get all market data from Hyperliquid
      const { meta, assetCtxs } = await HyperliquidService.getMetaAndAssetCtxs()

      // Supported perpetual symbols to sync
      const supportedCoins = ['BTC-PERP', 'ETH-PERP']

      for (const coinName of supportedCoins) {
        // Find the index of this coin in the universe
        const assetIndex = meta.universe.findIndex((asset: any) => asset.name === coinName)
        if (assetIndex === -1) continue

        const assetCtx = assetCtxs[assetIndex]
        if (!assetCtx) continue

        // Extract real-time market data
        const currentPrice = parseFloat(assetCtx.markPx || assetCtx.midPx || '0')
        const prevDayPrice = parseFloat(assetCtx.prevDayPx || currentPrice.toString())

        // Calculate real 24h change
        const change24h = prevDayPrice > 0
          ? ((currentPrice - prevDayPrice) / prevDayPrice) * 100
          : 0

        // Estimate high/low (Hyperliquid doesn't provide these in this endpoint)
        // We'll use a reasonable approximation
        const priceVariation = Math.abs(change24h) / 100
        const high24h = currentPrice * (1 + priceVariation / 2)
        const low24h = currentPrice * (1 - priceVariation / 2)
        const openPrice = prevDayPrice

        // Get real volume data
        const volume24h = parseFloat(assetCtx.dayBaseVlm || '0') // Base volume (e.g., BTC)
        const quoteVolume24h = parseFloat(assetCtx.dayNtlVlm || '0') // Notional volume (USDC)

        // Extract base coin name (BTC-PERP -> BTC)
        const baseCoin = coinName.replace('-PERP', '')

        // Update PERPETUAL ticker (BTC-PERP)
        await this.updateTicker(
          coinName,
          currentPrice,
          change24h,
          high24h,
          low24h,
          volume24h,
          quoteVolume24h,
          openPrice
        )

        // Also update SPOT format ticker (BTC/USDC) for frontend compatibility
        // Even though Hyperliquid doesn't have spot markets, we sync the same PERP data
        const spotSymbol = `${baseCoin}/USDC`
        await this.updateTicker(
          spotSymbol,
          currentPrice,
          change24h,
          high24h,
          low24h,
          volume24h,
          quoteVolume24h,
          openPrice
        )

        logger.debug('Synced tickers', {
          perp: coinName,
          spot: spotSymbol,
          price: currentPrice,
          change24h: change24h.toFixed(2)
        })
      }

      logger.debug('Tickers synced successfully')
    } catch (error) {
      logger.error('Failed to sync tickers', { error })
      throw error
    }
  }

  /**
   * Update ticker in database
   */
  private static async updateTicker(
    symbol: string,
    lastPrice: number,
    change24h: number,
    high24h: number,
    low24h: number,
    volume24h: number,
    quoteVolume24h: number,
    openPrice: number
  ) {
    try {
      await query(
        `INSERT INTO tickers (symbol, last_price, change_24h, high_24h, low_24h, volume_24h, quote_volume_24h, open_price, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           last_price = VALUES(last_price),
           change_24h = VALUES(change_24h),
           high_24h = VALUES(high_24h),
           low_24h = VALUES(low_24h),
           volume_24h = VALUES(volume_24h),
           quote_volume_24h = VALUES(quote_volume_24h),
           open_price = VALUES(open_price),
           updated_at = NOW()`,
        [symbol, lastPrice, change24h, high24h, low24h, volume24h, quoteVolume24h, openPrice]
      )
    } catch (error) {
      logger.error('Failed to update ticker', { error, symbol })
      throw error
    }
  }

  /**
   * Get real-time order book from Hyperliquid
   * TODO: Implement once getL2Book is working
   */
  static async getRealtimeOrderBook(symbol: string, depth: number = 20) {
    // Temporarily disabled - will fall back to mock data in MarketService
    throw new Error('Real-time order book not yet implemented')
  }

  /**
   * Get real-time klines from Hyperliquid
   * TODO: Implement once getCandles is working
   */
  static async getRealtimeKlines(
    symbol: string,
    interval: string,
    limit: number = 100
  ) {
    // Temporarily disabled - will fall back to mock data in MarketService
    throw new Error('Real-time klines not yet implemented')
  }

  /**
   * Convert interval string to milliseconds
   */
  private static getIntervalMs(interval: string): number {
    const intervals: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1H': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '4H': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1D': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
    }
    return intervals[interval] || intervals['1h']
  }
}
