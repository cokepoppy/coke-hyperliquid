<template>
  <div class="card h-full flex flex-col">
    <!-- Chart Header -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-border-primary">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-text-primary">Chart</span>

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

      <!-- Chart Tools -->
      <div class="flex items-center gap-2">
        <button
          @click="chartType = 'candle'"
          class="p-1.5 rounded hover:bg-bg-secondary transition-colors"
          :class="chartType === 'candle' ? 'bg-bg-secondary' : ''"
          title="Candlestick"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16" class="text-text-secondary">
            <rect x="7" y="2" width="2" height="2" fill="currentColor"/>
            <rect x="6" y="4" width="4" height="6" fill="currentColor"/>
            <rect x="7" y="10" width="2" height="4" fill="currentColor"/>
          </svg>
        </button>
        <button
          @click="chartType = 'line'"
          class="p-1.5 rounded hover:bg-bg-secondary transition-colors"
          :class="chartType === 'line' ? 'bg-bg-secondary' : ''"
          title="Line"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16" class="text-text-secondary">
            <path d="M2 12L6 8L10 10L14 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <button class="p-1.5 rounded hover:bg-bg-secondary transition-colors" title="Indicators">
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16" class="text-text-secondary">
            <path d="M2 14V8M8 14V2M14 14V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Chart Canvas -->
    <div class="flex-1 relative bg-bg-primary">
      <div ref="chartContainer" class="absolute inset-0"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'

const props = defineProps<{
  symbol?: string
}>()

const timeframes = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
]

const selectedTimeframe = ref('60')
const chartType = ref<'candle' | 'line'>('candle')
const chartContainer = ref<HTMLElement>()
let chartInstance: ECharts | null = null

// Mock data generator
const generateMockData = (count: number = 100) => {
  const data = []
  let basePrice = 50000
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * 60000 // 1 minute intervals
    const open = basePrice + (Math.random() - 0.5) * 100
    const close = open + (Math.random() - 0.5) * 200
    const high = Math.max(open, close) + Math.random() * 100
    const low = Math.min(open, close) - Math.random() * 100
    const volume = Math.random() * 10

    data.push({
      time: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: [open, close, low, high],
      volume: volume
    })

    basePrice = close
  }

  return data
}

const initChart = () => {
  if (!chartContainer.value) return

  chartInstance = echarts.init(chartContainer.value, {
    backgroundColor: 'transparent'
  })

  updateChart()

  window.addEventListener('resize', handleResize)
}

const updateChart = () => {
  if (!chartInstance) return

  const data = generateMockData()
  const times = data.map(d => d.time)
  const values = data.map(d => d.value)
  const volumes = data.map(d => d.volume)

  const option: echarts.EChartsOption = {
    animation: true,
    grid: [
      {
        left: '3%',
        right: '3%',
        top: '5%',
        height: '70%'
      },
      {
        left: '3%',
        right: '3%',
        top: '80%',
        height: '15%'
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#2a3439' } },
        axisLabel: { color: '#626e6c', fontSize: 10 },
        splitLine: { show: false },
      },
      {
        type: 'category',
        gridIndex: 1,
        data: times,
        axisLine: { lineStyle: { color: '#2a3439' } },
        axisLabel: { show: false },
        splitLine: { show: false },
      }
    ],
    yAxis: [
      {
        scale: true,
        axisLine: { show: false },
        axisLabel: {
          color: '#626e6c',
          fontSize: 10,
          formatter: (value: number) => value.toFixed(0)
        },
        splitLine: { lineStyle: { color: '#2a3439', type: 'dashed' } },
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLine: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      }
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: { color: '#626e6c' }
      },
      backgroundColor: '#1b2429',
      borderColor: '#2a3439',
      textStyle: { color: '#f6fefd' },
      formatter: (params: any) => {
        const data = params[0]
        if (!data) return ''
        const values = data.value
        return `
          <div style="font-size: 12px;">
            <div style="margin-bottom: 4px;">${data.name}</div>
            <div style="color: #50d2c1;">O: ${values[0].toFixed(2)}</div>
            <div style="color: #50d2c1;">C: ${values[1].toFixed(2)}</div>
            <div style="color: #f24a67;">L: ${values[2].toFixed(2)}</div>
            <div style="color: #1fa67d;">H: ${values[3].toFixed(2)}</div>
          </div>
        `
      }
    },
    series: [
      {
        type: chartType.value === 'candle' ? 'candlestick' : 'line',
        data: chartType.value === 'candle' ? values : values.map(v => v[1]),
        itemStyle: {
          color: '#1fa67d',
          color0: '#f24a67',
          borderColor: '#1fa67d',
          borderColor0: '#f24a67'
        },
        smooth: chartType.value === 'line',
        showSymbol: false,
        lineStyle: chartType.value === 'line' ? {
          color: '#50d2c1',
          width: 2
        } : undefined,
        areaStyle: chartType.value === 'line' ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(80, 210, 193, 0.3)' },
            { offset: 1, color: 'rgba(80, 210, 193, 0)' }
          ])
        } : undefined
      },
      {
        name: 'Volume',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes,
        itemStyle: {
          color: function(params: any) {
            const index = params.dataIndex
            if (index === 0) return '#1fa67d'
            return values[index][1] > values[index][0] ? '#1fa67d' : '#f24a67'
          }
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const changeTimeframe = (timeframe: string) => {
  selectedTimeframe.value = timeframe
  updateChart()
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(chartType, () => {
  updateChart()
})

onMounted(() => {
  initChart()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>
