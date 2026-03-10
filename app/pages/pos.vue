<template>
  <div>
    <!-- Shift Gate: no open shift -->
    <div v-if="!shiftLoading && !currentShift" class="flex items-center justify-center h-[calc(100vh-10rem)]">
      <div class="text-center max-w-md">
        <IconCashRegister class="w-16 h-16 text-base-content/15 mx-auto mb-4" />
        <h3 class="text-xl font-bold mb-2">Shift Belum Dibuka</h3>
        <p class="text-base-content/60 mb-6">Anda harus membuka shift kasir terlebih dahulu sebelum dapat membuat transaksi.</p>
        <NuxtLink to="/shifts" class="btn btn-primary">
          <IconCashRegister class="w-4 h-4" /> Buka Shift
        </NuxtLink>
      </div>
    </div>

    <div v-else-if="shiftLoading" class="flex items-center justify-center h-[calc(100vh-10rem)]">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- POS Interface -->
    <div v-else class="flex flex-col md:flex-row gap-4 h-[calc(100dvh-6rem)] md:h-[calc(100vh-10rem)]">
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
              <button v-if="orderModeAllows('DINE_IN')" class="btn btn-xs"
                :class="orderType === 'DINE_IN' ? 'btn-primary' : 'btn-ghost'" @click="orderType = 'DINE_IN'">
                Dine In
              </button>
              <button v-if="orderModeAllows('TAKEAWAY')" class="btn btn-xs"
                :class="orderType === 'TAKEAWAY' ? 'btn-primary' : 'btn-ghost'" @click="orderType = 'TAKEAWAY'">
                Takeaway
              </button>
            </div>
          </div>
          <div v-if="orderType === 'DINE_IN'" class="mt-2 flex gap-2">
            <input v-model="tableNumber" type="text" placeholder="No. Meja" class="input input-sm flex-1" />
            <input v-model.number="customerCount" type="number" placeholder="Jml Tamu" class="input input-sm w-24" min="1" />
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

          <div v-for="(item, idx) in cart" :key="idx"
            class="flex items-start gap-2 p-2 rounded-lg bg-base-200/50">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ item.product.name }}</p>
              <div v-if="item.variantSelections?.length" class="text-xs text-base-content/50 mt-0.5 flex flex-wrap gap-1">
                <span v-for="v in item.variantSelections" :key="v.groupName + v.optionName" class="badge badge-neutral badge-xs">{{ v.optionName }}</span>
              </div>
              <p class="text-xs text-base-content/50 mt-0.5">Rp {{ formatCurrency(getItemPrice(item)) }} × {{ item.quantity }}</p>
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
            <p class="text-sm font-bold w-20 text-right shrink-0">Rp {{ formatCurrency(getItemPrice(item) * item.quantity) }}</p>
          </div>
        </div>

        <!-- Cart Summary & Actions -->
        <div class="border-t border-base-300 p-4 space-y-3">
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-base-content/60">Subtotal</span>
              <span>Rp {{ formatCurrency(subtotal) }}</span>
            </div>
            <div v-if="taxEnabled" class="flex justify-between">
              <span class="text-base-content/60">{{ taxName }} ({{ taxRate }}%)</span>
              <span>Rp {{ formatCurrency(taxAmount) }}</span>
            </div>
            <div v-if="serviceEnabled" class="flex justify-between">
              <span class="text-base-content/60">{{ serviceName }} ({{ serviceRate }}%)</span>
              <span>Rp {{ formatCurrency(serviceAmount) }}</span>
            </div>
            <div class="flex justify-between font-bold text-base border-t border-base-300 pt-1">
              <span>Total</span>
              <span class="text-primary">Rp {{ formatCurrency(grandTotal) }}</span>
            </div>
          </div>

          <button class="btn btn-primary w-full" :disabled="!cart.length || submitting" @click="showPayment = true">
            <IconCash class="w-4 h-4" />
            Bayar — Rp {{ formatCurrency(grandTotal) }}
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
              <p class="text-3xl font-bold text-primary">Rp {{ formatCurrency(grandTotal) }}</p>
              <p v-if="taxEnabled || serviceEnabled" class="text-xs text-base-content/50 mt-1">
                Subtotal Rp {{ formatCurrency(subtotal) }}
                <span v-if="taxEnabled"> + {{ taxName }} Rp {{ formatCurrency(taxAmount) }}</span>
                <span v-if="serviceEnabled"> + {{ serviceName }} Rp {{ formatCurrency(serviceAmount) }}</span>
              </p>
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

            <div v-if="paymentMethod === 'CASH' && paidAmount >= grandTotal" class="text-center py-2 bg-success/10 rounded-lg">
              <p class="text-xs text-success uppercase font-semibold">Kembalian</p>
              <p class="text-xl font-bold text-success">Rp {{ formatCurrency(paidAmount - grandTotal) }}</p>
            </div>

            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Pelanggan (opsional)</legend>
              <input v-model="customerName" type="text" class="input w-full" placeholder="Nama pelanggan" />
            </fieldset>

            <button class="btn btn-primary w-full"
              :disabled="submitting || (paymentMethod === 'CASH' && paidAmount < grandTotal)"
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
          <div class="flex gap-2">
            <button class="btn btn-ghost flex-1 gap-1" @click="showReceipt = true">
              <IconPrinter class="w-4 h-4" /> Cetak Struk
            </button>
            <button class="btn btn-primary flex-1" @click="showSuccess = false">OK</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop" @click="showSuccess = false"><button>close</button></form>
      </dialog>

      <ReceiptPreview v-if="lastOrderId" v-model:show="showReceipt" :order-id="lastOrderId" @close="showReceipt = false" />

      <!-- Variant Picker Modal -->
      <dialog class="modal" :class="{ 'modal-open': showVariantPicker }">
        <div class="modal-box max-w-sm">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showVariantPicker = false">
            <IconX class="w-4 h-4" />
          </button>
          <h3 class="font-bold text-lg mb-2">Pilih Varian</h3>
          <p class="text-sm font-medium mb-4">{{ selectedProductForVariant?.name }}</p>

          <div class="space-y-4">
            <div v-for="group in selectedProductForVariant?.variantGroups" :key="group.id" class="p-3 bg-base-200/50 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold text-sm">{{ group.name }}</h4>
                <span v-if="group.required" class="badge badge-xs badge-error badge-outline">Wajib</span>
                <span v-else class="badge badge-xs badge-neutral badge-outline">Opsional</span>
              </div>
              <p class="text-xs text-base-content/50 mb-2">{{ group.multiple ? 'Pilih beberapa' : 'Pilih salah satu' }}</p>
              
              <div class="space-y-2">
                <label v-for="opt in group.options" :key="opt.id" class="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-base-200">
                  <input :type="group.multiple ? 'checkbox' : 'radio'" 
                    class="radio-sm" :class="group.multiple ? 'checkbox' : 'radio'"
                    :name="'variant_' + group.id"
                    :value="opt"
                    v-model="variantSelections[group.id]" />
                  <span class="flex-1 text-sm">{{ opt.name }}</span>
                  <span v-if="Number(opt.additionalPrice) > 0" class="text-xs font-medium text-success">+Rp {{ formatCurrency(opt.additionalPrice) }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="modal-action">
            <button class="btn btn-ghost w-1/3" @click="showVariantPicker = false">Batal</button>
            <button class="btn btn-primary flex-1" @click="confirmVariantSelection">Tambah Keranjang</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop" @click="showVariantPicker = false"><button>close</button></form>
      </dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconPackage, IconShoppingCart, IconPlus, IconMinus, IconTrash,
  IconCash, IconX, IconCheck, IconCashRegister, IconPrinter,
} from '@tabler/icons-vue'
import type { Product, Category, CartItem, CashRegisterShift } from '~/types'

