import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer'

interface PrinterConfig {
  id: string
  name: string
  role: 'cashier' | 'kitchen' | 'bar'
  type: 'usb' | 'lan' | 'bluetooth'
  address: string
  paperWidth: 58 | 80
  enabled: boolean
}

interface PrintOrder {
  orderNumber: string
  orderType: string
  tableNumber?: string | null
  customerName?: string | null
  customerCount?: number | null
  subtotal: number
  taxAmount: number
  serviceCharge: number
  discountAmount: number
  totalAmount: number
  paymentMethod?: string | null
  paidAmount?: number | null
  changeAmount?: number | null
  paidAt?: string | null
  createdAt: string
  cashier?: { name: string } | null
  items: Array<{
    quantity: number
    unitPrice: number
    subtotal: number
    notes?: string | null
    product?: { name: string; sku?: string | null } | null
  }>
}

interface PrintSettings {
  taxEnabled: boolean
  taxRate: number
  taxName: string
  taxInclusive: boolean
  serviceEnabled: boolean
  serviceRate: number
  serviceName: string
  currency: string
}

interface PrintInfo {
  tenantName: string
  locationName: string
  locationAddress?: string
  locationPhone?: string
  footerLine1?: string
  footerLine2?: string
}

function fmtCurrency(amount: number): string {
  return amount.toLocaleString('id-ID')
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Tunai', DEBIT: 'Debit', CREDIT_CARD: 'Kartu Kredit',
  EWALLET: 'E-Wallet', QRIS: 'QRIS',
}

/**
 * Pad left + right text to fill exactly `width` characters.
 * If combined length exceeds width, the right text takes priority.
 */
function leftRight(left: string, right: string, width: number): string {
  const gap = width - left.length - right.length
  if (gap <= 0) return left + ' ' + right
  return left + ' '.repeat(gap) + right
}

/**
 * Center text within `width` characters.
 */
function centerText(text: string, width: number): string {
  if (text.length >= width) return text
  const pad = Math.floor((width - text.length) / 2)
  return ' '.repeat(pad) + text
}

/**
 * Create a ThermalPrinter instance from printer config
 */
function createPrinter(config: PrinterConfig): ThermalPrinter {
  let iface = config.address
  if (config.type === 'lan' && !iface.startsWith('tcp://')) {
    iface = `tcp://${iface}`
  }

  return new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: iface,
    characterSet: CharacterSet.PC858_EURO,
    removeSpecialCharacters: false,
    width: config.paperWidth === 58 ? 32 : 48,
    options: {
      timeout: 5000,
    },
  })
}

/**
 * Print cashier receipt (struk pembayaran)
 */
