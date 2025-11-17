import apiClient from './client'
import type { Order, Position, Asset } from '@/types/trading'

export const tradingApi = {
  // Create order
  createOrder: (order: {
    symbol: string
    side: 'BUY' | 'SELL'
    type: 'LIMIT' | 'MARKET'
    price?: string
    quantity: string
    leverage?: number
    reduceOnly?: boolean
    postOnly?: boolean
    signature: string
  }) => {
    return apiClient.post<{ data: Order }>('/trade/order', order)
  },

  // Cancel order
  cancelOrder: (orderId: string) => {
    return apiClient.delete<{ success: boolean }>(`/trade/order/${orderId}`)
  },

  // Cancel all orders
  cancelAllOrders: (symbol?: string) => {
    return apiClient.delete<{ success: boolean }>('/trade/orders', {
      params: { symbol }
    })
  },

  // Get open orders
  getOpenOrders: (symbol?: string) => {
    return apiClient.get<{ data: Order[] }>('/trade/orders/open', {
      params: { symbol }
    })
  },

  // Get order history
  getOrderHistory: (symbol?: string, limit: number = 50) => {
    return apiClient.get<{ data: Order[] }>('/trade/orders/history', {
      params: { symbol, limit }
    })
  },

  // Set leverage
  setLeverage: (symbol: string, leverage: number) => {
    return apiClient.post<{ success: boolean }>('/trade/leverage', {
      symbol,
      leverage
    })
  },
}
