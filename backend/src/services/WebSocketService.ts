import { WebSocket, WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import logger from '../utils/logger'

interface Client {
  ws: WebSocket
  userId?: number
  subscriptions: Set<string>
}

/**
 * WebSocket Service - Manages WebSocket connections and broadcasts
 */
export class WebSocketService {
  private wss: WebSocketServer
  private clients: Map<WebSocket, Client> = new Map()
  private channelSubscribers: Map<string, Set<WebSocket>> = new Map()

  constructor(port: number) {
    this.wss = new WebSocketServer({ port })
    this.setupServer()
    logger.info('WebSocket server started', { port })
  }

  /**
   * Setup WebSocket server
   */
  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientIp = req.socket.remoteAddress
      logger.info('Client connected', { clientIp })

      // Initialize client
      const client: Client = {
        ws,
        subscriptions: new Set(),
      }
      this.clients.set(ws, client)

      // Setup client handlers
      this.setupClientHandlers(ws, client)

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        message: 'Connected to Hyperliquid WebSocket',
        timestamp: Date.now(),
      })
    })

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error', { error })
    })
  }

  /**
   * Setup handlers for a client connection
   */
  private setupClientHandlers(ws: WebSocket, client: Client): void {
    // Handle messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())
        this.handleClientMessage(ws, client, message)
      } catch (error) {
        logger.error('Failed to parse WebSocket message', { error })
        this.sendError(ws, 'Invalid message format')
      }
    })

    // Handle disconnect
    ws.on('close', () => {
      logger.info('Client disconnected')
      this.handleClientDisconnect(ws, client)
    })

    // Handle errors
    ws.on('error', (error) => {
      logger.error('Client WebSocket error', { error })
    })

    // Setup ping/pong for keepalive
    ws.on('pong', () => {
      // Client is alive
    })
  }

  /**
   * Handle client messages
   */
  private handleClientMessage(ws: WebSocket, client: Client, message: any): void {
    // Support both 'method' and 'action' for compatibility
    const method = message.method || message.action
    const params = message.params || message

    switch (method) {
      case 'subscribe':
        this.handleSubscribe(ws, client, params)
        break

      case 'unsubscribe':
        this.handleUnsubscribe(ws, client, params)
        break

      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: Date.now() })
        break

      default:
        this.sendError(ws, `Unknown method: ${method}`)
    }
  }

  /**
   * Handle subscribe request
   */
  private handleSubscribe(ws: WebSocket, client: Client, params: any): void {
    const { channel } = params

    if (!channel) {
      this.sendError(ws, 'Channel is required')
      return
    }

    // Add to client subscriptions
    client.subscriptions.add(channel)

    // Add to channel subscribers
    if (!this.channelSubscribers.has(channel)) {
      this.channelSubscribers.set(channel, new Set())
    }
    this.channelSubscribers.get(channel)!.add(ws)

    logger.debug('Client subscribed', { channel })

    this.sendToClient(ws, {
      type: 'subscribed',
      channel,
      timestamp: Date.now(),
    })
  }

  /**
   * Handle unsubscribe request
   */
  private handleUnsubscribe(ws: WebSocket, client: Client, params: any): void {
    const { channel } = params

    if (!channel) {
      this.sendError(ws, 'Channel is required')
      return
    }

    // Remove from client subscriptions
    client.subscriptions.delete(channel)

    // Remove from channel subscribers
    const subscribers = this.channelSubscribers.get(channel)
    if (subscribers) {
      subscribers.delete(ws)
      if (subscribers.size === 0) {
        this.channelSubscribers.delete(channel)
      }
    }

    logger.debug('Client unsubscribed', { channel })

    this.sendToClient(ws, {
      type: 'unsubscribed',
      channel,
      timestamp: Date.now(),
    })
  }

  /**
   * Handle client disconnect
   */
  private handleClientDisconnect(ws: WebSocket, client: Client): void {
    // Remove from all subscriptions
    for (const channel of client.subscriptions) {
      const subscribers = this.channelSubscribers.get(channel)
      if (subscribers) {
        subscribers.delete(ws)
        if (subscribers.size === 0) {
          this.channelSubscribers.delete(channel)
        }
      }
    }

    // Remove client
    this.clients.delete(ws)
  }

  /**
   * Broadcast to a channel
   */
  public broadcastToChannel(channel: string, data: any): void {
    const subscribers = this.channelSubscribers.get(channel)

    if (!subscribers || subscribers.size === 0) {
      return
    }

    const message = {
      channel,
      data,
      timestamp: Date.now(),
    }

    const messageStr = JSON.stringify(message)

    subscribers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr)
      }
    })

    logger.debug('Broadcast to channel', { channel, subscribers: subscribers.size })
  }

  /**
   * Send message to specific client
   */
  private sendToClient(ws: WebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

  /**
   * Send error to client
   */
  private sendError(ws: WebSocket, message: string): void {
    this.sendToClient(ws, {
      type: 'error',
      message,
      timestamp: Date.now(),
    })
  }

  /**
   * Get server statistics
   */
  public getStats(): {
    clients: number
    channels: number
    subscriptions: number
  } {
    let totalSubscriptions = 0
    this.clients.forEach((client) => {
      totalSubscriptions += client.subscriptions.size
    })

    return {
      clients: this.clients.size,
      channels: this.channelSubscribers.size,
      subscriptions: totalSubscriptions,
    }
  }

  /**
   * Start heartbeat to keep connections alive
   */
  public startHeartbeat(interval: number = 30000): void {
    setInterval(() => {
      this.clients.forEach((client, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping()
        }
      })
    }, interval)

    logger.info('Heartbeat started', { interval })
  }

  /**
   * Close server
   */
  public close(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => {
        logger.info('WebSocket server closed')
        resolve()
      })
    })
  }
}
