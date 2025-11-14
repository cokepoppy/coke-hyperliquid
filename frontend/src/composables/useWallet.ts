import { ref, computed } from 'vue'
import { BrowserProvider, JsonRpcSigner } from 'ethers'
import { useAuthStore } from '@/stores/auth'

declare global {
  interface Window {
    ethereum?: any
  }
}

export function useWallet() {
  const authStore = useAuthStore()
  const provider = ref<BrowserProvider | null>(null)
  const signer = ref<JsonRpcSigner | null>(null)
  const chainId = ref<number | null>(null)
  const error = ref<string>('')

  const isConnected = computed(() => authStore.isConnected)
  const address = computed(() => authStore.walletAddress)

  const checkMetaMask = () => {
    if (typeof window.ethereum === 'undefined') {
      error.value = 'MetaMask is not installed. Please install MetaMask to continue.'
      return false
    }
    return true
  }

  const connect = async () => {
    if (!checkMetaMask()) return

    try {
      error.value = ''
      provider.value = new BrowserProvider(window.ethereum)

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        error.value = 'No accounts found. Please unlock MetaMask.'
        return
      }

      signer.value = await provider.value.getSigner()
      const network = await provider.value.getNetwork()
      chainId.value = Number(network.chainId)

      authStore.connect(accounts[0])

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged)

      // Listen for chain changes
      window.ethereum.on('chainChanged', handleChainChanged)

      console.log('Wallet connected:', accounts[0])
    } catch (err: any) {
      error.value = err.message || 'Failed to connect wallet'
      console.error('Wallet connection error:', err)
    }
  }

  const disconnect = () => {
    authStore.disconnect()
    provider.value = null
    signer.value = null
    chainId.value = null

    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      authStore.connect(accounts[0])
    }
  }

  const handleChainChanged = () => {
    window.location.reload()
  }

  const switchNetwork = async (targetChainId: number) => {
    if (!checkMetaMask()) return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      })
    } catch (err: any) {
      if (err.code === 4902) {
        error.value = 'This network is not available in your MetaMask. Please add it first.'
      } else {
        error.value = err.message || 'Failed to switch network'
      }
      console.error('Switch network error:', err)
    }
  }

  const signMessage = async (message: string) => {
    if (!signer.value) {
      error.value = 'Wallet not connected'
      return null
    }

    try {
      const signature = await signer.value.signMessage(message)
      return signature
    } catch (err: any) {
      error.value = err.message || 'Failed to sign message'
      console.error('Sign message error:', err)
      return null
    }
  }

  const getBalance = async () => {
    if (!provider.value || !address.value) {
      return '0'
    }

    try {
      const balance = await provider.value.getBalance(address.value)
      return balance.toString()
    } catch (err: any) {
      error.value = err.message || 'Failed to get balance'
      console.error('Get balance error:', err)
      return '0'
    }
  }

  // Auto connect if already connected
  const autoConnect = async () => {
    if (!checkMetaMask()) return

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      })

      if (accounts.length > 0) {
        await connect()
      }
    } catch (err) {
      console.error('Auto connect error:', err)
    }
  }

  return {
    isConnected,
    address,
    chainId,
    error,
    connect,
    disconnect,
    switchNetwork,
    signMessage,
    getBalance,
    autoConnect
  }
}
