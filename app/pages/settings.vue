<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold">Pengaturan</h2>
        <p class="text-base-content/60 text-sm mt-0.5">Atur konfigurasi lokasi Anda</p>
      </div>
      <button class="btn btn-primary btn-sm" :disabled="!hasChanges || saving" @click="saveSettings">
        <IconDeviceFloppy class="w-4 h-4" />
        {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <div v-else class="grid gap-6">
      <!-- Receipt Info -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base"><IconReceipt2 class="w-5 h-5" /> Informasi Struk</h3>
          <p class="text-sm text-base-content/60">Nama restoran, alamat, dan info yang tampil di struk cetak</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Restoran</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['receipt.name']" placeholder="Nama restoran (kosong = nama tenant)" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">No. Telepon</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['receipt.phone']" placeholder="021-1234567" />
            </fieldset>
            <fieldset class="fieldset md:col-span-2">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Alamat</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['receipt.address']" placeholder="Jl. Contoh No. 1, Kota" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Footer Baris 1</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['receipt.footer1']" placeholder="Terima Kasih!" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Footer Baris 2</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['receipt.footer2']" placeholder="Silakan Datang Kembali" />
            </fieldset>
          </div>
        </div>
      </div>

      <!-- Tax Settings -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base"><IconReceipt2 class="w-5 h-5" /> Pajak (Tax)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Aktifkan Pajak</legend>
              <input type="checkbox" class="toggle toggle-primary" v-model="form['tax.enabled']" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama Pajak</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['tax.name']" :disabled="!form['tax.enabled']" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tarif (%)</legend>
              <input type="number" class="input input-bordered w-full" v-model.number="form['tax.rate']" min="0" max="100" step="0.1" :disabled="!form['tax.enabled']" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Pajak Inklusif</legend>
              <input type="checkbox" class="toggle toggle-primary" v-model="form['tax.inclusive']" :disabled="!form['tax.enabled']" />
            </fieldset>
          </div>
        </div>
      </div>

      <!-- Service Charge -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base"><IconPercentage class="w-5 h-5" /> Service Charge</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Aktifkan Service Charge</legend>
              <input type="checkbox" class="toggle toggle-primary" v-model="form['service.enabled']" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['service.name']" :disabled="!form['service.enabled']" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Tarif (%)</legend>
              <input type="number" class="input input-bordered w-full" v-model.number="form['service.rate']" min="0" max="100" step="0.1" :disabled="!form['service.enabled']" />
            </fieldset>
          </div>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base"><IconCreditCard class="w-5 h-5" /> Metode Pembayaran</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
            <label v-for="pm in allPaymentMethods" :key="pm.value" class="flex items-center gap-2 cursor-pointer p-2 border border-base-300 rounded">
              <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" :value="pm.value"
                v-model="form['payment.methods']" />
              <span class="text-sm">{{ pm.label }}</span>
            </label>
          </div>
          <fieldset class="fieldset mt-3">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Payment Gateway</legend>
            <input type="text" class="input input-bordered w-full max-w-md" v-model="form['payment.gateway']" placeholder="Nama atau kode gateway (opsional)" />
          </fieldset>
        </div>
      </div>

      <!-- Prefix Numbers -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base"><IconHash class="w-5 h-5" /> Prefix Nomor</h3>
          <p class="text-sm text-base-content/60">Prefix untuk penomoran otomatis dokumen</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Order</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['prefix.order']" maxlength="10" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Shift</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['prefix.shift']" maxlength="10" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Split Bill</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['prefix.split']" maxlength="10" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Expense</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['prefix.expense']" maxlength="10" />
            </fieldset>
          </div>
        </div>
      </div>

      <!-- Printer Settings -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <h3 class="card-title text-base"><IconPrinter class="w-5 h-5" /> Printer</h3>
            <button class="btn btn-ghost btn-sm" @click="addPrinter">
              <IconPlus class="w-4 h-4" /> Tambah Printer
            </button>
          </div>

          <div v-if="!printers.length" class="text-center py-6 text-base-content/50">
            <IconPrinter class="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p class="text-sm">Belum ada printer dikonfigurasi</p>
          </div>

          <div v-for="(printer, idx) in printers" :key="printer.id" class="border border-base-300 rounded-lg p-4 mt-3">
            <div class="flex items-center justify-between mb-3">
              <span class="font-semibold text-sm">{{ printer.name || `Printer ${idx + 1}` }}</span>
              <div class="flex items-center gap-2">
                <input type="checkbox" class="toggle toggle-sm toggle-primary" v-model="printer.enabled" />
                <button class="btn btn-ghost btn-xs btn-square text-error" @click="removePrinter(idx)">
                  <IconTrash class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <fieldset class="fieldset">
                <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama</legend>
                <input type="text" class="input input-bordered input-sm w-full" v-model="printer.name" placeholder="Kasir Utama" />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Fungsi</legend>
                <select class="select select-bordered select-sm w-full" v-model="printer.role">
                  <option value="cashier">Kasir (Struk)</option>
                  <option value="kitchen">Dapur</option>
                  <option value="bar">Bar</option>
                </select>
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Koneksi</legend>
                <select class="select select-bordered select-sm w-full" v-model="printer.type">
                  <option value="lan">LAN / Network</option>
                  <option value="usb">USB</option>
                  <option value="bluetooth">Bluetooth</option>
                </select>
              </fieldset>
              <fieldset v-if="printer.type === 'bluetooth'" class="fieldset md:col-span-3 lg:col-span-6">
                <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Bluetooth Device</legend>
                <div class="flex items-center gap-2">
                  <div class="flex-1 input input-bordered input-sm flex items-center gap-2 bg-base-200 cursor-default select-none">
                    <IconBluetooth class="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                    <span v-if="printer.btDeviceName" class="text-sm truncate">{{ printer.btDeviceName }}</span>
                    <span v-else class="text-sm text-base-content/40 italic">Belum dipasangkan</span>
                  </div>
                  <button
                    class="btn btn-sm btn-outline"
                    type="button"
                    @click="pairBluetoothPrinter(printer)"
                    :disabled="pairing === printer.id"
                  >
                    <IconBluetoothConnected v-if="printer.btDeviceName" class="w-4 h-4" />
                    <IconBluetooth v-else class="w-4 h-4" />
                    {{ pairing === printer.id ? 'Mencari...' : printer.btDeviceName ? 'Ganti Device' : 'Pair Printer' }}
                  </button>
                  <button
                    v-if="printer.btDeviceName"
                    class="btn btn-sm btn-ghost text-error"
                    type="button"
                    @click="printer.btDeviceName = undefined"
                    title="Hapus pairing"
                  >
                    <IconX class="w-4 h-4" />
                  </button>
                </div>
                <p class="text-xs text-base-content/50 mt-1">
                  Klik <b>Pair Printer</b> sekali dari browser Android. Setelah itu cetak otomatis tanpa dialog pilih device.
                </p>
              </fieldset>

              <fieldset v-if="printer.type !== 'bluetooth'" class="fieldset" :class="{ 'md:col-span-2': printer.type === 'bluetooth' }">
                <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">
                  {{ printer.type === 'bluetooth' ? 'Port Serial' : 'Alamat / IP' }}
                </legend>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  v-model="printer.address"
                  :placeholder="printer.type === 'usb' ? '/dev/usb/lp0 atau COM3' : '192.168.1.100'"
                />
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Mode</legend>
                <select class="select select-bordered select-sm w-full" v-model="printer.mode">
                  <option value="esc">ESC/POS</option>
                  <option value="pos">POS Mode</option>
                </select>
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Kertas</legend>
                <select class="select select-bordered select-sm w-full" v-model.number="printer.paperWidth">
                  <option :value="58">58mm</option>
                  <option :value="80">80mm</option>
                </select>
              </fieldset>
            </div>
          </div>
        </div>
      </div>

      <!-- Auto Print Settings -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base"><IconPrinter class="w-5 h-5" /> Cetak Otomatis</h3>
          <p class="text-sm text-base-content/60">Cetak otomatis struk dan tiket setelah transaksi</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Auto Cetak Struk</legend>
              <p class="text-xs text-base-content/50 mb-1">Cetak struk pembayaran otomatis setelah transaksi selesai</p>
              <input type="checkbox" class="toggle toggle-primary" v-model="form['print.autoReceipt']" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Auto Cetak Dapur/Bar</legend>
              <p class="text-xs text-base-content/50 mb-1">Cetak tiket dapur & bar otomatis saat order dine-in dibuat</p>
              <input type="checkbox" class="toggle toggle-primary" v-model="form['print.autoKitchen']" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Auto Cetak Pre-Bill</legend>
              <p class="text-xs text-base-content/50 mb-1">Cetak pre-bill otomatis saat pelanggan minta tagihan</p>
              <input type="checkbox" class="toggle toggle-primary" v-model="form['print.autoPreBill']" />
            </fieldset>
          </div>
        </div>
      </div>

      <!-- Order Settings -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base"><IconShoppingCart class="w-5 h-5" /> Pengaturan Order</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Mode Order</legend>
              <select class="select select-bordered w-full" v-model="form['order.mode']">
                <option value="all">Dine In & Takeaway</option>
                <option value="dine_in_only">Dine In Only</option>
                <option value="takeaway_only">Takeaway Only</option>
              </select>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Wajib Nomor Meja (Dine In)</legend>
              <input type="checkbox" class="toggle toggle-primary" v-model="form['order.requireTable']" />
            </fieldset>
          </div>
        </div>
      </div>

      <!-- General -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base"><IconWorld class="w-5 h-5" /> Umum</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Mata Uang</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['general.currency']" maxlength="5" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Timezone</legend>
              <input type="text" class="input input-bordered w-full" v-model="form['general.timezone']" />
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconDeviceFloppy, IconReceipt2, IconPercentage, IconCreditCard,
  IconHash, IconPrinter, IconShoppingCart, IconWorld, IconPlus, IconTrash,
  IconBluetooth, IconBluetoothConnected, IconX,
} from '@tabler/icons-vue'
import type { PrinterConfig } from '~/types'