const { formatCurrency } = useFormatCurrency()
const { autoPrintAfterOrder } = useAutoPrint()

// Shift check
const shiftLoading = ref(true)
const currentShift = ref<CashRegisterShift | null>(null)

async function fetchCurrentShift() {
  shiftLoading.value = true
  try {
    currentShift.value = await $fetch<CashRegisterShift>('/api/shifts/current').catch(() => null)
  } finally {
    shiftLoading.value = false
  }
}

// Settings
const settings = ref<Record<string, string>>({})
const taxEnabled = computed(() => settings.value['tax.enabled'] === 'true')
const taxRate = computed(() => Number(settings.value['tax.rate']) || 0)
const taxName = computed(() => settings.value['tax.name'] || 'Tax')
const serviceEnabled = computed(() => settings.value['service.enabled'] === 'true')
const serviceRate = computed(() => Number(settings.value['service.rate']) || 0)
const serviceName = computed(() => settings.value['service.name'] || 'Service')
const orderMode = computed(() => settings.value['order.mode'] || 'all')

function orderModeAllows(type: 'DINE_IN' | 'TAKEAWAY') {
  if (orderMode.value === 'all') return true
  if (orderMode.value === 'dine_in_only' && type === 'DINE_IN') return true
  if (orderMode.value === 'takeaway_only' && type === 'TAKEAWAY') return true
  return false
}

async function fetchSettings() {
  try {
    settings.value = await $fetch<Record<string, string>>('/api/settings')
  } catch { /* use defaults */ }
}

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
const customerCount = ref<number>(1)

const subtotal = computed(() => cart.value.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0))

const serviceAmount = computed(() => {
  if (!serviceEnabled.value) return 0
  return Math.round(subtotal.value * serviceRate.value / 100)
})
const taxAmount = computed(() => {
  if (!taxEnabled.value) return 0
  return Math.round((subtotal.value + serviceAmount.value) * taxRate.value / 100)
})
const grandTotal = computed(() => subtotal.value + serviceAmount.value + taxAmount.value)

