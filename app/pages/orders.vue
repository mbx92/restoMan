<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Riwayat Order</h1>
        <p class="text-sm text-base-content/50 mt-1">Kelola semua order</p>
      </div>
      <div class="mt-3 sm:mt-0 flex gap-2">
        <select v-model="statusFilter" class="select select-sm">
          <option value="">Semua Status</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Selesai</option>
          <option value="CANCELLED">Batal</option>
        </select>
        <NuxtLink to="/pos" class="btn btn-primary btn-sm">
          <IconPlus class="w-4 h-4" /> Order Baru
        </NuxtLink>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <div v-if="!orders?.length" class="p-10 text-center">
          <IconReceipt class="w-12 h-12 text-base-content/15 mx-auto mb-3" />
          <p class="text-sm text-base-content/50">Belum ada order</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>No. Order</th>
                <th>Tipe</th>
                <th>Item</th>
                <th>Total</th>
                <th>Pembayaran</th>
                <th>Status</th>
                <th>Kasir</th>
                <th>Waktu</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.id">
                <td class="font-mono text-sm">{{ order.orderNumber }}</td>
                <td>
                  <span class="badge badge-sm" :class="order.orderType === 'DINE_IN' ? 'badge-soft badge-info' : 'badge-soft badge-warning'">
                    {{ order.orderType === 'DINE_IN' ? `Dine In${order.tableNumber ? ` #${order.tableNumber}` : ''}` : 'Takeaway' }}
                  </span>
                </td>
                <td class="text-sm text-base-content/60">{{ order.items?.length }} item</td>
                <td class="font-medium">Rp {{ formatCurrency(order.totalAmount) }}</td>
                <td>
                  <span v-if="order.paymentMethod" class="text-sm">{{ paymentLabel(order.paymentMethod) }}</span>
                  <span v-else class="text-sm text-base-content/40">—</span>
                </td>
                <td>
                  <span class="badge badge-sm" :class="statusBadge(order.status)">
                    {{ statusLabel(order.status) }}
                  </span>
                </td>
                <td class="text-sm text-base-content/60">{{ order.cashier?.name }}</td>
                <td class="text-sm text-base-content/60">{{ formatDateTime(order.createdAt) }}</td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-xs" @click="viewOrder(order)">
                      <IconEye class="w-4 h-4" />
                    </button>
                    <button v-if="order.status === 'PENDING'" class="btn btn-ghost btn-xs text-error"
                      @click="cancelOrder(order)">
                      <IconX class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <dialog class="modal" :class="{ 'modal-open': !!selectedOrder }">
      <div class="modal-box max-w-lg" v-if="selectedOrder">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="selectedOrder = null">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-4">{{ selectedOrder.orderNumber }}</h3>

        <div class="space-y-3">
          <div class="flex gap-4 text-sm">
            <div>
              <span class="text-base-content/50">Tipe:</span>
              <span class="ml-1 font-medium">{{ selectedOrder.orderType === 'DINE_IN' ? 'Dine In' : 'Takeaway' }}</span>
            </div>
            <div v-if="selectedOrder.tableNumber">
              <span class="text-base-content/50">Meja:</span>
              <span class="ml-1 font-medium">{{ selectedOrder.tableNumber }}</span>
            </div>
            <div>
              <span class="text-base-content/50">Status:</span>
              <span class="badge badge-sm ml-1" :class="statusBadge(selectedOrder.status)">{{ statusLabel(selectedOrder.status) }}</span>
            </div>
          </div>

          <table class="table table-sm">
            <thead>
              <tr>
                <th>Produk</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Harga</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in selectedOrder.items" :key="item.id">
                <td>{{ item.product?.name }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">Rp {{ formatCurrency(item.unitPrice) }}</td>
                <td class="text-right font-medium">Rp {{ formatCurrency(item.subtotal) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-right font-bold">Total</td>
                <td class="text-right font-bold text-primary">Rp {{ formatCurrency(selectedOrder.totalAmount) }}</td>
              </tr>
            </tfoot>
          </table>

          <div v-if="selectedOrder.paymentMethod" class="text-sm text-base-content/60">
            Dibayar: {{ paymentLabel(selectedOrder.paymentMethod) }}
            <span v-if="selectedOrder.paidAmount"> — Rp {{ formatCurrency(selectedOrder.paidAmount) }}</span>
            <span v-if="selectedOrder.changeAmount && Number(selectedOrder.changeAmount) > 0">
              (Kembalian: Rp {{ formatCurrency(selectedOrder.changeAmount) }})
            </span>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="selectedOrder = null"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { IconPlus, IconReceipt, IconEye, IconX } from '@tabler/icons-vue'
import type { Order } from '~/types'

const { formatCurrency } = useFormatCurrency()

const statusFilter = ref('')

const { data: orders, refresh } = useFetch<Order[]>('/api/orders', {
  query: computed(() => ({
    status: statusFilter.value || undefined,
    limit: 100,
  })),
})

const selectedOrder = ref<Order | null>(null)

function viewOrder(order: Order) {
  selectedOrder.value = order
}

async function cancelOrder(order: Order) {
  if (!confirm(`Batalkan order ${order.orderNumber}?`)) return
  await $fetch(`/api/orders/${order.id}`, {
    method: 'PUT',
    body: { action: 'cancel' },
  })
  refresh()
}

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

function paymentLabel(method: string) {
  const map: Record<string, string> = {
    CASH: 'Tunai',
    DEBIT: 'Debit',
    CREDIT_CARD: 'Kartu Kredit',
    EWALLET: 'E-Wallet',
    QRIS: 'QRIS',
  }
  return map[method] || method
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}
</script>
