<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Transaksi</h1>
        <p class="text-sm text-base-content/50 mt-1">Riwayat semua transaksi keuangan</p>
      </div>
      <div class="mt-3 sm:mt-0">
        <button class="btn btn-primary btn-sm" @click="showModal = true">
          <IconPlus class="w-4 h-4" /> Tambah Transaksi
        </button>
      </div>
    </div>

    <!-- Transaction Table -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr class="text-xs uppercase text-base-content/40">
                <th>Tanggal</th>
                <th>Deskripsi</th>
                <th>Tipe</th>
                <th>Kategori</th>
                <th>Akun</th>
                <th class="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in transactions" :key="tx.id" class="hover">
                <td class="text-sm text-base-content/60">{{ formatDate(tx.date) }}</td>
                <td class="text-sm font-medium">{{ tx.description || '-' }}</td>
                <td>
                  <span class="badge badge-soft badge-sm" :class="typeBadge(tx.type)">
                    {{ typeLabel(tx.type) }}
                  </span>
                </td>
                <td class="text-sm">{{ tx.category?.name || '-' }}</td>
                <td class="text-sm text-base-content/60">{{ tx.account?.name }}</td>
                <td class="text-right text-sm font-mono font-medium" :class="tx.type === 'INCOME' ? 'text-success' : 'text-error'">
                  {{ tx.type === 'INCOME' ? '+' : '-' }}Rp {{ formatCurrency(tx.amount) }}
                </td>
              </tr>
              <tr v-if="transactions.length === 0">
                <td colspan="6" class="text-center py-12">
                  <div class="flex flex-col items-center text-base-content/30">
                    <IconReceipt class="w-10 h-10 mb-2" />
                    <p class="text-sm font-medium">Belum ada transaksi</p>
                    <p class="text-xs mt-1">Klik tombol "Tambah Transaksi" untuk memulai</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Transaction Modal -->
    <dialog v-if="showModal" class="modal modal-open">
      <div class="modal-box max-w-lg">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-1">Tambah Transaksi</h3>
        <p class="text-sm text-base-content/50 mb-5">Isi detail transaksi baru</p>

        <form @submit.prevent="addTransaction" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tipe Transaksi</legend>
            <select v-model="form.type" class="select w-full">
              <option value="EXPENSE">Pengeluaran</option>
              <option value="INCOME">Pemasukan</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Jumlah (Rp)</legend>
            <label class="input w-full">
              <span class="text-base-content/40 text-sm">Rp</span>
              <CurrencyInput v-model="form.amount" required />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Deskripsi</legend>
            <input v-model="form.description" type="text" class="input w-full" placeholder="Keterangan transaksi" />
          </fieldset>

          <div class="grid grid-cols-2 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Akun</legend>
              <select v-model="form.accountId" class="select w-full" required>
                <option value="" disabled>Pilih akun</option>
                <option v-for="acc in accounts" :key="acc.id" :value="acc.id">{{ acc.name }}</option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Kategori</legend>
              <select v-model="form.categoryId" class="select w-full" required>
                <option value="" disabled>Pilih kategori</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </fieldset>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tanggal</legend>
            <input v-model="form.date" type="date" class="input w-full" />
          </fieldset>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn btn-ghost btn-sm" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm">Simpan Transaksi</button>
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
import { IconPlus, IconReceipt, IconX } from '@tabler/icons-vue'
import type { Account, Category, Transaction } from '~/types'

const showModal = ref(false)
const form = reactive({
  type: 'EXPENSE',
  amount: 0,
  description: '',
  accountId: '',
  categoryId: '',
  date: new Date().toISOString().split('T')[0],
})

const { data: transactionsData, refresh } = await useFetch<Transaction[]>('/api/transactions')
const { data: accounts } = await useFetch<Account[]>('/api/accounts')
const { data: categories } = await useFetch<Category[]>('/api/categories')

const transactions = computed(() => transactionsData.value || [])

async function addTransaction() {
  await $fetch('/api/transactions', {
    method: 'POST',
    body: form,
  })
  showModal.value = false
  form.amount = 0
  form.description = ''
  form.accountId = ''
  form.categoryId = ''
  form.date = new Date().toISOString().split('T')[0]
  await refresh()
}

function typeBadge(type: string) {
  return {
    'badge-success': type === 'INCOME',
    'badge-error': type === 'EXPENSE',
    'badge-info': type === 'TRANSFER',
  }
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    INCOME: 'Pemasukan',
    EXPENSE: 'Pengeluaran',
    TRANSFER: 'Transfer',
  }
  return labels[type] || type
}

const { formatCurrency } = useFormatCurrency()

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>
