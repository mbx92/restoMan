// ============ Auth ============

export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'CASHIER'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ============ Products ============

export interface Category {
  id: string
  name: string
  icon?: string
  color?: string
  sortOrder: number
  isActive: boolean
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
  categoryId: string
  category?: Category
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
  totalAmount: number
  paymentMethod?: 'CASH' | 'DEBIT' | 'CREDIT_CARD' | 'EWALLET' | 'QRIS'
  paidAmount?: number
  changeAmount?: number
  paidAt?: string
  notes?: string
  customerName?: string
  cashierId: string
  cashier?: User
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

// ============ Expenses ============

export interface Expense {
  id: string
  description: string
  amount: number
  category?: string
  date: string
  createdAt: string
  updatedAt: string
}

// ============ Cart (client-side) ============

export interface CartItem {
  product: Product
  quantity: number
  notes?: string
}

// ============ Dashboard ============

export interface DashboardStats {
  todaySales: number
  todayOrders: number
  todayExpenses: number
  netIncome: number
}
