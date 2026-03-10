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
   * Call server-side direct print API.
   * The server handles ESC/POS generation and sends directly to the printer.
   */
  async function autoPrint(
    orderId: string,
    type: 'receipt' | 'kitchen' | 'pre-print',
  ): Promise<{ success: boolean; results?: any[] }> {
    try {
      const result = await $fetch<any>(`/api/orders/${orderId}/print`, {
        method: 'POST',
        body: { type },
      })

      if (result.success) {
        console.log(`[AutoPrint] ✅ ${type} printed successfully`)
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