const { pairDevice, isSupported: btSupported } = useBluetoothPrinter()
const pairing = ref<string | null>(null)

async function pairBluetoothPrinter(printer: PrinterConfig) {
  if (!btSupported) {
    alert('Web Bluetooth tidak didukung di browser ini. Gunakan Chrome/Edge di Android/Desktop dengan HTTPS.')
    return
  }
  pairing.value = printer.id
  try {
    const result = await pairDevice()
    if (result) {
      printer.btDeviceName = result.name
    }
  } catch (e: any) {
    alert('Gagal pair printer: ' + (e?.message || e))
  } finally {
    pairing.value = null
  }
}

const allPaymentMethods = [
  { value: 'CASH', label: 'Cash' },
  { value: 'DEBIT', label: 'Debit' },
  { value: 'CREDIT_CARD', label: 'Kartu Kredit' },
  { value: 'EWALLET', label: 'E-Wallet' },
  { value: 'QRIS', label: 'QRIS' },
]

interface FormState {
  'tax.enabled': boolean
  'tax.rate': number
  'tax.name': string
  'tax.inclusive': boolean
  'service.enabled': boolean
  'service.rate': number
  'service.name': string
  'payment.methods': string[]
  'payment.gateway': string
  'prefix.order': string
  'prefix.shift': string
  'prefix.split': string
  'prefix.expense': string
  'order.mode': string
  'order.requireTable': boolean
  'print.autoReceipt': boolean
  'print.autoKitchen': boolean
  'print.autoPreBill': boolean
  'general.currency': string
  'general.timezone': string
  'receipt.name': string
  'receipt.address': string
  'receipt.phone': string
  'receipt.footer1': string
  'receipt.footer2': string
}

