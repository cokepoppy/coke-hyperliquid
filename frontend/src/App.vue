<template>
  <div class="h-full flex flex-col">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Initialize auth store on app mount
const authStore = useAuthStore()

onMounted(() => {
  // Restore authentication state from localStorage
  authStore.initAuth()
})
</script>
