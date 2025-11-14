import { Router } from 'express'
import { MarketController } from '../controllers/MarketController'

const router = Router()

/**
 * Market Data Routes
 */

// Trading pairs
router.get('/pairs', MarketController.getTradingPairs)
router.get('/pair/:symbol', MarketController.getTradingPair)

// Tickers
router.get('/ticker/:symbol', MarketController.getTicker)
router.get('/tickers', MarketController.getAllTickers)

// Order book
router.get('/orderbook/:symbol', MarketController.getOrderBook)

// Recent trades
router.get('/trades/:symbol', MarketController.getRecentTrades)

// K-line data
router.get('/klines/:symbol', MarketController.getKlines)

// Funding rate (perpetuals)
router.get('/funding/:symbol', MarketController.getFundingRate)

export default router
