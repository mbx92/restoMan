<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Anggaran</h1>
        <p class="text-sm text-base-content/50 mt-1">Kelola anggaran pengeluaran kamu</p>
      </div>
      <div class="mt-3 sm:mt-0">
        <button class="btn btn-primary btn-sm" @click="showModal = true">
          <IconPlus class="w-4 h-4" /> Tambah Anggaran
        </button>
      </div>
    </div>

    <!-- Budget Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" v-if="budgets.length > 0">
      <div v-for="b in budgets" :key="b.id" class="card bg-base-100 border border-base-300 cursor-pointer hover:border-base-content/20 hover:shadow-md transition-[border-color,box-shadow] duration-200" @click="openEdit(b)">
        <div class="card-body p-5">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-semibold text-base-content">{{ b.name }}</h2>
              <span class="badge badge-soft badge-sm badge-neutral mt-1">{{ periodLabel(b.period) }}</span>
            </div>
            <span v-if="b.category" class="badge badge-soft badge-sm badge-primary">{{ b.category.name }}</span>
          </div>
          <div class="mt-4">
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="text-base-content/50">Rp {{ formatCurrency(Number(b.spent)) }}</span>
              <span class="font-medium">Rp {{ formatCurrency(Number(b.amount)) }}</span>
            </div>
            <progress class="progress w-full" :class="percentage(b) >= 100 ? 'progress-error' : percentage(b) >= 80 ? 'progress-warning' : 'progress-primary'" :value="percentage(b)" max="100"></progress>
            <p class="text-xs text-base-content/40 mt-1">{{ percentage(b) }}% terpakai</p>
          </div>
          <div class="mt-2 pt-2 border-t border-base-200">
            <p class="text-xs text-base-content/40">
              Sisa: <span class="font-medium text-base-content">Rp {{ formatCurrency(Math.max(0, Number(b.amount) - Number(b.spent))) }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else>
      <div class="card bg-base-100 border border-base-300 border-dashed">
        <div class="card-body items-center text-center py-12">
          <div class="bg-base-200 rounded-full p-4 mb-3">
            <IconChartPie class="w-8 h-8 text-base-content/30" />
          </div>
          <p class="font-medium text-base-content/60">Belum ada anggaran</p>
          <p class="text-sm text-base-content/40">Buat anggaran untuk mengontrol pengeluaran</p>
          <button class="btn btn-primary btn-sm mt-3" @click="showModal = true">
            <IconPlus class="w-4 h-4" /> Tambah Anggaran
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <dialog v-if="showEditModal" class="modal modal-open">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showEditModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-1">Edit Anggaran</h3>
        <p class="text-sm text-base-content/50 mb-5">Ubah detail anggaran</p>

        <form @submit.prevent="updateBudget" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Anggaran</legend>
            <input v-model="editForm.name" type="text" class="input w-full" required />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Batas Anggaran (Rp)</legend>
            <label class="input w-full">
              <span class="text-base-content/40 text-sm">Rp</span>
              <CurrencyInput v-model="editForm.amount" />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Terpakai (Rp)</legend>
            <label class="input w-full">
              <span class="text-base-content/40 text-sm">Rp</span>
              <CurrencyInput v-model="editForm.spent" />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Periode</legend>
            <select v-model="editForm.period" class="select w-full">
              <option value="DAILY">Harian</option>
              <option value="WEEKLY">Mingguan</option>
              <option value="MONTHLY">Bulanan</option>
              <option value="YEARLY">Tahunan</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Kategori</legend>
            <select v-model="editForm.categoryId" class="select w-full">
              <option value="">Semua Kategori</option>
              <option v-for="cat in expenseCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tanggal Mulai</legend>
            <input v-model="editForm.startDate" type="date" class="input w-full" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tanggal Akhir (opsional)</legend>
            <input v-model="editForm.endDate" type="date" class="input w-full" />
          </fieldset>

          <div class="flex items-center justify-between pt-2">
            <button type="button" class="btn btn-error btn-outline btn-sm" @click="deleteBudget">Hapus</button>
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
        <h3 class="font-bold text-lg mb-1">Tambah Anggaran</h3>
        <p class="text-sm text-base-content/50 mb-5">Buat anggaran pengeluaran baru</p>

        <form @submit.prevent="addBudget" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Anggaran</legend>
            <input v-model="form.name" type="text" class="input w-full" placeholder="Contoh: Makan Bulanan" required />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Batas Anggaran (Rp)</legend>
            <label class="input w-full">
              <span class="text-base-content/40 text-sm">Rp</span>
              <CurrencyInput v-model="form.amount" />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Periode</legend>
            <select v-model="form.period" class="select w-full">
              <option value="DAILY">Harian</option>
              <option value="WEEKLY">Mingguan</option>
              <option value="MONTHLY">Bulanan</option>
              <option value="YEARLY">Tahunan</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Kategori</legend>
            <select v-model="form.categoryId" class="select w-full">
              <option value="">Semua Kategori</option>
              <option v-for="cat in expenseCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tanggal Mulai</legend>
            <input v-model="form.startDate" type="date" class="input w-full" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tanggal Akhir (opsional)</legend>
            <input v-model="form.endDate" type="date" class="input w-full" />
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
import { IconPlus, IconX, IconChartPie } from '@tabler/icons-vue'
import type { Budget, Category } from '~/types'

const { formatCurrency } = useFormatCurrency()

const showModal = ref(false)
const showEditModal = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  name: '',
  amount: 0,
  period: 'MONTHLY',
  categoryId: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
})

