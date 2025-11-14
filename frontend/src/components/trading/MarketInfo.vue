<template>
  <div class="card px-2 md:px-4 py-3">
    <div class="flex items-center justify-between gap-4 md:gap-8 overflow-x-auto">
      <!-- Left: Symbol Info -->
      <div class="flex items-center gap-4">
        <!-- Symbol Selector -->
        <div class="relative" ref="symbolDropdown">
          <button
            @click="showSymbolMenu = !showSymbolMenu"
            class="flex items-center gap-2 hover:bg-bg-secondary px-2 py-1 rounded-md transition-colors"
          >
            <div class="flex items-center gap-2">
              <!-- Icon placeholder -->
              <div class="w-6 h-6 rounded-full bg-accent-primary flex items-center justify-center text-xs font-bold text-bg-primary">
                {{ symbolIcon }}
              </div>
              <div class="flex flex-col items-start">
                <div class="text-lg font-bold text-text-primary">
                  {{ currentPair.symbol }}
                </div>
              </div>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 12 12"
              fill="none"
              class="transition-transform text-text-secondary"
              :class="{ 'rotate-180': showSymbolMenu }"
            >
              <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </button>

          <!-- Symbol Dropdown -->
          <div
            v-show="showSymbolMenu"
            class="absolute top-full left-0 mt-1 bg-bg-secondary border border-border-primary rounded-lg shadow-xl w-80 max-h-96 overflow-y-auto z-50"
          >
            <div class="sticky top-0 bg-bg-secondary p-2 border-b border-border-primary">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search markets..."
                class="input-field text-sm"
              />
            </div>
            <div class="py-1">
              <button
                v-for="pair in filteredPairs"
                :key="pair.symbol"
                @click="selectPair(pair)"
                class="w-full px-4 py-2 flex items-center justify-between hover:bg-bg-primary transition-colors"
              >
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-text-primary">{{ pair.symbol }}</span>
                  <span class="text-xs px-2 py-0.5 rounded" :class="pair.type === 'SPOT' ? 'bg-buy-bg text-buy' : 'bg-sell-bg text-sell'">
                    {{ pair.type }}
                  </span>
                </div>
                <span class="text-sm mono-number" :class="parseFloat(pair.change24h) >= 0 ? 'price-up' : 'price-down'">
                  {{ formatPercent(pair.change24h) }}%
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Market Type Badge -->
        <div class="px-2 py-1 rounded-md text-xs font-medium" :class="currentPair.type === 'SPOT' ? 'bg-buy-bg text-buy' : 'bg-sell-bg text-sell'">
          {{ currentPair.type }}
        </div>
      </div>

      <!-- Right: Market Stats -->
      <div class="hidden md:flex items-center gap-4 lg:gap-8 overflow-x-auto no-scrollbar">
        <!-- Price -->
        <div class="flex flex-col gap-1">
          <div class="text-xs text-text-tertiary">Price</div>
          <div class="text-sm font-medium mono-number text-text-primary">
            {{ formatPrice(currentPair.lastPrice) }}
          </div>
        </div>

        <!-- 24h Change -->
        <div class="flex flex-col gap-1">
          <div class="text-xs text-text-tertiary">24h Change</div>
          <div class="text-sm font-medium mono-number" :class="parseFloat(currentPair.change24h) >= 0 ? 'price-up' : 'price-down'">
            <span>{{ formatChange(currentPair.change24h) }}</span>
            <span class="ml-1">/</span>
            <span class="ml-1">{{ formatPercent(currentPair.change24h) }}%</span>
          </div>
        </div>

        <!-- 24h Volume -->
        <div class="flex flex-col gap-1">
          <div class="text-xs text-text-tertiary">24h Volume</div>
          <div class="text-sm font-medium mono-number text-text-primary">
            {{ formatVolume(currentPair.volume24h) }} {{ currentPair.quoteAsset }}
          </div>
        </div>

        <!-- Market Cap (for spot) -->
        <div v-if="currentPair.marketCap" class="flex flex-col gap-1">
          <div class="text-xs text-text-tertiary">Market Cap</div>
          <div class="text-sm font-medium mono-number text-text-primary">
            {{ formatVolume(currentPair.marketCap) }} {{ currentPair.quoteAsset }}
          </div>
        </div>

        <!-- 24h High -->
        <div class="flex flex-col gap-1">
          <div class="text-xs text-text-tertiary">24h High</div>
          <div class="text-sm font-medium mono-number text-text-primary">
            {{ formatPrice(currentPair.high24h) }}
          </div>
        </div>

        <!-- 24h Low -->
        <div class="flex flex-col gap-1">
          <div class="text-xs text-text-tertiary">24h Low</div>
          <div class="text-sm font-medium mono-number text-text-primary">
            {{ formatPrice(currentPair.low24h) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { TradingPair } from '@/types/market'

// Mock data
const currentPair = ref<TradingPair>({
  symbol: 'BTC/USDC',
  baseAsset: 'BTC',
  quoteAsset: 'USDC',
  type: 'SPOT',
  lastPrice: '50245.32',
  change24h: '2.45',
  volume24h: '1234567890.50',
  high24h: '51200.00',
  low24h: '49800.00',
  marketCap: '982345678901.23',
})

const availablePairs = ref<TradingPair[]>([
  currentPair.value,
  {
    symbol: 'ETH/USDC',
    baseAsset: 'ETH',
    quoteAsset: 'USDC',
    type: 'SPOT',
    lastPrice: '3024.56',
    change24h: '1.23',
    volume24h: '567890123.45',
    high24h: '3100.00',
    low24h: '2980.00',
    marketCap: '363456789012.34',
  },
  {
    symbol: 'BTC-PERP',
    baseAsset: 'BTC',
    quoteAsset: 'USDC',
    type: 'PERPETUAL',
    lastPrice: '50300.00',
    change24h: '-0.56',
    volume24h: '987654321.00',
    high24h: '51500.00',
    low24h: '49900.00',
  },
])

const showSymbolMenu = ref(false)
const searchQuery = ref('')
const symbolDropdown = ref<HTMLElement>()

const symbolIcon = computed(() => {
  return currentPair.value.baseAsset.substring(0, 1)
})

const filteredPairs = computed(() => {
  if (!searchQuery.value) return availablePairs.value
  return availablePairs.value.filter(pair =>
    pair.symbol.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const selectPair = (pair: TradingPair) => {
  currentPair.value = pair
  showSymbolMenu.value = false
  searchQuery.value = ''
}

const formatPrice = (price: string) => {
  return parseFloat(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const formatChange = (change: string) => {
  const num = parseFloat(change)
  return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2)
}

const formatPercent = (change: string) => {
  const num = parseFloat(change)
  return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2)
}

const formatVolume = (volume: string) => {
  const num = parseFloat(volume)
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const handleClickOutside = (event: MouseEvent) => {
  if (symbolDropdown.value && !symbolDropdown.value.contains(event.target as Node)) {
    showSymbolMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
