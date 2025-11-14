<template>
  <div>
    <!-- Connect Button -->
    <button
      v-if="!isConnected"
      @click="handleConnect"
      class="btn btn-primary"
      :disabled="connecting"
    >
      {{ connecting ? 'Connecting...' : 'Connect Wallet' }}
    </button>

    <!-- Connected State -->
    <div v-else class="flex items-center gap-2">
      <div class="px-3 py-2 bg-buy/10 rounded-lg flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-buy animate-pulse"></div>
        <span class="text-sm font-medium text-text-primary">
          {{ formatAddress(address) }}
        </span>
      </div>
      <button
        @click="handleDisconnect"
        class="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
        title="Disconnect"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 16 16" class="text-text-secondary">
          <path d="M6 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H6M10 6L14 10M14 10L10 14M14 10H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mt-2 text-sm text-sell">
      {{ error }}
    </div>

    <!-- Modal for network switch -->
    <div
      v-if="showNetworkModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="showNetworkModal = false"
    >
      <div
        class="card p-6 max-w-md"
        @click.stop
      >
        <h3 class="text-lg font-bold text-text-primary mb-4">Wrong Network</h3>
        <p class="text-sm text-text-secondary mb-6">
          Please switch to the correct network to continue.
        </p>
        <div class="flex gap-3">
          <button
            @click="handleSwitchNetwork"
            class="btn btn-primary flex-1"
          >
            Switch Network
          </button>
          <button
            @click="showNetworkModal = false"
            class="btn btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWallet } from '@/composables/useWallet'

const {
  isConnected,
  address,
  chainId,
  error,
  connect,
  disconnect,
  switchNetwork,
  autoConnect
} = useWallet()

const connecting = ref(false)
const showNetworkModal = ref(false)

const TARGET_CHAIN_ID = 42161 // Arbitrum One

const formatAddress = (addr: string) => {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

const handleConnect = async () => {
  connecting.value = true
  await connect()
  connecting.value = false

  // Check if on correct network
  if (chainId.value && chainId.value !== TARGET_CHAIN_ID) {
    showNetworkModal.value = true
  }
}

const handleDisconnect = () => {
  disconnect()
}

const handleSwitchNetwork = async () => {
  await switchNetwork(TARGET_CHAIN_ID)
  showNetworkModal.value = false
}

onMounted(() => {
  autoConnect()
})
</script>
