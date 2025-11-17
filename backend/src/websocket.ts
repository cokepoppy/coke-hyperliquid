import { WebSocketService } from './services/WebSocketService'
import { HyperliquidService } from './services/HyperliquidService'
import config from './config'
import logger from './utils/logger'

let wsService: WebSocketService | null = null
let currentPrices: { [key: string]: number } = {
  'BTC': 98000,
  'ETH': 3500
}

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
 * Update current prices from Hyperliquid
 */
async function updateRealPrices(): Promise<void> {
  try {
    const btcTicker = await HyperliquidService.getTicker('BTC-PERP')
    const ethTicker = await HyperliquidService.getTicker('ETH-PERP')

    currentPrices['BTC'] = parseFloat(btcTicker.lastPrice)
    currentPrices['ETH'] = parseFloat(ethTicker.lastPrice)

    logger.debug('Updated real prices from Hyperliquid', { currentPrices })
  } catch (error) {
    logger.warn('Failed to update real prices from Hyperliquid', { error })
  }
}

/**
 * Start broadcasting mock data for demonstration
 * In production, this would be replaced with real market data feeds
 */
function startMockDataBroadcasts(ws: WebSocketService): void {
  // Update real prices from Hyperliquid every 10 seconds
  updateRealPrices() // Initial update
  setInterval(updateRealPrices, 10000)
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
      const coin = symbol.includes('BTC') ? 'BTC' : 'ETH'
      const basePrice = currentPrices[coin] || (coin === 'BTC' ? 98000 : 3500)

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
      const coin = symbol.includes('BTC') ? 'BTC' : 'ETH'
      const basePrice = currentPrices[coin] || (coin === 'BTC' ? 98000 : 3500)
      const side = Math.random() > 0.5 ? 'BUY' : 'SELL'

      ws.broadcastToChannel(`trades:${symbol}`, {
        symbol,
        tradeId: Math.random().toString(36).substring(7),
        price: (basePrice + (Math.random() - 0.5) * 100).toFixed(2),
        quantity: (Math.random() * 2).toFixed(4),
        side,
        timestamp: Date.now(),
      })
    })
  }, 1000)

  // Broadcast user positions updates every 3 seconds (mock)
  setInterval(() => {
    // In production, this would only broadcast to authenticated users
    // For now, broadcasting to all subscribers of user:positions channel
    ws.broadcastToChannel('user:positions', {
      positions: [
        {
          symbol: 'BTC-PERP',
          side: 'LONG',
          quantity: '0.5',
          entryPrice: '49800.00',
          markPrice: '50000.00',
          liquidationPrice: '45000.00',
          leverage: 10,
          margin: '2490.00',
          unrealizedPnl: (Math.random() * 200 - 100).toFixed(2),
          marginRatio: '0.0498',
        },
      ],
    })
  }, 3000)

  // Broadcast user orders updates every 3 seconds (mock)
  setInterval(() => {
    // In production, this would only broadcast to authenticated users
    ws.broadcastToChannel('user:orders', {
      orders: [
        {
          orderId: 'order_' + Math.random().toString(36).substring(7),
          symbol: 'ETH-PERP',
          side: Math.random() > 0.5 ? 'BUY' : 'SELL',
          type: 'LIMIT',
          price: '3000.00',
          quantity: '2.0',
          filledQuantity: (Math.random() * 2).toFixed(2),
          status: Math.random() > 0.7 ? 'PARTIALLY_FILLED' : 'OPEN',
          createdAt: Date.now() - Math.random() * 3600000,
        },
      ],
    })
  }, 3000)

  logger.info('Mock data broadcasts started')
}
