import prisma from './prisma'

/**
 * Generate next sequential number with atomic increment.
 * Uses database-level upsert to prevent race conditions.
 *
 * @returns formatted string e.g. "ORD-20260310-0001"
 */
export async function nextSequence(locationId: string, prefix: string, date?: Date): Promise<string> {
  const d = date || new Date()
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '')

  // Atomic upsert + increment using raw SQL to prevent race conditions
  const result = await prisma.$queryRawUnsafe<Array<{ last_number: number }>>(
    `INSERT INTO sequences ("id", "locationId", "prefix", "date", "lastNumber")
     VALUES (gen_random_uuid(), $1, $2, $3, 1)
     ON CONFLICT ("locationId", "prefix", "date")
     DO UPDATE SET "lastNumber" = sequences."lastNumber" + 1
     RETURNING "lastNumber" AS last_number`,
    locationId,
    prefix,
    dateStr,
  )

  const num = result[0].last_number
  return `${prefix}-${dateStr}-${String(num).padStart(4, '0')}`
}
