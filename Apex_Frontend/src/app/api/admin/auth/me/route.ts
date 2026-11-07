import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdmin, APPROVED_BASELINE_ADMIN_EMAIL, APPROVED_BASELINE_ADMIN_ID, invalidateAdminCache } from '@/lib/rbac'
import { db } from '@/lib/db'
import { logAdminActivity } from '@/lib/activityLog'

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

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin(request)
  if (session instanceof Response) return session

  try {
    const body = await request.json()
    const { name, currentPassword, newPassword } = body

    const user = await db.adminUser.findUnique({
      where: { id: session.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim()
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password.' }, { status: 400 })
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!isMatch) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters long.' }, { status: 400 })
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10)
    }

    const updated = await db.adminUser.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    invalidateAdminCache(session.id)

    await logAdminActivity({
      adminId: session.id,
      adminEmail: session.email,
      action: 'ADMIN_PROFILE_UPDATED',
      entityType: 'AdminUser',
      entityId: session.id,
      summary: `Administrator "${session.email}" updated personal account profile/credentials.`,
    })

    return NextResponse.json({ ok: true, admin: updated })
  } catch (error) {
    console.error('Error updating admin profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
