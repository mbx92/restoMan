<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Kategori</h1>
        <p class="text-sm text-base-content/50 mt-1">Kelola kategori produk</p>
      </div>
      <div class="mt-3 sm:mt-0">
        <button class="btn btn-primary btn-sm" @click="openCreateModal">
          <IconPlus class="w-4 h-4" /> Tambah Kategori
        </button>
      </div>
    </div>

    <!-- Categories Grid -->
    <div v-if="!categories?.length" class="card bg-base-100 border border-base-300">
      <div class="card-body p-10 text-center">
        <IconCategory class="w-12 h-12 text-base-content/15 mx-auto mb-3" />
        <p class="text-sm text-base-content/50">Belum ada kategori</p>
        <button class="btn btn-primary btn-sm mt-3" @click="openCreateModal">Tambah Kategori Pertama</button>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="cat in categories" :key="cat.id" class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                :style="{ backgroundColor: cat.color ? cat.color + '20' : 'oklch(95% 0.005 80)' }">
                {{ cat.icon || '📦' }}
              </div>
              <div>
                <h3 class="font-bold text-sm">{{ cat.name }}</h3>
                <p class="text-xs text-base-content/40">{{ cat.productCount ?? 0 }} produk</p>
              </div>
            </div>
            <div class="flex gap-1">
              <button class="btn btn-ghost btn-xs" @click="editCategory(cat)">
                <IconEdit class="w-4 h-4" />
              </button>
              <button class="btn btn-ghost btn-xs text-error" @click="deleteCategory(cat)">
                <IconTrash class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box max-w-sm">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-4">{{ editingId ? 'Edit Kategori' : 'Tambah Kategori' }}</h3>

        <form @submit.prevent="saveCategory" class="space-y-3">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Kategori</legend>
            <input v-model="form.name" type="text" class="input w-full" required placeholder="Makanan" />
          </fieldset>

          <div class="grid grid-cols-2 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Icon (Emoji)</legend>
              <input v-model="form.icon" type="text" class="input w-full" placeholder="🍔" />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Warna</legend>
              <input v-model="form.color" type="color" class="input w-full h-10 p-1" />
            </fieldset>
          </div>

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
import { IconPlus, IconCategory, IconEdit, IconTrash, IconX } from '@tabler/icons-vue'
import type { Category } from '~/types'

const { data: categories, refresh } = useFetch<Category[]>('/api/categories')

const showModal = ref(false)
const editingId = ref('')
const saving = ref(false)

const form = ref({ name: '', icon: '', color: '#22c55e' })

function openCreateModal() {
  editingId.value = ''
  form.value = { name: '', icon: '', color: '#22c55e' }
  showModal.value = true
}

function editCategory(cat: Category) {
  editingId.value = cat.id
  form.value = { name: cat.name, icon: cat.icon || '', color: cat.color || '#22c55e' }
  showModal.value = true
}

async function saveCategory() {
  saving.value = true
  try {
    if (editingId.value) {
      await $fetch(`/api/categories/${editingId.value}`, { method: 'PUT', body: form.value })
    } else {
      await $fetch('/api/categories', { method: 'POST', body: form.value })
    }
    showModal.value = false
    refresh()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal menyimpan kategori')
  } finally {
    saving.value = false
  }
}

async function deleteCategory(cat: Category) {
  if (!confirm(`Hapus kategori "${cat.name}"?`)) return
  await $fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
  refresh()
}
</script>
