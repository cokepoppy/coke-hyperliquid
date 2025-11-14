import { Request, Response } from 'express'
import { AccountService } from '../services/AccountService'
import { sendSuccess } from '../utils/response'
import { asyncHandler } from '../middleware/errorHandler'

/**
 * Account Controller - Handle account operations
 */
export class AccountController {
  /**
   * GET /api/account/balance
   * Get user's balance
   */
  static getBalance = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const balance = await AccountService.getBalance(userId)
    sendSuccess(res, balance)
  })

  /**
   * GET /api/account/positions
   * Get user's positions
   */
  static getPositions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const symbol = req.query.symbol as string | undefined
    const positions = await AccountService.getPositions(userId, symbol)

    sendSuccess(res, positions)
  })

  /**
   * GET /api/account/position/:symbol/:side
   * Get specific position
   */
  static getPosition = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const { symbol, side } = req.params

    if (side !== 'LONG' && side !== 'SHORT') {
      throw new Error('Invalid side. Must be LONG or SHORT')
    }

    const position = await AccountService.getPosition(userId, symbol, side)
    sendSuccess(res, position)
  })

  /**
   * POST /api/account/position/close
   * Close a position
   */
  static closePosition = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const { symbol, side } = req.body

    if (!symbol || !side) {
      throw new Error('Symbol and side are required')
    }

    if (side !== 'LONG' && side !== 'SHORT') {
      throw new Error('Invalid side. Must be LONG or SHORT')
    }

    await AccountService.closePosition(userId, symbol, side)

    sendSuccess(res, { message: 'Position closed successfully' })
  })

  /**
   * GET /api/account/assets
   * Get user's assets
   */
  static getAssets = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const assets = await AccountService.getAssets(userId)
    sendSuccess(res, assets)
  })

  /**
   * GET /api/account/asset/:asset
   * Get specific asset balance
   */
  static getAsset = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const { asset } = req.params
    const userAsset = await AccountService.getAsset(userId, asset)

    sendSuccess(res, userAsset)
  })

  /**
   * GET /api/account/history
   * Get trade history
   */
  static getTradeHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const symbol = req.query.symbol as string | undefined
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    if (limit < 1 || limit > 500) {
      throw new Error('Limit must be between 1 and 500')
    }

    const history = await AccountService.getTradeHistory(userId, symbol, limit, offset)
    sendSuccess(res, history)
  })

  /**
   * GET /api/account/summary
   * Get account summary
   */
  static getAccountSummary = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const summary = await AccountService.getAccountSummary(userId)
    sendSuccess(res, summary)
  })

  /**
   * POST /api/account/deposit
   * Deposit funds (for testing/demo)
   */
  static deposit = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const { asset, amount } = req.body

    if (!asset || !amount) {
      throw new Error('Asset and amount are required')
    }

    const updatedAsset = await AccountService.deposit(userId, asset, amount)

    sendSuccess(res, {
      message: 'Deposit successful',
      asset: updatedAsset,
    })
  })
}
