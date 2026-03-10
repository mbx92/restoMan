<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Inventori</h1>
        <p class="text-sm text-base-content/50 mt-1">Kelola stok produk</p>
      </div>
      <div class="mt-3 sm:mt-0 flex gap-2">
        <button class="btn btn-sm" :class="showLowStock ? 'btn-warning' : 'btn-ghost'" @click="showLowStock = !showLowStock">
          <IconAlertTriangle class="w-4 h-4" /> Stok Rendah
        </button>
        <button class="btn btn-primary btn-sm" @click="openAdjustModal()">
          <IconAdjustments class="w-4 h-4" /> Penyesuaian Stok
        </button>
      </div>
    </div>

    <!-- Stock Table -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <div v-if="!products?.length" class="p-10 text-center">
          <IconPackageImport class="w-12 h-12 text-base-content/15 mx-auto mb-3" />
          <p class="text-sm text-base-content/50">Belum ada produk dengan stok aktif</p>
          <p class="text-xs text-base-content/30 mt-1">Aktifkan "Kelola Stok" pada produk terlebih dahulu</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>SKU</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Harga</th>
                <th>HPP</th>
                <th>Nilai Stok</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in products" :key="p.id" :class="{ 'bg-error/5': p.stock <= 5 }">
                <td class="font-medium">{{ p.name }}</td>
                <td class="text-sm font-mono text-base-content/60">{{ p.sku || '—' }}</td>
                <td class="text-sm">{{ p.category?.name }}</td>
                <td>
                  <span class="font-bold text-lg" :class="p.stock <= 5 ? 'text-error' : p.stock <= 10 ? 'text-warning' : 'text-success'">
                    {{ p.stock }}
                  </span>
                </td>
                <td class="text-sm">Rp {{ formatCurrency(p.price) }}</td>
                <td class="text-sm text-base-content/60">Rp {{ formatCurrency(p.cost) }}</td>
                <td class="text-sm font-medium">Rp {{ formatCurrency(Number(p.cost) * p.stock) }}</td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-xs btn-success" @click="openAdjustModal(p)" title="Tambah Stok">
                      <IconPlus class="w-4 h-4" />
                    </button>
                    <button class="btn btn-ghost btn-xs btn-error" @click="openAdjustModal(p, 'OUT')" title="Kurangi Stok">
                      <IconMinus class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Stock Adjustment Modal -->
    <dialog class="modal" :class="{ 'modal-open': showAdjustModal }">
      <div class="modal-box max-w-sm">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showAdjustModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-4">Penyesuaian Stok</h3>

        <form @submit.prevent="submitAdjustment" class="space-y-3">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Produk</legend>
            <select v-model="adjForm.productId" class="select w-full" required>
              <option value="">Pilih produk</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} (Stok: {{ p.stock }})</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tipe</legend>
            <select v-model="adjForm.type" class="select w-full" required>
              <option value="IN">Masuk (IN)</option>
              <option value="OUT">Keluar (OUT)</option>
              <option value="ADJUSTMENT">Set Stok Manual</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Jumlah</legend>
            <input v-model.number="adjForm.quantity" type="number" class="input w-full" min="0" required />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Alasan (opsional)</legend>
            <input v-model="adjForm.reason" type="text" class="input w-full" placeholder="Restock, rusak, expired..." />
          </fieldset>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn btn-ghost btn-sm" @click="showAdjustModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              Simpan
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showAdjustModal = false"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import {
  IconAlertTriangle, IconAdjustments, IconPackageImport, IconPlus, IconMinus, IconX,
} from '@tabler/icons-vue'

const { formatCurrency } = useFormatCurrency()

const showLowStock = ref(false)
const showAdjustModal = ref(false)
const saving = ref(false)

const { data: products, refresh } = useFetch<any[]>('/api/inventory', {
  query: computed(() => ({
    lowStock: showLowStock.value ? 'true' : undefined,
  })),
})

const adjForm = ref({
  productId: '',
  type: 'IN',
  quantity: 0,
  reason: '',
})

function openAdjustModal(product?: any, type?: string) {
  adjForm.value = {
    productId: product?.id || '',
    type: type || 'IN',
    quantity: 0,
    reason: '',
  }
  showAdjustModal.value = true
}

async function submitAdjustment() {
  saving.value = true
  try {
    await $fetch('/api/inventory', { method: 'POST', body: adjForm.value })
    showAdjustModal.value = false
    refresh()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal menyimpan penyesuaian')
  } finally {
    saving.value = false
  }
}
</script>
