import prisma from './prisma'

const DEFAULT_SETTINGS: Record<string, { value: string; group: string }> = {
  // Tax
  'tax.enabled': { value: 'false', group: 'tax' },
  'tax.rate': { value: '11', group: 'tax' },
  'tax.name': { value: 'PPN', group: 'tax' },
  'tax.inclusive': { value: 'false', group: 'tax' },
  // Service charge
  'service.enabled': { value: 'false', group: 'service' },
  'service.rate': { value: '5', group: 'service' },
  'service.name': { value: 'Service Charge', group: 'service' },
  // Payment
  'payment.methods': { value: '["CASH","DEBIT","CREDIT_CARD","EWALLET","QRIS"]', group: 'payment' },
  'payment.gateway': { value: '', group: 'payment' },
  // Prefix
  'prefix.order': { value: 'ORD', group: 'prefix' },
  'prefix.shift': { value: 'SFT', group: 'prefix' },
  'prefix.split': { value: 'SPL', group: 'prefix' },
  'prefix.expense': { value: 'EXP', group: 'prefix' },
  // Printers (JSON array of printer configs)
  'printers': { value: '[]', group: 'printer' },
  // Auto Print
  'print.autoReceipt': { value: 'true', group: 'print' },
  'print.autoKitchen': { value: 'true', group: 'print' },
  'print.autoPreBill': { value: 'false', group: 'print' },
  // Order
  'order.mode': { value: 'all', group: 'order' },
  'order.requireTable': { value: 'true', group: 'order' },
  // General
  'general.currency': { value: 'IDR', group: 'general' },
  'general.timezone': { value: 'Asia/Jakarta', group: 'general' },
  // Receipt customization
  'receipt.name': { value: '', group: 'receipt' },
  'receipt.address': { value: '', group: 'receipt' },
  'receipt.phone': { value: '', group: 'receipt' },
  'receipt.footer1': { value: 'Terima Kasih!', group: 'receipt' },
  'receipt.footer2': { value: 'Silakan Datang Kembali', group: 'receipt' },
}

/**
 * Get a single setting value for a location. Falls back to default.
 */
export async function getSetting(locationId: string, key: string): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { locationId_key: { locationId, key } },
  })
  if (setting) return setting.value
  return DEFAULT_SETTINGS[key]?.value ?? ''
}

/**
 * Get all settings for a location as a key-value map
 */
export async function getAllSettings(locationId: string): Promise<Record<string, string>> {
  const stored = await prisma.setting.findMany({
    where: { locationId },
  })

  const map: Record<string, string> = {}

  // Start with defaults
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    map[key] = def.value
  }

  // Override with stored values
  for (const s of stored) {
    map[s.key] = s.value
  }

  return map
}

/**
 * Set a setting value for a location (upsert)
 */
export async function setSetting(locationId: string, key: string, value: string) {
  const group = DEFAULT_SETTINGS[key]?.group ?? key.split('.')[0]

  return prisma.setting.upsert({
    where: { locationId_key: { locationId, key } },
    create: { locationId, key, value, group: group! },
    update: { value },
  })
}

/**
 * Get parsed setting as boolean
 */
export async function getSettingBool(locationId: string, key: string): Promise<boolean> {
  const val = await getSetting(locationId, key)
  return val === 'true'
}

/**
 * Get parsed setting as number
 */
export async function getSettingNum(locationId: string, key: string): Promise<number> {
  const val = await getSetting(locationId, key)
  return Number(val) || 0
}

/**
 * Get parsed setting as JSON array
 */
export async function getSettingJson<T = unknown>(locationId: string, key: string): Promise<T> {
  const val = await getSetting(locationId, key)
  return JSON.parse(val || '[]')
}

/**
 * Calculate tax and service charge for an amount based on location settings
 */
export async function calculateCharges(locationId: string, subtotal: number) {
  const taxEnabled = await getSettingBool(locationId, 'tax.enabled')
  const taxRate = await getSettingNum(locationId, 'tax.rate')
  const taxInclusive = await getSettingBool(locationId, 'tax.inclusive')
  const serviceEnabled = await getSettingBool(locationId, 'service.enabled')
  const serviceRate = await getSettingNum(locationId, 'service.rate')

  let serviceCharge = 0
  let taxAmount = 0

  if (serviceEnabled) {
    serviceCharge = Math.round(subtotal * serviceRate / 100)
  }

  const taxBase = subtotal + serviceCharge

  if (taxEnabled) {
    if (taxInclusive) {
      // Tax already included in price — extract from subtotal
      taxAmount = Math.round(taxBase - (taxBase / (1 + taxRate / 100)))
    } else {
      taxAmount = Math.round(taxBase * taxRate / 100)
    }
  }

  const totalAmount = taxInclusive
    ? subtotal + serviceCharge
    : subtotal + serviceCharge + taxAmount

  return { taxAmount, serviceCharge, totalAmount }
}