async function printReceiptToPrinter(
  printer: ThermalPrinter,
  order: PrintOrder,
  settings: PrintSettings,
  info: PrintInfo,
  charWidth: number,
): Promise<void> {
  const sep = '-'.repeat(charWidth)
  const doubleSep = '='.repeat(charWidth)

  // Header — centered
  printer.alignCenter()
  printer.bold(true)
  printer.println(info.tenantName)
  printer.bold(false)
  if (info.locationName) printer.println(info.locationName)
  if (info.locationAddress) printer.println(info.locationAddress)
  if (info.locationPhone) printer.println(info.locationPhone)
  printer.alignLeft()
  printer.println(doubleSep)

  // Order info — manual padding for perfect alignment
  printer.println(leftRight('No:', order.orderNumber, charWidth))
  printer.println(leftRight('Tanggal:', fmtDate(order.createdAt), charWidth))
  printer.println(leftRight('Kasir:', order.cashier?.name || '-', charWidth))
  printer.println(leftRight('Tipe:', order.orderType === 'DINE_IN' ? 'Dine In' : 'Takeaway', charWidth))
  if (order.tableNumber) {
    printer.println(leftRight('Meja:', order.tableNumber, charWidth))
  }
  if (order.customerName) {
    printer.println(leftRight('Pelanggan:', order.customerName, charWidth))
  }
  if (order.customerCount && order.customerCount > 1) {
    printer.println(leftRight('Jml Tamu:', String(order.customerCount), charWidth))
  }
  printer.println(sep)

  // Items
  for (const item of order.items) {
    const name = item.product?.name || 'Item'
    printer.println(name)
    printer.println(leftRight(
      `  ${item.quantity}x @ Rp ${fmtCurrency(item.unitPrice)}`,
      `Rp ${fmtCurrency(item.subtotal)}`,
      charWidth,
    ))
    if (item.notes) printer.println(`  * ${item.notes}`)
  }
  printer.println(sep)

  // Totals
  printer.println(leftRight('Subtotal', `Rp ${fmtCurrency(order.subtotal)}`, charWidth))
  if (settings.serviceEnabled && order.serviceCharge > 0) {
    const label = charWidth >= 48
      ? `${settings.serviceName} (${settings.serviceRate}%)`
      : `Service (${settings.serviceRate}%)`
    printer.println(leftRight(label, `Rp ${fmtCurrency(order.serviceCharge)}`, charWidth))
  }
  if (settings.taxEnabled && order.taxAmount > 0) {
    const taxLabel = settings.taxInclusive
      ? `${settings.taxName} (inkl.)`
      : `${settings.taxName} (${settings.taxRate}%)`
    printer.println(leftRight(taxLabel, `Rp ${fmtCurrency(order.taxAmount)}`, charWidth))
  }
  if (order.discountAmount > 0) {
    printer.println(leftRight('Diskon', `-Rp ${fmtCurrency(order.discountAmount)}`, charWidth))
  }

  printer.println(doubleSep)
  printer.bold(true)
  printer.println(leftRight('TOTAL', `Rp ${fmtCurrency(order.totalAmount)}`, charWidth))
  printer.bold(false)

  // Payment info
  if (order.paymentMethod) {
    printer.println(sep)
    const methodLabel = METHOD_LABELS[order.paymentMethod] || order.paymentMethod
    printer.println(leftRight(
      `Bayar (${methodLabel})`,
      `Rp ${fmtCurrency(order.paidAmount || order.totalAmount)}`,
      charWidth,
    ))
    if (order.paymentMethod === 'CASH' && order.changeAmount && order.changeAmount > 0) {
      printer.println(leftRight('Kembalian', `Rp ${fmtCurrency(order.changeAmount)}`, charWidth))
    }
  }

  // Footer
  printer.println('')
  printer.alignCenter()
  printer.println(info.footerLine1 || 'Terima Kasih!')
  printer.println(info.footerLine2 || 'Silakan Datang Kembali')
  printer.println('')
  printer.cut()
}

/**
 * Print kitchen/bar ticket
 */
async function printKitchenTicketToPrinter(
  printer: ThermalPrinter,
  order: PrintOrder,
  role: 'kitchen' | 'bar',
  charWidth: number,
): Promise<void> {
  const sep = '-'.repeat(charWidth)
  const doubleSep = '='.repeat(charWidth)
  const title = role === 'kitchen' ? '** ORDER DAPUR **' : '** ORDER BAR **'

  printer.alignCenter()
  printer.bold(true)
  printer.setTextSize(1, 1)
  printer.println(title)
  printer.bold(false)
  printer.setTextNormal()
  printer.alignLeft()
  printer.println(doubleSep)

  printer.println(leftRight('No:', order.orderNumber, charWidth))
  printer.println(leftRight('Waktu:', fmtDate(order.createdAt), charWidth))
  if (order.tableNumber) {
    printer.bold(true)
    printer.println(leftRight('Meja:', order.tableNumber, charWidth))
    printer.bold(false)
  }
  if (order.customerName) {
    printer.println(leftRight('Pelanggan:', order.customerName, charWidth))
  }
  printer.println(leftRight('Tipe:', order.orderType === 'DINE_IN' ? 'Dine In' : 'Takeaway', charWidth))
  printer.println(sep)

  // Items — bold for kitchen readability
  printer.bold(true)
  for (const item of order.items) {
    const name = item.product?.name || 'Item'
    printer.setTextSize(1, 1)
    printer.println(`${item.quantity}x  ${name}`)
    if (item.notes) {
      printer.setTextNormal()
      printer.bold(false)
      printer.println(`     >> ${item.notes}`)
      printer.bold(true)
    }
  }
  printer.bold(false)
  printer.setTextNormal()

  printer.println(doubleSep)
  printer.println('')
  printer.cut()
}

/**
 * Print pre-bill
 */
