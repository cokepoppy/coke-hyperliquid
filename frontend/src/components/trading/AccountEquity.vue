<template>
  <div class="card h-full flex flex-col">
    <!-- Header -->
    <div class="px-4 py-2 border-b border-border-primary">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-text-primary">Account Equity</span>
        <div v-if="wsConnected" class="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live"></div>
      </div>
    </div>

    <!-- Account Stats -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <!-- Total Equity -->
      <div class="space-y-1">
        <div class="text-xs text-text-tertiary">Total Equity</div>
        <div class="text-lg font-bold mono-number text-text-primary">
          ${{ formatNumber(accountData.totalEquity) }}
        </div>
      </div>

      <!-- Available Balance -->
      <div class="flex justify-between items-center py-2 border-t border-border-primary">
        <span class="text-xs text-text-tertiary">Available Balance</span>
        <span class="text-sm mono-number text-text-primary">
          ${{ formatNumber(accountData.availableBalance) }}
        </span>
      </div>

      <!-- Margin Used -->
      <div class="flex justify-between items-center py-2 border-t border-border-primary">
        <span class="text-xs text-text-tertiary">Margin Used</span>
        <span class="text-sm mono-number text-text-primary">
          ${{ formatNumber(accountData.marginUsed) }}
        </span>
      </div>

      <!-- Unrealized PnL -->
      <div class="flex justify-between items-center py-2 border-t border-border-primary">
        <span class="text-xs text-text-tertiary">Unrealized PnL</span>
        <span
          class="text-sm mono-number font-medium"
          :class="accountData.unrealizedPnl >= 0 ? 'price-up' : 'price-down'"
        >
          {{ accountData.unrealizedPnl >= 0 ? '+' : '' }}${{ formatNumber(Math.abs(accountData.unrealizedPnl)) }}
        </span>
      </div>

      <!-- Margin Ratio -->
      <div class="flex justify-between items-center py-2 border-t border-border-primary">
        <span class="text-xs text-text-tertiary">Margin Ratio</span>
        <span
          class="text-sm mono-number font-medium"
          :class="getMarginRatioColor(accountData.marginRatio)"
        >
          {{ (accountData.marginRatio * 100).toFixed(2) }}%
        </span>
      </div>

      <!-- Maintenance Margin -->
      <div class="flex justify-between items-center py-2 border-t border-border-primary">
        <span class="text-xs text-text-tertiary">Maintenance Margin</span>
        <span class="text-sm mono-number text-text-primary">
          ${{ formatNumber(accountData.maintenanceMargin) }}
        </span>
      </div>

      <!-- Liquidation Warning -->
      <div
        v-if="accountData.marginRatio > 0.8"
        class="mt-4 p-3 bg-sell-bg border border-sell rounded-md"
      >
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-sell" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span class="text-xs text-sell font-medium">High Margin Risk</span>
        </div>
      </div>

      <!-- Assets -->
      <div v-if="assets.length > 0" class="mt-4 pt-3 border-t border-border-primary">
        <div class="text-xs font-medium text-text-tertiary mb-2">Assets</div>
        <div class="space-y-2">
          <div
            v-for="asset in assets"
            :key="asset.asset"
            class="flex justify-between items-center text-sm"
          >
            <span class="text-text-secondary">{{ asset.asset }}</span>
            <span class="mono-number text-text-primary font-medium">
              {{ formatAssetAmount(asset.free) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="p-4 border-t border-border-primary space-y-2">
      <button @click="showDepositModal = true" class="w-full btn-primary py-2 text-sm">
        Deposit
      </button>
      <div class="grid grid-cols-2 gap-2">
        <button class="btn-secondary py-2 text-sm" disabled title="Coming soon">
          Transfer
        </button>
        <button class="btn-secondary py-2 text-sm" disabled title="Coming soon">
          Withdraw
        </button>
      </div>
    </div>

    <!-- Deposit Modal -->
    <DepositModal
      v-model="showDepositModal"
      @success="handleDepositSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { accountApi } from '@/utils/api'
import websocketService, { subscribeToUserPositions } from '@/services/websocket'
import DepositModal from '@/components/modals/DepositModal.vue'

const authStore = useAuthStore()

interface AccountData {
  totalEquity: number
  availableBalance: number
  marginUsed: number
  unrealizedPnl: number
  marginRatio: number
  maintenanceMargin: number
}

const accountData = ref<AccountData>({
  totalEquity: 0,
  availableBalance: 0,
  marginUsed: 0,
  unrealizedPnl: 0,
  marginRatio: 0,
  maintenanceMargin: 0,
})

const assets = ref<Array<{ asset: string; free: string; locked: string }>>([])
const wsConnected = ref(false)
const showDepositModal = ref(false)

// Handle deposit success
const handleDepositSuccess = () => {
  // Refresh account data after successful deposit
  loadAccountData()
}

// Load account data from API
const loadAccountData = async () => {
  if (!authStore.isAuthenticated) return

  try {
    const response = await accountApi.getBalance()
    const balance = response.data

    // Backend returns: totalEquity, availableBalance, usedMargin, unrealizedPnl
    const totalEquity = parseFloat(balance.totalEquity || '0')
    const availableBalance = parseFloat(balance.availableBalance || '0')
    const usedMargin = parseFloat(balance.usedMargin || '0')
    const unrealizedPnl = parseFloat(balance.unrealizedPnl || '0')

    // Calculate margin ratio (used margin / total equity)
    const marginRatio = totalEquity > 0 ? usedMargin / totalEquity : 0

    accountData.value = {
      totalEquity,
      availableBalance,
      marginUsed: usedMargin,
      unrealizedPnl,
      marginRatio,
      maintenanceMargin: usedMargin * 0.5, // Simplified: 50% of margin used
    }

    // Load assets list
    if (balance.assets && Array.isArray(balance.assets)) {
      assets.value = balance.assets.filter((asset: any) => parseFloat(asset.free || '0') > 0)
    }
  } catch (error) {
    console.error('Failed to load account data:', error)
  }
}

// WebSocket handler for position updates
const handlePositionsUpdate = (data: any) => {
  if (data.data && data.data.positions) {
    // Recalculate based on updated positions
    loadAccountData()
    wsConnected.value = true
  }
}

// Subscribe to WebSocket updates
const subscribeToUpdates = () => {
  if (!authStore.isAuthenticated) return

  subscribeToUserPositions(handlePositionsUpdate)
  console.log('Subscribed to user positions for AccountEquity')
}

// Unsubscribe from WebSocket updates
const unsubscribeFromUpdates = () => {
  websocketService.unsubscribe('user:positions', handlePositionsUpdate)
  console.log('Unsubscribed from user positions for AccountEquity')
}

// Format number with commas
const formatNumber = (num: number) => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Format asset amount with appropriate decimal places
const formatAssetAmount = (amount: string) => {
  const num = parseFloat(amount)
  if (num === 0) return '0'

  // For small amounts (< 0.01), show more decimals
  if (num < 0.01) {
    return num.toFixed(8).replace(/\.?0+$/, '')
  }

  // For larger amounts, show up to 4 decimals
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })
}

// Get color class based on margin ratio
const getMarginRatioColor = (ratio: number) => {
  if (ratio > 0.8) return 'text-sell' // High risk
  if (ratio > 0.5) return 'text-yellow-500' // Medium risk
  return 'text-text-primary' // Safe
}

// Handle order created event
const handleOrderCreated = () => {
  console.log('Order created, refreshing account data')
  loadAccountData()
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    // Initial load
    await loadAccountData()

    // Connect to WebSocket
    try {
      await websocketService.connect()
      subscribeToUpdates()
      console.log('WebSocket connected for AccountEquity')
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }

    // Listen for order created events
    window.addEventListener('order-created', handleOrderCreated)
  }
})

onUnmounted(() => {
  unsubscribeFromUpdates()
  window.removeEventListener('order-created', handleOrderCreated)
})
</script>
