<template>
  <div class="min-h-screen bg-base-200">
    <div class="drawer lg:drawer-open">
      <input id="main-drawer" type="checkbox" class="drawer-toggle" />

      <!-- Main Content -->
      <div class="drawer-content flex flex-col">
        <!-- Top Navbar -->
        <div class="navbar bg-base-100 border-b border-base-300 sticky top-0 z-30">
          <div class="flex-none lg:hidden">
            <label for="main-drawer" class="btn btn-ghost btn-square">
              <IconMenu2 class="w-5 h-5" />
            </label>
          </div>
          <div class="flex-1">
            <div class="text-sm breadcrumbs px-2">
              <ul>
                <li class="text-base-content/50">RestoMan</li>
                <li class="font-medium">{{ pageTitle }}</li>
              </ul>
            </div>
          </div>
          <div class="flex-none gap-2">
            <!-- Bluetooth Printer Connect Button -->
            <template v-if="btSupported && hasBtPrinter">
              <button
                class="btn btn-sm gap-1.5"
                :class="btConnected ? 'btn-success btn-soft' : 'btn-ghost text-base-content/60'"
                :title="btConnected ? `Printer: ${btDeviceName}` : 'Klik untuk connect printer Bluetooth'"
                @click="connectBtPrinter"
              >
                <IconBluetooth class="w-4 h-4" />
                <span class="hidden sm:inline text-xs">{{ btConnected ? btDeviceName : 'Connect Printer' }}</span>
              </button>
            </template>

            <!-- Location Selector -->
            <div v-if="auth.user.value?.locations && auth.user.value.locations.length > 1" class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-1">
                <IconMapPin class="w-4 h-4" />
                <span class="text-xs">{{ auth.currentLocation.value?.name || 'Pilih Lokasi' }}</span>
              </div>
              <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-lg border border-base-300">
                <li v-for="loc in auth.user.value.locations" :key="loc.id">
                  <a :class="{ 'active': loc.id === auth.currentLocationId.value }"
                     @click="auth.switchLocation(loc.id)">
                    {{ loc.name }}
                  </a>
                </li>
              </ul>
            </div>

            <!-- User Role Badge -->
            <span class="badge badge-sm badge-soft badge-info">{{ auth.user.value?.role?.name }}</span>

            <!-- User Menu -->
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar avatar-placeholder">
                <div class="bg-primary text-primary-content w-9 rounded-full flex items-center justify-center">
                  <span class="text-sm font-bold">{{ userInitial }}</span>
                </div>
              </div>
              <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-lg border border-base-300">
                <li><a><IconUser class="w-4 h-4" /> Profil</a></li>
                <li v-if="auth.hasPermission('settings.view')">
                  <NuxtLink to="/settings"><IconSettings class="w-4 h-4" /> Pengaturan</NuxtLink>
                </li>
                <li class="border-t border-base-300 mt-1 pt-1">
                  <a class="text-error" @click="auth.logout()"><IconLogout class="w-4 h-4" /> Keluar</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Page Content -->
        <main class="flex-1 p-6">
          <slot />
        </main>

        <!-- Footer -->
        <footer class="footer footer-center p-4 border-t border-base-300 text-base-content/50 text-sm">
          <p>&copy; {{ currentYear }} RestoMan. Point of Sale System.</p>
        </footer>
      </div>

      <!-- Sidebar -->
      <div class="drawer-side z-40">
        <label for="main-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <aside class="bg-primary text-primary-content min-h-full w-72 flex flex-col">
          <!-- Brand -->
          <div class="px-6 py-5 border-b border-white/10">
            <NuxtLink to="/" class="flex items-center gap-3">
              <div class="bg-secondary rounded-lg p-2">
                <IconBuildingStore class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 class="text-lg font-bold tracking-tight">RestoMan</h1>
                <p class="text-xs text-primary-content/60">{{ auth.user.value?.tenant?.name || 'Point of Sale' }}</p>
              </div>
            </NuxtLink>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 px-3 py-4">
            <p class="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-primary-content/40">Menu Utama</p>
            <ul class="flex flex-col gap-0.5">
              <li>
                <NuxtLink to="/" exact-active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full">
                  <IconLayoutDashboard class="w-5 h-5 shrink-0" /> Dashboard
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/pos" active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full">
                  <IconCash class="w-5 h-5 shrink-0" /> Kasir (POS)
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/orders" active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full">
                  <IconReceipt class="w-5 h-5 shrink-0" /> Riwayat Order
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/shifts" active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full">
                  <IconCashRegister class="w-5 h-5 shrink-0" /> Shift Kasir
                </NuxtLink>
              </li>
            </ul>

            <p class="px-3 mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wider text-primary-content/40">Manajemen</p>
            <ul class="flex flex-col gap-0.5">
              <li>
                <NuxtLink to="/products" active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full">
                  <IconPackage class="w-5 h-5 shrink-0" /> Produk
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/categories" active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full">
                  <IconCategory class="w-5 h-5 shrink-0" /> Kategori
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/expenses" active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full">
                  <IconReportMoney class="w-5 h-5 shrink-0" /> Pengeluaran
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/inventory" active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full">
                  <IconPackages class="w-5 h-5 shrink-0" /> Inventori
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/reports" active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full">
                  <IconChartBar class="w-5 h-5 shrink-0" /> Laporan
                </NuxtLink>
              </li>
            </ul>

            <template v-if="auth.hasPermission('settings.view')">
              <p class="px-3 mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wider text-primary-content/40">Pengaturan</p>
              <ul class="flex flex-col gap-0.5">
                <li>
                  <NuxtLink to="/settings" active-class="bg-white/15 text-white font-semibold"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full">
                    <IconSettings class="w-5 h-5 shrink-0" /> Pengaturan
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/users" active-class="bg-white/15 text-white font-semibold"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full">
                    <IconUsers class="w-5 h-5 shrink-0" /> Pengguna
                  </NuxtLink>
                </li>
                <li>
                  <NuxtLink to="/tenant" active-class="bg-white/15 text-white font-semibold"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full">
                    <IconBuilding class="w-5 h-5 shrink-0" /> Tenant
                  </NuxtLink>
                </li>
              </ul>
            </template>
          </nav>

          <!-- Sidebar Footer -->
          <div class="px-4 py-4 border-t border-white/10">
            <div class="flex items-center gap-3 px-2">
              <div class="bg-secondary/20 rounded-full p-2">
                <IconUser class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ auth.user.value?.name || 'User' }}</p>
                <p class="text-xs text-primary-content/50 truncate">{{ auth.user.value?.role?.name }} — {{ auth.currentLocation.value?.name || '' }}</p>
              </div>
              <button @click="auth.lockScreen()" class="btn btn-ghost btn-xs btn-circle text-primary-content/50 hover:text-white hover:bg-white/10" title="Kunci Layar">
                <IconLock class="w-4 h-4" />
              </button>
              <button @click="auth.logout()" class="btn btn-ghost btn-xs btn-circle text-primary-content/50 hover:text-white hover:bg-white/10" title="Keluar">
                <IconLogout class="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconBuildingStore, IconLayoutDashboard, IconCash, IconReceipt,
  IconPackage, IconCategory, IconReportMoney, IconCashRegister,
  IconMenu2, IconUser, IconSettings, IconLogout, IconMapPin,
  IconUsers, IconBuilding, IconPackages, IconChartBar, IconLock,
  IconBluetooth,
} from '@tabler/icons-vue'
import type { PrinterConfig } from '~/types'

