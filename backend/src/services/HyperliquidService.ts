import { Hyperliquid } from 'hyperliquid'
import logger from '../utils/logger'

/**
 * Hyperliquid Service - Interface to Hyperliquid exchange
 */
export class HyperliquidService {
  private static client: Hyperliquid
  private static highLowCache: Map<string, { high: string; low: string; timestamp: number }> = new Map()
  private static CACHE_TTL = 60 * 60 * 1000 // 1 hour cache for high/low prices

  /**
   * Initialize Hyperliquid client
   */
  static initialize() {
    try {
      // Initialize in testnet mode for now
      this.client = new Hyperliquid({
        testnet: false, // Use mainnet for real data
      })
      logger.info('Hyperliquid client initialized')
    } catch (error) {
      logger.error('Failed to initialize Hyperliquid client', { error })
      throw error
    }
  }

  /**
   * Get all meta and asset contexts (market data)
   * Returns:
   * - meta.universe: Array of trading pair metadata (name, maxLeverage, etc.)
   * - assetCtxs: Array of real-time market data (markPx, funding, volume, etc.)
   */
  static async getMetaAndAssetCtxs() {
    try {
      if (!this.client) {
        throw new Error('Hyperliquid client not initialized. Call initialize() first.')
      }
      const [meta, assetCtxs] = await this.client.info.perpetuals.getMetaAndAssetCtxs()
      return { meta, assetCtxs }
    } catch (error) {
      logger.error('Failed to fetch meta and asset contexts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        clientInitialized: !!this.client
      })
      throw error
    }
  }

  /**
   * Get order book for a symbol
   */
  static async getL2Book(coin: string) {
    try {
      const book = await this.client.info.getL2Book(coin)
      return book
    } catch (error) {
      logger.error('Failed to fetch L2 book', { error, coin })
      throw error
    }
  }

  /**
   * Get candlestick data
   * Intervals: 1m, 5m, 15m, 1h, 4h, 1d
   */
  static async getCandles(coin: string, interval: string, startTime: number, endTime: number) {
    try {
      const candles = await this.client.info.getCandleSnapshot(
        coin,
        interval,
        startTime,
        endTime
      )
      return candles
    } catch (error) {
      logger.error('Failed to fetch candles', { error, coin, interval })
      throw error
    }
  }

  /**
   * Get recent trades
   * Note: Hyperliquid API doesn't have a public trades endpoint
   * This returns an empty array for now
   */
  static async getTrades(coin: string, limit: number = 100) {
    try {
      // Hyperliquid doesn't have a direct public trades endpoint
      // For now, return empty array
      // Alternative: could use user fills with a known public address
      logger.debug(`getTrades called for ${coin}, but not implemented in Hyperliquid API`)
      return []
    } catch (error) {
      logger.error('Failed to fetch trades', { error, coin })
      throw error
    }
  }

  /**
   * Get all available trading pairs with market data
   */
  static async getAllMarkets() {
    try {
      const { meta, assetCtxs } = await this.getMetaAndAssetCtxs()

      return meta.universe.map((asset: any, index: number) => {
        const ctx = assetCtxs[index]
        return {
          coin: asset.name,
          symbol: this.coinToSymbol(asset.name, 'PERPETUAL'),
          maxLeverage: asset.maxLeverage,
          markPrice: ctx.markPx,
          dayNtlVlm: ctx.dayNtlVlm, // 24h volume
          funding: ctx.funding,
          openInterest: ctx.openInterest,
          prevDayPx: ctx.prevDayPx,
        }
      })
    } catch (error) {
      logger.error('Failed to fetch all markets', { error })
      throw error
    }
  }

  /**
   * Get ticker data for a specific coin
   */
  static async getTicker(coin: string) {
    try {
      const { meta, assetCtxs } = await this.getMetaAndAssetCtxs()
      const assetIndex = meta.universe.findIndex((asset: any) => asset.name === coin)

      if (assetIndex === -1) {
        throw new Error(`Asset ${coin} not found`)
      }

      const asset = meta.universe[assetIndex]
      const ctx = assetCtxs[assetIndex]

      // Calculate 24h price change
      const currentPrice = parseFloat(ctx.markPx)
      const prevPrice = parseFloat(ctx.prevDayPx)
      const priceChange = currentPrice - prevPrice
      const priceChangePercent = (priceChange / prevPrice) * 100

      // Get 24h high/low from cache or candles
      let high24h = ctx.markPx
      let low24h = ctx.markPx

      // Check cache first
      const cached = this.highLowCache.get(coin)
      const now = Date.now()

      if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
        // Use cached values
        high24h = cached.high
        low24h = cached.low
      } else {
        // Fetch from candles API (only if cache expired)
        try {
          const endTime = now
          const startTime = endTime - (24 * 60 * 60 * 1000) // 24 hours ago
          const candles = await this.getCandles(coin, '1h', startTime, endTime)

          if (candles && candles.length > 0) {
            // Calculate high/low from hourly candles
            high24h = Math.max(...candles.map((c: any) => parseFloat(c.h))).toString()
            low24h = Math.min(...candles.map((c: any) => parseFloat(c.l))).toString()

            // Cache the results
            this.highLowCache.set(coin, { high: high24h, low: low24h, timestamp: now })
          }
        } catch (candleError: any) {
          // Only log if not a rate limit error
          if (candleError.code !== 429) {
            logger.warn(`Failed to fetch candles for ${coin}, using current price for high/low`, { candleError })
          }
          // Fallback to current price if candles fail
        }
      }

      return {
        coin: asset.name,
        symbol: this.coinToSymbol(asset.name, 'PERPETUAL'),
        lastPrice: ctx.markPx,
        markPrice: ctx.markPx,
        indexPrice: ctx.oraclePx, // Use oraclePx as index price
        priceChange24h: priceChange.toFixed(2),
        priceChangePercent24h: priceChangePercent.toFixed(2),
        high24h,
        low24h,
        volume24h: ctx.dayNtlVlm,
        fundingRate: ctx.funding,
        openInterest: ctx.openInterest,
        maxLeverage: asset.maxLeverage,
      }
    } catch (error) {
      logger.error('Failed to fetch ticker', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        coin
      })
      throw error
    }
  }

  /**
   * Get funding rate for perpetual
   */
  static async getFundingRate(coin: string) {
    try {
      const [meta, assetCtxs] = await this.client.info.perpetuals.getMetaAndAssetCtxs()
      const assetIndex = meta.universe.findIndex((asset: any) => asset.name === coin)

      if (assetIndex === -1) {
        throw new Error(`Asset ${coin} not found`)
      }

      const assetCtx = assetCtxs[assetIndex]

      // Get funding info from asset context
      return {
        coin,
        fundingRate: assetCtx.funding?.toString() || '0',
        markPrice: assetCtx.markPx?.toString() || '0',
      }
    } catch (error) {
      logger.error('Failed to fetch funding rate', { error, coin })
      throw error
    }
  }

  /**
   * Map Hyperliquid coin name to our symbol format
   */
  static coinToSymbol(coin: string, type: 'SPOT' | 'PERPETUAL' = 'SPOT'): string {
    if (type === 'PERPETUAL') {
      return `${coin}-PERP`
    }
    return `${coin}/USDC`
  }

  /**
   * Map our symbol to Hyperliquid coin name
   * Hyperliquid uses names like "BTC-PERP", "ETH-PERP", etc.
   */
  static symbolToCoin(symbol: string): string {
    // BTC/USDC -> BTC-PERP (Hyperliquid only has perpetuals)
    if (symbol.includes('/USDC')) {
      const base = symbol.replace('/USDC', '')
      return `${base}-PERP`
    }
    // BTC-PERP -> BTC-PERP (already in correct format)
    return symbol
  }
}
