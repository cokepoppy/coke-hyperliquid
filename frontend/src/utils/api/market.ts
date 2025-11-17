import apiClient from './client'
import type { TradingPair, Ticker, OrderBook, Trade } from '@/types/market'

export const marketApi = {
  // Get all trading pairs
  getTradingPairs: () => {
    return apiClient.get<{ data: TradingPair[] }>('/market/pairs')
  },

  // Get ticker for a symbol
  getTicker: (symbol: string) => {
    const encodedSymbol = encodeURIComponent(symbol)
    return apiClient.get<{ data: Ticker }>(`/market/ticker/${encodedSymbol}`)
  },

  // Get order book
  getOrderBook: (symbol: string, depth: number = 20) => {
    const encodedSymbol = encodeURIComponent(symbol)
    return apiClient.get<{ data: OrderBook }>(`/market/orderbook/${encodedSymbol}`, {
      params: { depth }
    })
  },

  // Get recent trades
  getRecentTrades: (symbol: string, limit: number = 50) => {
    const encodedSymbol = encodeURIComponent(symbol)
    return apiClient.get<{ data: Trade[] }>(`/market/trades/${encodedSymbol}`, {
      params: { limit }
    })
  },

  // Get klines
  getKlines: (symbol: string, interval: string, limit: number = 500) => {
    const encodedSymbol = encodeURIComponent(symbol)
    return apiClient.get<{ data: any[] }>(`/market/klines/${encodedSymbol}`, {
      params: { interval, limit }
    })
  },
}
