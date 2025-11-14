import { Router } from 'express'
import { TradingController } from '../controllers/TradingController'

const router = Router()

/**
 * Trading Routes
 * Note: These routes require authentication middleware
 */

// Order management
router.post('/order', TradingController.createOrder)
router.get('/order/:orderId', TradingController.getOrder)
router.delete('/order/:orderId', TradingController.cancelOrder)
router.delete('/orders/all', TradingController.cancelAllOrders)

// Order queries
router.get('/orders/open', TradingController.getOpenOrders)
router.get('/orders/history', TradingController.getOrderHistory)

// Leverage
router.post('/leverage', TradingController.setLeverage)

export default router
