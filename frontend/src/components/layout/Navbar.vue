<template>
  <div class="bg-bg-secondary border-b border-border-primary">
    <div class="flex items-center justify-between px-2 md:px-4 py-3">
      <!-- Left: Logo and Navigation -->
      <div class="flex items-center gap-6">
        <!-- Logo -->
        <router-link to="/trade" class="flex items-center">
          <div class="text-xl md:text-2xl font-bold text-accent-primary">Hyperliquid</div>
        </router-link>

        <!-- Navigation Links -->
        <nav class="hidden lg:flex items-center gap-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="isActive(item.path)
              ? 'text-text-primary bg-bg-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary/50'"
          >
            {{ item.label }}
          </router-link>

          <!-- More Dropdown -->
          <div class="relative" ref="moreDropdown">
            <button
              @click="showMoreMenu = !showMoreMenu"
              class="px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-primary/50 flex items-center gap-1"
            >
              More
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                class="transition-transform"
                :class="{ 'rotate-180': showMoreMenu }"
              >
                <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-show="showMoreMenu"
              class="absolute top-full left-0 mt-1 bg-bg-secondary border border-border-primary rounded-lg shadow-xl min-w-[160px] py-1 z-50"
            >
              <a
                v-for="item in moreItems"
                :key="item.label"
                :href="item.href"
                target="_blank"
                rel="noopener noreferrer"
                class="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors"
              >
                {{ item.label }}
              </a>
            </div>
          </div>
        </nav>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-2 md:gap-3">
        <!-- Deposit Button -->
        <button class="btn btn-primary text-xs md:text-sm font-medium px-3 md:px-4">
          Deposit
        </button>

        <!-- User Menu -->
        <div class="relative" ref="userDropdown">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-bg-primary transition-colors"
          >
            <span class="text-sm text-text-primary ellipsis max-w-[120px]">
              {{ userEmail || 'Connect Wallet' }}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              class="transition-transform"
              :class="{ 'rotate-180': showUserMenu }"
            >
              <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </button>

          <!-- User Dropdown -->
          <div
            v-show="showUserMenu"
            class="absolute top-full right-0 mt-1 bg-bg-secondary border border-border-primary rounded-lg shadow-xl min-w-[200px] py-1 z-50"
          >
            <div v-if="userEmail" class="px-4 py-2 border-b border-border-primary">
              <div class="text-xs text-text-tertiary">Signed in as</div>
              <div class="text-sm text-text-primary ellipsis">{{ userEmail }}</div>
            </div>
            <button
              v-for="action in userActions"
              :key="action.label"
              @click="action.onClick"
              class="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-colors"
            >
              {{ action.label }}
            </button>
          </div>
        </div>

        <!-- Settings Icon -->
        <button class="p-2 rounded-md hover:bg-bg-primary transition-colors">
          <svg width="18" height="18" fill="none" viewBox="0 0 20 19">
            <path
              d="M13.0002 9.5C13.0002 11.1569 11.6571 12.5 10.0002 12.5C8.34339 12.5 7.00024 11.1569 7.00024 9.5C7.00024 7.84315 8.34339 6.5 10.0002 6.5C11.6571 6.5 13.0002 7.84315 13.0002 9.5Z"
              stroke="currentColor"
              class="text-text-primary"
            />
            <path
              d="M8.44371 0.5L7.97869 3.34894C7.1159 3.62971 6.33259 4.08533 5.67101 4.67374L2.98426 3.65199L1.42773 6.34796L3.64042 8.15712C3.54855 8.59035 3.50023 9.03955 3.50023 9.49999C3.50023 9.96042 3.54855 10.4096 3.64041 10.8428L1.42773 12.652L2.98426 15.348L5.67487 14.3297C6.33564 14.9164 7.11758 15.3708 7.97869 15.6511L8.44371 18.5H11.5568L12.0218 15.6511C12.8846 15.3703 13.6679 14.9147 14.3295 14.3263L17.0162 15.348L18.5728 12.652L16.3601 10.8429C16.4519 10.4097 16.5003 9.96045 16.5003 9.50001C16.5003 9.03958 16.4519 8.59038 16.3601 8.15716L18.5728 6.34801L17.0162 3.65204L14.3256 4.67031C13.6649 4.08356 12.8829 3.62917 12.0218 3.34894L11.5568 0.5H8.44371Z"
              stroke="currentColor"
              class="text-text-primary"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { label: 'Trade', path: '/trade' },
  { label: 'Vaults', path: '/vaults' },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Staking', path: '/staking' },
  { label: 'Referrals', path: '/referrals' },
  { label: 'Leaderboard', path: '/leaderboard' },
]

const moreItems = [
  { label: 'Documentation', href: 'https://hyperliquid.gitbook.io' },
  { label: 'Discord', href: 'https://discord.gg/hyperliquid' },
  { label: 'Twitter', href: 'https://twitter.com/hyperliquid' },
]

const userEmail = ref('user@example.com')
const showMoreMenu = ref(false)
const showUserMenu = ref(false)
const moreDropdown = ref<HTMLElement>()
const userDropdown = ref<HTMLElement>()

const userActions = [
  { label: 'Account Settings', onClick: () => console.log('Settings') },
  { label: 'API Keys', onClick: () => console.log('API Keys') },
  { label: 'Disconnect', onClick: () => console.log('Disconnect') },
]

const isActive = (path: string) => {
  return route.path === path
}

const handleClickOutside = (event: MouseEvent) => {
  if (moreDropdown.value && !moreDropdown.value.contains(event.target as Node)) {
    showMoreMenu.value = false
  }
  if (userDropdown.value && !userDropdown.value.contains(event.target as Node)) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
