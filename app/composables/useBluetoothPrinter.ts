import { EscPosBuilder } from '~/utils/escpos'

interface BluetoothDevice {
  name?: string
  id: string
  gatt?: {
    connected: boolean
    connect(): Promise<any>
    disconnect(): void
    getPrimaryServices(): Promise<any[]>
  }
}

// ─── Module-level device cache ────────────────────────────────────────────────
// Persists across component mounts for the entire browser session.
// Cleared only when the tab is closed or refreshed.
const _cachedDevice = ref<BluetoothDevice | null>(null)

const BT_OPTIONAL_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '00001101-0000-1000-8000-00805f9b34fb',
]

export const useBluetoothPrinter = () => {
  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator
  const isConnected = computed(() => !!_cachedDevice.value)
  const connectedDeviceName = computed(() => _cachedDevice.value?.name ?? null)

  // ─── Device acquisition ─────────────────────────────────────────────────────

  async function tryGetPermittedDevice(deviceName?: string): Promise<BluetoothDevice | null> {
    try {
      // @ts-ignore
      const permitted: BluetoothDevice[] = await navigator.bluetooth.getDevices()
      if (!permitted?.length) return null
      console.log('[WebBT] Permitted devices:', permitted.map(d => d.name || d.id))
      return deviceName ? (permitted.find(d => d.name === deviceName) ?? null) : permitted[0]
    } catch {
      return null
    }
  }

  async function showPicker(deviceName?: string): Promise<BluetoothDevice | null> {
    if (deviceName) {
      try {
        // @ts-ignore
        return await navigator.bluetooth.requestDevice({
          filters: [{ name: deviceName }],
          optionalServices: BT_OPTIONAL_SERVICES,
        })
      } catch (err: any) {
        if (err?.name === 'NotFoundError') return null
        // some browsers don't support filters — fall through
      }
    }
    try {
      // @ts-ignore
      return await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BT_OPTIONAL_SERVICES,
      })
    } catch (err: any) {
      if (err?.name === 'NotFoundError') return null
      throw err
    }
  }

  /**
   * Acquire and cache the printer device for this session.
   *
   * Priority:
   * 1. Already cached in memory → instant, no picker.
   * 2. getDevices() (silent) → instant, no picker.
   * 3. Picker (one-time per browser, filtered to deviceName if set).
   *
   * After calling this once, all subsequent calls return the cached device
   * without any popup for the rest of the browser session.
   */
  async function connectPrinter(deviceName?: string): Promise<BluetoothDevice | null> {
    if (!isSupported) throw new Error('Web Bluetooth tidak didukung. Gunakan Chrome/Edge dengan HTTPS.')

    // 1. Memory cache — no async, no picker
    if (_cachedDevice.value) {
      console.log('[WebBT] Using cached device:', _cachedDevice.value.name)
      return _cachedDevice.value
    }

    // 2. Silent getDevices() — no picker, no user gesture
    const permitted = await tryGetPermittedDevice(deviceName)
    if (permitted) {
      console.log('[WebBT] Auto-connected via getDevices():', permitted.name)
      _cachedDevice.value = permitted
      return permitted
    }

    // 3. Picker — required once per browser/origin. Filtered to printer name for clean UX.
    console.log('[WebBT] First time on this browser — showing picker...')
    const device = await showPicker(deviceName)
    if (device) {
      _cachedDevice.value = device
      console.log('[WebBT] Cached after picker:', device.name)
    }
    return device
  }

  /**
   * ONE-TIME pairing from Settings page. Shows picker and caches device.
   */
  async function pairDevice(): Promise<{ id: string; name: string } | null> {
    if (!isSupported) throw new Error('Web Bluetooth tidak didukung. Gunakan Chrome/Edge dengan HTTPS.')
    const device = await showPicker()
    if (!device) return null
    _cachedDevice.value = device
    return { id: device.id, name: device.name || device.id }
  }

  /** Clear cached device */
  function disconnectPrinter() {
    if (_cachedDevice.value?.gatt?.connected) {
      try { _cachedDevice.value.gatt.disconnect() } catch { /* ignore */ }
    }
    _cachedDevice.value = null
    console.log('[WebBT] Device disconnected and cache cleared.')
  }

  // ─── GATT helpers ───────────────────────────────────────────────────────────

  async function getWriteCharacteristic(server: any): Promise<any> {
    const services = await server.getPrimaryServices()
    if (!services?.length) {
      throw new Error('Tidak ada Bluetooth Service. Lakukan Pair ulang di Pengaturan → "Ganti Device".')
    }
    for (const service of services) {
      try {
        const chars = await service.getCharacteristics()
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) return c
        }
      } catch { /* skip service */ }
    }
    throw new Error('Tidak ada karakteristik Write. Lakukan Pair ulang di Pengaturan → "Ganti Device".')
  }

  async function sendChunks(char: any, data: Uint8Array, chunkSize = 256) {
    for (let i = 0; i < data.length; i += chunkSize) {
      await char.writeValue(data.slice(i, i + chunkSize))
      await new Promise(r => setTimeout(r, 20))
    }
  }

  async function connectGatt(device: BluetoothDevice, maxRetries = 3): Promise<any> {
    let lastErr: any
    for (let i = 1; i <= maxRetries; i++) {
      try {
        const server = await device.gatt!.connect()
        return server
      } catch (e: any) {
        lastErr = e
        if (i < maxRetries) await new Promise(r => setTimeout(r, 500 * i))
      }
    }
    // Clear cache so retry will re-acquire device address
    _cachedDevice.value = null
    throw new Error(`Gagal connect ke printer (${maxRetries}x): ${lastErr?.message || lastErr}`)
  }

  // ─── Main print ─────────────────────────────────────────────────────────────

  /**
   * Print receipt text to the Bluetooth printer.
   * Uses cached device if available — no picker after first successful connect.
   */
  async function printTextReceipt(rawText: string, deviceName?: string): Promise<boolean> {
    const device = await connectPrinter(deviceName)
    if (!device) return false
    if (!device.gatt) throw new Error('Device tidak mendukung GATT Service')

    const server = await connectGatt(device)
    const characteristic = await getWriteCharacteristic(server)

    const escpos = new EscPosBuilder()
    escpos.align('left').normal()

    for (const line of rawText.split('\n')) {
      if (line.startsWith(' ') && line.trim().length > 0 && !line.match(/^\d+x/)) {
        escpos.align('center').println(line.trim())
      } else if (line.includes('**')) {
        escpos.align('center').bold(true).println(line.replace(/\*\*/g, '').trim()).bold(false)
      } else if (line.trim() === '') {
        escpos.println()
      } else {
        escpos.align('left').println(line)
      }
    }

    escpos.cut()
    const payload = escpos.build()
    console.log(`[WebBT] Sending ${payload.length} bytes...`)
    await sendChunks(characteristic, payload)
    console.log('[WebBT] Print complete.')

    if (device.gatt?.connected) try { device.gatt.disconnect() } catch { /* ignore */ }
    return true
  }

  return {
    isSupported,
    isConnected,
    connectedDeviceName,
    pairDevice,
    connectPrinter,
    disconnectPrinter,
    printTextReceipt,
    // backward compat aliases
    connectDevice: (deviceName?: string) => connectPrinter(deviceName),
    getDevice: (deviceName?: string) => connectPrinter(deviceName),
  }
}
