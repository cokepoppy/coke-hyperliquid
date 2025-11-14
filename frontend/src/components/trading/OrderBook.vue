<template>
  <div class="card h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-border-primary">
      <span class="text-sm font-medium text-text-primary">Order Book</span>

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
import { ref, computed } from 'vue'
import type { OrderBookLevel } from '@/types/market'

// Mock order book data
const asks = ref<OrderBookLevel[]>([
  { price: '50255.50', quantity: '0.125' },
  { price: '50254.00', quantity: '0.234' },
  { price: '50253.50', quantity: '0.456' },
  { price: '50252.00', quantity: '0.789' },
  { price: '50251.50', quantity: '1.234' },
  { price: '50250.00', quantity: '0.567' },
  { price: '50249.50', quantity: '0.890' },
  { price: '50248.00', quantity: '1.123' },
])

const bids = ref<OrderBookLevel[]>([
  { price: '50245.00', quantity: '0.345' },
  { price: '50244.50', quantity: '0.678' },
  { price: '50243.00', quantity: '0.901' },
  { price: '50242.50', quantity: '1.234' },
  { price: '50241.00', quantity: '0.567' },
  { price: '50240.50', quantity: '0.890' },
  { price: '50239.00', quantity: '1.123' },
  { price: '50238.50', quantity: '0.456' },
])

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
</script>
