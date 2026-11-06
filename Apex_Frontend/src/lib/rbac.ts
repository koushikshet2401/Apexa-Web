import { NextResponse } from 'next/server'
import { getAdminFromRequest, AdminSession } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * System Permissions across all modules
 */
export const PERMISSIONS = {
  // Properties
  PROPERTIES_READ: 'PROPERTIES:READ',
  PROPERTIES_CREATE: 'PROPERTIES:CREATE',
  PROPERTIES_UPDATE: 'PROPERTIES:UPDATE',
  PROPERTIES_PRICE_UPDATE: 'PROPERTIES:PRICE_UPDATE',
  PROPERTIES_DELETE: 'PROPERTIES:DELETE',
  PROPERTIES_PUBLISH: 'PROPERTIES:PUBLISH',

  // Deals
  DEALS_READ: 'DEALS:READ',
  DEALS_CREATE: 'DEALS:CREATE',
  DEALS_UPDATE: 'DEALS:UPDATE',
  DEALS_CLOSE: 'DEALS:CLOSE',

  // Enquiries
  ENQUIRIES_READ: 'ENQUIRIES:READ',
  ENQUIRIES_UPDATE: 'ENQUIRIES:UPDATE',
  ENQUIRIES_ASSIGN: 'ENQUIRIES:ASSIGN',
  ENQUIRIES_REPLY: 'ENQUIRIES:REPLY',
  ENQUIRIES_CLOSE: 'ENQUIRIES:CLOSE',
  ENQUIRIES_NOTES: 'ENQUIRIES:NOTES',
  ENQUIRIES_DELETE: 'ENQUIRIES:DELETE',

  // Users & Roles
  USERS_READ: 'USERS:READ',
  USERS_CREATE: 'USERS:CREATE',
  USERS_UPDATE: 'USERS:UPDATE',
  USERS_DELETE: 'USERS:DELETE',
  USERS_MANAGE_ROLES: 'USERS:MANAGE_ROLES',
  ROLES_READ: 'ROLES:READ',

  // Media
  MEDIA_READ: 'MEDIA:READ',
  MEDIA_UPLOAD: 'MEDIA:UPLOAD',
  MEDIA_DELETE: 'MEDIA:DELETE',

  // Website Content (Homepage, Countries, Services)
  CONTENT_READ: 'CONTENT:READ',
  CONTENT_UPDATE: 'CONTENT:UPDATE',

  // Analytics
  ANALYTICS_READ: 'ANALYTICS:READ',
} as const

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS]

/**
 * Proposed Default System Roles
 */
export interface RoleDefinition {
  name: string
  description: string
  permissions: PermissionKey[]
  isSystem: boolean
}

export const PROPOSED_DEFAULT_ROLES: Record<string, RoleDefinition> = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    description: 'Complete unrestricted administrative access across all system modules, finances, deals, and role assignment.',
    permissions: Object.values(PERMISSIONS) as PermissionKey[],
    isSystem: true,
  },
  PROPERTY_MANAGER: {
    name: 'PROPERTY_MANAGER',
    description: 'Manages property portfolio, launches, round spaces, media assets, and deal closures.',
    permissions: [
      PERMISSIONS.PROPERTIES_READ,
      PERMISSIONS.PROPERTIES_CREATE,
      PERMISSIONS.PROPERTIES_UPDATE,
      PERMISSIONS.PROPERTIES_PRICE_UPDATE,
      PERMISSIONS.PROPERTIES_DELETE,
      PERMISSIONS.PROPERTIES_PUBLISH,
      PERMISSIONS.DEALS_READ,
      PERMISSIONS.DEALS_CREATE,
      PERMISSIONS.DEALS_UPDATE,
      PERMISSIONS.DEALS_CLOSE,
      PERMISSIONS.ENQUIRIES_READ,
      PERMISSIONS.ENQUIRIES_UPDATE,
      PERMISSIONS.ENQUIRIES_ASSIGN,
      PERMISSIONS.ENQUIRIES_REPLY,
      PERMISSIONS.ENQUIRIES_CLOSE,
      PERMISSIONS.ENQUIRIES_NOTES,
      PERMISSIONS.MEDIA_READ,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_DELETE,
      PERMISSIONS.CONTENT_READ,
    ],
    isSystem: false,
  },
  CONTENT_EDITOR: {
    name: 'CONTENT_EDITOR',
    description: 'Curates public property descriptions, media assets, homepage content, countries, and service categories.',
    permissions: [
      PERMISSIONS.PROPERTIES_READ,
      PERMISSIONS.PROPERTIES_CREATE,
      PERMISSIONS.PROPERTIES_UPDATE,
      PERMISSIONS.MEDIA_READ,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.CONTENT_READ,
      PERMISSIONS.CONTENT_UPDATE,
    ],
    isSystem: false,
  },
  ENQUIRY_ADVISOR: {
    name: 'ENQUIRY_ADVISOR',
    description: 'Handles client and investor enquiries, notes, communications, and customer status workflows.',
    permissions: [
      PERMISSIONS.PROPERTIES_READ,
      PERMISSIONS.ENQUIRIES_READ,
      PERMISSIONS.ENQUIRIES_UPDATE,
      PERMISSIONS.ENQUIRIES_ASSIGN,
      PERMISSIONS.ENQUIRIES_REPLY,
      PERMISSIONS.ENQUIRIES_CLOSE,
      PERMISSIONS.ENQUIRIES_NOTES,
    ],
    isSystem: false,
  },
  COMPLIANCE_OFFICER: {
    name: 'COMPLIANCE_OFFICER',
    description: 'Read-only audit access to financial valuations, deals, admin activity logs, and system operations.',
    permissions: [
      PERMISSIONS.PROPERTIES_READ,
      PERMISSIONS.DEALS_READ,
      PERMISSIONS.ANALYTICS_READ,
      PERMISSIONS.ENQUIRIES_READ,
    ],
    isSystem: false,
  },
}

