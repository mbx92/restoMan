<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Tenant</h1>
        <p class="text-sm text-base-content/50 mt-1">Kelola informasi tenant dan lokasi</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else class="grid gap-6">
      <!-- Tenant Info Card -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base"><IconBuilding class="w-5 h-5" /> Informasi Tenant</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Tenant</legend>
              <input v-model="tenantName" type="text" class="input w-full" placeholder="Nama bisnis" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Slug</legend>
              <input :value="tenant?.slug" type="text" class="input w-full" disabled />
            </fieldset>
          </div>
          <div class="flex justify-end mt-2">
            <button class="btn btn-primary btn-sm" :disabled="savingTenant" @click="saveTenant">
              <span v-if="savingTenant" class="loading loading-spinner loading-xs"></span>
              Simpan
            </button>
          </div>
        </div>
      </div>

      <!-- Locations Card -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <h3 class="card-title text-base"><IconMapPin class="w-5 h-5" /> Lokasi</h3>
            <button class="btn btn-primary btn-sm" @click="showLocModal = true">
              <IconPlus class="w-4 h-4" /> Tambah Lokasi
            </button>
          </div>

          <div v-if="!tenant?.locations?.length" class="py-6 text-center text-base-content/50 text-sm">
            Belum ada lokasi
          </div>

          <div v-else class="overflow-x-auto mt-2">
            <table class="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Alamat</th>
                  <th>Telepon</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="loc in tenant.locations" :key="loc.id">
                  <td class="font-medium">{{ loc.name }}</td>
                  <td class="text-sm text-base-content/60">{{ loc.address || '—' }}</td>
                  <td class="text-sm text-base-content/60">{{ loc.phone || '—' }}</td>
                  <td>
                    <span class="badge badge-sm" :class="loc.isActive ? 'badge-soft badge-success' : 'badge-soft badge-error'">
                      {{ loc.isActive ? 'Aktif' : 'Nonaktif' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Location Modal -->
    <dialog class="modal" :class="{ 'modal-open': showLocModal }">
      <div class="modal-box max-w-sm">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showLocModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-4">Tambah Lokasi</h3>

        <form @submit.prevent="createLocation" class="space-y-3">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Lokasi</legend>
            <input v-model="locForm.name" type="text" class="input w-full" required placeholder="Cabang Utama" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Alamat</legend>
            <input v-model="locForm.address" type="text" class="input w-full" placeholder="Jl. Contoh No. 1" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Telepon</legend>
            <input v-model="locForm.phone" type="text" class="input w-full" placeholder="021-1234567" />
          </fieldset>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn btn-ghost btn-sm" @click="showLocModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="savingLoc">
              <span v-if="savingLoc" class="loading loading-spinner loading-xs"></span>
              Tambah
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showLocModal = false"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { IconBuilding, IconMapPin, IconPlus, IconX } from '@tabler/icons-vue'

const loading = ref(true)
const tenant = ref<any>(null)
const tenantName = ref('')
const savingTenant = ref(false)

const showLocModal = ref(false)
const savingLoc = ref(false)
const locForm = ref({ name: '', address: '', phone: '' })

async function fetchTenant() {
  loading.value = true
  try {
    tenant.value = await $fetch<any>('/api/tenant')
    tenantName.value = tenant.value?.name || ''
  } finally {
    loading.value = false
  }
}

async function saveTenant() {
  savingTenant.value = true
  try {
    await $fetch('/api/tenant', { method: 'PUT', body: { name: tenantName.value } })
    await fetchTenant()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal menyimpan')
  } finally {
    savingTenant.value = false
  }
}

async function createLocation() {
  savingLoc.value = true
  try {
    await $fetch('/api/tenant/locations', { method: 'POST', body: locForm.value })
    showLocModal.value = false
    locForm.value = { name: '', address: '', phone: '' }
    await fetchTenant()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal menambah lokasi')
  } finally {
    savingLoc.value = false
  }
}

onMounted(() => fetchTenant())
</script>
