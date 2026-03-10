<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Dashboard</h1>
        <p class="text-sm text-base-content/50 mt-1">Ringkasan penjualan hari ini</p>
      </div>
      <div class="mt-3 sm:mt-0">
        <NuxtLink to="/pos" class="btn btn-primary btn-sm">
          <IconPlus class="w-4 h-4" /> Order Baru
        </NuxtLink>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Penjualan</p>
              <p class="text-2xl font-bold text-success mt-1">Rp {{ formatCurrency(stats?.todaySales) }}</p>
            </div>
            <div class="bg-success/10 rounded-lg p-3">
              <IconCash class="w-5 h-5 text-success" />
            </div>
          </div>
          <p class="text-xs text-base-content/40 mt-2">Hari ini</p>
        </div>
      </div>

      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Order</p>
              <p class="text-2xl font-bold text-info mt-1">{{ stats?.todayOrders ?? 0 }}</p>
            </div>
            <div class="bg-info/10 rounded-lg p-3">
              <IconReceipt class="w-5 h-5 text-info" />
            </div>
          </div>
          <p class="text-xs text-base-content/40 mt-2">Hari ini</p>
        </div>
      </div>

      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Pengeluaran</p>
              <p class="text-2xl font-bold text-error mt-1">Rp {{ formatCurrency(stats?.todayExpenses) }}</p>
            </div>
            <div class="bg-error/10 rounded-lg p-3">
              <IconReportMoney class="w-5 h-5 text-error" />
            </div>
          </div>
          <p class="text-xs text-base-content/40 mt-2">Hari ini</p>
        </div>
      </div>

      <div class="card bg-primary text-primary-content">
        <div class="card-body p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-primary-content/60">Laba Bersih</p>
              <p class="text-2xl font-bold mt-1">Rp {{ formatCurrency(stats?.netIncome) }}</p>
            </div>
            <div class="bg-white/15 rounded-lg p-3">
              <IconTrendingUp class="w-5 h-5" />
            </div>
          </div>
          <p class="text-xs text-primary-content/60 mt-2">Hari ini</p>
        </div>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <div class="flex items-center justify-between p-5 pb-0">
          <h2 class="font-bold text-base">Order Terbaru</h2>
          <NuxtLink to="/orders" class="btn btn-ghost btn-xs">Lihat Semua</NuxtLink>
        </div>

        <div v-if="!orders?.length" class="p-10 text-center">
          <IconReceipt class="w-12 h-12 text-base-content/15 mx-auto mb-3" />
          <p class="text-sm text-base-content/50">Belum ada order hari ini</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>No. Order</th>
                <th>Tipe</th>
                <th>Status</th>
                <th>Total</th>
                <th>Kasir</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.id">
                <td class="font-mono text-sm">{{ order.orderNumber }}</td>
                <td>
                  <span class="badge badge-sm" :class="order.orderType === 'DINE_IN' ? 'badge-soft badge-info' : 'badge-soft badge-warning'">
                    {{ order.orderType === 'DINE_IN' ? 'Dine In' : 'Takeaway' }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-sm" :class="statusBadge(order.status)">
                    {{ statusLabel(order.status) }}
                  </span>
                </td>
                <td class="font-medium">Rp {{ formatCurrency(order.totalAmount) }}</td>
                <td class="text-sm text-base-content/60">{{ order.cashier?.name }}</td>
                <td class="text-sm text-base-content/60">{{ formatTime(order.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPlus, IconCash, IconReceipt, IconReportMoney, IconTrendingUp } from '@tabler/icons-vue'
import type { DashboardStats, Order } from '~/types'

const { formatCurrency } = useFormatCurrency()

const { data: stats } = useFetch<DashboardStats>('/api/dashboard/stats')
const { data: orders } = useFetch<Order[]>('/api/orders', { query: { limit: 10 } })

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: 'badge-soft badge-warning',
    COMPLETED: 'badge-soft badge-success',
    CANCELLED: 'badge-soft badge-error',
  }
  return map[status] || ''
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    COMPLETED: 'Selesai',
    CANCELLED: 'Batal',
  }
  return map[status] || status
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}
</script>
