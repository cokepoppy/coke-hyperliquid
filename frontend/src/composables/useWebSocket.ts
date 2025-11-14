import { ref, onUnmounted } from 'vue'

export interface WebSocketMessage {
  channel: string
  data: any
}

export function useWebSocket(url: string) {
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  const messageHandlers = new Map<string, Set<(data: any) => void>>()

  const connect = () => {
    try {
      ws.value = new WebSocket(url)

      ws.value.onopen = () => {
        connected.value = true
        reconnectAttempts.value = 0
        console.log('WebSocket connected')
      }

      ws.value.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          const handlers = messageHandlers.get(message.channel)

          if (handlers) {
            handlers.forEach(handler => handler(message.data))
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }

      ws.value.onclose = () => {
        connected.value = false
        console.log('WebSocket disconnected')

        // Auto reconnect
        if (reconnectAttempts.value < maxReconnectAttempts) {
          reconnectAttempts.value++
          console.log(`Reconnecting... Attempt ${reconnectAttempts.value}`)
          setTimeout(connect, reconnectDelay)
        }
      }

      ws.value.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('WebSocket connection error:', error)
    }
  }

  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  const send = (data: any) => {
    if (ws.value && connected.value) {
      ws.value.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket not connected')
    }
  }

  const subscribe = (channel: string, handler: (data: any) => void) => {
    if (!messageHandlers.has(channel)) {
      messageHandlers.set(channel, new Set())
    }
    messageHandlers.get(channel)!.add(handler)

    // Send subscription message
    send({
      method: 'subscribe',
      params: { channel }
    })

    // Return unsubscribe function
    return () => unsubscribe(channel, handler)
  }

  const unsubscribe = (channel: string, handler: (data: any) => void) => {
    const handlers = messageHandlers.get(channel)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        messageHandlers.delete(channel)
        send({
          method: 'unsubscribe',
          params: { channel }
        })
      }
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    connected,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe
  }
}
