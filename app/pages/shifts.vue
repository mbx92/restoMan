<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold">Shift Kasir</h2>
        <p class="text-base-content/60 text-sm mt-0.5">Kelola shift kasir dan cash register</p>
      </div>
      <button v-if="!currentShift" class="btn btn-primary btn-sm" @click="showOpenModal = true">
        <IconPlus class="w-4 h-4" /> Buka Shift
      </button>
    </div>

    <!-- Current Open Shift Banner -->
    <div v-if="currentShift" class="card bg-success/10 border border-success/30 mb-6">
      <div class="card-body py-4 flex-row items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="bg-success/20 rounded-full p-3">
            <IconCashRegister class="w-6 h-6 text-success" />
          </div>
          <div>
            <p class="font-semibold">Shift Aktif: {{ currentShift.shiftNumber }}</p>
            <p class="text-sm text-base-content/60">
              Dibuka {{ formatDate(currentShift.openedAt) }} &middot;
              Modal: Rp {{ formatCurrency(currentShift.openingAmount) }} &middot;
              {{ currentShift.orderCount || 0 }} order &middot;
              Penjualan: Rp {{ formatCurrency(currentShift.totalSales || 0) }}
            </p>
          </div>
        </div>
        <button class="btn btn-warning btn-sm" @click="openCloseModal(currentShift)">
          <IconLock class="w-4 h-4" /> Tutup Shift
        </button>
      </div>
    </div>

    <!-- Shifts Table -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>No. Shift</th>
                <th>Kasir</th>
                <th>Dibuka</th>
                <th>Ditutup</th>
                <th class="text-right">Modal</th>
                <th class="text-right">Expected</th>
                <th class="text-right">Aktual</th>
                <th class="text-right">Selisih</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingList" class="text-center">
                <td colspan="9"><span class="loading loading-spinner loading-sm"></span></td>
              </tr>
              <tr v-else-if="!shifts.length">
                <td colspan="9" class="text-center text-base-content/50 py-10">
                  <IconCashRegister class="w-10 h-10 mx-auto mb-2 opacity-30" />
                  Belum ada data shift
                </td>
              </tr>
              <tr v-for="shift in shifts" :key="shift.id">
                <td class="font-mono text-sm">{{ shift.shiftNumber }}</td>
                <td>{{ shift.user?.name || '-' }}</td>
                <td class="text-sm">{{ formatDate(shift.openedAt) }}</td>
                <td class="text-sm">{{ shift.closedAt ? formatDate(shift.closedAt) : '-' }}</td>
                <td class="text-right font-mono text-sm">Rp {{ formatCurrency(shift.openingAmount) }}</td>
                <td class="text-right font-mono text-sm">{{ shift.expectedAmount != null ? `Rp ${formatCurrency(shift.expectedAmount)}` : '-' }}</td>
                <td class="text-right font-mono text-sm">{{ shift.closingAmount != null ? `Rp ${formatCurrency(shift.closingAmount)}` : '-' }}</td>
                <td class="text-right font-mono text-sm">
                  <span v-if="shift.difference != null" :class="shift.difference >= 0 ? 'text-success' : 'text-error'">
                    {{ shift.difference >= 0 ? '+' : '' }}Rp {{ formatCurrency(shift.difference) }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td>
                  <span v-if="shift.status === 'OPEN'" class="badge badge-soft badge-success badge-sm">Aktif</span>
                  <span v-else class="badge badge-soft badge-neutral badge-sm">Ditutup</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Open Shift Modal -->
    <dialog ref="openModalRef" class="modal" :class="{ 'modal-open': showOpenModal }">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showOpenModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-4">Buka Shift Baru</h3>
        <form @submit.prevent="openShift">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Modal Awal (Rp)</legend>
            <input type="number" class="input input-bordered w-full" v-model.number="openForm.openingAmount" min="0" required />
          </fieldset>
          <fieldset class="fieldset mt-3">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Catatan (opsional)</legend>
            <textarea class="textarea textarea-bordered w-full" v-model="openForm.notes" rows="2"></textarea>
          </fieldset>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost btn-sm" @click="showOpenModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="openingShift">
              {{ openingShift ? 'Membuka...' : 'Buka Shift' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showOpenModal = false"><button>close</button></form>
    </dialog>

    <!-- Close Shift Modal -->
    <dialog ref="closeModalRef" class="modal" :class="{ 'modal-open': showCloseModal }">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showCloseModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-4">Tutup Shift</h3>
        <p class="text-sm text-base-content/60 mb-2">
          Shift: <strong>{{ closingShiftData?.shiftNumber }}</strong>
        </p>

        <div v-if="closingShiftData?.expectedAmount != null" class="bg-base-200/50 p-3 rounded-lg flex flex-col gap-1 mb-4 text-sm">
          <div class="flex justify-between">
            <span class="text-base-content/60">Modal Awal</span>
            <span class="font-medium">Rp {{ formatCurrency(closingShiftData.openingAmount) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Total Penjualan Tunai</span>
            <span class="font-medium text-success">+ Rp {{ formatCurrency(closingShiftData.totalCashSales || 0) }}</span>
          </div>
          <div class="flex justify-between border-t border-base-300 pt-1 mt-1 font-bold">
            <span>Ekspektasi Kas Laci</span>
            <span class="text-primary">Rp {{ formatCurrency(closingShiftData.expectedAmount) }}</span>
          </div>
        </div>
        <form @submit.prevent="closeShift">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Jumlah Kas Aktual (Rp)</legend>
            <input type="number" class="input input-bordered w-full" v-model.number="closeForm.closingAmount" min="0" required />
          </fieldset>
          <fieldset class="fieldset mt-3">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Catatan (opsional)</legend>
            <textarea class="textarea textarea-bordered w-full" v-model="closeForm.notes" rows="2"></textarea>
          </fieldset>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost btn-sm" @click="showCloseModal = false">Batal</button>
            <button type="submit" class="btn btn-warning btn-sm" :disabled="closingShift">
              {{ closingShift ? 'Menutup...' : 'Tutup Shift' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showCloseModal = false"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import type { CashRegisterShift } from '~/types'
import {
  IconPlus, IconX, IconCashRegister, IconLock,
} from '@tabler/icons-vue'

const { formatCurrency } = useFormatCurrency()

const loadingList = ref(true)
const shifts = ref<CashRegisterShift[]>([])
const currentShift = ref<CashRegisterShift | null>(null)

// Open shift
const showOpenModal = ref(false)
const openingShift = ref(false)
const openForm = reactive({ openingAmount: 0, notes: '' })

// Close shift
const showCloseModal = ref(false)
const closingShift = ref(false)
const closingShiftData = ref<CashRegisterShift | null>(null)
const closeForm = reactive({ closingAmount: 0, notes: '' })

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

async function fetchShifts() {
  loadingList.value = true
  try {
    const [list, current] = await Promise.all([
      $fetch<CashRegisterShift[]>('/api/shifts'),
      $fetch<CashRegisterShift | null>('/api/shifts/current').catch(() => null),
    ])
    shifts.value = list
    currentShift.value = current
  } finally {
    loadingList.value = false
  }
}

async function openShift() {
  openingShift.value = true
  try {
    await $fetch('/api/shifts', {
      method: 'POST',
      body: { openingAmount: openForm.openingAmount, notes: openForm.notes },
    })
    showOpenModal.value = false
    openForm.openingAmount = 0
    openForm.notes = ''
    await fetchShifts()
  } finally {
    openingShift.value = false
  }
}

function openCloseModal(shift: CashRegisterShift) {
  closingShiftData.value = shift
  closeForm.closingAmount = 0
  closeForm.notes = ''
  showCloseModal.value = true
}

async function closeShift() {
  if (!closingShiftData.value) return
  closingShift.value = true
  try {
    await $fetch(`/api/shifts/${closingShiftData.value.id}`, {
      method: 'PUT',
      body: { closingAmount: closeForm.closingAmount, notes: closeForm.notes },
    })
    showCloseModal.value = false
    closingShiftData.value = null
    await fetchShifts()
  } finally {
    closingShift.value = false
  }
}

onMounted(() => fetchShifts())
</script>
