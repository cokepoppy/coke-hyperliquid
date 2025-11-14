<template>
  <div class="h-full flex flex-col bg-bg-tertiary">
    <!-- Navbar -->
    <Navbar />

    <!-- Portfolio Content -->
    <div class="flex-1 overflow-auto p-4">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-2xl font-bold text-text-primary mb-6">Portfolio</h1>

        <!-- Coming Soon -->
        <div class="card p-8 text-center">
          <div class="text-text-secondary mb-2">Portfolio page coming soon</div>
          <div class="text-sm text-text-tertiary">
            View your assets, trading history, and performance metrics here
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue'
</script>
