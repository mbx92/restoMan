<template>
  <div v-if="isLocked" class="fixed inset-0 z-9999 bg-base-300 flex flex-col items-center justify-center p-4">
    <div class="card bg-base-100 shadow-xl w-full max-w-sm">
      <div class="card-body items-center text-center">
        <div class="bg-primary/10 p-4 rounded-full mb-2">
          <IconLock class="w-10 h-10 text-primary" />
        </div>
        <h2 class="card-title text-2xl mb-1">POS Terkunci</h2>
        <p class="text-sm text-base-content/60 mb-6">Silakan masukkan PIN Anda untuk membuka kembali sesi ini.</p>
        
        <form @submit.prevent="verifyPin" class="w-full">
          <div class="flex justify-center gap-2 mb-6">
            <template v-for="i in 4" :key="i">
              <div 
                class="w-12 h-14 rounded-lg flex items-center justify-center text-2xl font-bold border-2 transition-colors"
                :class="pin.length >= i ? 'bg-primary text-primary-content border-primary' : 'bg-base-200 border-base-300'"
              >
                {{ pin.length >= i ? '•' : '' }}
              </div>
            </template>
          </div>

          <p v-if="errorMsg" class="text-error text-sm mb-4 font-medium">{{ errorMsg }}</p>

          <div class="grid grid-cols-3 gap-2 mb-6">
            <button v-for="n in 9" :key="n" type="button" class="btn btn-lg btn-ghost rounded-lg font-bold text-xl" @click="appendNumber(n)">
              {{ n }}
            </button>
            <button type="button" class="btn btn-lg btn-ghost text-error" @click="clearPin">
              <IconX class="w-6 h-6" />
            </button>
            <button type="button" class="btn btn-lg btn-ghost rounded-lg font-bold text-xl" @click="appendNumber(0)">
              0
            </button>
            <button type="button" class="btn btn-lg btn-ghost text-primary" @click="backspace">
              <IconBackspace class="w-6 h-6" />
            </button>
          </div>

          <div class="space-y-2 w-full">
            <button type="submit" class="btn btn-primary w-full" :disabled="pin.length !== 4 || verifying">
              <span v-if="verifying" class="loading loading-spinner loading-xs"></span>
              Buka Layar
            </button>
            <button type="button" class="btn btn-ghost btn-sm w-full text-base-content/50 hover:text-error" @click="forceLogout">
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconLock, IconBackspace, IconX } from '@tabler/icons-vue'

const { isLocked, logout } = useAuth()
const pin = ref('')
const verifying = ref(false)
const errorMsg = ref('')

function appendNumber(num: number) {
  if (pin.value.length < 4) {
    pin.value += num.toString()
    errorMsg.value = ''
    if (pin.value.length === 4) {
      verifyPin()
    }
  }
}

function backspace() {
  if (pin.value.length > 0) {
    pin.value = pin.value.slice(0, -1)
    errorMsg.value = ''
  }
}

function clearPin() {
  pin.value = ''
  errorMsg.value = ''
}

async function verifyPin() {
  if (pin.value.length !== 4) return
  
  verifying.value = true
  errorMsg.value = ''
  
  try {
    await $fetch('/api/auth/verify-pin', {
      method: 'POST',
      credentials: 'include',
      body: { pin: pin.value }
    })
    isLocked.value = false
    pin.value = ''
  } catch (err: any) {
    const status = err?.data?.statusCode || err?.statusCode
    const msg = err?.data?.statusMessage || ''
    // Session is invalid — force re-login
    if (status === 401 && !msg.includes('PIN salah')) {
      await logout()
      return
    }
    errorMsg.value = msg.replace('[AUTH-002] Sesi tidak valid, silakan login kembali: ', '').replace('[AUTH-002] ', '') || 'PIN salah'
    pin.value = ''
  } finally {
    verifying.value = false
  }
}

function forceLogout() {
  pin.value = ''
  errorMsg.value = ''
  logout()
}

// Global keydown listeners for numpad/keyboard
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  if (!isLocked.value) return
  
  if (e.key >= '0' && e.key <= '9') {
    appendNumber(parseInt(e.key))
  } else if (e.key === 'Backspace') {
    backspace()
  } else if (e.key === 'Escape') {
    clearPin()
  } else if (e.key === 'Enter') {
    verifyPin()
  }
}
</script>
