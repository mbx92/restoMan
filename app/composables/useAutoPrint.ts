import { useBluetoothPrinter } from './useBluetoothPrinter'
import { useReceipt } from './useReceipt'

/**
 * Auto-print composable — calls server-side direct print API
 * to send ESC/POS commands directly to thermal printers.
 */
export const useAutoPrint = () => {
  /**
   * Check if a specific auto-print type is enabled in settings
   */
  function isAutoPrintEnabled(
    settings: Record<string, string>,
    type: 'receipt' | 'kitchen' | 'pre-print',
  ): boolean {
    if (type === 'receipt') return settings['print.autoReceipt'] === 'true'
    if (type === 'kitchen') return settings['print.autoKitchen'] === 'true'
    if (type === 'pre-print') return settings['print.autoPreBill'] === 'true'
    return false
  }

  /**
   * Call server-side direct print API or client-side Web Bluetooth API.
   * If a Bluetooth printer is enabled for this role, it prints from browser.
   * Otherwise, it sends the request to the server.
   */
  async function autoPrint(
    orderId: string,
    type: 'receipt' | 'kitchen' | 'pre-print',
    clientPrinters?: import('~/types').PrinterConfig[],
  ): Promise<{ success: boolean; results?: any[] }> {
    try {
      // 1. Check for Bluetooth printers first if client configs are provided
      if (clientPrinters && clientPrinters.length > 0) {
        // Only use Web Bluetooth for BT printers WITHOUT a configured address.
        // BT printers WITH an address (serial port path like /dev/tty.* or COM3)
        // are handled server-side, same as LAN printers.
        const btPrinters = clientPrinters.filter(p => 
          p.enabled && p.type === 'bluetooth' && (
            (type === 'receipt' && p.role === 'cashier') ||
            (type === 'pre-print' && p.role === 'cashier') ||
            (type === 'kitchen' && (p.role === 'kitchen' || p.role === 'bar'))
          )
        )

        // If a BT printer is found with no address, use browser Web Bluetooth (requires user gesture)
        if (btPrinters.length > 0) {
          console.log(`[AutoPrint] 🦷 Web Bluetooth (no address) found for ${type}, fetching receipt text...`)
          
          // We need the raw receipt text to feed into the BT printer
          const { buildCashierReceipt, buildKitchenTicket, buildPrePrintBill } = useReceipt()
          const data = await $fetch<any>(`/api/orders/${orderId}/pre-print`)
          
          const orderData = data.order
          const settingsData = data.settings
          const infoData = {
            tenantName: data.tenant?.name || '',
            locationName: data.location?.name || '',
            locationAddress: data.location?.address || undefined,
            locationPhone: data.location?.phone || undefined,
          }

          let receiptText = ''
          const paperWidth = btPrinters[0]?.paperWidth || 80 // use width of first BT printer

          if (type === 'receipt') receiptText = buildCashierReceipt(orderData, settingsData, infoData, paperWidth)
          else if (type === 'kitchen') receiptText = buildKitchenTicket(orderData, infoData, 'kitchen', paperWidth)
          else receiptText = buildPrePrintBill(orderData, settingsData, infoData, paperWidth)

          const { printTextReceipt, isSupported } = useBluetoothPrinter()
          
          if (!isSupported) {
            console.error('[AutoPrint] Web Bluetooth not supported in this browser.')
            return { success: false, results: [{ error: 'Web Bluetooth not supported' }] }
          }

          // Trigger Web Bluetooth — uses getDevices() to auto-connect if device was previously paired.
          // Only falls back to device picker if no previously-permitted device is found.
          await printTextReceipt(receiptText, btPrinters[0]?.btDeviceName)
          console.log(`[AutoPrint] ✅ ${type} printed successfully via Web Bluetooth`)
          return { success: true }
        }
      }

      // 2. Fallback to Server-Side Print (LAN / USB via backend)
      const result = await $fetch<any>(`/api/orders/${orderId}/print`, {
        method: 'POST',
        body: { type },
      })

      if (result.success) {
        console.log(`[AutoPrint] ✅ ${type} printed successfully via server`)
      } else {
        console.warn(`[AutoPrint] ⚠️ ${type} print had issues:`, result.results)
      }

      return result
    } catch (err: any) {
      console.error(`[AutoPrint] ❌ Failed to print ${type}:`, err?.data?.statusMessage || err?.message)
      return { success: false }
    }
  }

  /**
   * Auto-print after order creation + payment based on order type and settings.
   *
   * Takeaway: print receipt after payment
   * Dine-in:  print kitchen/bar tickets on order create,
   *           print receipt after payment
   */
  async function autoPrintAfterOrder(
    orderId: string,
    orderType: 'DINE_IN' | 'TAKEAWAY',
    settings: Record<string, string>,
    phase: 'created' | 'paid',
  ): Promise<void> {
    if (phase === 'created' && orderType === 'DINE_IN') {
      if (isAutoPrintEnabled(settings, 'kitchen')) {
        await autoPrint(orderId, 'kitchen')
      }
    }

    if (phase === 'paid') {
      if (isAutoPrintEnabled(settings, 'receipt')) {
        await autoPrint(orderId, 'receipt')
      }
    }
  }

  return {
    autoPrint,
    autoPrintAfterOrder,
    isAutoPrintEnabled,
  }
}
