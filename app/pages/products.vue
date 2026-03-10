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

    <!-- Filters & View Toggle -->
    <div class="flex flex-col sm:flex-row justify-between gap-2 mb-4">
      <div class="flex gap-2">
        <select v-model="categoryFilter" class="select select-sm">
          <option value="">Semua Kategori</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <input v-model="searchQuery" type="text" placeholder="Cari produk..." class="input input-sm w-48" />
      </div>
      <div class="join">
        <button class="join-item btn btn-sm" :class="viewMode === 'list' ? 'btn-active' : ''" @click="viewMode = 'list'" title="List View"><IconList class="w-4 h-4" /></button>
        <button class="join-item btn btn-sm" :class="viewMode === 'grid' ? 'btn-active' : ''" @click="viewMode = 'grid'" title="Grid View"><IconLayoutGrid class="w-4 h-4" /></button>
      </div>
    </div>

    <!-- Products Table -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <div v-if="!products?.length" class="p-10 text-center">
          <IconPackage class="w-12 h-12 text-base-content/15 mx-auto mb-3" />
          <p class="text-sm text-base-content/50">Belum ada produk</p>
          <button class="btn btn-primary btn-sm mt-3" @click="openCreateModal">Tambah Produk Pertama</button>
        </div>

        <!-- Grid View -->
        <div v-if="viewMode === 'grid'" class="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <div v-for="product in paginatedProducts" :key="product.id" class="card bg-base-100 border border-base-300">
            <div class="card-body p-4 gap-1">
              <div class="flex justify-between items-start gap-2">
                <p class="font-bold text-sm line-clamp-2 leading-tight">{{ product.name }}</p>
                <div class="dropdown dropdown-end">
                  <div tabindex="0" role="button" class="btn btn-ghost btn-xs btn-square"><IconDotsVertical class="w-4 h-4" /></div>
                  <ul tabindex="0" class="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-32 border border-base-200">
                    <li><a @click="editProduct(product)"><IconEdit class="w-4 h-4" /> Edit</a></li>
                    <li><a @click="openVariantModal(product)"><IconList class="w-4 h-4" /> Varian</a></li>
                    <li><a class="text-error" @click="deleteProduct(product)"><IconTrash class="w-4 h-4" /> Hapus</a></li>
                  </ul>
                </div>
              </div>
              <p class="text-xs text-base-content/50">{{ product.category?.name || '—' }}</p>
              <p class="text-xs font-mono text-base-content/40 mb-2">{{ product.sku }}</p>
              
              <div class="mt-auto pt-2 border-t border-base-200 flex justify-between items-end">
                <div>
                  <p class="font-bold text-primary text-sm">Rp {{ formatCurrency(product.price) }}</p>
                  <p v-if="product.trackStock" class="text-xs mt-0.5" :class="product.stock <= 5 ? 'text-error font-medium' : 'text-base-content/50'">Stok: {{ product.stock }}</p>
                </div>
                <input type="checkbox" class="toggle toggle-success toggle-sm" :checked="product.isActive" @change="toggleStatus(product)" />
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
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
              <tr v-for="product in paginatedProducts" :key="product.id">
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
                  <input type="checkbox" class="toggle toggle-success toggle-sm" 
                         :checked="product.isActive"
                         @change="toggleStatus(product)" />
                </td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-xs" @click="editProduct(product)" title="Edit">
                      <IconEdit class="w-4 h-4" />
                    </button>
                    <button class="btn btn-ghost btn-xs" @click="openVariantModal(product)" title="Variant">
                      <IconList class="w-4 h-4" />
                    </button>
                    <button class="btn btn-ghost btn-xs text-error" @click="deleteProduct(product)" title="Hapus">
                      <IconTrash class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center p-4 border-t border-base-300">
          <div class="join">
            <button class="join-item btn btn-sm" :disabled="currentPage === 1" @click="currentPage--">«</button>
            <button class="join-item btn btn-sm">Hal {{ currentPage }} / {{ totalPages }}</button>
            <button class="join-item btn btn-sm" :disabled="currentPage === totalPages" @click="currentPage++">»</button>
          </div>
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

    <!-- Variant Editor Modal -->
    <dialog class="modal" :class="{ 'modal-open': showVariantModal }">
      <div class="modal-box max-w-lg">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showVariantModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-1">Variant — {{ variantProductName }}</h3>
        <p class="text-sm text-base-content/60 mb-4">Kelola opsi variant (ukuran, topping, dll.)</p>

        <div class="space-y-4">
          <div v-for="(group, gi) in variantGroups" :key="gi" class="border border-base-300 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-2">
              <input v-model="group.name" type="text" class="input input-sm flex-1" placeholder="Nama group (e.g. Ukuran)" />
              <label class="flex items-center gap-1 text-xs">
                <input type="checkbox" v-model="group.required" class="checkbox checkbox-xs" /> Wajib
              </label>
              <label class="flex items-center gap-1 text-xs">
                <input type="checkbox" v-model="group.multiple" class="checkbox checkbox-xs" /> Multi
              </label>
              <button class="btn btn-ghost btn-xs text-error" @click="variantGroups.splice(gi, 1)">
                <IconTrash class="w-3 h-3" />
              </button>
            </div>
            <div class="space-y-1">
              <div v-for="(opt, oi) in group.options" :key="oi" class="flex items-center gap-2">
                <input v-model="opt.name" type="text" class="input input-xs flex-1" placeholder="Opsi (e.g. Large)" />
                <input v-model.number="opt.additionalPrice" type="number" class="input input-xs w-24" placeholder="+ Harga" />
                <button class="btn btn-ghost btn-xs text-error" @click="group.options.splice(oi, 1)">
                  <IconX class="w-3 h-3" />
                </button>
              </div>
              <button class="btn btn-ghost btn-xs" @click="group.options.push({ name: '', additionalPrice: 0, isActive: true, sortOrder: group.options.length })">
                <IconPlus class="w-3 h-3" /> Tambah Opsi
              </button>
            </div>
          </div>

          <button class="btn btn-outline btn-sm w-full" @click="variantGroups.push({ name: '', required: false, multiple: false, sortOrder: variantGroups.length, options: [] })">
            <IconPlus class="w-4 h-4" /> Tambah Group
          </button>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <button class="btn btn-ghost btn-sm" @click="showVariantModal = false">Batal</button>
          <button class="btn btn-primary btn-sm" :disabled="savingVariant" @click="saveVariants">
            <span v-if="savingVariant" class="loading loading-spinner loading-xs"></span>
            Simpan Variant
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showVariantModal = false"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { IconPlus, IconPackage, IconEdit, IconTrash, IconX, IconList, IconLayoutGrid, IconDotsVertical } from '@tabler/icons-vue'
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

