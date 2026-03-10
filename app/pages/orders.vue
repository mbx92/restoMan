<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Riwayat Order</h1>
        <p class="text-sm text-base-content/50 mt-1">Kelola semua order</p>
      </div>
      <div class="mt-3 sm:mt-0 flex flex-wrap gap-2">
        <select v-model="statusFilter" class="select select-sm">
          <option value="">Semua Status</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Selesai</option>
          <option value="CANCELLED">Batal</option>
        </select>
        <div class="join">
          <button class="join-item btn btn-sm" :class="viewMode === 'list' ? 'btn-active' : ''" @click="viewMode = 'list'" title="List View"><IconList class="w-4 h-4" /></button>
          <button class="join-item btn btn-sm" :class="viewMode === 'grid' ? 'btn-active' : ''" @click="viewMode = 'grid'" title="Grid View"><IconLayoutGrid class="w-4 h-4" /></button>
        </div>
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

        <!-- Grid View -->
        <div v-if="viewMode === 'grid'" class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div v-for="order in paginatedOrders" :key="order.id" class="card bg-base-100 border border-base-300">
            <div class="card-body p-4 gap-2">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-bold font-mono text-sm">{{ order.orderNumber }}</h3>
                  <p class="text-xs text-base-content/60">{{ formatDateTime(order.createdAt) }}</p>
                </div>
                <div class="dropdown dropdown-end">
                  <div tabindex="0" role="button" class="btn btn-ghost btn-xs btn-square"><IconDotsVertical class="w-4 h-4" /></div>
                  <ul tabindex="0" class="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-40 border border-base-200">
                    <li><a @click="viewOrder(order)"><IconEye class="w-4 h-4" /> Detail</a></li>
                    <li><a @click="receiptOrderId = order.id; showReceipt = true"><IconPrinter class="w-4 h-4" /> Struk</a></li>
                    <li v-if="order.status === 'PENDING'"><a class="text-error" @click="cancelOrder(order)"><IconX class="w-4 h-4" /> Batal</a></li>
                  </ul>
                </div>
              </div>

              <div class="flex flex-wrap gap-1 mt-1">
                <span class="badge badge-sm" :class="order.orderType === 'DINE_IN' ? 'badge-soft badge-info' : 'badge-soft badge-warning'">
                  {{ order.orderType === 'DINE_IN' ? `Dine In${order.tableNumber ? ` #${order.tableNumber}` : ''}` : 'Takeaway' }}
                </span>
                <span class="badge badge-sm" :class="statusBadge(order.status)">
                  {{ statusLabel(order.status) }}
                </span>
              </div>

              <div class="text-sm mt-1">
                <span class="text-base-content/60">{{ order.items?.length }} item</span> &middot; 
                <span v-if="order.paymentMethod" class="text-xs">{{ paymentLabel(order.paymentMethod) }}</span>
                <span v-else class="text-xs text-base-content/40">Belum Bayar</span>
              </div>

              <div class="mt-auto pt-2 border-t border-base-200 flex justify-between items-center">
                <span class="text-xs text-base-content/50">{{ order.cashier?.name || '—' }}</span>
                <span class="font-bold text-primary">Rp {{ formatCurrency(order.totalAmount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
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
              <tr v-for="order in paginatedOrders" :key="order.id">
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
                    <button class="btn btn-ghost btn-xs" @click="receiptOrderId = order.id; showReceipt = true">
                      <IconPrinter class="w-4 h-4" />
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

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center p-4 border-t border-base-300">
          <div class="join">
            <button class="join-item btn btn-sm" :disabled="currentPage === 1" @click="currentPage--">«</button>
            <button class="join-item btn btn-sm">Hal {{ currentPage }} / {{ totalPages }}</button>
            <button class="join-item btn btn-sm" :disabled="currentPage === totalPages" @click="currentPage++">»</button>
          </div>
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

          <div class="flex gap-2 mt-2">
            <button class="btn btn-sm btn-ghost gap-1" @click="receiptOrderId = selectedOrder.id; showReceipt = true">
              <IconPrinter class="w-4 h-4" /> Cetak Struk
            </button>
            <button
              v-if="isAdmin && selectedOrder.status !== 'PENDING'"
              class="btn btn-sm btn-warning btn-outline gap-1"
              :disabled="reopening"
              @click="reopenOrder(selectedOrder)"
            >
              <span v-if="reopening" class="loading loading-spinner loading-xs"></span>
              <IconRefresh v-else class="w-4 h-4" />
              Buka Kembali
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="selectedOrder = null"><button>close</button></form>
    </dialog>

    <ReceiptPreview v-if="receiptOrderId" v-model:show="showReceipt" :order-id="receiptOrderId" @close="showReceipt = false" />
  </div>
</template>

<script setup lang="ts">
import { IconPlus, IconReceipt, IconEye, IconX, IconPrinter, IconRefresh, IconList, IconLayoutGrid, IconDotsVertical } from '@tabler/icons-vue'
import type { Order } from '~/types'

const { formatCurrency } = useFormatCurrency()
const { isAdmin } = useAuth()

const statusFilter = ref('')
const showReceipt = ref(false)
const receiptOrderId = ref('')

const { data: orders, refresh } = useFetch<Order[]>('/api/orders', {
  query: computed(() => ({
    status: statusFilter.value || undefined,
    limit: 1000, // retrieve more for client side pagination
  })),
})

// View Mode & Pagination
const viewMode = ref<'list'|'grid'>('list')
const currentPage = ref(1)
const itemsPerPage = 12

const totalPages = computed(() => {
  return Math.max(1, Math.ceil((orders.value?.length || 0) / itemsPerPage))
})

const paginatedOrders = computed(() => {
  if (!orders.value) return []
  const start = (currentPage.value - 1) * itemsPerPage
  return orders.value.slice(start, start + itemsPerPage)
})

watch(statusFilter, () => {
  currentPage.value = 1
})

const selectedOrder = ref<Order | null>(null)

function viewOrder(order: Order) {
  selectedOrder.value = order
}

const reopening = ref(false)

async function cancelOrder(order: Order) {
  if (!confirm(`Batalkan order ${order.orderNumber}?`)) return
  await $fetch(`/api/orders/${order.id}`, {
    method: 'PUT',
    body: { action: 'cancel' },
  })
  refresh()
}

async function reopenOrder(order: Order) {
  if (!confirm(`Buka kembali order ${order.orderNumber}? Status akan kembali ke Pending.`)) return
  reopening.value = true
  try {
    await $fetch(`/api/orders/${order.id}`, {
      method: 'PUT',
      body: { action: 'reopen' },
    })
    selectedOrder.value = null
    refresh()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal membuka kembali order')
  } finally {
    reopening.value = false
  }
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
