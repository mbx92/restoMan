import type { PrinterConfig } from '~/types'

interface ReceiptOrder {
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

interface ReceiptSettings {
  taxEnabled: boolean
  taxRate: number
  taxName: string
  taxInclusive: boolean
  serviceEnabled: boolean
  serviceRate: number
  serviceName: string
  currency: string
}

interface ReceiptInfo {
  tenantName: string
  locationName: string
  locationAddress?: string
  locationPhone?: string
}

export const useReceipt = () => {
  const { formatCurrency } = useFormatCurrency()

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  /**
   * Generate cashier receipt (struk pembayaran)
   */
  function buildCashierReceipt(
    order: ReceiptOrder,
    receiptSettings: ReceiptSettings,
    info: ReceiptInfo,
    paperWidth: number = 80,
  ): string {
    const charWidth = paperWidth === 58 ? 32 : 48
    const separator = '-'.repeat(charWidth)
    const doubleSep = '='.repeat(charWidth)

    function pad(left: string, right: string) {
      const space = charWidth - left.length - right.length
      return left + ' '.repeat(Math.max(1, space)) + right
    }

    function center(text: string) {
      const padding = Math.max(0, Math.floor((charWidth - text.length) / 2))
      return ' '.repeat(padding) + text
    }

    const lines: string[] = []

    // Header
    lines.push(center(info.tenantName))
    lines.push(center(info.locationName))
    if (info.locationAddress) lines.push(center(info.locationAddress))
    if (info.locationPhone) lines.push(center(info.locationPhone))
    lines.push(doubleSep)

    // Order info
    lines.push(pad('No:', order.orderNumber))
    lines.push(pad('Tanggal:', formatDate(order.createdAt)))
    lines.push(pad('Kasir:', order.cashier?.name || '-'))
    lines.push(pad('Tipe:', order.orderType === 'DINE_IN' ? 'Dine In' : 'Takeaway'))
    if (order.tableNumber) lines.push(pad('Meja:', order.tableNumber))
    if (order.customerName) lines.push(pad('Pelanggan:', order.customerName))
    if (order.customerCount) lines.push(pad('Jumlah Tamu:', String(order.customerCount)))
    lines.push(separator)

    // Items
    for (const item of order.items) {
      const name = item.product?.name || 'Item'
      const qty = `${item.quantity}x`
      const price = `Rp ${formatCurrency(item.subtotal)}`
      lines.push(name)
      lines.push(pad(`  ${qty} @ Rp ${formatCurrency(item.unitPrice)}`, price))
      if (item.notes) lines.push(`  * ${item.notes}`)
    }
    lines.push(separator)

    // Totals
    lines.push(pad('Subtotal', `Rp ${formatCurrency(order.subtotal)}`))
    if (receiptSettings.serviceEnabled && order.serviceCharge > 0) {
      lines.push(pad(`${receiptSettings.serviceName} (${receiptSettings.serviceRate}%)`, `Rp ${formatCurrency(order.serviceCharge)}`))
    }
    if (receiptSettings.taxEnabled && order.taxAmount > 0) {
      const taxLabel = receiptSettings.taxInclusive
        ? `${receiptSettings.taxName} (inkl.)`
        : `${receiptSettings.taxName} (${receiptSettings.taxRate}%)`
      lines.push(pad(taxLabel, `Rp ${formatCurrency(order.taxAmount)}`))
    }
    if (order.discountAmount > 0) {
      lines.push(pad('Diskon', `-Rp ${formatCurrency(order.discountAmount)}`))
    }
    lines.push(doubleSep)
    lines.push(pad('TOTAL', `Rp ${formatCurrency(order.totalAmount)}`))

    // Payment info
    if (order.paymentMethod) {
      lines.push(separator)
      const methodLabels: Record<string, string> = {
        CASH: 'Tunai', DEBIT: 'Debit', CREDIT_CARD: 'Kartu Kredit',
        EWALLET: 'E-Wallet', QRIS: 'QRIS',
      }
      lines.push(pad('Bayar (' + (methodLabels[order.paymentMethod] || order.paymentMethod) + ')', `Rp ${formatCurrency(order.paidAmount || order.totalAmount)}`))
      if (order.paymentMethod === 'CASH' && order.changeAmount && order.changeAmount > 0) {
        lines.push(pad('Kembalian', `Rp ${formatCurrency(order.changeAmount)}`))
      }
    }

    lines.push('')
    lines.push(center('Terima Kasih!'))
    lines.push(center('Silakan Datang Kembali'))
    lines.push('')

    return lines.join('\n')
  }

  /**
   * Generate kitchen ticket (order tiket dapur / bar)
   */
  function buildKitchenTicket(
    order: ReceiptOrder,
    info: ReceiptInfo,
    printerRole: 'kitchen' | 'bar',
    paperWidth: number = 80,
  ): string {
    const charWidth = paperWidth === 58 ? 32 : 48
    const separator = '-'.repeat(charWidth)
    const doubleSep = '='.repeat(charWidth)

    function center(text: string) {
      const padding = Math.max(0, Math.floor((charWidth - text.length) / 2))
      return ' '.repeat(padding) + text
    }

    function pad(left: string, right: string) {
      const space = charWidth - left.length - right.length
      return left + ' '.repeat(Math.max(1, space)) + right
    }

    const lines: string[] = []
    const title = printerRole === 'kitchen' ? '** ORDER DAPUR **' : '** ORDER BAR **'

    lines.push(center(title))
    lines.push(doubleSep)
    lines.push(pad('No:', order.orderNumber))
    lines.push(pad('Waktu:', formatDate(order.createdAt)))
    if (order.tableNumber) lines.push(pad('Meja:', order.tableNumber))
    if (order.customerName) lines.push(pad('Pelanggan:', order.customerName))
    lines.push(pad('Tipe:', order.orderType === 'DINE_IN' ? 'Dine In' : 'Takeaway'))
    lines.push(separator)

    // Items — larger text for kitchen readability
    for (const item of order.items) {
      const name = item.product?.name || 'Item'
      lines.push(`${item.quantity}x  ${name}`)
      if (item.notes) lines.push(`     >> ${item.notes}`)
    }

    lines.push(doubleSep)
    lines.push('')

    return lines.join('\n')
  }

  /**
   * Generate pre-print bill (rincian sebelum bayar)
   */
  function buildPrePrintBill(
    order: ReceiptOrder,
    receiptSettings: ReceiptSettings,
    info: ReceiptInfo,
    paperWidth: number = 80,
  ): string {
    const charWidth = paperWidth === 58 ? 32 : 48
    const separator = '-'.repeat(charWidth)
    const doubleSep = '='.repeat(charWidth)

    function pad(left: string, right: string) {
      const space = charWidth - left.length - right.length
      return left + ' '.repeat(Math.max(1, space)) + right
    }

    function center(text: string) {
      const padding = Math.max(0, Math.floor((charWidth - text.length) / 2))
      return ' '.repeat(padding) + text
    }

    const lines: string[] = []

    lines.push(center('** PRE-PRINT BILL **'))
    lines.push(center(info.tenantName))
    lines.push(center(info.locationName))
    lines.push(doubleSep)
    lines.push(pad('No:', order.orderNumber))
    lines.push(pad('Tanggal:', formatDate(order.createdAt)))
    if (order.tableNumber) lines.push(pad('Meja:', order.tableNumber))
    if (order.customerName) lines.push(pad('Pelanggan:', order.customerName))
    lines.push(separator)

    for (const item of order.items) {
      const name = item.product?.name || 'Item'
      const price = `Rp ${formatCurrency(item.subtotal)}`
      lines.push(name)
      lines.push(pad(`  ${item.quantity}x @ Rp ${formatCurrency(item.unitPrice)}`, price))
    }
    lines.push(separator)

    lines.push(pad('Subtotal', `Rp ${formatCurrency(order.subtotal)}`))
    if (receiptSettings.serviceEnabled && order.serviceCharge > 0) {
      lines.push(pad(`${receiptSettings.serviceName} (${receiptSettings.serviceRate}%)`, `Rp ${formatCurrency(order.serviceCharge)}`))
    }
    if (receiptSettings.taxEnabled && order.taxAmount > 0) {
      lines.push(pad(`${receiptSettings.taxName} (${receiptSettings.taxRate}%)`, `Rp ${formatCurrency(order.taxAmount)}`))
    }
    if (order.discountAmount > 0) {
      lines.push(pad('Diskon', `-Rp ${formatCurrency(order.discountAmount)}`))
    }
    lines.push(doubleSep)
    lines.push(pad('TOTAL', `Rp ${formatCurrency(order.totalAmount)}`))
    lines.push('')
    lines.push(center('** BELUM DIBAYAR **'))
    lines.push('')

    return lines.join('\n')
  }

  /**
   * Render receipt as printable HTML (for browser print dialog or iframe)
   */
  function receiptToHtml(content: string, paperWidth: number = 80): string {
    const fontSizePx = paperWidth === 58 ? 11 : 12
    const widthMm = paperWidth

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 0; size: ${widthMm}mm auto; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: ${fontSizePx}px;
    line-height: 1.4;
    margin: 0;
    padding: 4mm;
    width: ${widthMm - 8}mm;
    white-space: pre;
    word-wrap: break-word;
  }
  @media print {
    body { margin: 0; padding: 2mm; }
  }
</style>
</head>
<body>${escapeHtml(content)}</body>
</html>`
  }

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  /**
   * Print via browser: opens a hidden iframe, writes HTML, triggers print
   */
  function printViaBrowser(html: string) {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.top = '-9999px'
    iframe.style.left = '-9999px'
    iframe.style.width = '0'
    iframe.style.height = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(html)
    doc.close()

    iframe.onload = () => {
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 3000)
    }
  }

  /**
   * Print an order to all applicable printers
   */
  function printOrder(
    order: ReceiptOrder,
    receiptSettings: ReceiptSettings,
    info: ReceiptInfo,
    enabledPrinters: PrinterConfig[],
    type: 'receipt' | 'kitchen' | 'pre-print' = 'receipt',
  ) {
    for (const printer of enabledPrinters) {
      if (!printer.enabled) continue

      let content = ''

      if (type === 'receipt' && printer.role === 'cashier') {
        content = buildCashierReceipt(order, receiptSettings, info, printer.paperWidth)
      } else if (type === 'kitchen' && (printer.role === 'kitchen' || printer.role === 'bar')) {
        content = buildKitchenTicket(order, info, printer.role, printer.paperWidth)
      } else if (type === 'pre-print' && printer.role === 'cashier') {
        content = buildPrePrintBill(order, receiptSettings, info, printer.paperWidth)
      } else {
        continue
      }

      if (!content) continue

      // Browser print (for now — actual ESC/POS network printing needs server-side)
      const html = receiptToHtml(content, printer.paperWidth)
      printViaBrowser(html)
    }
  }

  return {
    buildCashierReceipt,
    buildKitchenTicket,
    buildPrePrintBill,
    receiptToHtml,
    printViaBrowser,
    printOrder,
  }
}
