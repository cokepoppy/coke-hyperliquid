<template>
  <div class="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-bg-primary to-bg-secondary">
    <div class="w-full max-w-md p-8">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-text-primary mb-2">
          Hyperliquid Clone
        </h1>
        <p class="text-text-secondary">
          高性能去中心化交易平台
        </p>
      </div>

      <!-- Login Card -->
      <div class="bg-bg-tertiary rounded-xl shadow-2xl p-8 border border-border-primary">
        <h2 class="text-2xl font-semibold text-text-primary mb-6 text-center">
          登录账户
        </h2>

        <!-- Google Login -->
        <div class="mb-6">
          <GoogleLogin />
        </div>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-primary"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-bg-tertiary text-text-secondary">或</span>
          </div>
        </div>

        <!-- Wallet Connect (Placeholder for future implementation) -->
        <button
          class="w-full py-3 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled
        >
          <div class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
            </svg>
            <span>连接钱包</span>
          </div>
        </button>

        <!-- Terms and Privacy -->
        <p class="text-xs text-text-secondary text-center mt-6">
          登录即表示您同意我们的
          <a href="#" class="text-accent-primary hover:underline">服务条款</a>
          和
          <a href="#" class="text-accent-primary hover:underline">隐私政策</a>
        </p>
      </div>

      <!-- Features -->
      <div class="mt-8 grid grid-cols-3 gap-4 text-center">
        <div class="p-4">
          <div class="text-2xl mb-2">⚡</div>
          <p class="text-xs text-text-secondary">闪电交易</p>
        </div>
        <div class="p-4">
          <div class="text-2xl mb-2">🔒</div>
          <p class="text-xs text-text-secondary">安全可靠</p>
        </div>
        <div class="p-4">
          <div class="text-2xl mb-2">💎</div>
          <p class="text-xs text-text-secondary">低手续费</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import GoogleLogin from '@/components/auth/GoogleLogin.vue'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  // Initialize auth from localStorage
  authStore.initAuth()

  // If already authenticated, redirect to trade page
  if (authStore.isAuthenticated) {
    router.push('/trade')
  }
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
