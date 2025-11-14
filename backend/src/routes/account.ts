import { Router } from 'express'
import { AccountController } from '../controllers/AccountController'

const router = Router()

/**
 * Account Routes
 * Note: These routes require authentication middleware
 */

// Balance
router.get('/balance', AccountController.getBalance)

// Assets
router.get('/assets', AccountController.getAssets)
router.get('/asset/:asset', AccountController.getAsset)

// Positions
router.get('/positions', AccountController.getPositions)
router.get('/position/:symbol/:side', AccountController.getPosition)
router.post('/position/close', AccountController.closePosition)

// History
router.get('/history', AccountController.getTradeHistory)

// Summary
router.get('/summary', AccountController.getAccountSummary)

// Deposit (for testing/demo)
router.post('/deposit', AccountController.deposit)

export default router
