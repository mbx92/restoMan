<template>
  <div class="min-h-screen bg-base-200 flex">
    <!-- Left Panel - Branding -->
    <div class="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden">
      <div class="absolute inset-0 text-white/10 pointer-events-none flex items-center justify-center">
        <!-- Decorative Food Icons replacing the circles -->
        <IconPizza class="absolute -top-20 -left-10 w-[400px] h-[400px] -rotate-12" />
        <IconIceCream class="absolute bottom-0 right-0 w-[500px] h-[500px] translate-x-1/4 translate-y-1/4 rotate-12" />
        <IconCoffee class="absolute top-1/2 left-1/3 w-[250px] h-[250px] -rotate-45" />
      </div>
      <div class="relative z-10 flex flex-col justify-between p-12 w-full">
        <div class="flex items-center gap-3">
          <div class="bg-secondary text-primary-content tracking-tight rounded-lg p-2.5">
            <IconChefHat class="w-7 h-7 text-white" />
          </div>
          <span class="text-xl font-bold text-white tracking-tight">RestoMan</span>
        </div>

        <div class="max-w-sm">
          <h1 class="text-4xl font-bold text-white leading-tight mb-4">
            Kelola Restoranmu <br/>
            <span class="text-secondary text-white/90">Dengan Cerdas.</span>
          </h1>
          <p class="text-primary-content/80 leading-relaxed">
            Platform Point of Sale (POS) terbaik yang membantu kamu mencatat pesanan, menganalisis penjualan, dan mengelola menu secara efektif.
          </p>
        </div>

        <div class="grid grid-cols-3 gap-6">
          <div>
            <div class="bg-white/15 rounded-lg p-3 w-fit mb-3">
              <IconChartBar class="w-5 h-5 text-secondary" />
            </div>
            <p class="text-sm font-medium text-white">Laporan Real-time</p>
            <p class="text-xs text-primary-content/60 mt-1">Analisis penjualan otomatis</p>
          </div>
          <div>
            <div class="bg-white/15 rounded-lg p-3 w-fit mb-3">
              <IconShieldCheck class="w-5 h-5 text-secondary" />
            </div>
            <p class="text-sm font-medium text-white">Data Aman</p>
            <p class="text-xs text-primary-content/60 mt-1">Sistem kasir terpusat</p>
          </div>
          <div>
            <div class="bg-white/15 rounded-lg p-3 w-fit mb-3">
              <IconReceipt class="w-5 h-5 text-secondary" />
            </div>
            <p class="text-sm font-medium text-white">Manajemen Akurat</p>
            <p class="text-xs text-primary-content/60 mt-1">Stok dan pesanan aman</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel - Login Form -->
    <div class="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12">
      <div class="w-full max-w-md">
        <!-- Mobile Brand -->
        <div class="flex items-center gap-3 mb-10 lg:hidden">
          <div class="bg-primary rounded-lg p-2.5">
            <IconChefHat class="w-6 h-6 text-white" />
          </div>
          <span class="text-xl font-bold text-base-content tracking-tight">RestoMan</span>
        </div>

        <div class="mb-8">
          <h2 class="text-2xl font-bold text-base-content">Masuk ke akun</h2>
          <p class="text-base-content/50 mt-1 text-sm">Masukkan email dan password untuk melanjutkan</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Email</legend>
            <label class="input w-full">
              <IconMail class="w-4 h-4 opacity-40" />
              <input
                v-model="form.email"
                type="email"
                placeholder="nama@email.com"
                required
              />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Password</legend>
            <label class="input w-full">
              <IconLock class="w-4 h-4 opacity-40" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Masukkan password"
                required
              />
              <button type="button" class="btn btn-ghost btn-xs btn-circle" @click="showPassword = !showPassword">
                <IconEye v-if="!showPassword" class="w-4 h-4 opacity-40" />
                <IconEyeOff v-else class="w-4 h-4 opacity-40" />
              </button>
            </label>
          </fieldset>

          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.remember" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
              <span class="text-sm text-base-content/60">Ingat saya</span>
            </label>
            <a class="link link-primary text-sm link-hover font-medium">Lupa password?</a>
          </div>

          <!-- Error Alert -->
          <div v-if="error" role="alert" class="alert alert-error alert-soft">
            <IconAlertCircle class="w-4 h-4" />
            <span class="text-sm">{{ error }}</span>
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
            <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
            <template v-else>Masuk</template>
          </button>
        </form>

        <div class="divider text-base-content/30 text-xs my-6">ATAU MASUK DENGAN</div>

        <div class="grid grid-cols-2 gap-3">
          <button class="btn btn-outline btn-sm">
            <IconBrandGoogle class="w-4 h-4" /> Google
          </button>
          <button class="btn btn-outline btn-sm">
            <IconBrandGithub class="w-4 h-4" /> GitHub
          </button>
        </div>

        <p class="text-center mt-8 text-sm text-base-content/50">
          Belum punya akun?
          <NuxtLink to="/register" class="link link-primary font-semibold link-hover">Daftar</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconChefHat,
  IconPizza,
  IconIceCream,
  IconCoffee,
  IconChartBar,
  IconShieldCheck,
  IconReceipt,
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconBrandGoogle,
  IconBrandGithub,
} from '@tabler/icons-vue'

definePageMeta({
  layout: false,
})

const form = reactive({
  email: '',
  password: '',
  remember: false,
})
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  isLoading.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: form.email, password: form.password },
    })
    await navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.message || e.message || 'Terjadi kesalahan saat login'
  } finally {
    isLoading.value = false
  }
}
</script>