const editForm = reactive({
  name: '',
  amount: 0,
  spent: 0,
  period: 'MONTHLY',
  categoryId: '',
  startDate: '',
  endDate: '',
})

const { data: budgetsData, refresh } = await useFetch<Budget[]>('/api/budgets')
const budgets = computed(() => budgetsData.value || [])

const { data: categoriesData } = await useFetch<Category[]>('/api/categories')
const expenseCategories = computed(() => (categoriesData.value || []).filter((c) => c.type === 'EXPENSE'))

function percentage(b: Budget) {
  const amount = Number(b.amount)
  if (amount === 0) return 0
  return Math.round((Number(b.spent) / amount) * 100)
}

function periodLabel(period: string) {
  const labels: Record<string, string> = {
    DAILY: 'Harian',
    WEEKLY: 'Mingguan',
    MONTHLY: 'Bulanan',
    YEARLY: 'Tahunan',
  }
  return labels[period] || period
}

function openEdit(b: Budget) {
  editingId.value = b.id
  editForm.name = b.name
  editForm.amount = Number(b.amount)
  editForm.spent = Number(b.spent)
  editForm.period = b.period
  editForm.categoryId = b.categoryId || ''
  editForm.startDate = new Date(b.startDate).toISOString().split('T')[0]
  editForm.endDate = b.endDate ? new Date(b.endDate).toISOString().split('T')[0] : ''
  showEditModal.value = true
}

async function addBudget() {
  await $fetch('/api/budgets', { method: 'POST', body: form })
  showModal.value = false
  form.name = ''
  form.amount = 0
  form.period = 'MONTHLY'
  form.categoryId = ''
  form.startDate = new Date().toISOString().split('T')[0]
  form.endDate = ''
  await refresh()
}

async function updateBudget() {
  if (!editingId.value) return
  await $fetch(`/api/budgets/${editingId.value}`, { method: 'PUT', body: editForm })
  showEditModal.value = false
  await refresh()
}

async function deleteBudget() {
  if (!editingId.value) return
  if (!confirm('Yakin ingin menghapus anggaran ini?')) return
  await $fetch(`/api/budgets/${editingId.value}`, { method: 'DELETE' })
  showEditModal.value = false
  await refresh()
}
</script>
