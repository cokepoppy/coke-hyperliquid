import { onMounted, onUnmounted } from 'vue'
import { useWebSocket } from './useWebSocket'
import { useMarketStore } from '@/stores/market'

export function useMarketData() {
  const marketStore = useMarketStore()
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws'
  const { connected, connect, subscribe } = useWebSocket(wsUrl)

  const subscribeToTicker = (symbol: string) => {
    return subscribe(`ticker.${symbol}`, (data) => {
      marketStore.updateTicker(symbol, data)
    })
  }

  const subscribeToOrderBook = (symbol: string) => {
    return subscribe(`orderbook.${symbol}`, (data) => {
      marketStore.updateOrderBook(symbol, data)
    })
  }

  const subscribeToTrades = (symbol: string, callback: (data: any) => void) => {
    return subscribe(`trades.${symbol}`, callback)
  }

  onMounted(() => {
    connect()
  })

  return {
    connected,
    subscribeToTicker,
    subscribeToOrderBook,
    subscribeToTrades
  }
}
