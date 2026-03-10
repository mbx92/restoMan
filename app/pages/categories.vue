<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Kategori</h1>
        <p class="text-sm text-base-content/50 mt-1">Kelola kategori pemasukan dan pengeluaran</p>
      </div>
      <div class="mt-3 sm:mt-0">
        <button class="btn btn-primary btn-sm" @click="showModal = true">
          <IconPlus class="w-4 h-4" /> Tambah Kategori
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-5">
      <button class="btn btn-sm" :class="activeTab === 'EXPENSE' ? 'btn-primary' : 'btn-ghost'" @click="activeTab = 'EXPENSE'">
        <IconArrowDownRight class="w-4 h-4" /> Pengeluaran
        <span class="badge badge-sm" :class="activeTab === 'EXPENSE' ? 'badge-primary' : 'badge-ghost'">{{ expenseCategories.length }}</span>
      </button>
      <button class="btn btn-sm" :class="activeTab === 'INCOME' ? 'btn-primary' : 'btn-ghost'" @click="activeTab = 'INCOME'">
        <IconArrowUpRight class="w-4 h-4" /> Pemasukan
        <span class="badge badge-sm" :class="activeTab === 'INCOME' ? 'badge-primary' : 'badge-ghost'">{{ incomeCategories.length }}</span>
      </button>
    </div>

    <!-- Category List -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <table class="table" v-if="activeCategories.length > 0">
          <thead>
            <tr>
              <th class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Icon</th>
              <th class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Nama</th>
              <th class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Tipe</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in activeCategories" :key="cat.id" class="hover:bg-base-200/50">
              <td class="w-16">
                <div class="rounded-lg p-2 w-9 h-9 flex items-center justify-center" :class="activeTab === 'INCOME' ? 'bg-success/10' : 'bg-error/10'">
                  <img v-if="cat.icon && (cat.icon.startsWith('/') || cat.icon.startsWith('http'))" :src="cat.icon" class="w-5 h-5 object-contain" />
                  <span v-else-if="cat.icon" class="text-lg">{{ cat.icon }}</span>
                  <IconTag v-else class="w-4 h-4" :class="activeTab === 'INCOME' ? 'text-success' : 'text-error'" />
                </div>
              </td>
              <td class="font-medium">{{ cat.name }}</td>
              <td>
                <span class="badge badge-soft badge-sm" :class="activeTab === 'INCOME' ? 'badge-success' : 'badge-error'">
                  {{ activeTab === 'INCOME' ? 'Pemasukan' : 'Pengeluaran' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center text-center py-12 px-4">
          <div class="bg-base-200 rounded-full p-4 mb-3">
            <IconCategory class="w-8 h-8 text-base-content/30" />
          </div>
          <p class="font-medium text-base-content/60">Belum ada kategori {{ activeTab === 'INCOME' ? 'pemasukan' : 'pengeluaran' }}</p>
          <p class="text-sm text-base-content/40 mt-1">Tambahkan kategori untuk mengorganisir transaksi</p>
          <button class="btn btn-primary btn-sm mt-3" @click="showModal = true; form.type = activeTab">
            <IconPlus class="w-4 h-4" /> Tambah Kategori
          </button>
        </div>
      </div>
    </div>

    <!-- Add Category Modal -->
    <dialog v-if="showModal" class="modal modal-open">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-1">Tambah Kategori</h3>
        <p class="text-sm text-base-content/50 mb-5">Buat kategori baru</p>

        <form @submit.prevent="addCategory" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Kategori</legend>
            <input v-model="form.name" type="text" class="input w-full" placeholder="Contoh: Makan, Transportasi, Gaji" required />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tipe</legend>
            <select v-model="form.type" class="select w-full">
              <option value="EXPENSE">Pengeluaran</option>
              <option value="INCOME">Pemasukan</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Icon / Logo (opsional)</legend>
            <p class="text-xs text-base-content/40 mb-2">Upload file, masukkan URL, atau ketik emoji (mis. 🍔)</p>
            <IconPicker v-model="form.icon" />
            <input v-model="form.icon" type="text" class="input input-sm w-full mt-2" placeholder="Atau ketik emoji langsung: 🍔 🏦 💰" />
          </fieldset>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn btn-ghost btn-sm" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm">Simpan Kategori</button>
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
  IconTag,
  IconCategory,
  IconArrowUpRight,
  IconArrowDownRight,
} from '@tabler/icons-vue'
import type { Category } from '~/types'

const showModal = ref(false)
const activeTab = ref<'INCOME' | 'EXPENSE'>('EXPENSE')

const form = reactive({
  name: '',
  type: 'EXPENSE',
  icon: '',
})

const { data: categoriesData, refresh } = await useFetch<Category[]>('/api/categories')
const categories = computed(() => categoriesData.value || [])

const incomeCategories = computed(() =>
  categories.value.filter((c) => c.type === 'INCOME')
)
const expenseCategories = computed(() =>
  categories.value.filter((c) => c.type === 'EXPENSE')
)
const activeCategories = computed(() =>
  activeTab.value === 'INCOME' ? incomeCategories.value : expenseCategories.value
)

async function addCategory() {
  await $fetch('/api/categories', {
    method: 'POST',
    body: form,
  })
  showModal.value = false
  form.name = ''
  form.type = 'EXPENSE'
  form.icon = ''
  await refresh()
}
</script>
