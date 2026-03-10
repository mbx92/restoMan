<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Pengeluaran</h1>
        <p class="text-sm text-base-content/50 mt-1">Catat pengeluaran operasional</p>
      </div>
      <div class="mt-3 sm:mt-0">
        <button class="btn btn-primary btn-sm" @click="openCreateModal">
          <IconPlus class="w-4 h-4" /> Tambah Pengeluaran
        </button>
      </div>
    </div>

    <!-- Expense Table -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <div v-if="!expenses?.length" class="p-10 text-center">
          <IconReportMoney class="w-12 h-12 text-base-content/15 mx-auto mb-3" />
          <p class="text-sm text-base-content/50">Belum ada pengeluaran</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Deskripsi</th>
                <th>Kategori</th>
                <th>Jumlah</th>
                <th>Tanggal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in expenses" :key="expense.id">
                <td class="font-medium">{{ expense.description }}</td>
                <td class="text-sm text-base-content/60">{{ expense.category || '—' }}</td>
                <td class="font-medium text-error">Rp {{ formatCurrency(expense.amount) }}</td>
                <td class="text-sm text-base-content/60">{{ formatDate(expense.date) }}</td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-xs" @click="editExpense(expense)">
                      <IconEdit class="w-4 h-4" />
                    </button>
                    <button class="btn btn-ghost btn-xs text-error" @click="deleteExpense(expense)">
                      <IconTrash class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-4">{{ editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran' }}</h3>

        <form @submit.prevent="saveExpense" class="space-y-3">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Deskripsi</legend>
            <input v-model="form.description" type="text" class="input w-full" required placeholder="Beli bahan baku" />
          </fieldset>

          <div class="grid grid-cols-2 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Jumlah</legend>
              <input v-model.number="form.amount" type="number" class="input w-full" min="0" required />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Kategori</legend>
              <input v-model="form.category" type="text" class="input w-full" placeholder="Bahan Baku" />
            </fieldset>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tanggal</legend>
            <input v-model="form.date" type="date" class="input w-full" />
          </fieldset>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn btn-ghost btn-sm" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              {{ editingId ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showModal = false"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { IconPlus, IconReportMoney, IconEdit, IconTrash, IconX } from '@tabler/icons-vue'
import type { Expense } from '~/types'

const { formatCurrency } = useFormatCurrency()

const { data: expenses, refresh } = useFetch<Expense[]>('/api/expenses')

const showModal = ref(false)
const editingId = ref('')
const saving = ref(false)

const form = ref({
  description: '',
  amount: 0,
  category: '',
  date: new Date().toISOString().slice(0, 10),
})

function openCreateModal() {
  editingId.value = ''
  form.value = { description: '', amount: 0, category: '', date: new Date().toISOString().slice(0, 10) }
  showModal.value = true
}

function editExpense(expense: Expense) {
  editingId.value = expense.id
  form.value = {
    description: expense.description,
    amount: Number(expense.amount),
    category: expense.category || '',
    date: expense.date.slice(0, 10),
  }
  showModal.value = true
}

async function saveExpense() {
  saving.value = true
  try {
    if (editingId.value) {
      await $fetch(`/api/expenses/${editingId.value}`, { method: 'PUT', body: form.value })
    } else {
      await $fetch('/api/expenses', { method: 'POST', body: form.value })
    }
    showModal.value = false
    refresh()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal menyimpan pengeluaran')
  } finally {
    saving.value = false
  }
}

async function deleteExpense(expense: Expense) {
  if (!confirm(`Hapus pengeluaran "${expense.description}"?`)) return
  await $fetch(`/api/expenses/${expense.id}`, { method: 'DELETE' })
  refresh()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
</script>
