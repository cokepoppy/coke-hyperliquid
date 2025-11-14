import apiClient from './client'
import type { TradingPair, Ticker, OrderBook, Trade } from '@/types/market'

export const marketApi = {
  // Get all trading pairs
  getTradingPairs: () => {
    return apiClient.get<{ data: TradingPair[] }>('/market/pairs')
  },

  // Get ticker for a symbol
  getTicker: (symbol: string) => {
    return apiClient.get<{ data: Ticker }>(`/market/ticker/${symbol}`)
  },

  // Get order book
  getOrderBook: (symbol: string, depth: number = 20) => {
    return apiClient.get<{ data: OrderBook }>(`/market/orderbook/${symbol}`, {
      params: { depth }
    })
  },

  // Get recent trades
  getRecentTrades: (symbol: string, limit: number = 50) => {
    return apiClient.get<{ data: Trade[] }>(`/market/trades/${symbol}`, {
      params: { limit }
    })
  },

  // Get klines
  getKlines: (symbol: string, interval: string, limit: number = 500) => {
    return apiClient.get<{ data: any[] }>(`/market/klines/${symbol}`, {
      params: { interval, limit }
    })
  },
}
