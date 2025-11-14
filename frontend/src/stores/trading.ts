import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Position, Order, Asset } from '@/types/trading'

export const useTradingStore = defineStore('trading', () => {
  const positions = ref<Position[]>([])
  const orders = ref<Order[]>([])
  const assets = ref<Asset[]>([])

  const addPosition = (position: Position) => {
    positions.value.push(position)
  }

  const removePosition = (symbol: string) => {
    const index = positions.value.findIndex(p => p.symbol === symbol)
    if (index !== -1) {
      positions.value.splice(index, 1)
    }
  }

  const addOrder = (order: Order) => {
    orders.value.push(order)
  }

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    const order = orders.value.find(o => o.orderId === orderId)
    if (order) {
      Object.assign(order, updates)
    }
  }

  const removeOrder = (orderId: string) => {
    const index = orders.value.findIndex(o => o.orderId === orderId)
    if (index !== -1) {
      orders.value.splice(index, 1)
    }
  }

  const updateAssets = (newAssets: Asset[]) => {
    assets.value = newAssets
  }

  return {
    positions,
    orders,
    assets,
    addPosition,
    removePosition,
    addOrder,
    updateOrder,
    removeOrder,
    updateAssets,
  }
})
