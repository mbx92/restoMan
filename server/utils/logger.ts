import prisma from './prisma'
import type { H3Event } from 'h3'

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LogEntry {
  action: string
  module: string
  level?: LogLevel
  message: string
  errorCode?: string
  metadata?: Record<string, unknown>
  userId?: string
  locationId?: string
}

/**
 * Write an audit log entry to the database
 */
export async function auditLog(event: H3Event | null, entry: LogEntry) {
  const ipAddress = event ? getRequestIP(event, { xForwardedFor: true }) || '' : ''
  const userAgent = event ? getRequestHeader(event, 'user-agent') || '' : ''

  await prisma.auditLog.create({
    data: {
      action: entry.action,
      module: entry.module,
      level: entry.level || 'INFO',
      message: entry.message,
      errorCode: entry.errorCode || null,
      metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : undefined,
      userId: entry.userId || null,
      locationId: entry.locationId || null,
      ipAddress,
      userAgent,
    },
  }).catch((err) => {
    // Don't let logging failures crash the app
    console.error('[AuditLog] Failed to write:', err.message)
  })
}

/**
 * Shorthand log helpers
 */
export const logger = {
  info(event: H3Event | null, module: string, action: string, message: string, extra?: Partial<LogEntry>) {
    return auditLog(event, { module, action, message, level: 'INFO', ...extra })
  },
  warn(event: H3Event | null, module: string, action: string, message: string, extra?: Partial<LogEntry>) {
    return auditLog(event, { module, action, message, level: 'WARN', ...extra })
  },
  error(event: H3Event | null, module: string, action: string, message: string, extra?: Partial<LogEntry>) {
    return auditLog(event, { module, action, message, level: 'ERROR', ...extra })
  },
}