/**
 * Ensures all system permissions, roles, and default role-permission mappings
 * are registered in the database. Idempotent and safe to run on startup or during test setup.
 */
export async function ensureDefaultRolesAndPermissions(prismaClient: any = db) {
  // 1. Seed or update AdminPermission records
  const permissionIdMap = new Map<string, string>()
  for (const permKey of Object.values(PERMISSIONS)) {
    const [module, action] = permKey.split(':')
    const id = `perm_${module.toLowerCase()}_${action.toLowerCase()}`
    const record = await prismaClient.adminPermission.upsert({
      where: { module_action: { module, action } },
      update: { description: permKey },
      create: {
        id,
        module,
        action,
        description: permKey,
      },
    })
    permissionIdMap.set(permKey, record.id)
  }

  // 2. Seed or update AdminRole and RolePermission records
  for (const [roleKey, roleDef] of Object.entries(PROPOSED_DEFAULT_ROLES)) {
    const roleId = `role_${roleKey.toLowerCase()}`
    const role = await prismaClient.adminRole.upsert({
      where: { name: roleDef.name },
      update: {
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
      create: {
        id: roleId,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
    })

    // Upsert role permissions
    for (const permKey of roleDef.permissions) {
      const permId = permissionIdMap.get(permKey)
      if (permId) {
        await prismaClient.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permId,
          },
        })
      }
    }
  }
}

// =========================================================================
// SESSION REVOCATION & PERMISSION CACHE
// =========================================================================

interface CachedSessionState {
  isActive: boolean
  role: string
  permissions: string[]
  sessionVersion: number
  cachedAt: number
}

const sessionCache = new Map<string, CachedSessionState>()
const revokedTokens = new Set<string>()
const inMemorySessionVersions = new Map<string, number>()
const CACHE_TTL_MS = 30 * 1000 // 30 seconds TTL

// ============================================================================
// TEMPORARY BASELINE COMPATIBILITY CONFIGURATION
// To be removed/disabled immediately upon Phase 3 migration deployment.
// Only the single seeded baseline admin is permitted to receive fallback Super Admin access.
// Under no circumstances should any other account receive SUPER_ADMIN privileges in baseline mode.
// ============================================================================
export const APPROVED_BASELINE_ADMIN_EMAIL = 'admin@apexpacificholdings.com'
export const APPROVED_BASELINE_ADMIN_ID = 'cmvw891lo0000ue8kuji2laoa'

export function revokeSessionToken(token: string) {
  if (token) revokedTokens.add(token)
}

export function getAdminSessionVersion(adminId: string): number {
  return inMemorySessionVersions.get(adminId) || 1
}

