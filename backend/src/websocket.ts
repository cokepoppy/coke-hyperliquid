import { WebSocketService } from './services/WebSocketService'
import config from './config'
import logger from './utils/logger'

let wsService: WebSocketService | null = null

/**
 * Initialize WebSocket server
 */
export const initWebSocket = (): WebSocketService => {
  if (wsService) {
    return wsService
  }

  wsService = new WebSocketService(config.websocket.port)
  wsService.startHeartbeat()

  // Start mock data broadcasts (for demo)
  startMockDataBroadcasts(wsService)

  return wsService
}

/**
 * Get WebSocket service instance
 */
export const getWebSocketService = (): WebSocketService | null => {
  return wsService
}

/**
 * Close WebSocket server
 */
export const closeWebSocket = async (): Promise<void> => {
  if (wsService) {
    await wsService.close()
    wsService = null
  }
}

/**
 * Start broadcasting mock data for demonstration
 * In production, this would be replaced with real market data feeds
 */
function startMockDataBroadcasts(ws: WebSocketService): void {
  // Broadcast ticker updates every 2 seconds
  setInterval(() => {
    const symbols = ['BTC/USDC', 'ETH/USDC', 'BTC-PERP', 'ETH-PERP']

    symbols.forEach((symbol) => {
      const basePrice = symbol.includes('BTC') ? 50000 : 3000
      const change = (Math.random() - 0.5) * 100

      ws.broadcastToChannel(`ticker:${symbol}`, {
        symbol,
        lastPrice: (basePrice + change).toFixed(2),
        change24h: ((Math.random() - 0.5) * 5).toFixed(2),
        high24h: (basePrice + 500).toFixed(2),
        low24h: (basePrice - 500).toFixed(2),
        volume24h: (Math.random() * 10000).toFixed(2),
        fundingRate: '0.0001',
        nextFundingTime: Date.now() + 3600000,
      })
    })
  }, 2000)

  // Broadcast orderbook updates every 1 second
  setInterval(() => {
    const symbols = ['BTC/USDC', 'ETH/USDC', 'BTC-PERP', 'ETH-PERP']

    symbols.forEach((symbol) => {
      const basePrice = symbol.includes('BTC') ? 50000 : 3000

      // Generate mock bids
      const bids = Array.from({ length: 20 }, (_, i) => ({
        price: (basePrice * (1 - (i + 1) * 0.0001)).toFixed(2),
        quantity: (Math.random() * 10).toFixed(4),
      }))

      // Generate mock asks
      const asks = Array.from({ length: 20 }, (_, i) => ({
        price: (basePrice * (1 + (i + 1) * 0.0001)).toFixed(2),
        quantity: (Math.random() * 10).toFixed(4),
      }))

      ws.broadcastToChannel(`orderbook:${symbol}`, {
        symbol,
        bids,
        asks,
      })
    })
  }, 1000)

  // Broadcast recent trades every 1 second
  setInterval(() => {
    const symbols = ['BTC/USDC', 'ETH/USDC', 'BTC-PERP', 'ETH-PERP']

    symbols.forEach((symbol) => {
      const basePrice = symbol.includes('BTC') ? 50000 : 3000
      const side = Math.random() > 0.5 ? 'BUY' : 'SELL'

      ws.broadcastToChannel(`trades:${symbol}`, {
        symbol,
        tradeId: Math.random().toString(36).substring(7),
        price: (basePrice + (Math.random() - 0.5) * 10).toFixed(2),
        quantity: (Math.random() * 2).toFixed(4),
        side,
        timestamp: Date.now(),
      })
    })
  }, 1000)

  logger.info('Mock data broadcasts started')
}
