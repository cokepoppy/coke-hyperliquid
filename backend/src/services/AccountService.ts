import { AssetModel } from '../models/Asset'
import { PositionModel } from '../models/Position'
import { TradingPairModel } from '../models/TradingPair'
import { Balance, Position, Asset } from '../types'
import { createError } from '../utils/response'

/**
 * Account Service - Business logic for account management
 */
export class AccountService {
  /**
   * Get user's balance
   */
  static async getBalance(userId: number): Promise<Balance> {
    const assets = await AssetModel.findByUserId(userId)

    // Calculate total equity
    let totalEquity = 0
    let availableBalance = 0
    let usedMargin = 0

    for (const asset of assets) {
      const free = parseFloat(asset.free)
      const locked = parseFloat(asset.locked)

      totalEquity += free + locked
      availableBalance += free
      // Locked balance is effectively used margin
      usedMargin += locked
    }

    // Get unrealized PnL from positions
    const unrealizedPnl = parseFloat(
      await PositionModel.getTotalUnrealizedPnlByUserId(userId)
    )

    // Adjust total equity with unrealized PnL
    totalEquity += unrealizedPnl

    return {
      totalEquity: totalEquity.toFixed(8),
      availableBalance: availableBalance.toFixed(8),
      usedMargin: usedMargin.toFixed(8),
      unrealizedPnl: unrealizedPnl.toFixed(8),
      assets,
    }
  }

  /**
   * Get user's positions
   */
  static async getPositions(userId: number, symbol?: string): Promise<Position[]> {
    return await PositionModel.findByUserId(userId, symbol)
  }

  /**
   * Get specific position
   */
  static async getPosition(
    userId: number,
    symbol: string,
    side: 'LONG' | 'SHORT'
  ): Promise<Position> {
    const position = await PositionModel.findByUserAndSymbol(userId, symbol, side)

    if (!position) {
      throw createError.notFound('Position not found')
    }

    return position
  }

  /**
   * Close a position
   */
  static async closePosition(
    userId: number,
    symbol: string,
    side: 'LONG' | 'SHORT'
  ): Promise<void> {
    const position = await PositionModel.findByUserAndSymbol(userId, symbol, side)

    if (!position) {
      throw createError.notFound('Position not found')
    }

    if (position.userId !== userId) {
      throw createError.forbidden('Not authorized to close this position')
    }

    // In a real implementation, this would:
    // 1. Create a market order to close the position
    // 2. Wait for the order to fill
    // 3. Calculate realized PnL
    // 4. Update user's balance
    // 5. Delete the position

    // For now, just delete the position
    await PositionModel.close(position.positionId)
  }

  /**
   * Get user's assets (individual balances)
   */
  static async getAssets(userId: number): Promise<Asset[]> {
    return await AssetModel.findByUserId(userId)
  }

  /**
   * Get specific asset balance
   */
  static async getAsset(userId: number, asset: string): Promise<Asset> {
    const userAsset = await AssetModel.findByUserAndAsset(userId, asset)

    if (!userAsset) {
      // Return zero balance if asset doesn't exist
      return {
        asset,
        free: '0',
        locked: '0',
        total: '0',
      }
    }

    return userAsset
  }

  /**
   * Get trade history (executions)
   */
  static async getTradeHistory(
    userId: number,
    symbol?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    // This would query the trades table joined with orders
    // For now, return empty array as trades are not fully implemented
    return []
  }

  /**
   * Get account summary
   */
  static async getAccountSummary(userId: number): Promise<{
    balance: Balance
    positions: Position[]
    openOrdersCount: number
  }> {
    const balance = await this.getBalance(userId)
    const positions = await this.getPositions(userId)

    // Count open orders
    const { OrderModel } = await import('../models/Order')
    const openOrders = await OrderModel.findOpenByUserId(userId)

    return {
      balance,
      positions,
      openOrdersCount: openOrders.length,
    }
  }

  /**
   * Deposit funds (for testing/demo)
   */
  static async deposit(
    userId: number,
    asset: string,
    amount: string
  ): Promise<Asset> {
    // List of supported assets for deposit (common stablecoins and fiat)
    const supportedAssets = ['USDT', 'USDC', 'USD', 'BUSD', 'DAI']

    if (!supportedAssets.includes(asset.toUpperCase())) {
      throw createError.badRequest(`Invalid asset: ${asset}. Supported assets: ${supportedAssets.join(', ')}`)
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      throw createError.badRequest('Invalid amount')
    }

    // Normalize asset to uppercase
    const normalizedAsset = asset.toUpperCase()

    // Get or create asset
    await AssetModel.getOrCreate(userId, normalizedAsset)

    // Add to free balance
    await AssetModel.addFree(userId, normalizedAsset, amount)

    return await AssetModel.findByUserAndAsset(userId, normalizedAsset) as Asset
  }
}