const loading = ref(true)
const saving = ref(false)
const original = ref<Record<string, string>>({})
const printers = reactive<PrinterConfig[]>([])
const originalPrintersJson = ref('[]')

const form = reactive<FormState>({
  'tax.enabled': false,
  'tax.rate': 11,
  'tax.name': 'PPN',
  'tax.inclusive': false,
  'service.enabled': false,
  'service.rate': 5,
  'service.name': 'Service Charge',
  'payment.methods': ['CASH', 'DEBIT', 'CREDIT_CARD', 'EWALLET', 'QRIS'],
  'payment.gateway': '',
  'prefix.order': 'ORD',
  'prefix.shift': 'SFT',
  'prefix.split': 'SPL',
  'prefix.expense': 'EXP',
  'order.mode': 'all',
  'order.requireTable': true,
  'print.autoReceipt': true,
  'print.autoKitchen': true,
  'print.autoPreBill': false,
  'general.currency': 'IDR',
  'general.timezone': 'Asia/Jakarta',
  'receipt.name': '',
  'receipt.address': '',
  'receipt.phone': '',
  'receipt.footer1': 'Terima Kasih!',
  'receipt.footer2': 'Silakan Datang Kembali',
})

const hasChanges = computed(() => {
  const serialized = serializeForm()
  const formChanged = Object.keys(serialized).some(k => serialized[k] !== original.value[k])
  const printersChanged = JSON.stringify(printers) !== originalPrintersJson.value
  return formChanged || printersChanged
})

