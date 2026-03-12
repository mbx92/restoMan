const STORAGE_KEY = 'restoman_offline_queue'

interface OfflineOrderItem {
  productId: string
  quantity: number
  notes: string | null
  variantSelections: any
}

interface OfflineOrder {
  id: string
  createdAt: string
  orderType: 'DINE_IN' | 'TAKEAWAY'
  tableNumber: string | null
  customerName: string | null
  customerCount: number
  items: OfflineOrderItem[]
  paymentMethod: string
  paidAmount: number
}

export const useOfflineQueue = () => {
  const isOnline = ref(true)
  const queue = ref<OfflineOrder[]>([])
  const syncing = ref(false)

  function loadQueue() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      queue.value = stored ? JSON.parse(stored) : []
    } catch {
      queue.value = []
    }
  }

  function saveQueue() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.value))
  }

  function addToQueue(order: Omit<OfflineOrder, 'id' | 'createdAt'>) {
    const entry: OfflineOrder = {
      ...order,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
    }
    queue.value.push(entry)
    saveQueue()
    return entry
  }

  async function syncQueue() {
    if (!isOnline.value || syncing.value || !queue.value.length) return
    syncing.value = true
    const pending = [...queue.value]
    const failed: OfflineOrder[] = []

    for (const order of pending) {
      try {
        const created = await $fetch('/api/orders', {
          method: 'POST',
          body: {
            orderType: order.orderType,
            tableNumber: order.tableNumber,
            customerName: order.customerName,
            customerCount: order.customerCount,
            items: order.items,
          },
        })
        await $fetch(`/api/orders/${(created as any).id}`, {
          method: 'PUT',
          body: {
            action: 'pay',
            paymentMethod: order.paymentMethod,
            paidAmount: order.paidAmount,
          },
        })
      } catch {
        failed.push(order)
      }
    }

    queue.value = failed
    saveQueue()
    syncing.value = false
  }

  function onOnline() {
    isOnline.value = true
    syncQueue()
  }

  function onOffline() {
    isOnline.value = false
  }

  onMounted(() => {
    isOnline.value = navigator.onLine
    loadQueue()
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    if (isOnline.value && queue.value.length) {
      syncQueue()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  })

  return { isOnline, queue, syncing, addToQueue, syncQueue }
}
