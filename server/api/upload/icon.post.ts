import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
}
const MAX_SIZE = 500 * 1024 // 500KB

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file')

  if (!file?.data) {
    throw createError({ statusCode: 400, statusMessage: 'File tidak ditemukan' })
  }

  const ext = file.type ? ALLOWED_TYPES[file.type] : undefined
  if (!ext) {
    throw createError({ statusCode: 400, statusMessage: 'Tipe file tidak didukung. Gunakan PNG, JPG, SVG, atau WebP' })
  }

  if (file.data.byteLength > MAX_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'Ukuran file maksimal 500KB' })
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const dir = join(process.cwd(), 'public', 'uploads', 'icons')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), file.data)

  return { url: `/uploads/icons/${filename}` }
})
