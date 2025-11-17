<template>
  <div class="card h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-border-primary">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-text-primary">Order Book</span>
        <div v-if="isLoading" class="w-3 h-3 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Precision Selector -->
      <button class="text-xs text-text-secondary hover:text-text-primary transition-colors">
        0.01
      </button>
    </div>

    <!-- Column Headers -->
    <div class="grid grid-cols-3 px-4 py-2 text-xs text-text-tertiary border-b border-border-primary">
      <span>Price</span>
      <span class="text-right">Amount</span>
      <span class="text-right">Total</span>
    </div>

    <!-- Order Book Content -->
    <div class="flex-1 overflow-hidden flex flex-col">
      <!-- Asks (Sell Orders) -->
      <div class="flex-1 overflow-y-auto flex flex-col-reverse px-4">
        <div
          v-for="(ask, index) in displayAsks"
          :key="'ask-' + index"
          class="relative grid grid-cols-3 py-0.5 text-sm mono-number hover:bg-bg-secondary cursor-pointer"
        >
          <!-- Depth Bar -->
          <div
            class="absolute inset-y-0 right-0 bg-sell/10"
            :style="{ width: ask.depthPercent + '%' }"
          ></div>

          <span class="text-sell z-10">{{ formatPrice(ask.price) }}</span>
          <span class="text-right text-text-primary z-10">{{ formatAmount(ask.quantity) }}</span>
          <span class="text-right text-text-secondary z-10">{{ formatAmount(ask.total) }}</span>
        </div>
      </div>

      <!-- Spread -->
      <div class="px-4 py-2 bg-bg-secondary border-y border-border-primary">
        <div class="flex items-center justify-between text-sm">
          <span class="text-text-tertiary">Spread</span>
          <span class="mono-number font-medium" :class="parseFloat(spread) >= 0 ? 'price-up' : 'price-down'">
            {{ formatPrice(spread) }}
          </span>
        </div>
      </div>

      <!-- Bids (Buy Orders) -->
      <div class="flex-1 overflow-y-auto px-4">
        <div
          v-for="(bid, index) in displayBids"
          :key="'bid-' + index"
          class="relative grid grid-cols-3 py-0.5 text-sm mono-number hover:bg-bg-secondary cursor-pointer"
        >
          <!-- Depth Bar -->
          <div
            class="absolute inset-y-0 right-0 bg-buy/10"
            :style="{ width: bid.depthPercent + '%' }"
          ></div>

          <span class="text-buy z-10">{{ formatPrice(bid.price) }}</span>
          <span class="text-right text-text-primary z-10">{{ formatAmount(bid.quantity) }}</span>
          <span class="text-right text-text-secondary z-10">{{ formatAmount(bid.total) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { OrderBookLevel } from '@/types/market'
import { marketApi } from '@/utils/api'

const props = defineProps<{
  symbol?: string
}>()

const asks = ref<OrderBookLevel[]>([])
const bids = ref<OrderBookLevel[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
let refreshInterval: number | null = null

// Load order book data
const loadOrderBook = async () => {
  const symbol = props.symbol || 'BTC/USDC'
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await marketApi.getOrderBook(symbol, 20)
    const orderbook = response.data

    asks.value = orderbook.asks
    bids.value = orderbook.bids
  } catch (error: any) {
    console.error('Failed to load order book:', error)
    errorMessage.value = 'Failed to load order book'

    // Fallback to mock data
    asks.value = generateMockAsks()
    bids.value = generateMockBids()
  } finally {
    isLoading.value = false
  }
}

// Generate mock data (fallback)
const generateMockAsks = (): OrderBookLevel[] => {
  const basePrice = 50250
  return Array.from({ length: 8 }, (_, i) => ({
    price: (basePrice + (i + 1) * 0.5).toFixed(2),
    quantity: (Math.random() * 1 + 0.1).toFixed(3)
  }))
}

const generateMockBids = (): OrderBookLevel[] => {
  const basePrice = 50245
  return Array.from({ length: 8 }, (_, i) => ({
    price: (basePrice - i * 0.5).toFixed(2),
    quantity: (Math.random() * 1 + 0.1).toFixed(3)
  }))
}

const spread = computed(() => {
  if (asks.value.length === 0 || bids.value.length === 0) return '0.00'
  const lowestAsk = parseFloat(asks.value[asks.value.length - 1].price)
  const highestBid = parseFloat(bids.value[0].price)
  return (lowestAsk - highestBid).toFixed(2)
})

const displayAsks = computed(() => {
  let total = 0
  const maxTotal = asks.value.reduce((sum, level) => sum + parseFloat(level.quantity), 0)

  return asks.value.map(level => {
    total += parseFloat(level.quantity)
    return {
      ...level,
      total: total.toFixed(3),
      depthPercent: ((total / maxTotal) * 100).toFixed(2)
    }
  })
})

const displayBids = computed(() => {
  let total = 0
  const maxTotal = bids.value.reduce((sum, level) => sum + parseFloat(level.quantity), 0)

  return bids.value.map(level => {
    total += parseFloat(level.quantity)
    return {
      ...level,
      total: total.toFixed(3),
      depthPercent: ((total / maxTotal) * 100).toFixed(2)
    }
  })
})

const formatPrice = (price: string) => {
  return parseFloat(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const formatAmount = (amount: string) => {
  return parseFloat(amount).toFixed(3)
}

onMounted(() => {
  // Initial load
  loadOrderBook()

  // Auto-refresh every 2 seconds
  refreshInterval = window.setInterval(() => {
    loadOrderBook()
  }, 2000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
