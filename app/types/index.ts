// ============ Multi-Tenancy ============

export interface Tenant {
  id: string
  name: string
  slug: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  name: string
  address?: string
  phone?: string
  isActive: boolean
  tenantId: string
  createdAt: string
  updatedAt: string
}

// ============ Auth & Authorization ============

export interface Permission {
  id: string
  code: string
  name: string
  module: string
  description?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  isSystem: boolean
  tenantId: string
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  isActive: boolean
  tenantId: string
  roleId: string
  role: Role
  createdAt: string
  updatedAt: string
}

export interface SessionUser {
  id: string
  name: string
  email: string
  tenantId: string
  locationId: string
  role: {
    id: string
    name: string
    permissions: string[] // permission codes
  }
}

// ============ Settings ============

export interface Setting {
  id: string
  locationId: string
  key: string
  value: string
  group: string
}

export type PrinterRole = 'cashier' | 'kitchen' | 'bar'

export interface PrinterConfig {
  id: string            // unique id (e.g. cuid or uuid)
  name: string          // label: "Kasir Utama", "Dapur", "Bar"
  role: PrinterRole     // determines what gets printed
  type: 'usb' | 'lan' | 'bluetooth'
  address: string       // IP, USB path, or BT address
  mode: 'esc' | 'pos'  // ESC/POS or POS mode
  paperWidth: 58 | 80   // mm
  enabled: boolean
}

export interface SettingsMap {
  // Tax
  'tax.enabled': boolean
  'tax.rate': number
  'tax.name': string
  'tax.inclusive': boolean
  // Service charge
  'service.enabled': boolean
  'service.rate': number
  'service.name': string
  // Payment
  'payment.methods': string[] // enabled payment methods
  'payment.gateway': string
  // Prefix
  'prefix.order': string
  'prefix.shift': string
  'prefix.split': string
  'prefix.expense': string
  // Printers
  'printers': PrinterConfig[]
  // Order type
  'order.mode': 'all' | 'dine_in_only' | 'takeaway_only'
  'order.requireTable': boolean
  // General
  'general.currency': string
  'general.timezone': string
}

// ============ Products ============

export interface Category {
  id: string
  name: string
  icon?: string
  color?: string
  sortOrder: number
  isActive: boolean
  tenantId: string
  productCount?: number
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  sku?: string
  description?: string
  price: number
  cost: number
  image?: string
  stock: number
  trackStock: boolean
  isActive: boolean
  sortOrder: number
  tenantId: string
  categoryId: string
  category?: Category
  createdAt: string
  updatedAt: string
  variantGroups?: any[]
}

// ============ Cash Register / Shift ============

export interface CashRegisterShift {
  id: string
  shiftNumber: string
  status: 'OPEN' | 'CLOSED'
  openedAt: string
  closedAt?: string
  openingAmount: number
  closingAmount?: number
  expectedAmount?: number
  difference?: number
  notes?: string
  userId: string
  user?: Pick<User, 'id' | 'name'>
  locationId: string
  orderCount?: number
  totalSales?: number
  totalCashSales?: number
  createdAt: string
  updatedAt: string
}

// ============ Orders ============

export interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes?: string
  orderId: string
  productId: string
  product?: Product
  createdAt: string
}

export interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  orderType: 'DINE_IN' | 'TAKEAWAY'
  tableNumber?: string
  subtotal: number
  discountAmount: number
  taxAmount: number
  serviceCharge: number
  totalAmount: number
  paymentMethod?: 'CASH' | 'DEBIT' | 'CREDIT_CARD' | 'EWALLET' | 'QRIS'
  paidAmount?: number
  changeAmount?: number
  paidAt?: string
  notes?: string
  customerName?: string
  customerCount?: number
  cashierId: string
  cashier?: Pick<User, 'id' | 'name'>
  locationId: string
  shiftId?: string
  items: OrderItem[]
  splitBills?: SplitBill[]
  createdAt: string
  updatedAt: string
}

// ============ Split Bill ============

export interface SplitBillItem {
  id: string
  splitBillId: string
  orderItemId: string
  orderItem?: OrderItem
  quantity: number
  amount: number
}

export interface SplitBill {
  id: string
  billNumber: string
  splitType: 'EQUAL' | 'BY_ITEM'
  amount: number
  paymentMethod?: string
  paidAmount?: number
  changeAmount?: number
  isPaid: boolean
  paidAt?: string
  label?: string
  orderId: string
  items: SplitBillItem[]
  createdAt: string
}

// ============ Table Transfer ============

export interface TableTransfer {
  id: string
  orderId: string
  fromTable: string
  toTable: string
  transferredAt: string
}

// ============ Expenses ============

export interface Expense {
  id: string
  description: string
  amount: number
  category?: string
  date: string
  locationId: string
  createdAt: string
  updatedAt: string
}

// ============ Audit Log ============

export interface AuditLog {
  id: string
  action: string
  errorCode?: string
  module: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  message: string
  metadata?: Record<string, unknown>
  userId?: string
  user?: Pick<User, 'id' | 'name'>
  locationId?: string
  ipAddress?: string
  createdAt: string
}

// ============ Cart (client-side) ============

export interface CartItem {
  product: Product
  quantity: number
  notes?: string
  variantSelections?: {
    groupName: string
    optionName: string
    additionalPrice: number
  }[]
}

// ============ Dashboard ============

export interface DashboardStats {
  todaySales: number
  todayOrders: number
  todayExpenses: number
  netIncome: number
}
