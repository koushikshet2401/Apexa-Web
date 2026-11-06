import { db } from '@/lib/db'

export interface ActivityLogInput {
  adminId?: string | null
  adminEmail: string
  action: string
  entityType: string
  entityId: string
  summary: string
  metadata?: Record<string, any>
  ipAddress?: string | null
}

const SENSITIVE_KEY_REGEX = /password|token|secret|jwt|key|authorization|bearer|cookie/i

function sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined

  const cleaned: Record<string, any> = {}
  for (const [key, val] of Object.entries(metadata)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      cleaned[key] = '[REDACTED]'
    } else if (typeof val === 'object' && val !== null) {
      cleaned[key] = sanitizeMetadata(val)
    } else {
      cleaned[key] = val
    }
  }
  return cleaned
}

/**
 * Records an administrative activity log entry.
 * Operates in non-blocking mode: never throws or disrupts calling business logic.
 * Gracefully handles unmigrated baseline database when AdminActivityLog table is pending.
 */
export async function logAdminActivity(input: ActivityLogInput): Promise<any> {
  const safeMetadata = sanitizeMetadata(input.metadata)

  try {
    const entry = await db.adminActivityLog.create({
      data: {
        adminId: input.adminId || null,
        adminEmail: input.adminEmail,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary,
        metadata: safeMetadata ? (safeMetadata as any) : undefined,
        ipAddress: input.ipAddress || null,
      },
    })
    return entry
  } catch (err: any) {
    // If AdminActivityLog table does not exist (P2021) prior to Phase 3 migration deployment,
    // log to standard system output with clear prefix
    if (err?.code === 'P2021') {
      console.info(
        `[ADMIN_AUDIT_LOG] (DB Table Pending Migration): [${input.action}] by <${input.adminEmail}> on ${input.entityType}:${input.entityId} — ${input.summary}`
      )
    } else {
      console.error('[ADMIN_AUDIT_LOG_ERROR]', err?.message || err)
    }
    return null
  }
}