const route = useRoute()
const auth = useAuth()
const currentYear = new Date().getFullYear()
const { isSupported: btSupported, isConnected: btConnected, connectedDeviceName: btDeviceName, connectPrinter } = useBluetoothPrinter()

// Load BT printer configs to know whether to show the button
const hasBtPrinter = ref(false)

async function loadPrinterConfig() {
  if (!btSupported) return
  try {
    const settings = await $fetch<Record<string, string>>('/api/settings')
    const printers: PrinterConfig[] = JSON.parse(settings['printers'] || '[]')
    hasBtPrinter.value = printers.some(p => p.enabled && p.type === 'bluetooth')
  } catch { /* ignore */ }
}

async function connectBtPrinter() {
  try {
    const settings = await $fetch<Record<string, string>>('/api/settings')
    const printers: PrinterConfig[] = JSON.parse(settings['printers'] || '[]')
    const btPrinter = printers.find(p => p.enabled && p.type === 'bluetooth')
    await connectPrinter(btPrinter?.btDeviceName)
  } catch (e: any) {
    alert(e?.message || 'Gagal connect printer')
  }
}

onMounted(() => {
  auth.fetchUser()
  loadPrinterConfig()
})

const userInitial = computed(() => {
  const name = auth.user.value?.name || 'U'
  return name.charAt(0).toUpperCase()
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/pos': 'Kasir (POS)',
    '/orders': 'Riwayat Order',
    '/shifts': 'Shift Kasir',
    '/products': 'Produk',
    '/categories': 'Kategori',
    '/expenses': 'Pengeluaran',
    '/settings': 'Pengaturan',
    '/users': 'Pengguna',
    '/tenant': 'Tenant',
    '/inventory': 'Inventori',
    '/reports': 'Laporan',
  }
  return titles[route.path] || 'Halaman'
})
</script>
