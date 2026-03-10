<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Akun</h1>
        <p class="text-sm text-base-content/50 mt-1">Kelola akun keuangan kamu</p>
      </div>
      <div class="mt-3 sm:mt-0">
        <button class="btn btn-primary btn-sm" @click="showModal = true">
          <IconPlus class="w-4 h-4" /> Tambah Akun
        </button>
      </div>
    </div>

    <!-- Account Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="acc in accounts" :key="acc.id" class="card bg-base-100 border border-base-300 group transition-[border-color,box-shadow] duration-200 hover:border-base-content/20 hover:shadow-md cursor-pointer overflow-hidden relative" @click="openEdit(acc)">
        <!-- Watermark logo -->
        <div v-if="acc.icon" class="absolute right-3 bottom-3 w-20 h-20 opacity-[0.07] group-hover:opacity-[0.13] transition-opacity duration-300 pointer-events-none">
          <img :src="acc.icon" class="w-full h-full object-contain" :alt="acc.name" />
        </div>
        <div class="card-body p-5 relative z-10">
          <div class="flex items-center gap-3">
            <div class="rounded-lg p-2.5 shrink-0" :class="accountIconBg(acc.type)">
              <img v-if="acc.icon" :src="acc.icon" class="w-5 h-5 object-contain" :alt="acc.name" />
              <component v-else :is="accountIcon(acc.type)" class="w-5 h-5" />
            </div>
            <div>
              <h2 class="font-semibold text-base-content">{{ acc.name }}</h2>
              <span class="badge badge-soft badge-sm badge-neutral mt-1">{{ accountTypeLabel(acc.type) }}</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-base-200">
            <p class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Saldo</p>
            <p class="text-xl font-bold font-mono mt-1">Rp {{ formatCurrency(Number(acc.balance)) }}</p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="accounts.length === 0" class="col-span-full">
        <div class="card bg-base-100 border border-base-300 border-dashed">
          <div class="card-body items-center text-center py-12">
            <div class="bg-base-200 rounded-full p-4 mb-3">
              <IconBuildingBank class="w-8 h-8 text-base-content/30" />
            </div>
            <p class="font-medium text-base-content/60">Belum ada akun</p>
            <p class="text-sm text-base-content/40">Tambahkan akun pertama untuk mulai mencatat keuangan</p>
            <button class="btn btn-primary btn-sm mt-3" @click="showModal = true">
              <IconPlus class="w-4 h-4" /> Tambah Akun
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Account Modal -->
    <dialog v-if="showEditModal" class="modal modal-open">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showEditModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-1">Edit Akun</h3>
        <p class="text-sm text-base-content/50 mb-5">Ubah detail akun keuangan</p>

        <form @submit.prevent="updateAccount" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Akun</legend>
            <input v-model="editForm.name" type="text" class="input w-full" placeholder="Contoh: BCA, Gopay, Kas" required />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tipe Akun</legend>
            <select v-model="editForm.type" class="select w-full">
              <option value="CASH">Kas</option>
              <option value="BANK">Bank</option>
              <option value="EWALLET">E-Wallet</option>
              <option value="CREDIT_CARD">Kartu Kredit</option>
              <option value="INVESTMENT">Investasi</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Saldo (Rp)</legend>
            <label class="input w-full">
              <span class="text-base-content/40 text-sm">Rp</span>
              <CurrencyInput v-model="editForm.balance" />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Icon / Logo (opsional)</legend>
            <IconPicker v-model="editForm.icon" />
          </fieldset>

          <div class="flex items-center justify-between pt-2">
            <button type="button" class="btn btn-error btn-outline btn-sm" @click="deleteAccount">Hapus Akun</button>
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

    <!-- Add Account Modal -->
    <dialog v-if="showModal" class="modal modal-open">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-1">Tambah Akun</h3>
        <p class="text-sm text-base-content/50 mb-5">Buat akun keuangan baru</p>

        <form @submit.prevent="addAccount" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Akun</legend>
            <input v-model="form.name" type="text" class="input w-full" placeholder="Contoh: BCA, Gopay, Kas" required />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tipe Akun</legend>
            <select v-model="form.type" class="select w-full">
              <option value="CASH">Kas</option>
              <option value="BANK">Bank</option>
              <option value="EWALLET">E-Wallet</option>
              <option value="CREDIT_CARD">Kartu Kredit</option>
              <option value="INVESTMENT">Investasi</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Saldo Awal (Rp)</legend>
            <label class="input w-full">
              <span class="text-base-content/40 text-sm">Rp</span>
              <CurrencyInput v-model="form.balance" />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Icon / Logo (opsional)</legend>
            <IconPicker v-model="form.icon" />
          </fieldset>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn btn-ghost btn-sm" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm">Simpan Akun</button>
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
import {
  IconPlus,
  IconX,
  IconBuildingBank,
  IconCash,
  IconWallet,
  IconCreditCard,
  IconChartLine,
  IconDots,
} from '@tabler/icons-vue'
import type { Account } from '~/types'

const showModal = ref(false)
const showEditModal = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  name: '',
  type: 'CASH',
  balance: 0,
  icon: '',
})

const editForm = reactive({
  name: '',
  type: 'CASH',
  balance: 0,
  icon: '',
})

function openEdit(acc: Account) {
  editingId.value = acc.id
  editForm.name = acc.name
  editForm.type = acc.type
  editForm.balance = Number(acc.balance)
  editForm.icon = acc.icon || ''
  showEditModal.value = true
}

async function updateAccount() {
  if (!editingId.value) return
  await $fetch(`/api/accounts/${editingId.value}`, {
    method: 'PUT',
    body: editForm,
  })
  showEditModal.value = false
  await refresh()
}

async function deleteAccount() {
  if (!editingId.value) return
  if (!confirm('Yakin ingin menghapus akun ini?')) return
  await $fetch(`/api/accounts/${editingId.value}`, { method: 'DELETE' })
  showEditModal.value = false
  await refresh()
}

const { data: accountsData, refresh } = await useFetch<Account[]>('/api/accounts')
const accounts = computed(() => accountsData.value || [])

async function addAccount() {
  await $fetch('/api/accounts', {
    method: 'POST',
    body: form,
  })
  showModal.value = false
  form.name = ''
  form.type = 'CASH'
  form.balance = 0
  form.icon = ''
  await refresh()
}

function accountIcon(type: string) {
  const icons: Record<string, any> = {
    CASH: IconCash,
    BANK: IconBuildingBank,
    EWALLET: IconWallet,
    CREDIT_CARD: IconCreditCard,
    INVESTMENT: IconChartLine,
  }
  return icons[type] || IconDots
}

function accountIconBg(type: string) {
  const colors: Record<string, string> = {
    CASH: 'bg-success/10 text-success',
    BANK: 'bg-primary/10 text-primary',
    EWALLET: 'bg-secondary/10 text-secondary',
    CREDIT_CARD: 'bg-warning/10 text-warning',
    INVESTMENT: 'bg-info/10 text-info',
  }
  return colors[type] || 'bg-base-200 text-base-content/50'
}

function accountTypeLabel(type: string) {
  const labels: Record<string, string> = {
    CASH: 'Kas',
    BANK: 'Bank',
    EWALLET: 'E-Wallet',
    CREDIT_CARD: 'Kartu Kredit',
    INVESTMENT: 'Investasi',
    OTHER: 'Lainnya',
  }
  return labels[type] || type
}

const { formatCurrency } = useFormatCurrency()
</script>
