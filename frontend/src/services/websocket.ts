type MessageCallback = (data: any) => void

interface Subscription {
  channel: string
  callback: MessageCallback
}

class WebSocketService {
  private ws: WebSocket | null = null
  private subscriptions: Subscription[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private isConnecting = false

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        return
      }

      this.isConnecting = true

      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0

          // Resubscribe to all channels
          this.subscriptions.forEach(sub => {
            this.send({
              action: 'subscribe',
              channel: sub.channel
            })
          })

          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.isConnecting = false
          this.ws = null

          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

            setTimeout(() => {
              this.connect().catch(err => {
                console.error('Reconnection failed:', err)
              })
            }, this.reconnectDelay)
          }
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.subscriptions = []
  }

  subscribe(channel: string, callback: MessageCallback) {
    // Check if already subscribed
    const existing = this.subscriptions.find(sub => sub.channel === channel && sub.callback === callback)
    if (existing) {
      return
    }

    this.subscriptions.push({ channel, callback })

    // If connected, subscribe immediately
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        action: 'subscribe',
        channel
      })
    }
  }

  unsubscribe(channel: string, callback?: MessageCallback) {
    if (callback) {
      this.subscriptions = this.subscriptions.filter(
        sub => !(sub.channel === channel && sub.callback === callback)
      )
    } else {
      this.subscriptions = this.subscriptions.filter(sub => sub.channel !== channel)
    }

    // If connected, unsubscribe
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        action: 'unsubscribe',
        channel
      })
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  private handleMessage(data: any) {
    const { channel, ...payload } = data

    // Find and call all subscribers for this channel
    this.subscriptions
      .filter(sub => sub.channel === channel || sub.channel === '*')
      .forEach(sub => {
        try {
          sub.callback(payload)
        } catch (error) {
          console.error('Error in WebSocket callback:', error)
        }
      })
  }
}

// Create singleton instance
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4001'
const websocketService = new WebSocketService(wsUrl)

export default websocketService

// Helper functions for specific channels
export const subscribeToOrderBook = (symbol: string, callback: MessageCallback) => {
  websocketService.subscribe(`orderbook:${symbol}`, callback)
}

export const subscribeToTrades = (symbol: string, callback: MessageCallback) => {
  websocketService.subscribe(`trades:${symbol}`, callback)
}

export const subscribeToTicker = (symbol: string, callback: MessageCallback) => {
  websocketService.subscribe(`ticker:${symbol}`, callback)
}

export const subscribeToUserOrders = (callback: MessageCallback) => {
  websocketService.subscribe('user:orders', callback)
}

export const subscribeToUserPositions = (callback: MessageCallback) => {
  websocketService.subscribe('user:positions', callback)
}
