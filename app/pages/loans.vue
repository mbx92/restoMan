<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Hutang</h1>
        <p class="text-sm text-base-content/50 mt-1">Kelola hutang dan piutang kamu</p>
      </div>
      <div class="mt-3 sm:mt-0">
        <button class="btn btn-primary btn-sm" @click="showModal = true">
          <IconPlus class="w-4 h-4" /> Tambah Hutang/Piutang
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Total Hutang</p>
          <p class="text-xl font-bold font-mono mt-1 text-error">Rp {{ formatCurrency(totalPayable) }}</p>
        </div>
      </div>
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Total Piutang</p>
          <p class="text-xl font-bold font-mono mt-1 text-success">Rp {{ formatCurrency(totalReceivable) }}</p>
        </div>
      </div>
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/40">Sisa Belum Lunas</p>
          <p class="text-xl font-bold font-mono mt-1">Rp {{ formatCurrency(totalRemaining) }}</p>
        </div>
      </div>
    </div>

    <!-- Debt Table -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table" v-if="debts.length > 0">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Tipe</th>
                <th>Pihak Terkait</th>
                <th class="text-right">Total</th>
                <th class="text-right">Terbayar</th>
                <th class="text-right">Sisa</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="debt in debts" :key="debt.id" class="hover:bg-base-200/50 cursor-pointer" @click="openEdit(debt)">
                <td>
                  <p class="font-medium">{{ debt.name }}</p>
                  <p v-if="debt.notes" class="text-xs text-base-content/40">{{ debt.notes }}</p>
                </td>
                <td>
                  <span class="badge badge-soft badge-sm" :class="debt.type === 'PAYABLE' ? 'badge-error' : 'badge-success'">
                    {{ debt.type === 'PAYABLE' ? 'Hutang' : 'Piutang' }}
                  </span>
                </td>
                <td class="text-base-content/60">{{ debt.counterparty || '-' }}</td>
                <td class="text-right font-mono">Rp {{ formatCurrency(Number(debt.totalAmount)) }}</td>
                <td class="text-right font-mono">Rp {{ formatCurrency(Number(debt.paidAmount)) }}</td>
                <td class="text-right font-mono font-medium">Rp {{ formatCurrency(Number(debt.totalAmount) - Number(debt.paidAmount)) }}</td>
                <td class="text-base-content/60">{{ debt.dueDate ? formatDate(debt.dueDate) : '-' }}</td>
                <td>
                  <span class="badge badge-soft badge-sm" :class="Number(debt.paidAmount) >= Number(debt.totalAmount) ? 'badge-success' : 'badge-warning'">
                    {{ Number(debt.paidAmount) >= Number(debt.totalAmount) ? 'Lunas' : 'Belum Lunas' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <!-- Empty State -->
          <div v-else class="py-12 text-center">
            <div class="flex flex-col items-center text-base-content/30">
              <IconFileInvoice class="w-10 h-10 mb-3" />
              <p class="font-medium text-base-content/60">Belum ada hutang/piutang</p>
              <p class="text-sm text-base-content/40 mt-1">Tambahkan data hutang atau piutang</p>
              <button class="btn btn-primary btn-sm mt-4" @click="showModal = true">
                <IconPlus class="w-4 h-4" /> Tambah
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <dialog v-if="showEditModal" class="modal modal-open">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showEditModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-1">Edit Hutang/Piutang</h3>
        <p class="text-sm text-base-content/50 mb-5">Ubah detail hutang atau piutang</p>

        <form @submit.prevent="updateDebt" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama</legend>
            <input v-model="editForm.name" type="text" class="input w-full" required />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tipe</legend>
            <select v-model="editForm.type" class="select w-full">
              <option value="PAYABLE">Hutang (Saya berhutang)</option>
              <option value="RECEIVABLE">Piutang (Orang berhutang ke saya)</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Total (Rp)</legend>
            <label class="input w-full">
              <span class="text-base-content/40 text-sm">Rp</span>
              <CurrencyInput v-model="editForm.totalAmount" />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Terbayar (Rp)</legend>
            <label class="input w-full">
              <span class="text-base-content/40 text-sm">Rp</span>
              <CurrencyInput v-model="editForm.paidAmount" />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Pihak Terkait</legend>
            <input v-model="editForm.counterparty" type="text" class="input w-full" placeholder="Nama orang/perusahaan" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Catatan</legend>
            <input v-model="editForm.notes" type="text" class="input w-full" placeholder="Catatan opsional" />
          </fieldset>

          <div class="flex gap-3">
            <fieldset class="fieldset flex-1">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Jatuh Tempo (Mulai Pembayaran Pertama)</legend>
              <input v-model="editForm.dueDate" type="date" class="input w-full" />
            </fieldset>

            <fieldset class="fieldset flex-1">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tenor (Bulan)</legend>
              <input v-model="editForm.durationMonths" type="number" class="input w-full" disabled />
              <p class="text-xs text-base-content/50 mt-1">Hanya info (tidak bisa diubah)</p>
            </fieldset>
            
            <fieldset class="fieldset flex-1">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Bunga/Thn (%)</legend>
              <input v-model="editForm.interestRate" type="number" step="0.01" class="input w-full" disabled />
            </fieldset>
          </div>

          <fieldset class="fieldset" v-if="editingDebt && editingDebt.installments && editingDebt.installments.length > 0">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide border-b border-base-200 pb-2 mb-2 w-full">Jadwal Cicilan</legend>
            <div class="border border-base-300 rounded bg-base-100 overflow-hidden max-h-60 overflow-y-auto">
              <table class="table table-xs table-pin-rows">
                <thead class="bg-base-200">
                  <tr>
                    <th>Bln</th>
                    <th>Jatuh Tempo</th>
                    <th class="text-right">Nominal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="inst in editingDebt.installments" :key="inst.id">
                    <td class="font-mono text-center">{{ inst.sequence }}</td>
                    <td class="whitespace-nowrap">{{ formatDate(inst.dueDate) }}</td>
                    <td class="text-right font-mono whitespace-nowrap">Rp {{ formatCurrency(Number(inst.amount)) }}</td>
                    <td class="text-center">
                      <span v-if="inst.isPaid" class="badge badge-success badge-sm whitespace-nowrap">Lunas</span>
                      <button v-else type="button" class="btn btn-xs btn-outline btn-primary shrink-0" @click.prevent="payInstallment(inst.id)" :disabled="isPaying === inst.id">
                        <span v-if="isPaying === inst.id" class="loading loading-spinner w-3 h-3"></span>
                        <span v-else>Bayar</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </fieldset>

          <div class="flex items-center justify-between pt-2">
            <button type="button" class="btn btn-error btn-outline btn-sm" @click="deleteDebt">Hapus</button>
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

    <!-- Add Modal -->
    <dialog v-if="showModal" class="modal modal-open">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-1">Tambah Hutang/Piutang</h3>
        <p class="text-sm text-base-content/50 mb-5">Catat hutang atau piutang baru</p>

        <form @submit.prevent="addDebt" class="space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama</legend>
            <input v-model="form.name" type="text" class="input w-full" placeholder="Contoh: Pinjaman motor" required />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tipe</legend>
            <select v-model="form.type" class="select w-full">
              <option value="PAYABLE">Hutang (Saya berhutang)</option>
              <option value="RECEIVABLE">Piutang (Orang berhutang ke saya)</option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Total (Rp)</legend>
            <label class="input w-full">
              <span class="text-base-content/40 text-sm">Rp</span>
              <CurrencyInput v-model="form.totalAmount" />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Sudah Terbayar (Rp)</legend>
            <label class="input w-full">
              <span class="text-base-content/40 text-sm">Rp</span>
              <CurrencyInput v-model="form.paidAmount" />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Pihak Terkait</legend>
            <input v-model="form.counterparty" type="text" class="input w-full" placeholder="Nama orang/perusahaan" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Catatan</legend>
            <input v-model="form.notes" type="text" class="input w-full" placeholder="Catatan opsional" />
          </fieldset>

          <div class="flex gap-3">
            <fieldset class="fieldset flex-1">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Jatuh Tempo / Mulai Pembayaran</legend>
              <input v-model="form.dueDate" type="date" class="input w-full" />
              <p class="text-xs text-base-content/50 mt-1">Estimasi tanggal lunas atau pembayaran pertama</p>
            </fieldset>

            <fieldset class="fieldset flex-1">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tenor (Opsional)</legend>
              <input v-model="form.durationMonths" type="number" class="input w-full" placeholder="Bulan (mis: 12)" />
              <p class="text-xs text-base-content/50 mt-1">Isi jika butuh cicilan bulanan</p>
            </fieldset>
            
            <fieldset class="fieldset flex-1">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Bunga/Thn (%)</legend>
              <input v-model="form.interestRate" type="number" step="0.01" class="input w-full" placeholder="Mis: 10" />
              <p class="text-xs text-base-content/50 mt-1">Opsional: Bunga Flat (Tetap) per Tahun</p>
            </fieldset>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn btn-ghost btn-sm" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm">Simpan</button>
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
import { IconPlus, IconX, IconFileInvoice } from '@tabler/icons-vue'
import type { Debt } from '~/types'

const { formatCurrency } = useFormatCurrency()

const showModal = ref(false)
const showEditModal = ref(false)
const editingId = ref<string | null>(null)
const editingDebt = ref<Debt | null>(null)
const isPaying = ref<string | null>(null)

const form = reactive({
  name: '',
  type: 'PAYABLE',
  totalAmount: 0,
  paidAmount: 0,
  counterparty: '',
  notes: '',
  dueDate: '',
  durationMonths: null as number | null,
  interestRate: null as number | null,
})

const editForm = reactive({
  name: '',
  type: 'PAYABLE',
  totalAmount: 0,
  paidAmount: 0,
  counterparty: '',
  notes: '',
  dueDate: '',
  durationMonths: null as number | null,
  interestRate: null as number | null,
})

const { data: debtsData, refresh } = await useFetch<Debt[]>('/api/debts')
const debts = computed(() => debtsData.value || [])

const totalPayable = computed(() =>
  debts.value.filter((d) => d.type === 'PAYABLE').reduce((sum, d) => sum + (Number(d.totalAmount) - Number(d.paidAmount)), 0)
)
const totalReceivable = computed(() =>
  debts.value.filter((d) => d.type === 'RECEIVABLE').reduce((sum, d) => sum + (Number(d.totalAmount) - Number(d.paidAmount)), 0)
)
const totalRemaining = computed(() =>
  debts.value.reduce((sum, d) => sum + (Number(d.totalAmount) - Number(d.paidAmount)), 0)
)

function openEdit(debt: Debt) {
  editingId.value = debt.id
  editingDebt.value = debt
  editForm.name = debt.name
  editForm.type = debt.type
  editForm.totalAmount = Number(debt.totalAmount)
  editForm.paidAmount = Number(debt.paidAmount)
  editForm.counterparty = debt.counterparty || ''
  editForm.notes = debt.notes || ''
  editForm.dueDate = debt.dueDate ? (new Date(debt.dueDate).toISOString().split('T')[0] ?? '') : ''
  editForm.durationMonths = debt.durationMonths || null
  editForm.interestRate = debt.interestRate ? Number(debt.interestRate) : null
  showEditModal.value = true
}

async function addDebt() {
  await $fetch('/api/debts', { method: 'POST', body: form })
  showModal.value = false
  form.name = ''
  form.type = 'PAYABLE'
  form.totalAmount = 0
  form.paidAmount = 0
  form.counterparty = ''
  form.notes = ''
  form.dueDate = ''
  form.durationMonths = null
  form.interestRate = null
  await refresh()
}

async function updateDebt() {
  if (!editingId.value) return
  const updatedDebt = await $fetch<Debt>(`/api/debts/${editingId.value}`, { method: 'PUT', body: editForm })
  showEditModal.value = false
  await refresh()
}

async function deleteDebt() {
  if (!editingId.value) return
  if (!confirm('Yakin ingin menghapus data ini?')) return
  await $fetch(`/api/debts/${editingId.value}`, { method: 'DELETE' })
  showEditModal.value = false
  editingDebt.value = null
  await refresh()
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function payInstallment(installmentId: string) {
  try {
    isPaying.value = installmentId
    await $fetch(`/api/debts/installments/${installmentId}/pay`, { method: 'POST' })
    await refresh()
    // Refresh modal editing state slightly
    const updated = debts.value.find(d => d.id === editingId.value)
    if (updated) {
      editingDebt.value = updated
      editForm.paidAmount = Number(updated.paidAmount)
    }
  } catch (error) {
    console.error('Error paying installment:', error)
    alert('Gagal memproses pembayaran cicilan.')
  } finally {
    isPaying.value = null
  }
}
</script>
