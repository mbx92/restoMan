/**
 * Custom error codes for RestoMan POS
 * Format: MODULE-XXX
 */
export const ErrorCodes = {
  // Auth — AUTH-0xx
  AUTH_INVALID_CREDENTIALS: { code: 'AUTH-001', status: 401, message: 'Email atau password salah' },
  AUTH_UNAUTHENTICATED: { code: 'AUTH-002', status: 401, message: 'Sesi tidak valid, silakan login kembali' },
  AUTH_FORBIDDEN: { code: 'AUTH-003', status: 403, message: 'Anda tidak memiliki akses untuk aksi ini' },
  AUTH_USER_INACTIVE: { code: 'AUTH-004', status: 403, message: 'Akun Anda dinonaktifkan' },
  AUTH_PERMISSION_DENIED: { code: 'AUTH-005', status: 403, message: 'Permission tidak mencukupi' },

  // Tenant — TNT-0xx
  TNT_NOT_FOUND: { code: 'TNT-001', status: 404, message: 'Tenant tidak ditemukan' },
  TNT_INACTIVE: { code: 'TNT-002', status: 403, message: 'Tenant tidak aktif' },

  // Location — LOC-0xx
  LOC_NOT_FOUND: { code: 'LOC-001', status: 404, message: 'Lokasi tidak ditemukan' },
  LOC_INACTIVE: { code: 'LOC-002', status: 403, message: 'Lokasi tidak aktif' },
  LOC_NOT_SET: { code: 'LOC-003', status: 400, message: 'Lokasi belum dipilih' },

  // Shift — SFT-0xx
  SFT_NOT_OPEN: { code: 'SFT-001', status: 400, message: 'Shift kasir belum dibuka. Buka shift terlebih dahulu' },
  SFT_ALREADY_OPEN: { code: 'SFT-002', status: 400, message: 'Sudah ada shift yang masih terbuka' },
  SFT_NOT_FOUND: { code: 'SFT-003', status: 404, message: 'Shift tidak ditemukan' },
  SFT_ALREADY_CLOSED: { code: 'SFT-004', status: 400, message: 'Shift sudah ditutup' },
  SFT_HAS_PENDING: { code: 'SFT-005', status: 400, message: 'Masih ada order pending, selesaikan terlebih dahulu' },

  // Order — ORD-0xx
  ORD_EMPTY_ITEMS: { code: 'ORD-001', status: 400, message: 'Order harus memiliki minimal 1 item' },
  ORD_NOT_FOUND: { code: 'ORD-002', status: 404, message: 'Order tidak ditemukan' },
  ORD_ALREADY_PROCESSED: { code: 'ORD-003', status: 400, message: 'Order sudah diproses' },
  ORD_ONLY_PENDING: { code: 'ORD-004', status: 400, message: 'Hanya order pending yang bisa diproses' },
  ORD_INSUFFICIENT_PAYMENT: { code: 'ORD-005', status: 400, message: 'Jumlah bayar kurang' },
  ORD_INVALID_ACTION: { code: 'ORD-006', status: 400, message: 'Action tidak valid' },
  ORD_PRODUCT_NOT_FOUND: { code: 'ORD-007', status: 400, message: 'Produk tidak ditemukan' },
  ORD_TYPE_NOT_ALLOWED: { code: 'ORD-008', status: 400, message: 'Tipe order tidak diizinkan untuk lokasi ini' },
  ORD_TABLE_REQUIRED: { code: 'ORD-009', status: 400, message: 'Nomor meja wajib diisi untuk dine-in' },
  ORD_ALREADY_PENDING: { code: 'ORD-010', status: 400, message: 'Order sudah berstatus pending' },

  // Split Bill — SPL-0xx
  SPL_ORDER_NOT_PENDING: { code: 'SPL-001', status: 400, message: 'Split bill hanya untuk order pending' },
  SPL_INVALID_COUNT: { code: 'SPL-002', status: 400, message: 'Jumlah split tidak valid (minimal 2)' },
  SPL_ITEMS_REQUIRED: { code: 'SPL-003', status: 400, message: 'Item untuk split wajib diisi' },

  // Product — PRD-0xx
  PRD_NOT_FOUND: { code: 'PRD-001', status: 404, message: 'Produk tidak ditemukan' },
  PRD_NAME_REQUIRED: { code: 'PRD-002', status: 400, message: 'Nama dan kategori wajib diisi' },
  PRD_OUT_OF_STOCK: { code: 'PRD-003', status: 400, message: 'Stok produk habis' },

  // Category — CAT-0xx
  CAT_NOT_FOUND: { code: 'CAT-001', status: 404, message: 'Kategori tidak ditemukan' },
  CAT_NAME_REQUIRED: { code: 'CAT-002', status: 400, message: 'Nama kategori wajib diisi' },

  // Setting — SET-0xx
  SET_NOT_FOUND: { code: 'SET-001', status: 404, message: 'Setting tidak ditemukan' },

  // Expense — EXP-0xx
  EXP_REQUIRED: { code: 'EXP-001', status: 400, message: 'Deskripsi dan jumlah wajib diisi' },
  EXP_NOT_FOUND: { code: 'EXP-002', status: 404, message: 'Pengeluaran tidak ditemukan' },

  // Table — TBL-0xx
  TBL_NO_TABLE: { code: 'TBL-001', status: 400, message: 'Order tidak memiliki meja' },
  TBL_SAME_TABLE: { code: 'TBL-002', status: 400, message: 'Meja tujuan sama dengan meja asal' },
} as const

export type ErrorCode = keyof typeof ErrorCodes

export function throwError(errorKey: ErrorCode, extra?: string): never {
  const err = ErrorCodes[errorKey]
  const message = extra ? `${err.message}: ${extra}` : err.message
  throw createError({
    statusCode: err.status,
    statusMessage: `[${err.code}] ${message}`,
  })
}