async function printPreBillToPrinter(
  printer: ThermalPrinter,
  order: PrintOrder,
  settings: PrintSettings,
  info: PrintInfo,
  charWidth: number,
): Promise<void> {
  const sep = '-'.repeat(charWidth)
  const doubleSep = '='.repeat(charWidth)

  printer.alignCenter()
  printer.bold(true)
  printer.println('** PRE-PRINT BILL **')
  printer.bold(false)
  printer.println(info.tenantName)
  if (info.locationName) printer.println(info.locationName)
  printer.alignLeft()
  printer.println(doubleSep)

  printer.println(leftRight('No:', order.orderNumber, charWidth))
  printer.println(leftRight('Tanggal:', fmtDate(order.createdAt), charWidth))
  if (order.tableNumber) {
    printer.println(leftRight('Meja:', order.tableNumber, charWidth))
  }
  if (order.customerName) {
    printer.println(leftRight('Pelanggan:', order.customerName, charWidth))
  }
  printer.println(sep)

  // Items
  for (const item of order.items) {
    const name = item.product?.name || 'Item'
    printer.println(name)
    printer.println(leftRight(
      `  ${item.quantity}x @ Rp ${fmtCurrency(item.unitPrice)}`,
      `Rp ${fmtCurrency(item.subtotal)}`,
      charWidth,
    ))
  }
  printer.println(sep)

  // Totals
  printer.println(leftRight('Subtotal', `Rp ${fmtCurrency(order.subtotal)}`, charWidth))
  if (settings.serviceEnabled && order.serviceCharge > 0) {
    printer.println(leftRight(
      `Service (${settings.serviceRate}%)`,
      `Rp ${fmtCurrency(order.serviceCharge)}`,
      charWidth,
    ))
  }
  if (settings.taxEnabled && order.taxAmount > 0) {
    printer.println(leftRight(
      `${settings.taxName} (${settings.taxRate}%)`,
      `Rp ${fmtCurrency(order.taxAmount)}`,
      charWidth,
    ))
  }
  if (order.discountAmount > 0) {
    printer.println(leftRight('Diskon', `-Rp ${fmtCurrency(order.discountAmount)}`, charWidth))
  }

  printer.println(doubleSep)
  printer.bold(true)
  printer.println(leftRight('TOTAL', `Rp ${fmtCurrency(order.totalAmount)}`, charWidth))
  printer.bold(false)

  printer.println('')
  printer.alignCenter()
  printer.bold(true)
  printer.println('** BELUM DIBAYAR **')
  printer.bold(false)
  printer.println('')
  printer.cut()
}

/**
 * Main print function — sends print job to all matching printers
 */
export async function directPrint(
  order: PrintOrder,
  settings: PrintSettings,
  info: PrintInfo,
  printerConfigs: PrinterConfig[],
  type: 'receipt' | 'kitchen' | 'pre-print',
): Promise<{ success: boolean; results: Array<{ printer: string; ok: boolean; error?: string }> }> {
  const results: Array<{ printer: string; ok: boolean; error?: string }> = []

  for (const config of printerConfigs) {
    if (!config.enabled) continue
    if (!config.address) {
      results.push({ printer: config.name, ok: false, error: 'No address configured' })
      continue
    }

    // Match printer role to print type
    if (type === 'receipt' && config.role !== 'cashier') continue
    if (type === 'pre-print' && config.role !== 'cashier') continue
    if (type === 'kitchen' && config.role !== 'kitchen' && config.role !== 'bar') continue

    const charWidth = config.paperWidth === 58 ? 32 : 48
    const printer = createPrinter(config)

    try {
      const isConnected = await printer.isPrinterConnected()
      if (!isConnected) {
        results.push({ printer: config.name, ok: false, error: 'Printer not connected' })
        continue
      }

      if (type === 'receipt') {
        await printReceiptToPrinter(printer, order, settings, info, charWidth)
      } else if (type === 'kitchen') {
        await printKitchenTicketToPrinter(printer, order, config.role as 'kitchen' | 'bar', charWidth)
      } else if (type === 'pre-print') {
        await printPreBillToPrinter(printer, order, settings, info, charWidth)
      }

      await printer.execute()
      results.push({ printer: config.name, ok: true })
    } catch (err: any) {
      results.push({ printer: config.name, ok: false, error: err?.message || 'Print failed' })
    }
  }

  return {
    success: results.some(r => r.ok),
    results,
  }
}
