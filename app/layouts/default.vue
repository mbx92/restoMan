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
                <li class="text-base-content/50">MoneyMan</li>
                <li class="font-medium">{{ pageTitle }}</li>
              </ul>
            </div>
          </div>
          <div class="flex-none gap-2">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar avatar-placeholder">
                <div class="bg-primary text-primary-content w-9 rounded-full flex items-center justify-center">
                  <span class="text-sm font-bold">U</span>
                </div>
              </div>
              <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-lg border border-base-300">
                <li><a><IconUser class="w-4 h-4" /> Profil</a></li>
                <li><a><IconSettings class="w-4 h-4" /> Pengaturan</a></li>
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
          <p>&copy; {{ currentYear }} MoneyMan. Personal Finance Manager.</p>
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
                <IconWallet class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 class="text-lg font-bold tracking-tight">MoneyMan</h1>
                <p class="text-xs text-primary-content/60">Finance Manager</p>
              </div>
            </NuxtLink>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 px-3 py-4">
            <p class="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-primary-content/40">Menu Utama</p>
            <ul class="flex flex-col gap-0.5">
              <li>
                <NuxtLink
                  to="/"
                  exact-active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full"
                >
                  <IconLayoutDashboard class="w-5 h-5 shrink-0" />
                  Dashboard
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/transactions"
                  active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full"
                >
                  <IconArrowsExchange class="w-5 h-5 shrink-0" />
                  Transaksi
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/accounts"
                  active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full"
                >
                  <IconBuildingBank class="w-5 h-5 shrink-0" />
                  Akun
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/categories"
                  active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full"
                >
                  <IconCategory class="w-5 h-5 shrink-0" />
                  Kategori
                </NuxtLink>
              </li>
            </ul>

            <p class="px-3 mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wider text-primary-content/40">Keuangan</p>
            <ul class="flex flex-col gap-0.5">
              <li>
                <NuxtLink
                  to="/investments"
                  active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full"
                >
                  <IconChartLine class="w-5 h-5 shrink-0" />
                  Investasi
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/loans"
                  active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full"
                >
                  <IconFileInvoice class="w-5 h-5 shrink-0" />
                  Hutang
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/budgets"
                  active-class="bg-white/15 text-white font-semibold"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-primary-content/75 hover:bg-white/10 hover:text-white transition-colors w-full"
                >
                  <IconChartPie class="w-5 h-5 shrink-0" />
                  Anggaran
                </NuxtLink>
              </li>
            </ul>
          </nav>

          <!-- Sidebar Footer -->
          <div class="px-4 py-4 border-t border-white/10">
            <div class="flex items-center gap-3 px-2">
              <div class="bg-secondary/20 rounded-full p-2">
                <IconUser class="w-4 h-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ auth.user.value?.name || 'User' }}</p>
                <p class="text-xs text-primary-content/50 truncate">{{ auth.user.value?.email || '' }}</p>
              </div>
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
  IconWallet,
  IconLayoutDashboard,
  IconArrowsExchange,
  IconBuildingBank,
  IconCategory,
  IconChartPie,
  IconChartLine,
  IconFileInvoice,
  IconMenu2,
  IconUser,
  IconSettings,
  IconLogout,
} from '@tabler/icons-vue'

const route = useRoute()
const auth = useAuth()
const currentYear = new Date().getFullYear()

onMounted(() => auth.fetchUser())

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/transactions': 'Transaksi',
    '/accounts': 'Akun',
    '/categories': 'Kategori',
    '/investments': 'Investasi',
    '/loans': 'Hutang',
    '/budgets': 'Anggaran',
  }
  return titles[route.path] || 'Halaman'
})
</script>
