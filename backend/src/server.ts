import createApp from './app'
import config from './config'
import logger from './utils/logger'
import { initDatabase, closeDatabase } from './config/database'
import { initWebSocket, closeWebSocket } from './websocket'
import { HyperliquidService } from './services/HyperliquidService'
import { MarketDataSync } from './services/MarketDataSync'

/**
 * Start the HTTP and WebSocket servers
 */
const startServer = async (): Promise<void> => {
  try {
    // Initialize database
    await initDatabase()

    // Initialize Hyperliquid client
    HyperliquidService.initialize()
    logger.info('Hyperliquid service initialized')

    // Start market data sync
    await MarketDataSync.start()
    logger.info('Market data sync started')

    // Initialize WebSocket server
    initWebSocket()
    logger.info('WebSocket service initialized', {
      port: config.websocket.port,
      wsUrl: `ws://${config.host}:${config.websocket.port}`,
    })

    // Create Express app
    const app = createApp()

    // Start HTTP server
    const server = app.listen(config.port, config.host, () => {
      logger.info(`HTTP server started`, {
        environment: config.env,
        host: config.host,
        port: config.port,
        apiUrl: `http://${config.host}:${config.port}`,
      })

      logger.info('All services running', {
        httpPort: config.port,
        wsPort: config.websocket.port,
      })
    })

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`)
      server.close(async () => {
        MarketDataSync.stop()
        await closeWebSocket()
        await closeDatabase()
        logger.info('All services closed')
        process.exit(0)
      })

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout')
        process.exit(1)
      }, 10000)
    }

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack })
      process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise })
      process.exit(1)
    })
  } catch (error) {
    logger.error('Failed to start server', { error })
    process.exit(1)
  }
}

// Start the server
startServer()
