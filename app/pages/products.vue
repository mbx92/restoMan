<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Produk</h1>
        <p class="text-sm text-base-content/50 mt-1">Kelola menu dan produk</p>
      </div>
      <div class="mt-3 sm:mt-0">
        <button class="btn btn-primary btn-sm" @click="openCreateModal">
          <IconPlus class="w-4 h-4" /> Tambah Produk
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-2 mb-4">
      <select v-model="categoryFilter" class="select select-sm">
        <option value="">Semua Kategori</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <input v-model="searchQuery" type="text" placeholder="Cari produk..." class="input input-sm w-48" />
    </div>

    <!-- Products Table -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <div v-if="!products?.length" class="p-10 text-center">
          <IconPackage class="w-12 h-12 text-base-content/15 mx-auto mb-3" />
          <p class="text-sm text-base-content/50">Belum ada produk</p>
          <button class="btn btn-primary btn-sm mt-3" @click="openCreateModal">Tambah Produk Pertama</button>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>SKU</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>HPP</th>
                <th>Stok</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td>
                  <div class="font-medium">{{ product.name }}</div>
                  <div v-if="product.description" class="text-xs text-base-content/40 truncate max-w-48">{{ product.description }}</div>
                </td>
                <td class="font-mono text-sm text-base-content/60">{{ product.sku || '—' }}</td>
                <td class="text-sm">{{ product.category?.name }}</td>
                <td class="font-medium">Rp {{ formatCurrency(product.price) }}</td>
                <td class="text-sm text-base-content/60">Rp {{ formatCurrency(product.cost) }}</td>
                <td>
                  <span v-if="product.trackStock" class="text-sm" :class="product.stock <= 5 ? 'text-error font-medium' : ''">
                    {{ product.stock }}
                  </span>
                  <span v-else class="text-base-content/30">—</span>
                </td>
                <td>
                  <span class="badge badge-sm" :class="product.isActive ? 'badge-soft badge-success' : 'badge-soft badge-error'">
                    {{ product.isActive ? 'Aktif' : 'Nonaktif' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-xs" @click="editProduct(product)">
                      <IconEdit class="w-4 h-4" />
                    </button>
                    <button class="btn btn-ghost btn-xs text-error" @click="deleteProduct(product)">
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
      <div class="modal-box max-w-lg">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-4">{{ editingId ? 'Edit Produk' : 'Tambah Produk' }}</h3>

        <form @submit.prevent="saveProduct" class="space-y-3">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Produk</legend>
            <input v-model="form.name" type="text" class="input w-full" required placeholder="Nasi Goreng Special" />
          </fieldset>

          <div class="grid grid-cols-2 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Kategori</legend>
              <select v-model="form.categoryId" class="select w-full" required>
                <option value="" disabled>Pilih kategori</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">SKU</legend>
              <input v-model="form.sku" type="text" class="input w-full" placeholder="MKN-001" />
            </fieldset>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Harga Jual</legend>
              <input v-model.number="form.price" type="number" class="input w-full" min="0" required />
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">HPP (Harga Pokok)</legend>
              <input v-model.number="form.cost" type="number" class="input w-full" min="0" />
            </fieldset>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Deskripsi</legend>
            <textarea v-model="form.description" class="textarea w-full" rows="2" placeholder="Deskripsi produk"></textarea>
          </fieldset>

          <div class="grid grid-cols-2 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Kelola Stok</legend>
              <label class="label cursor-pointer justify-start gap-2">
                <input v-model="form.trackStock" type="checkbox" class="checkbox checkbox-sm" />
                <span class="text-sm">Aktifkan stok</span>
              </label>
            </fieldset>

            <fieldset v-if="form.trackStock" class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Jumlah Stok</legend>
              <input v-model.number="form.stock" type="number" class="input w-full" min="0" />
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
import { IconPlus, IconPackage, IconEdit, IconTrash, IconX } from '@tabler/icons-vue'
import type { Product, Category } from '~/types'

const { formatCurrency } = useFormatCurrency()

const categoryFilter = ref('')
const searchQuery = ref('')

const { data: categories } = useFetch<Category[]>('/api/categories')
const { data: products, refresh } = useFetch<Product[]>('/api/products', {
  query: computed(() => ({
    categoryId: categoryFilter.value || undefined,
    search: searchQuery.value || undefined,
    active: 'all',
  })),
})

// Form
const showModal = ref(false)
const editingId = ref('')
const saving = ref(false)

const emptyForm = () => ({
  name: '',
  sku: '',
  description: '',
  price: 0,
  cost: 0,
  categoryId: '',
  trackStock: false,
  stock: 0,
})

const form = ref(emptyForm())

function openCreateModal() {
  editingId.value = ''
  form.value = emptyForm()
  showModal.value = true
}

function editProduct(product: Product) {
  editingId.value = product.id
  form.value = {
    name: product.name,
    sku: product.sku || '',
    description: product.description || '',
    price: Number(product.price),
    cost: Number(product.cost),
    categoryId: product.categoryId,
    trackStock: product.trackStock,
    stock: product.stock,
  }
  showModal.value = true
}

async function saveProduct() {
  saving.value = true
  try {
    if (editingId.value) {
      await $fetch(`/api/products/${editingId.value}`, { method: 'PUT', body: form.value })
    } else {
      await $fetch('/api/products', { method: 'POST', body: form.value })
    }
    showModal.value = false
    refresh()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal menyimpan produk')
  } finally {
    saving.value = false
  }
}

async function deleteProduct(product: Product) {
  if (!confirm(`Hapus produk "${product.name}"?`)) return
  await $fetch(`/api/products/${product.id}`, { method: 'DELETE' })
  refresh()
}
</script>
