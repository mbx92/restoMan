<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Dashboard</h1>
        <p class="text-sm text-base-content/50 mt-1">Ringkasan keuangan bulan ini</p>
      </div>
      <div class="mt-3 sm:mt-0">
        <NuxtLink to="/transactions" class="btn btn-primary btn-sm">
          <IconPlus class="w-4 h-4" /> Transaksi Baru
        </NuxtLink>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Pemasukan</p>
              <p class="text-2xl font-bold text-success mt-1">Rp {{ formatCurrency(totalIncome) }}</p>
            </div>
            <div class="bg-success/10 rounded-lg p-3">
              <IconTrendingUp class="w-5 h-5 text-success" />
            </div>
          </div>
          <p class="text-xs text-base-content/40 mt-2">Bulan ini</p>
        </div>
      </div>

      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Pengeluaran</p>
              <p class="text-2xl font-bold text-error mt-1">Rp {{ formatCurrency(totalExpense) }}</p>
            </div>
            <div class="bg-error/10 rounded-lg p-3">
              <IconTrendingDown class="w-5 h-5 text-error" />
            </div>
          </div>
          <p class="text-xs text-base-content/40 mt-2">Bulan ini</p>
        </div>
      </div>

      <div class="card bg-primary text-primary-content">
        <div class="card-body p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-primary-content/60">Saldo Total</p>
              <p class="text-2xl font-bold mt-1">Rp {{ formatCurrency(totalBalance) }}</p>
            </div>
            <div class="bg-white/15 rounded-lg p-3">
              <IconWallet class="w-5 h-5" />
            </div>
          </div>
          <p class="text-xs text-primary-content/50 mt-2">Semua akun</p>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Transactions -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-0">
            <div class="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 class="font-semibold text-base-content">Transaksi Terakhir</h2>
              <NuxtLink to="/transactions" class="btn btn-ghost btn-xs text-primary">Lihat Semua</NuxtLink>
            </div>
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr class="text-xs uppercase text-base-content/40">
                    <th>Tanggal</th>
                    <th>Deskripsi</th>
                    <th>Kategori</th>
                    <th class="text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tx in recentTransactions" :key="tx.id" class="hover">
                    <td class="text-sm text-base-content/60">{{ formatDate(tx.date) }}</td>
                    <td class="text-sm font-medium">{{ tx.description || '-' }}</td>
                    <td><span class="badge badge-soft badge-sm">{{ tx.category?.name }}</span></td>
                    <td class="text-right text-sm font-mono font-medium" :class="tx.type === 'INCOME' ? 'text-success' : 'text-error'">
                      {{ tx.type === 'INCOME' ? '+' : '-' }}Rp {{ formatCurrency(tx.amount) }}
                    </td>
                  </tr>
                  <tr v-if="recentTransactions.length === 0">
                    <td colspan="4" class="text-center py-10">
                      <div class="flex flex-col items-center text-base-content/30">
                        <IconReceipt class="w-10 h-10 mb-2" />
                        <p class="text-sm">Belum ada transaksi</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Accounts Sidebar -->
      <div>
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-0">
            <div class="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 class="font-semibold text-base-content">Akun</h2>
              <NuxtLink to="/accounts" class="btn btn-ghost btn-xs text-primary">Kelola</NuxtLink>
            </div>
            <div class="divide-y divide-base-200">
              <div v-for="acc in (accounts || [])" :key="acc.id" class="flex items-center justify-between px-5 py-3">
                <div class="flex items-center gap-3 overflow-hidden pr-4">
                  <div class="bg-primary/10 rounded-lg p-2 shrink-0">
                    <IconBuildingBank class="w-4 h-4 text-primary" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium truncate">{{ acc.name }}</p>
                    <p class="text-xs text-base-content/40">{{ acc.type }}</p>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-sm font-mono font-medium">Rp {{ formatCurrency(Number(acc.balance)) }}</p>
                </div>
              </div>
              <div v-if="(accounts || []).length === 0" class="px-5 py-8 text-center">
                <div class="flex flex-col items-center text-base-content/30">
                  <IconBuildingBank class="w-8 h-8 mb-2" />
                  <p class="text-sm">Belum ada akun</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconTrendingUp,
  IconTrendingDown,
  IconWallet,
  IconReceipt,
  IconPlus,
  IconBuildingBank,
} from '@tabler/icons-vue'
import type { Account, Transaction } from '~/types'

const { data: accounts } = await useFetch<Account[]>('/api/accounts')
const { data: transactions } = await useFetch<Transaction[]>('/api/transactions?limit=10')

const recentTransactions = computed(() => transactions.value || [])

const totalBalance = computed(() => {
  return (accounts.value || []).reduce((sum, acc) => sum + Number(acc.balance), 0)
})

const totalIncome = computed(() => {
  return (transactions.value || [])
    .filter((tx) => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)
})

const totalExpense = computed(() => {
  return (transactions.value || [])
    .filter((tx) => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)
})

const { formatCurrency } = useFormatCurrency()

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>
