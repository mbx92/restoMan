<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Laporan</h1>
        <p class="text-sm text-base-content/50 mt-1">Analisis penjualan dan keuangan</p>
      </div>
      <div class="mt-3 sm:mt-0 flex gap-2">
        <input v-model="startDate" type="date" class="input input-sm" />
        <input v-model="endDate" type="date" class="input input-sm" />
        <button class="btn btn-primary btn-sm" @click="loadReports">
          <IconRefresh class="w-4 h-4" /> Muat
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <!-- Tabs -->
    <div class="flex gap-1 mb-6">
      <button class="btn btn-sm" :class="tab === 'revenue' ? 'btn-primary' : 'btn-ghost'" @click="tab = 'revenue'">Revenue</button>
      <button class="btn btn-sm" :class="tab === 'top-selling' ? 'btn-primary' : 'btn-ghost'" @click="tab = 'top-selling'">Top Selling</button>
      <button class="btn btn-sm" :class="tab === 'pnl' ? 'btn-primary' : 'btn-ghost'" @click="tab = 'pnl'">Profit & Loss</button>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Revenue Tab -->
    <div v-else-if="tab === 'revenue' && revenue" class="grid gap-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-4">
            <p class="text-xs text-base-content/50 uppercase">Total Revenue</p>
            <p class="text-2xl font-bold text-primary">Rp {{ fmt(revenue.totalRevenue) }}</p>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-4">
            <p class="text-xs text-base-content/50 uppercase">Jumlah Order</p>
            <p class="text-2xl font-bold">{{ revenue.orderCount }}</p>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-4">
            <p class="text-xs text-base-content/50 uppercase">Rata-rata / Order</p>
            <p class="text-2xl font-bold">Rp {{ fmt(revenue.orderCount ? revenue.totalRevenue / revenue.orderCount : 0) }}</p>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-4">
            <p class="text-xs text-base-content/50 uppercase">Diskon</p>
            <p class="text-2xl font-bold text-error">Rp {{ fmt(revenue.totalDiscount) }}</p>
          </div>
        </div>
      </div>

      <!-- Payment Breakdown -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base">Per Metode Pembayaran</h3>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead><tr><th>Metode</th><th class="text-right">Total</th></tr></thead>
              <tbody>
                <tr v-for="(val, key) in revenue.byPayment" :key="key">
                  <td>{{ paymentLabel(key as string) }}</td>
                  <td class="text-right font-medium">Rp {{ fmt(val) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Daily Revenue -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base">Revenue Harian</h3>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead><tr><th>Tanggal</th><th class="text-right">Revenue</th></tr></thead>
              <tbody>
                <tr v-for="(val, key) in revenue.byDate" :key="key">
                  <td>{{ key }}</td>
                  <td class="text-right font-medium">Rp {{ fmt(val) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Selling Tab -->
    <div v-else-if="tab === 'top-selling'" class="card bg-base-100 border border-base-300">
      <div class="card-body">
        <h3 class="card-title text-base">Top 20 Produk Terlaris</h3>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Produk</th>
                <th class="text-right">Terjual</th>
                <th class="text-right">Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in topSelling" :key="item.productId">
                <td class="font-bold" :class="i < 3 ? 'text-primary' : ''">{{ i + 1 }}</td>
                <td class="font-medium">{{ item.product?.name || '—' }}</td>
                <td class="text-right">{{ item.totalQty }}</td>
                <td class="text-right font-medium">Rp {{ fmt(item.totalRevenue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Profit & Loss Tab -->
    <div v-else-if="tab === 'pnl' && pnl" class="grid gap-4">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="card bg-success/10 border border-success/20">
          <div class="card-body p-4">
            <p class="text-xs text-base-content/50 uppercase">Revenue</p>
            <p class="text-2xl font-bold text-success">Rp {{ fmt(pnl.totalRevenue) }}</p>
          </div>
        </div>
        <div class="card bg-warning/10 border border-warning/20">
          <div class="card-body p-4">
            <p class="text-xs text-base-content/50 uppercase">HPP (COGS)</p>
            <p class="text-2xl font-bold text-warning">Rp {{ fmt(pnl.totalCOGS) }}</p>
          </div>
        </div>
        <div class="card bg-error/10 border border-error/20">
          <div class="card-body p-4">
            <p class="text-xs text-base-content/50 uppercase">Pengeluaran</p>
            <p class="text-2xl font-bold text-error">Rp {{ fmt(pnl.totalExpenses) }}</p>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base">Ringkasan P&L</h3>
          <table class="table table-sm">
            <tbody>
              <tr><td>Revenue (Total Penjualan)</td><td class="text-right font-medium">Rp {{ fmt(pnl.totalRevenue) }}</td></tr>
              <tr><td>Subtotal (sebelum pajak/service)</td><td class="text-right">Rp {{ fmt(pnl.totalSubtotal) }}</td></tr>
              <tr><td>Pajak</td><td class="text-right">Rp {{ fmt(pnl.totalTax) }}</td></tr>
              <tr><td>Service Charge</td><td class="text-right">Rp {{ fmt(pnl.totalService) }}</td></tr>
              <tr><td>Diskon</td><td class="text-right text-error">-Rp {{ fmt(pnl.totalDiscount) }}</td></tr>
              <tr class="border-t border-base-300">
                <td class="font-bold">HPP (Cost of Goods Sold)</td>
                <td class="text-right font-bold text-warning">-Rp {{ fmt(pnl.totalCOGS) }}</td>
              </tr>
              <tr>
                <td class="font-bold">Gross Profit</td>
                <td class="text-right font-bold" :class="pnl.grossProfit >= 0 ? 'text-success' : 'text-error'">
                  Rp {{ fmt(pnl.grossProfit) }}
                </td>
              </tr>
              <tr class="border-t border-base-300">
                <td class="font-bold">Pengeluaran Operasional</td>
                <td class="text-right font-bold text-error">-Rp {{ fmt(pnl.totalExpenses) }}</td>
              </tr>
              <tr class="bg-primary/5">
                <td class="font-bold text-lg">Net Profit</td>
                <td class="text-right font-bold text-lg" :class="pnl.netProfit >= 0 ? 'text-success' : 'text-error'">
                  Rp {{ fmt(pnl.netProfit) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Expense breakdown -->
      <div v-if="Object.keys(pnl.expenseByCategory || {}).length" class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base">Pengeluaran per Kategori</h3>
          <table class="table table-sm">
            <thead><tr><th>Kategori</th><th class="text-right">Jumlah</th></tr></thead>
            <tbody>
              <tr v-for="(val, key) in pnl.expenseByCategory" :key="key">
                <td>{{ key }}</td>
                <td class="text-right font-medium">Rp {{ fmt(val) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconRefresh } from '@tabler/icons-vue'

const { formatCurrency: fmt } = useFormatCurrency()

const today = new Date()
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const startDate = ref(firstDayOfMonth.toISOString().split('T')[0])
const endDate = ref(today.toISOString().split('T')[0])

const tab = ref('revenue')
const loading = ref(false)

const revenue = ref<any>(null)
const topSelling = ref<any[]>([])
const pnl = ref<any>(null)

const paymentLabels: Record<string, string> = {
  CASH: 'Tunai', DEBIT: 'Debit', CREDIT_CARD: 'Kartu Kredit', EWALLET: 'E-Wallet', QRIS: 'QRIS',
}
function paymentLabel(key: string) { return paymentLabels[key] || key }

async function loadReports() {
  loading.value = true
  try {
    const params = { startDate: startDate.value, endDate: endDate.value }
    const [rev, top, pl] = await Promise.all([
      $fetch<any>('/api/reports/revenue', { params }),
      $fetch<any[]>('/api/reports/top-selling', { params }),
      $fetch<any>('/api/reports/profit-loss', { params }),
    ])
    revenue.value = rev
    topSelling.value = top
    pnl.value = pl
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal memuat laporan')
  } finally {
    loading.value = false
  }
}

onMounted(() => loadReports())
</script>
