<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Investasi</h1>
        <p class="text-sm text-base-content/50 mt-1">Kelola portofolio investasi kamu</p>
      </div>
      <div class="mt-3 sm:mt-0 flex gap-2">
        <button class="btn btn-outline btn-sm" @click="refreshAllPrices" :disabled="isRefreshingAll">
          <IconRefresh class="w-4 h-4" :class="{ 'animate-spin': isRefreshingAll }" />
          {{ isRefreshingAll ? 'Memperbarui...' : 'Refresh Semua Harga' }}
        </button>
        <button class="btn btn-primary btn-sm" @click="showModal = true">
          <IconPlus class="w-4 h-4" /> Tambah Investasi
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Total Modal</p>
          <p class="text-xl font-bold font-mono mt-1">Rp {{ formatCurrency(totalInitial) }}</p>
        </div>
      </div>
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Nilai Saat Ini</p>
          <p class="text-xl font-bold font-mono mt-1">Rp {{ formatCurrency(totalCurrent) }}</p>
        </div>
      </div>
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Untung / Rugi</p>
          <p class="text-xl font-bold font-mono mt-1" :class="totalProfit >= 0 ? 'text-success' : 'text-error'">
            {{ totalProfit >= 0 ? '+' : '' }}Rp {{ formatCurrency(totalProfit) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Investment Table -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table" v-if="investments.length > 0">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Tipe</th>
                <th>Platform</th>
                <th class="text-right">Modal</th>
                <th class="text-right">Nilai Saat Ini</th>
                <th class="text-right">Untung/Rugi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in investments" :key="inv.id" class="hover:bg-base-200/50 cursor-pointer" @click="openEdit(inv)">
                <td>
                  <div>
                    <p class="font-medium">{{ inv.name }}</p>
                    <div class="flex items-center gap-1 mt-0.5">
                      <span v-if="inv.ticker" class="badge badge-soft badge-xs badge-info font-mono">{{ inv.ticker }}</span>
                      <p class="text-xs text-base-content/40">{{ formatDate(inv.startDate) }}</p>
                    </div>
                  </div>
                </td>
                <td><span class="badge badge-soft badge-sm badge-neutral">{{ investmentTypeLabel(inv.type) }}</span></td>
                <td class="text-base-content/60">{{ inv.platform || '-' }}</td>
                <td class="text-right font-mono">Rp {{ formatCurrency(Number(inv.initialAmount)) }}</td>
                <td class="text-right font-mono">Rp {{ formatCurrency(Number(inv.currentValue)) }}</td>
                <td class="text-right font-mono" :class="Number(inv.currentValue) - Number(inv.initialAmount) >= 0 ? 'text-success' : 'text-error'">
                  {{ Number(inv.currentValue) - Number(inv.initialAmount) >= 0 ? '+' : '' }}Rp {{ formatCurrency(Math.abs(Number(inv.currentValue) - Number(inv.initialAmount))) }}
                </td>
              </tr>
            </tbody>
          </table>
          <!-- Empty State -->
          <div v-else class="py-12 text-center">
            <div class="flex flex-col items-center text-base-content/30">
              <IconChartLine class="w-10 h-10 mb-3" />
              <p class="font-medium text-base-content/60">Belum ada investasi</p>
              <p class="text-sm text-base-content/40 mt-1">Tambahkan investasi pertama kamu</p>
              <button class="btn btn-primary btn-sm mt-4" @click="showModal = true">
                <IconPlus class="w-4 h-4" /> Tambah Investasi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <dialog v-if="showEditModal" class="modal modal-open">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showEditModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-1">Edit Investasi</h3>
        <p class="text-sm text-base-content/50 mb-5">Ubah detail investasi</p>

        <form @submit.prevent="updateInvestment" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama</legend>
            <input v-model="editForm.name" type="text" class="input w-full" required />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tipe</legend>
            <select v-model="editForm.type" class="select w-full">
              <option value="STOCK">Saham</option>
              <option value="CRYPTO">Kripto</option>
              <option value="MUTUAL_FUND">Reksadana</option>
              <option value="GOLD">Emas</option>
              <option value="PROPERTY">Properti</option>
              <option value="DEPOSIT">Deposito</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </fieldset>

          <fieldset class="fieldset" v-if="['STOCK', 'CRYPTO'].includes(editForm.type)">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">
              Ticker Symbol <span class="text-base-content/50 font-normal">(Opsional)</span>
            </legend>
            <div class="flex gap-2">
              <input v-model="editForm.ticker" type="text" class="input w-full uppercase" placeholder="Contoh: BBCA.JK atau BTC-USD" @input="editForm.ticker = editForm.ticker?.toUpperCase()" />
              <button
                type="button"
                class="btn btn-square btn-outline btn-neutral shrink-0"
                @click="fetchPriceEdit"
                :disabled="!editForm.ticker || editFetchingPrice"
                title="Ambil harga saat ini"
              >
                <IconRefresh v-if="!editFetchingPrice" class="w-4 h-4" />
                <span v-else class="loading loading-spinner w-4 h-4"></span>
              </button>
            </div>
            <p v-if="editQuoteInfo" class="text-xs text-success mt-1">{{ editQuoteInfo }}</p>
            <p v-if="editQuoteError" class="text-xs text-error mt-1">{{ editQuoteError }}</p>
          </fieldset>

          <div class="flex gap-2">
            <fieldset class="fieldset flex-1">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Modal Dasar (Rp)</legend>
              <label class="input w-full">
                <span class="text-base-content/40 text-sm">Rp</span>
                <CurrencyInput v-model="editForm.initialAmountBase" />
              </label>
            </fieldset>
            <fieldset class="fieldset w-28">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Satuan</legend>
              <select v-model="editForm.multiplier" class="select w-full">
                <option :value="1">x1</option>
                <option :value="100">x100 (Lot)</option>
              </select>
            </fieldset>
          </div>
          <p class="text-xs text-base-content/50 -mt-2">Total Modal: Rp {{ formatCurrency(editForm.initialAmountBase * editForm.multiplier) }}</p>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nilai Saat Ini (Per Satuan/Lembar)</legend>
            <label class="input w-full">
              <span class="text-base-content/40 text-sm">Rp</span>
              <CurrencyInput v-model="editForm.currentValueBase" />
            </label>
            <p class="text-xs text-base-content/50 mt-1">Total Nilai: Rp {{ formatCurrency(editForm.currentValueBase * editForm.multiplier) }}</p>
          </fieldset>



          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Platform</legend>
            <input v-model="editForm.platform" type="text" class="input w-full" placeholder="Contoh: Bibit, Stockbit" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Catatan</legend>
            <input v-model="editForm.notes" type="text" class="input w-full" placeholder="Catatan opsional" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tanggal Mulai</legend>
            <input v-model="editForm.startDate" type="date" class="input w-full" />
          </fieldset>

          <div class="flex items-center justify-between pt-2">
            <button type="button" class="btn btn-error btn-outline btn-sm" @click="deleteInvestment">Hapus</button>
            <div class="flex gap-2">
              <button type="button" class="btn btn-ghost btn-sm" @click="showEditModal = false">Batal</button>
              <button type="submit" class="btn btn-primary btn-sm">Simpan</button>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showEditModal = false">
        <button>close</button>
      </form>
    </dialog>

    <!-- Add Modal -->
    <dialog v-if="showModal" class="modal modal-open">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-1">Tambah Investasi</h3>
        <p class="text-sm text-base-content/50 mb-5">Catat investasi baru</p>

        <form @submit.prevent="addInvestment" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama</legend>
            <input v-model="form.name" type="text" class="input w-full" placeholder="Contoh: Reksadana BNI-AM" required />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tipe Investasi</legend>
            <select v-model="form.type" class="select w-full">
              <option value="STOCK">Saham</option>
              <option value="CRYPTO">Kripto</option>
              <option value="MUTUAL_FUND">Reksadana</option>
              <option value="GOLD">Emas</option>
              <option value="PROPERTY">Properti</option>
              <option value="DEPOSIT">Deposito</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </fieldset>

          <fieldset class="fieldset" v-if="['STOCK', 'CRYPTO'].includes(form.type)">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">
              Ticker Symbol <span class="text-base-content/50 font-normal">(Opsional)</span>
            </legend>
            <div class="flex gap-2">
              <input v-model="form.ticker" type="text" class="input w-full uppercase" placeholder="Contoh: BBCA.JK atau BTC-USD" @input="form.ticker = form.ticker?.toUpperCase()" />
              <button
                type="button"
                class="btn btn-square btn-outline btn-neutral shrink-0"
                @click="fetchPriceAdd"
                :disabled="!form.ticker || addFetchingPrice"
                title="Ambil harga saat ini"
              >
                <IconRefresh v-if="!addFetchingPrice" class="w-4 h-4" />
                <span v-else class="loading loading-spinner w-4 h-4"></span>
              </button>
            </div>
            <p v-if="addQuoteInfo" class="text-xs text-success mt-1">{{ addQuoteInfo }}</p>
            <p v-if="addQuoteError" class="text-xs text-error mt-1">{{ addQuoteError }}</p>
          </fieldset>

          <div class="flex gap-2">
            <fieldset class="fieldset flex-1">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Modal Dasar (Rp)</legend>
              <label class="input w-full">
                <span class="text-base-content/40 text-sm">Rp</span>
                <CurrencyInput v-model="form.initialAmountBase" />
              </label>
            </fieldset>
            <fieldset class="fieldset w-28">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Satuan</legend>
              <select v-model="form.multiplier" class="select w-full">
                <option :value="1">x1</option>
                <option :value="100">x100 (Lot)</option>
              </select>
            </fieldset>
          </div>
          <p class="text-xs text-base-content/50 -mt-2">Total Modal: Rp {{ formatCurrency(form.initialAmountBase * form.multiplier) }}</p>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nilai Saat Ini (Per Satuan/Lembar)</legend>
            <label class="input w-full">
              <span class="text-base-content/40 text-sm">Rp</span>
              <CurrencyInput v-model="form.currentValueBase" />
            </label>
            <p class="text-xs text-base-content/50 mt-1">Total Nilai: Rp {{ formatCurrency(form.currentValueBase * form.multiplier) }}</p>
          </fieldset>



          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Platform</legend>
            <input v-model="form.platform" type="text" class="input w-full" placeholder="Contoh: Bibit, Stockbit" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Catatan</legend>
            <input v-model="form.notes" type="text" class="input w-full" placeholder="Catatan opsional" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tanggal Mulai</legend>
            <input v-model="form.startDate" type="date" class="input w-full" />
          </fieldset>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn btn-ghost btn-sm" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm">Simpan</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showModal = false">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { IconPlus, IconX, IconChartLine, IconRefresh } from '@tabler/icons-vue'
import type { Investment } from '~/types'

const { formatCurrency } = useFormatCurrency()

const showModal = ref(false)
const showEditModal = ref(false)
const editingId = ref<string | null>(null)
const isRefreshingAll = ref(false)

// Add form state
const addFetchingPrice = ref(false)
const addQuoteInfo = ref('')
const addQuoteError = ref('')

// Edit form state
const editFetchingPrice = ref(false)
const editQuoteInfo = ref('')
const editQuoteError = ref('')

const investmentTypes = [
  { value: 'STOCK', label: 'Saham' },
  { value: 'MUTUAL_FUND', label: 'Reksadana' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'GOLD', label: 'Emas' },
  { value: 'DEPOSIT', label: 'Deposito' },
  { value: 'BOND', label: 'Obligasi' },
  { value: 'PROPERTY', label: 'Properti' },
  { value: 'OTHER', label: 'Lainnya' },
]

const form = reactive({
  name: '',
  type: 'OTHER',
  ticker: '',
  multiplier: 1,
  initialAmountBase: 0,
  currentValueBase: 0,
  platform: '',
  notes: '',
  startDate: new Date().toISOString().split('T')[0],
})

const editForm = reactive({
  name: '',
  type: 'OTHER',
  ticker: '',
  multiplier: 1,
  initialAmountBase: 0,
  currentValueBase: 0,
  platform: '',
  notes: '',
  startDate: '',
})

const { data: investmentsData, refresh } = await useFetch<Investment[]>('/api/investments')
const investments = computed(() => investmentsData.value || [])

const totalInitial = computed(() => investments.value.reduce((sum, inv) => sum + Number(inv.initialAmount), 0))
const totalCurrent = computed(() => investments.value.reduce((sum, inv) => sum + Number(inv.currentValue), 0))
const totalProfit = computed(() => totalCurrent.value - totalInitial.value)

// --- Yahoo Finance Fetch (via server proxy) ---

async function fetchQuote(symbol: string): Promise<{ price: number; name: string; currency: string } | null> {
  try {
    const data = await $fetch<any>(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`)
    return data
  } catch (e: any) {
    console.warn('[fetchQuote] error:', e.data?.message || e.message)
    return null
  }
}

async function fetchPriceAdd() {
  if (!form.ticker) return
  addFetchingPrice.value = true
  addQuoteInfo.value = ''
  addQuoteError.value = ''
  const result = await fetchQuote(form.ticker)
  addFetchingPrice.value = false
  if (!result || result.price === null) {
    addQuoteError.value = `Ticker "${form.ticker}" tidak ditemukan.`
    return
  }
  
  form.currentValueBase = result.price
  addQuoteInfo.value = `${result.name} — Harga: ${result.currency} ${result.price.toLocaleString()}`
}

async function fetchPriceEdit() {
  if (!editForm.ticker) return
  editFetchingPrice.value = true
  editQuoteInfo.value = ''
  editQuoteError.value = ''
  const result = await fetchQuote(editForm.ticker)
  editFetchingPrice.value = false
  if (!result || result.price === null) {
    editQuoteError.value = `Ticker "${editForm.ticker}" tidak ditemukan.`
    return
  }
  
  editForm.currentValueBase = result.price
  editQuoteInfo.value = `${result.name} — Harga: ${result.currency} ${result.price.toLocaleString()}`
}

async function refreshAllPrices() {
  const tickered = investments.value.filter((inv) => inv.ticker)
  if (tickered.length === 0) return
  isRefreshingAll.value = true
  await Promise.all(
    tickered.map(async (inv) => {
      const result = await fetchQuote(inv.ticker!)
      if (result && result.price !== null) {
        await $fetch(`/api/investments/${inv.id}`, {
          method: 'PUT',
          body: {
            name: inv.name,
            type: inv.type,
            ticker: inv.ticker,
            quantity: inv.quantity !== null ? Number(inv.quantity) : null,
            initialAmount: Number(inv.initialAmount),
            currentValue: result.price * (inv.quantity ? Number(inv.quantity) : 1), // Using stored quantity as multiplier if it exists
            platform: inv.platform ?? null,
            notes: inv.notes ?? null,
            startDate: inv.startDate,
          },
        })
      }
    })
  )
  await refresh()
  isRefreshingAll.value = false
}

// --- CRUD ---

function openEdit(inv: Investment) {
  editingId.value = inv.id
  editForm.name = inv.name
  editForm.type = inv.type
  editForm.ticker = inv.ticker || ''
  const multiplier = inv.quantity ? Number(inv.quantity) : 1
  editForm.multiplier = multiplier
  editForm.initialAmountBase = Number(inv.initialAmount) / multiplier
  editForm.currentValueBase = Number(inv.currentValue) / multiplier
  editForm.platform = inv.platform || ''
  editForm.notes = inv.notes || ''
  editForm.startDate = inv.startDate ? (new Date(inv.startDate).toISOString().split('T')[0] ?? '') : ''
  editQuoteInfo.value = ''
  editQuoteError.value = ''
  showEditModal.value = true
}

async function addInvestment() {
  const totalInitial = form.initialAmountBase * form.multiplier
  const totalCurrent = form.currentValueBase * form.multiplier

  await $fetch('/api/investments', { 
    method: 'POST', 
    body: {
      ...form,
      initialAmount: totalInitial,
      currentValue: totalCurrent,
      quantity: form.multiplier > 1 ? form.multiplier : null // Save multiplier to quantity field so refreshAllPrices works
    } 
  })
  showModal.value = false
  form.name = ''
  form.type = 'OTHER'
  form.ticker = ''
  form.multiplier = 1
  form.initialAmountBase = 0
  form.currentValueBase = 0
  form.platform = ''
  form.notes = ''
  form.startDate = new Date().toISOString().split('T')[0]
  addQuoteInfo.value = ''
  addQuoteError.value = ''
  await refresh()
}

async function updateInvestment() {
  if (!editingId.value) return
  const totalInitial = editForm.initialAmountBase * editForm.multiplier
  const totalCurrent = editForm.currentValueBase * editForm.multiplier

  await $fetch(`/api/investments/${editingId.value}`, { 
    method: 'PUT', 
    body: {
      ...editForm,
      initialAmount: totalInitial,
      currentValue: totalCurrent,
      quantity: editForm.multiplier > 1 ? editForm.multiplier : null
    }
  })
  showEditModal.value = false
  await refresh()
}

async function deleteInvestment() {
  if (!editingId.value) return
  if (!confirm('Yakin ingin menghapus investasi ini?')) return
  await $fetch(`/api/investments/${editingId.value}`, { method: 'DELETE' })
  showEditModal.value = false
  await refresh()
}

function investmentTypeLabel(type: string) {
  const found = investmentTypes.find((t) => t.value === type)
  return found ? found.label : type
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
