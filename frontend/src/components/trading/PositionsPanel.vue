<template>
  <div class="card">
    <!-- Tabs -->
    <div class="flex items-center border-b border-border-primary">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        class="px-4 py-3 text-sm font-medium transition-colors relative"
        :class="activeTab === tab
          ? 'text-text-primary'
          : 'text-text-secondary hover:text-text-primary'"
      >
        {{ tab }}
        <div
          v-if="activeTab === tab"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"
        ></div>
      </button>
    </div>

    <!-- Content -->
    <div class="overflow-x-auto">
      <!-- Positions Tab -->
      <div v-if="activeTab === 'Positions'">
        <table class="w-full text-sm">
          <thead class="bg-bg-secondary">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-text-tertiary">Symbol</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Side</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Size</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Entry Price</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Mark Price</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Liq. Price</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">PnL</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="position in positions"
              :key="position.symbol"
              class="border-b border-border-primary hover:bg-bg-secondary transition-colors"
            >
              <td class="px-4 py-3">
                <div class="font-medium text-text-primary">{{ position.symbol }}</div>
                <div class="text-xs text-text-tertiary">{{ position.leverage }}x</div>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="px-2 py-0.5 rounded text-xs font-medium" :class="position.side === 'LONG' ? 'bg-buy/20 text-buy' : 'bg-sell/20 text-sell'">
                  {{ position.side }}
                </span>
              </td>
              <td class="px-4 py-3 text-right mono-number text-text-primary">{{ position.quantity }}</td>
              <td class="px-4 py-3 text-right mono-number text-text-primary">{{ position.entryPrice }}</td>
              <td class="px-4 py-3 text-right mono-number text-text-primary">{{ position.markPrice }}</td>
              <td class="px-4 py-3 text-right mono-number text-text-secondary">{{ position.liquidationPrice }}</td>
              <td class="px-4 py-3 text-right mono-number" :class="parseFloat(position.unrealizedPnl) >= 0 ? 'price-up' : 'price-down'">
                {{ formatPnl(position.unrealizedPnl) }}
              </td>
              <td class="px-4 py-3 text-right">
                <button class="px-3 py-1 text-xs rounded btn-secondary">
                  Close
                </button>
              </td>
            </tr>
            <tr v-if="positions.length === 0">
              <td colspan="8" class="px-4 py-8 text-center text-text-tertiary text-sm">
                No open positions
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Orders Tab -->
      <div v-if="activeTab === 'Orders'">
        <table class="w-full text-sm">
          <thead class="bg-bg-secondary">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-text-tertiary">Time</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-text-tertiary">Symbol</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Type</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Side</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Price</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Amount</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Filled</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Status</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in orders"
              :key="order.orderId"
              class="border-b border-border-primary hover:bg-bg-secondary transition-colors"
            >
              <td class="px-4 py-3 text-text-tertiary">{{ formatTime(order.createdAt) }}</td>
              <td class="px-4 py-3 text-text-primary font-medium">{{ order.symbol }}</td>
              <td class="px-4 py-3 text-right text-text-secondary">{{ order.type }}</td>
              <td class="px-4 py-3 text-right">
                <span :class="order.side === 'BUY' ? 'text-buy' : 'text-sell'">{{ order.side }}</span>
              </td>
              <td class="px-4 py-3 text-right mono-number text-text-primary">{{ order.price || '-' }}</td>
              <td class="px-4 py-3 text-right mono-number text-text-primary">{{ order.quantity }}</td>
              <td class="px-4 py-3 text-right mono-number text-text-secondary">{{ order.filledQuantity }}</td>
              <td class="px-4 py-3 text-right">
                <span class="text-xs text-text-tertiary">{{ order.status }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  v-if="order.status === 'OPEN'"
                  @click="cancelOrder(order.orderId)"
                  class="px-3 py-1 text-xs rounded btn-secondary"
                >
                  Cancel
                </button>
              </td>
            </tr>
            <tr v-if="orders.length === 0">
              <td colspan="9" class="px-4 py-8 text-center text-text-tertiary text-sm">
                No open orders
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'History'">
        <table class="w-full text-sm">
          <thead class="bg-bg-secondary">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-text-tertiary">Time</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-text-tertiary">Symbol</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Side</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Price</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Amount</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Fee</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-text-tertiary">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border-primary">
              <td colspan="7" class="px-4 py-8 text-center text-text-tertiary text-sm">
                No trade history
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Position, Order } from '@/types/trading'

const activeTab = ref('Positions')
const tabs = ['Positions', 'Orders', 'History']

// Mock data
const positions = ref<Position[]>([
  {
    symbol: 'BTC-PERP',
    side: 'LONG',
    quantity: '0.5',
    entryPrice: '49800.00',
    markPrice: '50245.32',
    liquidationPrice: '45000.00',
    leverage: 10,
    margin: '2490.00',
    unrealizedPnl: '222.66',
    realizedPnl: '0.00',
    marginRatio: '0.05',
  },
])

const orders = ref<Order[]>([
  {
    orderId: 'ORD123456',
    symbol: 'BTC/USDC',
    side: 'BUY',
    type: 'LIMIT',
    price: '50000.00',
    quantity: '0.1',
    filledQuantity: '0.0',
    status: 'OPEN',
    createdAt: Date.now() - 60000,
    updatedAt: Date.now(),
  },
])

const formatPnl = (pnl: string) => {
  const num = parseFloat(pnl)
  return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2)
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const cancelOrder = (orderId: string) => {
  console.log('Canceling order:', orderId)
  // API call to cancel order
}
</script>
