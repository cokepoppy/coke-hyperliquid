<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <!-- Modal Content -->
        <div class="relative w-full max-w-md bg-bg-secondary rounded-lg shadow-xl border border-border-primary">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-border-primary">
            <h3 class="text-lg font-semibold text-text-primary">Deposit Funds</h3>
            <button
              @click="closeModal"
              class="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-4 space-y-4">
            <!-- Asset Selection -->
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">
                Asset
              </label>
              <select
                v-model="formData.asset"
                class="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <!-- Amount Input -->
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">
                Amount
              </label>
              <div class="relative">
                <input
                  v-model="formData.amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">
                  {{ formData.asset }}
                </div>
              </div>
            </div>

            <!-- Quick Amount Buttons -->
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="amount in quickAmounts"
                :key="amount"
                @click="formData.amount = amount.toString()"
                class="px-3 py-1.5 text-xs font-medium bg-bg-tertiary hover:bg-bg-primary border border-border-primary rounded-md text-text-secondary hover:text-text-primary transition-colors"
              >
                ${{ amount }}
              </button>
            </div>

            <!-- Info Notice -->
            <div class="p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-md">
              <p class="text-xs text-text-secondary">
                <span class="font-medium text-accent-primary">Note:</span>
                This is a demo/testing environment. Deposits are simulated and do not involve real funds.
              </p>
            </div>

            <!-- Error Message -->
            <div
              v-if="errorMessage"
              class="p-3 bg-sell-bg border border-sell rounded-md"
            >
              <p class="text-sm text-sell">{{ errorMessage }}</p>
            </div>

            <!-- Success Message -->
            <div
              v-if="successMessage"
              class="p-3 bg-buy-bg border border-buy rounded-md"
            >
              <p class="text-sm text-buy">{{ successMessage }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 p-4 border-t border-border-primary">
            <button
              @click="closeModal"
              class="flex-1 btn-secondary py-2"
            >
              Cancel
            </button>
            <button
              @click="handleDeposit"
              :disabled="loading || !isFormValid"
              class="flex-1 btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">Processing...</span>
              <span v-else>Deposit</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { accountApi } from '@/utils/api'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formData = ref({
  asset: 'USDT',
  amount: '',
})

const quickAmounts = [100, 500, 1000, 5000]
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isFormValid = computed(() => {
  const amount = parseFloat(formData.value.amount)
  return formData.value.asset && amount > 0 && !isNaN(amount)
})

const closeModal = () => {
  emit('update:modelValue', false)
  // Reset form after modal closes
  setTimeout(() => {
    formData.value = { asset: 'USDT', amount: '' }
    errorMessage.value = ''
    successMessage.value = ''
  }, 300)
}

const handleDeposit = async () => {
  if (!isFormValid.value) return

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await accountApi.deposit({
      asset: formData.value.asset,
      amount: formData.value.amount,
    })

    successMessage.value = `Successfully deposited ${formData.value.amount} ${formData.value.asset}!`

    // Emit success event to refresh parent component
    setTimeout(() => {
      emit('success')
      closeModal()
    }, 1500)
  } catch (error: any) {
    console.error('Deposit failed:', error)
    errorMessage.value = error.response?.data?.error || 'Failed to deposit funds. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
}

/* Hide number input arrows */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
