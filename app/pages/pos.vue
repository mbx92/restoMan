<template>
  <div class="flex gap-4 h-[calc(100vh-10rem)]">
    <!-- Left: Product Grid -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Category Filter + Search -->
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <div class="flex gap-1 flex-wrap flex-1">
          <button class="btn btn-sm" :class="!selectedCategory ? 'btn-primary' : 'btn-ghost'" @click="selectedCategory = ''">
            Semua
          </button>
          <button v-for="cat in categories" :key="cat.id" class="btn btn-sm"
            :class="selectedCategory === cat.id ? 'btn-primary' : 'btn-ghost'"
            @click="selectedCategory = cat.id">
            {{ cat.name }}
          </button>
        </div>
        <input v-model="searchQuery" type="text" placeholder="Cari produk..." class="input input-sm w-48" />
      </div>

      <!-- Product Grid -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="!filteredProducts.length" class="flex items-center justify-center h-full">
          <div class="text-center">
            <IconPackage class="w-12 h-12 text-base-content/15 mx-auto mb-3" />
            <p class="text-sm text-base-content/50">Tidak ada produk ditemukan</p>
          </div>
        </div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <button v-for="product in filteredProducts" :key="product.id"
            class="card bg-base-100 border border-base-300 hover:border-primary hover:shadow-sm transition-all text-left cursor-pointer"
            :class="{ 'opacity-50': product.trackStock && product.stock <= 0 }"
            :disabled="product.trackStock && product.stock <= 0"
            @click="addToCart(product)">
            <div class="card-body p-3">
              <p class="font-medium text-sm line-clamp-2 leading-tight">{{ product.name }}</p>
              <p class="text-xs text-base-content/50">{{ product.category?.name }}</p>
              <p class="font-bold text-primary mt-1">Rp {{ formatCurrency(product.price) }}</p>
              <p v-if="product.trackStock" class="text-xs mt-0.5" :class="product.stock <= 5 ? 'text-error' : 'text-base-content/40'">
                Stok: {{ product.stock }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Right: Cart -->
    <div class="w-80 lg:w-96 flex flex-col bg-base-100 border border-base-300 rounded-lg shrink-0">
      <!-- Cart Header -->
      <div class="p-4 border-b border-base-300">
        <div class="flex items-center justify-between">
          <h2 class="font-bold text-base">Order Baru</h2>
          <div class="flex gap-1">
            <button class="btn btn-xs" :class="orderType === 'DINE_IN' ? 'btn-primary' : 'btn-ghost'" @click="orderType = 'DINE_IN'">
              Dine In
            </button>
            <button class="btn btn-xs" :class="orderType === 'TAKEAWAY' ? 'btn-primary' : 'btn-ghost'" @click="orderType = 'TAKEAWAY'">
              Takeaway
            </button>
          </div>
        </div>
        <div v-if="orderType === 'DINE_IN'" class="mt-2">
          <input v-model="tableNumber" type="text" placeholder="No. Meja" class="input input-sm w-full" />
        </div>
      </div>

      <!-- Cart Items -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        <div v-if="!cart.length" class="flex items-center justify-center h-full">
          <div class="text-center">
            <IconShoppingCart class="w-10 h-10 text-base-content/15 mx-auto mb-2" />
            <p class="text-sm text-base-content/50">Keranjang kosong</p>
            <p class="text-xs text-base-content/30">Pilih produk untuk memulai</p>
          </div>
        </div>

        <div v-for="(item, idx) in cart" :key="item.product.id"
          class="flex items-start gap-2 p-2 rounded-lg bg-base-200/50">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ item.product.name }}</p>
            <p class="text-xs text-base-content/50">Rp {{ formatCurrency(item.product.price) }} × {{ item.quantity }}</p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button class="btn btn-ghost btn-xs btn-square" @click="decreaseQty(idx)">
              <IconMinus class="w-3 h-3" />
            </button>
            <span class="text-sm font-medium w-6 text-center">{{ item.quantity }}</span>
            <button class="btn btn-ghost btn-xs btn-square" @click="increaseQty(idx)">
              <IconPlus class="w-3 h-3" />
            </button>
            <button class="btn btn-ghost btn-xs btn-square text-error" @click="removeFromCart(idx)">
              <IconTrash class="w-3 h-3" />
            </button>
          </div>
          <p class="text-sm font-bold w-20 text-right shrink-0">Rp {{ formatCurrency(item.product.price * item.quantity) }}</p>
        </div>
      </div>

      <!-- Cart Summary & Actions -->
      <div class="border-t border-base-300 p-4 space-y-3">
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-base-content/60">Subtotal</span>
            <span>Rp {{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="flex justify-between font-bold text-base">
            <span>Total</span>
            <span class="text-primary">Rp {{ formatCurrency(subtotal) }}</span>
          </div>
        </div>

        <button class="btn btn-primary w-full" :disabled="!cart.length || submitting" @click="showPayment = true">
          <IconCash class="w-4 h-4" />
          Bayar — Rp {{ formatCurrency(subtotal) }}
        </button>
        <button v-if="cart.length" class="btn btn-ghost btn-sm w-full" @click="clearCart">
          Kosongkan Keranjang
        </button>
      </div>
    </div>

    <!-- Payment Modal -->
    <dialog class="modal" :class="{ 'modal-open': showPayment }">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showPayment = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-4">Pembayaran</h3>

        <div class="space-y-4">
          <div class="text-center py-3 bg-base-200/50 rounded-lg">
            <p class="text-xs text-base-content/50 uppercase font-semibold">Total</p>
            <p class="text-3xl font-bold text-primary">Rp {{ formatCurrency(subtotal) }}</p>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Metode Pembayaran</legend>
            <div class="flex flex-wrap gap-2">
              <button v-for="pm in paymentMethods" :key="pm.value" class="btn btn-sm"
                :class="paymentMethod === pm.value ? 'btn-primary' : 'btn-ghost'"
                @click="paymentMethod = pm.value">
                {{ pm.label }}
              </button>
            </div>
          </fieldset>

          <fieldset v-if="paymentMethod === 'CASH'" class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Uang Diterima</legend>
            <input v-model.number="paidAmount" type="number" class="input w-full text-lg" min="0" />
            <div class="flex gap-2 mt-2">
              <button v-for="quick in quickAmounts" :key="quick" class="btn btn-ghost btn-xs flex-1"
                @click="paidAmount = quick">
                {{ formatCurrency(quick) }}
              </button>
            </div>
          </fieldset>

          <div v-if="paymentMethod === 'CASH' && paidAmount >= subtotal" class="text-center py-2 bg-success/10 rounded-lg">
            <p class="text-xs text-success uppercase font-semibold">Kembalian</p>
            <p class="text-xl font-bold text-success">Rp {{ formatCurrency(paidAmount - subtotal) }}</p>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Pelanggan (opsional)</legend>
            <input v-model="customerName" type="text" class="input w-full" placeholder="Nama pelanggan" />
          </fieldset>

          <button class="btn btn-primary w-full"
            :disabled="submitting || (paymentMethod === 'CASH' && paidAmount < subtotal)"
            @click="submitOrder">
            <span v-if="submitting" class="loading loading-spinner loading-xs"></span>
            <IconCheck v-else class="w-4 h-4" />
            Selesaikan Order
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showPayment = false"><button>close</button></form>
    </dialog>

    <!-- Success Modal -->
    <dialog class="modal" :class="{ 'modal-open': showSuccess }">
      <div class="modal-box max-w-sm text-center">
        <div class="py-6 space-y-3">
          <div class="bg-success/10 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
            <IconCheck class="w-8 h-8 text-success" />
          </div>
          <h3 class="font-bold text-lg">Order Berhasil!</h3>
          <p class="text-sm text-base-content/60">{{ lastOrderNumber }}</p>
          <p v-if="lastChange !== null && lastChange > 0" class="text-lg font-bold text-success">
            Kembalian: Rp {{ formatCurrency(lastChange) }}
          </p>
        </div>
        <button class="btn btn-primary w-full" @click="showSuccess = false">OK</button>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showSuccess = false"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import {
  IconPackage, IconShoppingCart, IconPlus, IconMinus, IconTrash,
  IconCash, IconX, IconCheck,
} from '@tabler/icons-vue'
import type { Product, Category, CartItem } from '~/types'

const { formatCurrency } = useFormatCurrency()

// Data
const { data: categories } = useFetch<Category[]>('/api/categories')
const { data: products, refresh: refreshProducts } = useFetch<Product[]>('/api/products')

// Filters
const selectedCategory = ref('')
const searchQuery = ref('')

const filteredProducts = computed(() => {
  if (!products.value) return []
  return products.value.filter((p) => {
    if (selectedCategory.value && p.categoryId !== selectedCategory.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
    }
    return true
  })
})

// Cart
const cart = ref<CartItem[]>([])
const orderType = ref<'DINE_IN' | 'TAKEAWAY'>('DINE_IN')
const tableNumber = ref('')

const subtotal = computed(() => cart.value.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0))

