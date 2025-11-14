import express, { Application } from 'express'
import cors from 'cors'
import config from './config'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { authenticate } from './middleware/auth'
import logger from './utils/logger'
import marketRoutes from './routes/market'
import tradingRoutes from './routes/trading'
import accountRoutes from './routes/account'
import authRoutes from './routes/auth'

/**
 * Create and configure Express application
 */
const createApp = (): Application => {
  const app = express()

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1)

  // CORS middleware
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Request logging middleware
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body,
      ip: req.ip,
    })
    next()
  })

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      environment: config.env,
    })
  })

  // API Routes
  app.use('/api/auth', authRoutes) // Auth routes (public + protected)
  app.use('/api/market', marketRoutes) // Market data (public)
  app.use('/api/trade', authenticate, tradingRoutes) // Trading (requires auth)
  app.use('/api/account', authenticate, accountRoutes) // Account (requires auth)

  // 404 handler
  app.use(notFoundHandler)

  // Global error handler
  app.use(errorHandler)

  return app
}

export default createApp
