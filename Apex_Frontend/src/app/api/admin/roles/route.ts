import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS, PROPOSED_DEFAULT_ROLES } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.ROLES_READ)
  if (auth instanceof Response) return auth

  try {
    let roles: any[] = []
    try {
      roles = await db.adminRole.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { users: true },
          },
        },
        orderBy: { name: 'asc' },
      })
    } catch (err: any) {
      if (err?.code === 'P2021' || err?.code === 'P2022') {
        // Fallback: return proposed default roles
        roles = Object.values(PROPOSED_DEFAULT_ROLES).map((r, i) => ({
          id: `role-${r.name.toLowerCase()}`,
          name: r.name,
          description: r.description,
          isSystem: r.isSystem,
          permissions: r.permissions.map((p) => {
            const [module, action] = p.split(':')
            return {
              permission: { id: `perm-${p.toLowerCase()}`, module, action, description: p },
            }
          }),
          _count: { users: i === 0 ? 1 : 0 },
        }))
      } else {
        throw err
      }
    }

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Error fetching admin roles:', error)
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }
}