function addToCart(product: Product) {
  const existing = cart.value.find(i => i.product.id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ product, quantity: 1 })
  }
}

function increaseQty(idx: number) {
  const item = cart.value[idx]
  if (item) item.quantity++
}

function decreaseQty(idx: number) {
  const item = cart.value[idx]
  if (!item) return
  if (item.quantity > 1) {
    item.quantity--
  } else {
    cart.value.splice(idx, 1)
  }
}

function removeFromCart(idx: number) {
  cart.value.splice(idx, 1)
}

function clearCart() {
  cart.value = []
  tableNumber.value = ''
  customerName.value = ''
}

// Payment
const showPayment = ref(false)
const paymentMethod = ref<string>('CASH')
const paidAmount = ref(0)
const customerName = ref('')
const submitting = ref(false)

const paymentMethods = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'DEBIT', label: 'Debit' },
  { value: 'CREDIT_CARD', label: 'Kartu Kredit' },
  { value: 'EWALLET', label: 'E-Wallet' },
  { value: 'QRIS', label: 'QRIS' },
]

const quickAmounts = computed(() => {
  const total = subtotal.value
  const rounded = Math.ceil(total / 10000) * 10000
  return [rounded, rounded + 10000, rounded + 50000].filter(v => v >= total)
})

watch(showPayment, (val) => {
  if (val) {
    paidAmount.value = 0
    paymentMethod.value = 'CASH'
    customerName.value = ''
  }
})

// Success
const showSuccess = ref(false)
const lastOrderNumber = ref('')
const lastChange = ref<number | null>(null)

async function submitOrder() {
  submitting.value = true
  try {
    const order = await $fetch('/api/orders', {
      method: 'POST',
      body: {
        orderType: orderType.value,
        tableNumber: orderType.value === 'DINE_IN' ? tableNumber.value : null,
        customerName: customerName.value || null,
        items: cart.value.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
      },
    })

    // Pay immediately
    const paid = await $fetch(`/api/orders/${(order as any).id}`, {
      method: 'PUT',
      body: {
        action: 'pay',
        paymentMethod: paymentMethod.value,
        paidAmount: paymentMethod.value === 'CASH' ? paidAmount.value : subtotal.value,
      },
    })

    lastOrderNumber.value = (paid as any).orderNumber
    lastChange.value = paymentMethod.value === 'CASH' ? paidAmount.value - subtotal.value : null

    showPayment.value = false
    showSuccess.value = true
    clearCart()
    refreshProducts()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal membuat order')
  } finally {
    submitting.value = false
  }
}
</script>