function getItemPrice(item: CartItem) {
  let basePrice = Number(item.product.price)
  if (item.variantSelections) {
    basePrice += item.variantSelections.reduce((sum, sel) => sum + Number(sel.additionalPrice), 0)
  }
  return basePrice
}

// Variant Picker State
const showVariantPicker = ref(false)
const selectedProductForVariant = ref<Product | null>(null)
const variantSelections = ref<Record<string, any>>({}) // groupId -> selected option | array of options

function addToCart(product: any) {
  if (product.variantGroups && product.variantGroups.length > 0) {
    selectedProductForVariant.value = product
    variantSelections.value = {}
    
    // Initialize default arrays for multiple select
    product.variantGroups.forEach((g: any) => {
      if (g.multiple) {
        variantSelections.value[g.id] = []
      }
    })
    
    showVariantPicker.value = true
    return
  }

  const existing = cart.value.find(i => i.product.id === product.id && !i.variantSelections?.length)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ product, quantity: 1 })
  }
}

function confirmVariantSelection() {
  if (!selectedProductForVariant.value) return

  const product = selectedProductForVariant.value
  const selections: { groupName: string, optionName: string, additionalPrice: number }[] = []

  // Validation & Mapping
  for (const group of product.variantGroups as any[]) {
    const selected = variantSelections.value[group.id]
    
    if (group.required) {
      if (group.multiple && (!selected || selected.length === 0)) {
        alert(`Pilih setidaknya satu opsi untuk ${group.name}`)
        return
      }
      if (!group.multiple && !selected) {
        alert(`Opsi ${group.name} wajib dipilih`)
        return
      }
    }

    if (group.multiple && selected && selected.length > 0) {
      selected.forEach((opt: any) => {
        selections.push({ groupName: group.name, optionName: opt.name, additionalPrice: Number(opt.additionalPrice) })
      })
    } else if (!group.multiple && selected) {
      selections.push({ groupName: group.name, optionName: selected.name, additionalPrice: Number(selected.additionalPrice) })
    }
  }

  // Create unique signature to stack identical items
  const selSignature = selections.map(s => s.groupName + '|' + s.optionName).sort().join(',')
  
  const existing = cart.value.find(i => {
    if (i.product.id !== product.id) return false
    const iSignature = (i.variantSelections || []).map(s => s.groupName + '|' + s.optionName).sort().join(',')
    return iSignature === selSignature
  })

  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({
      product,
      quantity: 1,
      variantSelections: selections.length > 0 ? selections : undefined
    })
  }

  showVariantPicker.value = false
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
  customerCount.value = 1
}

// Payment
const showPayment = ref(false)
const paymentMethod = ref<string>('CASH')
const paidAmount = ref(0)
const customerName = ref('')
const submitting = ref(false)

const allPaymentMethods = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'DEBIT', label: 'Debit' },
  { value: 'CREDIT_CARD', label: 'Kartu Kredit' },
  { value: 'EWALLET', label: 'E-Wallet' },
  { value: 'QRIS', label: 'QRIS' },
]

const paymentMethods = computed(() => {
  try {
    const enabled = JSON.parse(settings.value['payment.methods'] || '[]')
    if (Array.isArray(enabled) && enabled.length) {
      return allPaymentMethods.filter(pm => enabled.includes(pm.value))
    }
  } catch { /* fallback */ }
  return allPaymentMethods
})

const quickAmounts = computed(() => {
  const total = grandTotal.value
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
const lastOrderId = ref('')
const showReceipt = ref(false)

async function submitOrder() {
  submitting.value = true
  try {
    const currentOrderType = orderType.value

    const order = await $fetch('/api/orders', {
      method: 'POST',
      body: {
        orderType: currentOrderType,
        tableNumber: currentOrderType === 'DINE_IN' ? tableNumber.value : null,
        customerName: customerName.value || null,
        customerCount: customerCount.value || 1,
        items: cart.value.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes || null,
          variantSelections: item.variantSelections || null
        })),
      },
    })

    const orderId = (order as any).id

    // Auto-print kitchen/bar tickets for dine-in orders
    await autoPrintAfterOrder(orderId, currentOrderType, settings.value, 'created')

    // Pay immediately
    const paid = await $fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: {
        action: 'pay',
        paymentMethod: paymentMethod.value,
        paidAmount: paymentMethod.value === 'CASH' ? paidAmount.value : grandTotal.value,
      },
    })

    lastOrderId.value = (paid as any).id
    lastOrderNumber.value = (paid as any).orderNumber
    lastChange.value = paymentMethod.value === 'CASH' ? paidAmount.value - grandTotal.value : null

    // Auto-print receipt after payment
    await autoPrintAfterOrder((paid as any).id, currentOrderType, settings.value, 'paid')

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

// Initialize: set initial order type based on mode
onMounted(async () => {
  await Promise.all([fetchCurrentShift(), fetchSettings()])
  if (orderMode.value === 'takeaway_only') orderType.value = 'TAKEAWAY'
  else orderType.value = 'DINE_IN'
})
</script>
