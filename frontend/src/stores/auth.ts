import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

interface User {
  id: number
  email?: string
  name?: string
  avatar?: string
  walletAddress?: string
}

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isConnected = ref(false)
  const walletAddress = ref('')
  const userEmail = ref('')

  // Initialize from localStorage
  const initAuth = () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
      isAuthenticated.value = true
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }
  }

  // Connect wallet (existing function)
  const connect = (address: string, email?: string) => {
    isConnected.value = true
    walletAddress.value = address
    if (email) {
      userEmail.value = email
    }
  }

  // Disconnect wallet (existing function)
  const disconnect = () => {
    isConnected.value = false
    walletAddress.value = ''
    userEmail.value = ''
  }

  // Login with Google
  const loginWithGoogle = async (googleToken: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/google`, {
        token: googleToken
      })

      if (response.data.success) {
        const { user: userData, token: authToken } = response.data.data
        user.value = userData
        token.value = authToken.token
        isAuthenticated.value = true

        // Save to localStorage
        localStorage.setItem('auth_token', authToken.token)
        localStorage.setItem('user', JSON.stringify(userData))

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken.token}`

        return true
      }
      return false
    } catch (error) {
      console.error('Google login failed:', error)
      return false
    }
  }

  // Logout
  const logout = () => {
    isAuthenticated.value = false
    user.value = null
    token.value = null
    isConnected.value = false
    walletAddress.value = ''
    userEmail.value = ''

    // Clear localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')

    // Clear axios default header
    delete axios.defaults.headers.common['Authorization']
  }

  return {
    isAuthenticated,
    user,
    token,
    isConnected,
    walletAddress,
    userEmail,
    initAuth,
    connect,
    disconnect,
    loginWithGoogle,
    logout,
  }
})
