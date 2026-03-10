<script setup lang="ts">
import { IconPrinter, IconX, IconReceipt } from '@tabler/icons-vue'
import type { PrinterConfig } from '~/types'

const props = defineProps<{
  orderId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const show = defineModel<boolean>('show', { default: false })

const { buildCashierReceipt, buildKitchenTicket, buildPrePrintBill, receiptToHtml, printViaBrowser } = useReceipt()
const { autoPrint } = useAutoPrint()

const loading = ref(true)
const receiptText = ref('')
const previewType = ref<'receipt' | 'kitchen' | 'pre-print'>('receipt')
const previewPaper = ref<58 | 80>(80)

// Store fetched data
const orderData = ref<any>(null)
const settingsData = ref<any>(null)
const infoData = ref<{ tenantName: string; locationName: string; locationAddress?: string; locationPhone?: string }>({
  tenantName: '', locationName: '',
})
const printers = ref<PrinterConfig[]>([])

async function fetchData() {
  loading.value = true
  try {
    const data = await $fetch<any>(`/api/orders/${props.orderId}/pre-print`)
    orderData.value = data.order
    settingsData.value = data.settings
    infoData.value = {
      tenantName: data.tenant?.name || '',
      locationName: data.location?.name || '',
      locationAddress: data.location?.address || undefined,
      locationPhone: data.location?.phone || undefined,
    }

    // Parse printers from settings
    const printersSetting = data.settings?.printers || data.rawSettings?.printers
    if (typeof printersSetting === 'string') {
      try { printers.value = JSON.parse(printersSetting) } catch { printers.value = [] }
    } else if (Array.isArray(printersSetting)) {
      printers.value = printersSetting
    }

    rebuildPreview()
  } catch {
    receiptText.value = 'Gagal memuat data order.'
  } finally {
    loading.value = false
  }
}

function rebuildPreview() {
  if (!orderData.value) return
  const paper = previewPaper.value

  if (previewType.value === 'receipt') {
    receiptText.value = buildCashierReceipt(orderData.value, settingsData.value, infoData.value, paper)
  } else if (previewType.value === 'kitchen') {
    receiptText.value = buildKitchenTicket(orderData.value, infoData.value, 'kitchen', paper)
  } else {
    receiptText.value = buildPrePrintBill(orderData.value, settingsData.value, infoData.value, paper)
  }
}

function doPrint() {
  const html = receiptToHtml(receiptText.value, previewPaper.value)
  printViaBrowser(html)
}

const printing = ref(false)
const printResult = ref<string | null>(null)

async function doDirectPrint() {
  printing.value = true
  printResult.value = null
  try {
    const result = await autoPrint(props.orderId, previewType.value)
    if (result.success) {
      printResult.value = '✅ Berhasil dicetak!'
    } else {
      printResult.value = '⚠️ Gagal cetak — periksa koneksi printer'
    }
  } catch {
    printResult.value = '❌ Error — printer tidak terhubung'
  } finally {
    printing.value = false
    setTimeout(() => { printResult.value = null }, 3000)
  }
}

watch(show, (val) => {
  if (val && props.orderId) fetchData()
})

watch([previewType, previewPaper], () => rebuildPreview())
</script>

<template>
  <dialog class="modal" :class="{ 'modal-open': show }">
    <div class="modal-box max-w-lg p-0">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-base-300 px-5 py-3">
        <h3 class="flex items-center gap-2 text-base font-bold">
          <IconReceipt :size="20" />
          Preview Struk
        </h3>
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="show = false; emit('close')">
          <IconX :size="18" />
        </button>
      </div>

      <!-- Controls -->
      <div class="flex flex-wrap items-center gap-2 border-b border-base-300 px-5 py-2">
        <select v-model="previewType" class="select select-sm select-bordered">
          <option value="receipt">Struk Pembayaran</option>
          <option value="pre-print">Pre-Print Bill</option>
          <option value="kitchen">Tiket Dapur</option>
        </select>
        <select v-model.number="previewPaper" class="select select-sm select-bordered">
          <option :value="80">80mm</option>
          <option :value="58">58mm</option>
        </select>
        <div class="flex-1" />
        <button class="btn btn-sm btn-primary gap-1" :disabled="loading || !receiptText || printing" @click="doDirectPrint">
          <span v-if="printing" class="loading loading-spinner loading-xs"></span>
          <IconPrinter v-else :size="16" />
          Direct Print
        </button>
        <button class="btn btn-sm btn-ghost gap-1" :disabled="loading || !receiptText" @click="doPrint">
          <IconPrinter :size="16" />
          Browser
        </button>
      </div>
      <div v-if="printResult" class="px-5 py-2 text-sm" :class="printResult.startsWith('✅') ? 'text-success' : 'text-error'">
        {{ printResult }}
      </div>

      <!-- Preview -->
      <div class="overflow-auto bg-white p-4" style="max-height: 60vh;">
        <div v-if="loading" class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-md" />
        </div>
        <pre v-else class="whitespace-pre text-xs leading-relaxed" :class="previewPaper === 58 ? 'text-[10px]' : 'text-xs'"
        >{{ receiptText }}</pre>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="show = false; emit('close')">
      <button>close</button>
    </form>
  </dialog>
</template>
