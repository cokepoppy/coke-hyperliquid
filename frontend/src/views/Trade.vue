<template>
  <div class="h-full flex flex-col bg-bg-tertiary">
    <!-- Navbar -->
    <Navbar />

    <!-- Market Info -->
    <div class="px-2 py-2">
      <MarketInfo />
    </div>

    <!-- Main Trading Grid - Desktop -->
    <div class="hidden lg:grid flex-1 gap-2 px-2 pb-2 overflow-hidden trading-grid-desktop">
      <!-- Chart Area -->
      <div class="overflow-hidden" style="grid-area: chart;">
        <TradingChart />
      </div>

      <!-- Order Book -->
      <div class="overflow-hidden" style="grid-area: orderbook; max-height: 500px;">
        <OrderBook />
      </div>

      <!-- Trade Form -->
      <div class="overflow-hidden" style="grid-area: tradeform; max-height: 500px;">
        <TradeForm symbol="BTC" :is-perpetual="false" />
      </div>

      <!-- Positions Panel -->
      <div class="overflow-hidden" style="grid-area: positions;">
        <PositionsPanel />
      </div>
    </div>

    <!-- Main Trading Layout - Tablet -->
    <div class="hidden md:grid lg:hidden flex-1 gap-2 px-2 pb-2 overflow-hidden trading-grid-tablet">
      <!-- Chart Area -->
      <div class="overflow-hidden" style="grid-area: chart;">
        <TradingChart />
      </div>

      <!-- Order Book -->
      <div class="overflow-hidden" style="grid-area: orderbook;">
        <OrderBook />
      </div>

      <!-- Trade Form -->
      <div class="overflow-hidden" style="grid-area: tradeform;">
        <TradeForm symbol="BTC" :is-perpetual="false" />
      </div>

      <!-- Positions Panel -->
      <div class="overflow-hidden" style="grid-area: positions;">
        <PositionsPanel />
      </div>
    </div>

    <!-- Main Trading Layout - Mobile -->
    <div class="md:hidden flex-1 overflow-y-auto px-2 pb-2">
      <!-- Mobile Tabs -->
      <div class="sticky top-0 z-10 bg-bg-tertiary pb-2">
        <div class="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            v-for="tab in mobileTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors"
            :class="activeTab === tab.id
              ? 'bg-accent-primary text-bg-primary'
              : 'bg-bg-secondary text-text-secondary'"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Mobile Content -->
      <div class="space-y-2">
        <!-- Chart Tab -->
        <div v-show="activeTab === 'chart'" class="h-[400px]">
          <TradingChart />
        </div>

        <!-- Trade Tab -->
        <div v-show="activeTab === 'trade'">
          <TradeForm symbol="BTC" :is-perpetual="false" />
        </div>

        <!-- Orderbook Tab -->
        <div v-show="activeTab === 'orderbook'" class="h-[600px]">
          <OrderBook />
        </div>

        <!-- Positions Tab -->
        <div v-show="activeTab === 'positions'">
          <PositionsPanel />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Navbar from '@/components/layout/Navbar.vue'
import MarketInfo from '@/components/trading/MarketInfo.vue'
import TradingChart from '@/components/trading/TradingChart.vue'
import OrderBook from '@/components/trading/OrderBook.vue'
import TradeForm from '@/components/trading/TradeForm.vue'
import PositionsPanel from '@/components/trading/PositionsPanel.vue'

const activeTab = ref('chart')

const mobileTabs = [
  { id: 'chart', label: 'Chart' },
  { id: 'trade', label: 'Trade' },
  { id: 'orderbook', label: 'Book' },
  { id: 'positions', label: 'Positions' },
]
</script>

<style scoped>
/* Desktop Layout */
.trading-grid-desktop {
  grid-template-areas:
    "chart chart orderbook"
    "chart chart tradeform"
    "positions positions positions";
  grid-template-columns: 1fr 1fr 360px;
  grid-template-rows: 1fr auto 300px;
}

/* Tablet Layout */
.trading-grid-tablet {
  grid-template-areas:
    "chart chart"
    "orderbook tradeform"
    "positions positions";
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 400px auto auto;
}
</style>
