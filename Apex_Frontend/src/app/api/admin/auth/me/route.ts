import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, APPROVED_BASELINE_ADMIN_EMAIL, APPROVED_BASELINE_ADMIN_ID } from '@/lib/rbac'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (session instanceof Response) return session

  try {

    // Try Phase 3 query with role and permissions; fallback to baseline if columns are not yet deployed
    let admin: any = null
    try {
      admin = await db.adminUser.findUnique({
        where: { id: session.id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              permissions: {
                select: {
                  permission: {
                    select: {
                      module: true,
                      action: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    } catch (err: any) {
      if (err?.code === 'P2022' || err?.code === 'P2021') {
        admin = await db.adminUser.findUnique({
          where: { id: session.id },
          select: {
            id: true,
            email: true,
            name: true,
          },
        })
      } else {
        throw err
      }
    }

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 401 })
    }

    if (admin.isActive === false) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    const permissions: string[] = []
    if (admin.role?.permissions && Array.isArray(admin.role.permissions)) {
      for (const rp of admin.role.permissions) {
        if (rp.permission?.module && rp.permission?.action) {
          permissions.push(`${rp.permission.module}:${rp.permission.action}`)
        }
      }
    }

    const isApprovedAdmin =
      admin.id === APPROVED_BASELINE_ADMIN_ID &&
      admin.email?.toLowerCase() === APPROVED_BASELINE_ADMIN_EMAIL.toLowerCase() &&
      session.id === APPROVED_BASELINE_ADMIN_ID &&
      session.email?.toLowerCase() === APPROVED_BASELINE_ADMIN_EMAIL.toLowerCase()
    const resolvedRole = admin.role?.name || (isApprovedAdmin ? 'SUPER_ADMIN' : 'RESTRICTED_ADMIN')
    const resolvedDescription = admin.role?.description || (isApprovedAdmin ? 'Full Administrative Access' : 'Restricted Baseline Access')

    return NextResponse.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: resolvedRole,
      roleDescription: resolvedDescription,
      permissions: permissions.length > 0 ? permissions : (isApprovedAdmin ? (session.permissions || []) : []),
    })
  } catch (error) {
    console.error('Error fetching admin profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