export function revokeAdminSessions(adminId: string): number {
  if (adminId) {
    const nextVersion = getAdminSessionVersion(adminId) + 1
    inMemorySessionVersions.set(adminId, nextVersion)
    invalidateAdminCache(adminId)
    return nextVersion
  }
  return 1
}

export function invalidateAdminCache(adminId: string) {
  if (adminId) {
    for (const key of Array.from(sessionCache.keys())) {
      if (key === adminId || key.startsWith(`${adminId}:`)) {
        sessionCache.delete(key)
      }
    }
  }
}

/**
 * Validates the live database state of an authenticated admin session.
 * Prevents deactivated accounts or revoked roles from continuing with stale JWT claims.
 */
export async function verifyLiveAdminSession(
  session: AdminSession,
  rawToken?: string
): Promise<{ valid: boolean; error?: string; liveSession?: AdminSession }> {
  if (!session || !session.id) {
    return { valid: false, error: 'Unauthorized: Invalid session payload.' }
  }

  // 1. Check in-memory token revocation (individual-device logout)
  if (rawToken && revokedTokens.has(rawToken)) {
    return { valid: false, error: 'Unauthorized: Session has been logged out.' }
  }

  // 2. Check session version (all-device logout & account-wide revocation)
  // Enforces exact equality (===) so that subsequent logins CANNOT reactivate or resurrect older JWTs.
  const currentExpectedVersion = getAdminSessionVersion(session.id)
  const tokenVersion = typeof session.sessionVersion === 'number' ? session.sessionVersion : 1
  if (tokenVersion !== currentExpectedVersion) {
    return { valid: false, error: 'Unauthorized: Session has expired or been revoked.' }
  }

  // 3. Fast cache lookup
  const now = Date.now()
  const cacheKey = `${session.id}:${session.email?.toLowerCase() || ''}`
  const cached = sessionCache.get(cacheKey)
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    if (!cached.isActive) {
      return { valid: false, error: 'Forbidden: Account has been deactivated.' }
    }
    if (tokenVersion !== cached.sessionVersion) {
      return { valid: false, error: 'Unauthorized: Session has expired or been revoked.' }
    }
    return {
      valid: true,
      liveSession: {
        ...session,
        role: cached.role,
        permissions: cached.permissions,
        sessionVersion: cached.sessionVersion,
      },
    }
  }

  // 4. Query live PostgreSQL database
  try {
    const user = await db.adminUser.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        isActive: true,
        roleId: true,
        role: {
          select: {
            name: true,
            permissions: {
              select: {
                permission: {
                  select: { module: true, action: true },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return { valid: false, error: 'Unauthorized: Administrator account no longer exists.' }
    }

    if (user.isActive === false) {
      sessionCache.set(cacheKey, {
        isActive: false,
        role: 'DEACTIVATED',
        permissions: [],
        sessionVersion: currentExpectedVersion,
        cachedAt: now,
      })
      return { valid: false, error: 'Forbidden: Account has been deactivated.' }
    }

    const livePermissions: string[] = []
    if (user.role?.permissions && Array.isArray(user.role.permissions)) {
      for (const rp of user.role.permissions) {
        if (rp.permission?.module && rp.permission?.action) {
          livePermissions.push(`${rp.permission.module}:${rp.permission.action}`)
        }
      }
    }

    const roleName = user.role?.name || session.role || 'SUPER_ADMIN'
    sessionCache.set(cacheKey, {
      isActive: true,
      role: roleName,
      permissions: livePermissions,
      sessionVersion: currentExpectedVersion,
      cachedAt: now,
    })

    return {
      valid: true,
      liveSession: {
        ...session,
        role: roleName,
        permissions: livePermissions,
        sessionVersion: currentExpectedVersion,
      },
    }
  } catch (err: any) {
    // STRICT BASELINE SCHEMA COMPATIBILITY ERROR HANDLING:
    // ONLY catch known missing-column (P2022) or missing-table (P2021) errors.
    // NEVER treat connection failures, query timeouts, or arbitrary exceptions as baseline fallback.
    if (err?.code === 'P2022' || err?.code === 'P2021') {
      try {
        const baselineUser = await db.adminUser.findUnique({
          where: { id: session.id },
          select: { id: true, email: true },
        })

        if (!baselineUser) {
          return { valid: false, error: 'Unauthorized: Administrator account no longer exists.' }
        }

        // STRICT BASELINE FALLBACK CHECK:
        // Only the explicitly verified primary administrator account is granted temporary fallback SUPER_ADMIN.
        // Both database record and presentation session must strictly match BOTH the approved admin ID AND approved email.
        const isApprovedAdmin =
          baselineUser.id === APPROVED_BASELINE_ADMIN_ID &&
          baselineUser.email.toLowerCase() === APPROVED_BASELINE_ADMIN_EMAIL.toLowerCase() &&
          session.id === APPROVED_BASELINE_ADMIN_ID &&
          session.email?.toLowerCase() === APPROVED_BASELINE_ADMIN_EMAIL.toLowerCase()

        if (!isApprovedAdmin) {
          return {
            valid: false,
            error: 'Forbidden: Baseline fallback authorization is restricted exclusively to the verified primary administrator.',
          }
        }

        // Baseline administrator holds default legacy admin role unless explicitly scoped to a restricted role
        const fallbackRole = session.role || 'SUPER_ADMIN'
        const fallbackPermissions =
          fallbackRole === 'SUPER_ADMIN' || fallbackRole === 'admin'
            ? (Object.values(PERMISSIONS) as string[])
            : (session.permissions || [])

        sessionCache.set(cacheKey, {
          isActive: true,
          role: fallbackRole,
          permissions: fallbackPermissions,
          sessionVersion: currentExpectedVersion,
          cachedAt: now,
        })

        return {
          valid: true,
          liveSession: {
            ...session,
            role: fallbackRole,
            permissions: fallbackPermissions,
            sessionVersion: currentExpectedVersion,
          },
        }
      } catch (baselineErr) {
        console.error('[AUTH_SECURITY] Unexpected error during baseline user lookup:', baselineErr)
        throw baselineErr
      }
    }

    // Rethrow any unexpected database failure to ensure secure rejection (500) rather than bypass
    console.error('[AUTH_SECURITY] Unexpected database error in session verification:', err)
    throw err
  }
}

/**
 * Evaluates whether an authenticated administrator holds a specific permission.
 */
export function hasPermission(admin: AdminSession, permission: PermissionKey): boolean {
  if (!admin) return false

  // Super Admin holds full access
  if (admin.role === 'SUPER_ADMIN' || admin.role === 'admin') {
    return true
  }

  if (Array.isArray(admin.permissions) && admin.permissions.includes(permission)) {
    return true
  }

  return false
}

/**
 * Server-side guard: Requires authenticated admin session.
 * Re-validates against live database to enforce active status and prevent revoked access.
 */
export async function requireAdmin(request: Request): Promise<AdminSession | Response> {
  const session = await getAdminFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Extract raw token for revocation check
  let rawToken: string | undefined
  if ('cookies' in request && typeof (request as any).cookies?.get === 'function') {
    rawToken = (request as any).cookies.get('apex_admin_session')?.value
  } else {
    const cookieHeader = request.headers.get('cookie') || ''
    const match = cookieHeader.match(/(?:^|;\s*)apex_admin_session=([^;]*)/)
    if (match) rawToken = decodeURIComponent(match[1])
  }

  try {
    const check = await verifyLiveAdminSession(session, rawToken)
    if (!check.valid) {
      const status = check.error?.startsWith('Forbidden') ? 403 : 401
      return NextResponse.json({ error: check.error || 'Unauthorized' }, { status })
    }
    return check.liveSession || session
  } catch {
    return NextResponse.json({ error: 'Internal server error verifying session' }, { status: 500 })
  }
}

/**
 * Server-side guard: Requires specific permission key.
 * Verifies live role and permission grants in database.
 */
export async function requirePermission(
  request: Request,
  permission: PermissionKey
): Promise<AdminSession | Response> {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  if (!hasPermission(auth, permission)) {
    return NextResponse.json(
      { error: `Forbidden: Insufficient permissions for [${permission}]` },
      { status: 403 }
    )
  }

  return auth
}

/**
 * Server-side guard: Requires specific role name.
 */
export async function requireRole(
  request: Request,
  requiredRole: string
): Promise<AdminSession | Response> {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  if (auth.role !== 'SUPER_ADMIN' && auth.role !== requiredRole) {
    return NextResponse.json(
      { error: `Forbidden: Requires role [${requiredRole}]` },
      { status: 403 }
    )
  }

  return auth
}
