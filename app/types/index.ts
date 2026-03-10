export interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  icon?: string
  color?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  type: string
  icon?: string
  color?: string
  parentId?: string
  children?: Category[]
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  amount: number
  type: string
  description?: string
  date: string
  accountId: string
  account?: Account
  categoryId: string
  category?: Category
  transferToId?: string
  transferTo?: Account
  tags?: Tag[]
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
}

export interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  period: string
  startDate: string
  endDate?: string
  categoryId?: string
  category?: Category
  createdAt: string
  updatedAt: string
}

export interface Investment {
  id: string
  name: string
  type: string
  initialAmount: number | string
  currentValue: number | string
  ticker?: string
  quantity?: number | string | null
  platform?: string
  notes?: string
  startDate: string
  createdAt: string
  updatedAt: string
}

export interface DebtInstallment {
  id: string
  debtId: string
  sequence: number
  amount: number
  dueDate: string
  isPaid: boolean
  paidAt?: string
  createdAt: string
  updatedAt: string
}

export interface Debt {
  id: string
  name: string
  type: string
  totalAmount: number
  paidAmount: number
  counterparty?: string
  notes?: string
  dueDate?: string
  durationMonths?: number | null
  interestRate?: number | null
  installments?: DebtInstallment[]
  createdAt: string
  updatedAt: string
}