// View Mode & Pagination
const viewMode = ref<'list'|'grid'>('list')
const currentPage = ref(1)
const itemsPerPage = 12

const totalPages = computed(() => {
  return Math.max(1, Math.ceil((products.value?.length || 0) / itemsPerPage))
})

const paginatedProducts = computed(() => {
  if (!products.value) return []
  const start = (currentPage.value - 1) * itemsPerPage
  return products.value.slice(start, start + itemsPerPage)
})

watch([categoryFilter, searchQuery], () => {
  currentPage.value = 1
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

async function toggleStatus(product: Product) {
  const newStatus = !product.isActive
  product.isActive = newStatus
  try {
    await $fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      body: { isActive: newStatus },
    })
  } catch (err: any) {
    product.isActive = !newStatus
    alert('Gagal mengubah status')
  }
}

// Variant management
const showVariantModal = ref(false)
const savingVariant = ref(false)
const variantProductId = ref('')
const variantProductName = ref('')
const variantGroups = ref<any[]>([])

async function openVariantModal(product: Product) {
  variantProductId.value = product.id
  variantProductName.value = product.name
  try {
    const groups = await $fetch<any[]>(`/api/products/${product.id}/variants`)
    variantGroups.value = groups.map(g => ({
      name: g.name,
      required: g.required,
      multiple: g.multiple,
      sortOrder: g.sortOrder,
      options: g.options.map((o: any) => ({
        name: o.name,
        additionalPrice: Number(o.additionalPrice),
        isActive: o.isActive,
        sortOrder: o.sortOrder,
      })),
    }))
  } catch {
    variantGroups.value = []
  }
  showVariantModal.value = true
}

async function saveVariants() {
  savingVariant.value = true
  try {
    await $fetch(`/api/products/${variantProductId.value}/variants`, {
      method: 'POST',
      body: { groups: variantGroups.value },
    })
    showVariantModal.value = false
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal menyimpan variant')
  } finally {
    savingVariant.value = false
  }
}
</script>
