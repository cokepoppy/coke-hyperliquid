<template>
  <div class="card h-full flex flex-col">
    <!-- Chart Header -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-border-primary">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-text-primary">{{ props.symbol || 'BTC/USDC' }}</span>

        <!-- Timeframe Selector -->
        <div class="flex items-center gap-1">
          <button
            v-for="tf in timeframes"
            :key="tf.value"
            @click="changeTimeframe(tf.value)"
            class="px-2 py-1 text-xs rounded transition-colors"
            :class="selectedTimeframe === tf.value
              ? 'bg-accent-primary text-bg-primary font-medium'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'"
          >
            {{ tf.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- TradingView Chart Container -->
    <div class="flex-1 relative bg-bg-primary">
      <!-- Loading Indicator -->
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-bg-primary/80 z-10">
        <div class="text-text-secondary text-sm">
          <i class="fas fa-spinner fa-spin"></i>
          Loading chart...
        </div>
      </div>

      <!-- TradingView Widget Container -->
      <div ref="chartContainer" id="tradingview_chart" class="absolute inset-0"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

declare global {
  interface Window {
    TradingView: any
    tvWidget: any
  }
}

const props = defineProps<{
  symbol?: string
}>()

const timeframes = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
]

const selectedTimeframe = ref('60')
const chartContainer = ref<HTMLElement>()
const isLoading = ref(true)

let tvWidget: any = null

// Convert symbol format: BTC/USDC -> BTCUSDC
const getFormattedSymbol = () => {
  const sym = props.symbol || 'BTC/USDC'
  return sym.replace('/', '')
}

// Initialize TradingView Widget
const initTradingView = () => {
  if (!chartContainer.value || !window.TradingView) {
    setTimeout(initTradingView, 400)
    return
  }

  try {
    const symbol = getFormattedSymbol()

    tvWidget = new window.TradingView.widget({
      autosize: true,
      symbol: `BINANCE:${symbol}`,
      interval: selectedTimeframe.value,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1', // Candle style
      locale: 'en',
      toolbar_bg: '#131722',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: 'tradingview_chart',
      studies: [
        {
          id: 'Volume@tv-basicstudies',
          inputs: {}
        }
      ],
      disabled_features: [
        'use_localstorage_for_settings',
        'header_symbol_search',
        'symbol_search_hot_key',
      ],
      enabled_features: [
        'study_templates',
        'side_toolbar_in_fullscreen_mode',
      ],
      loading_screen: {
        backgroundColor: '#131722',
        foregroundColor: '#787b86',
      },
      overrides: {
        'mainSeriesProperties.candleStyle.upColor': '#26a69a',
        'mainSeriesProperties.candleStyle.downColor': '#ef5350',
        'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
        'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350',
        'paneProperties.background': '#131722',
        'paneProperties.vertGridProperties.color': '#1e222d',
        'paneProperties.horzGridProperties.color': '#1e222d',
      },
    })

    // Check if onChartReady method exists before calling
    if (tvWidget && typeof tvWidget.onChartReady === 'function') {
      tvWidget.onChartReady(() => {
        isLoading.value = false
        window.tvWidget = tvWidget
      })
    } else {
      // Fallback: just set loading to false after a delay
      setTimeout(() => {
        isLoading.value = false
        window.tvWidget = tvWidget
      }, 1000)
    }
  } catch (error) {
    console.error('TradingView init failed:', error)
    isLoading.value = false
  }
}

// Change timeframe
const changeTimeframe = (timeframe: string) => {
  selectedTimeframe.value = timeframe

  if (tvWidget && tvWidget.chart) {
    tvWidget.chart().setResolution(timeframe)
  }
}

// Load TradingView script
const loadTradingViewScript = () => {
  return new Promise((resolve, reject) => {
    if (window.TradingView) {
      resolve(window.TradingView)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => resolve(window.TradingView)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  try {
    await loadTradingViewScript()
    initTradingView()
  } catch (error) {
    console.error('Failed to load TradingView:', error)
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  if (tvWidget) {
    tvWidget.remove()
    tvWidget = null
  }
})

// Watch for symbol changes
watch(() => props.symbol, () => {
  if (tvWidget) {
    tvWidget.remove()
    tvWidget = null
  }
  isLoading.value = true
  initTradingView()
})
</script>

<style scoped>
#tradingview_chart {
  background-color: #131722;
}

:deep(iframe) {
  border: none;
}
</style>
