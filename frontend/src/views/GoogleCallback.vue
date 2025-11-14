<template>
  <div class="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-bg-primary to-bg-secondary">
    <div class="text-center">
      <div class="mb-4">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
      <h2 class="text-xl font-semibold text-text-primary mb-2">
        {{ statusMessage }}
      </h2>
      <p class="text-text-secondary">
        请稍候...
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const statusMessage = ref('正在处理 Google 登录...')

onMounted(async () => {
  try {
    // Check for error in query params
    const error = route.query.error as string
    if (error) {
      console.error('Google OAuth error:', error)
      statusMessage.value = '登录失败'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      return
    }

    // Get token and user from URL hash
    const hash = window.location.hash.substring(1) // Remove #
    const params = new URLSearchParams(hash)
    const token = params.get('token')
    const userStr = params.get('user')

    if (!token || !userStr) {
      console.error('No token or user data received')
      statusMessage.value = '登录失败：未收到认证信息'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      return
    }

    // Parse user data
    const userData = JSON.parse(decodeURIComponent(userStr))

    // Save to store
    authStore.user = userData
    authStore.token = token
    authStore.isAuthenticated = true

    // Save to localStorage
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user', JSON.stringify(userData))

    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

    statusMessage.value = '登录成功！'

    // Redirect to trade page
    setTimeout(() => {
      router.push('/trade')
    }, 500)
  } catch (error: any) {
    console.error('Google callback error:', error)
    statusMessage.value = '登录失败，请重试'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }
})
</script>

<style scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
