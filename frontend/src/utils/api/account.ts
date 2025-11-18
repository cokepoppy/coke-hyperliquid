import apiClient from './client'
import type { Position, Asset } from '@/types/trading'

export const accountApi = {
  // Get account balance
  getBalance: () => {
    return apiClient.get<{ data: Asset[] }>('/account/balance')
  },

  // Get positions
  getPositions: (symbol?: string) => {
    return apiClient.get<{ data: Position[] }>('/account/positions', {
      params: { symbol }
    })
  },

  // Close position
  closePosition: (symbol: string, side: 'LONG' | 'SHORT') => {
    return apiClient.post<{ success: boolean }>('/account/position/close', {
      symbol,
      side
    })
  },

  // Get trade history
  getTradeHistory: (symbol?: string, limit: number = 100) => {
    return apiClient.get<{ data: any[] }>('/account/trades', {
      params: { symbol, limit }
    })
  },

  // Get asset logs
  getAssetLogs: (asset?: string, limit: number = 100) => {
    return apiClient.get<{ data: any[] }>('/account/logs', {
      params: { asset, limit }
    })
  },

  // Deposit funds
  deposit: (data: { asset: string; amount: string }) => {
    return apiClient.post<{ success: boolean; data: any }>('/account/deposit', data)
  },
}