function serializeForm(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, val] of Object.entries(form)) {
    if (typeof val === 'boolean') out[key] = String(val)
    else if (Array.isArray(val)) out[key] = JSON.stringify(val)
    else out[key] = String(val)
  }
  out['printers'] = JSON.stringify(printers)
  return out
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function addPrinter() {
  printers.push({
    id: generateId(),
    name: '',
    role: 'cashier',
    type: 'lan',
    address: '',
    mode: 'esc',
    paperWidth: 80,
    enabled: true,
  })
}

function removePrinter(idx: number) {
  printers.splice(idx, 1)
}

function hydrateForm(settings: Record<string, string>) {
  const toBool = (v: string | undefined) => v === 'true'
  const toNum = (v: string | undefined) => Number(v) || 0

  form['tax.enabled'] = toBool(settings['tax.enabled'])
  form['tax.rate'] = toNum(settings['tax.rate'])
  form['tax.name'] = settings['tax.name'] || 'PPN'
  form['tax.inclusive'] = toBool(settings['tax.inclusive'])
  form['service.enabled'] = toBool(settings['service.enabled'])
  form['service.rate'] = toNum(settings['service.rate'])
  form['service.name'] = settings['service.name'] || 'Service Charge'
  form['payment.gateway'] = settings['payment.gateway'] || ''
  form['prefix.order'] = settings['prefix.order'] || 'ORD'
  form['prefix.shift'] = settings['prefix.shift'] || 'SFT'
  form['prefix.split'] = settings['prefix.split'] || 'SPL'
  form['prefix.expense'] = settings['prefix.expense'] || 'EXP'
  form['order.mode'] = settings['order.mode'] || 'all'
  form['order.requireTable'] = toBool(settings['order.requireTable'])
  form['print.autoReceipt'] = settings['print.autoReceipt'] !== undefined ? toBool(settings['print.autoReceipt']) : true
  form['print.autoKitchen'] = settings['print.autoKitchen'] !== undefined ? toBool(settings['print.autoKitchen']) : true
  form['print.autoPreBill'] = settings['print.autoPreBill'] !== undefined ? toBool(settings['print.autoPreBill']) : false
  form['general.currency'] = settings['general.currency'] || 'IDR'
  form['general.timezone'] = settings['general.timezone'] || 'Asia/Jakarta'
  form['receipt.name'] = settings['receipt.name'] || ''
  form['receipt.address'] = settings['receipt.address'] || ''
  form['receipt.phone'] = settings['receipt.phone'] || ''
  form['receipt.footer1'] = settings['receipt.footer1'] || 'Terima Kasih!'
  form['receipt.footer2'] = settings['receipt.footer2'] || 'Silakan Datang Kembali'

  try {
    form['payment.methods'] = JSON.parse(settings['payment.methods'] || '[]')
  } catch {
    form['payment.methods'] = ['CASH']
  }

  // Printers
  try {
    const parsed = JSON.parse(settings['printers'] || '[]')
    printers.splice(0, printers.length, ...parsed)
  } catch {
    printers.splice(0, printers.length)
  }
  originalPrintersJson.value = JSON.stringify(printers)
}

async function fetchSettings() {
  loading.value = true
  try {
    const data = await $fetch<Record<string, string>>('/api/settings')
    original.value = { ...data }
    hydrateForm(data)
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    const serialized = serializeForm()
    await $fetch('/api/settings', {
      method: 'PUT',
      body: serialized,
    })
    original.value = { ...serialized }
    originalPrintersJson.value = JSON.stringify(printers)
  } finally {
    saving.value = false
  }
}

onMounted(() => fetchSettings())
</script>
