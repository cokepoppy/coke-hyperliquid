import { Hyperliquid } from 'hyperliquid'
import logger from '../utils/logger'

/**
 * Hyperliquid Service - Interface to Hyperliquid exchange
 */
export class HyperliquidService {
  private static client: Hyperliquid

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
      const [meta, assetCtxs] = await this.client.info.perpetuals.getMetaAndAssetCtxs()
      return { meta, assetCtxs }
    } catch (error) {
      logger.error('Failed to fetch meta and asset contexts', { error })
      throw error
    }
  }

  /**
   * Get order book for a symbol
   * TODO: Implement once we determine the correct API method
   */
  static async getL2Book(coin: string) {
    try {
      // Temporarily disabled - need to find correct API method
      throw new Error('getL2Book not yet implemented')
      // const book = await this.client.info.perpetuals.getL2Book(coin)
      // return book
    } catch (error) {
      logger.error('Failed to fetch L2 book', { error, coin })
      throw error
    }
  }

  /**
   * Get candlestick data
   * TODO: Fix arguments - getCandleSnapshot expects 4-5 arguments
   */
  static async getCandles(coin: string, interval: string, startTime: number, endTime: number) {
    try {
      // Temporarily disabled - need to fix arguments
      throw new Error('getCandles not yet implemented')
      // const candles = await this.client.info.getCandleSnapshot(...)
      // return candles
    } catch (error) {
      logger.error('Failed to fetch candles', { error, coin, interval })
      throw error
    }
  }

  /**
   * Get recent trades
   */
  static async getTrades(coin: string, limit: number = 100) {
    try {
      // Hyperliquid doesn't have a direct trades endpoint
      // We'll use the user fills endpoint with a public address
      // Or implement alternative method
      return []
    } catch (error) {
      logger.error('Failed to fetch trades', { error, coin })
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
   */
  static symbolToCoin(symbol: string): string {
    // BTC/USDC -> BTC
    // BTC-PERP -> BTC
    return symbol.replace('/USDC', '').replace('-PERP', '')
  }
}
