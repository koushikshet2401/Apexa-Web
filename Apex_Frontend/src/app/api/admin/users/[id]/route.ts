import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS, invalidateAdminCache, revokeAdminSessions } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.USERS_READ)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    let user: any = null
    try {
      user = await db.adminUser.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          lastLoginAt: true,
          roleId: true,
          role: {
            select: { id: true, name: true, description: true },
          },
          createdAt: true,
          updatedAt: true,
        },
      })
    } catch (err: any) {
      if (err?.code === 'P2022' || err?.code === 'P2021') {
        user = await db.adminUser.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      } else {
        throw err
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Administrator not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching admin user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.USERS_UPDATE)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const existing = await db.adminUser.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Administrator not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, roleId, isActive, password } = body

    // LAST ACTIVE SUPER ADMIN PROTECTION
    // If attempting to deactivate this admin, verify that at least one other active super admin remains
    if (isActive === false) {
      try {
        const activeCount = await db.adminUser.count({
          where: {
            isActive: true,
            id: { not: id },
          },
        })
        if (activeCount === 0) {
          return NextResponse.json(
            { error: 'Cannot deactivate the last remaining active administrator.' },
            { status: 400 }
          )
        }
      } catch (err: any) {
        if (err?.code !== 'P2022' && err?.code !== 'P2021') {
          throw err
        }
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name ? name.trim() : null
    if (roleId !== undefined) updateData.roleId = roleId || null
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (password && typeof password === 'string' && password.length >= 8) {
      updateData.passwordHash = await bcrypt.hash(password, 10)
    }

    let updated: any = null
    try {
      updated = await db.adminUser.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          roleId: true,
          updatedAt: true,
        },
      })
    } catch (err: any) {
      if (err?.code === 'P2022' || err?.code === 'P2021') {
        const baselineData: any = {}
        if (name !== undefined) baselineData.name = name ? name.trim() : null
        if (updateData.passwordHash) baselineData.passwordHash = updateData.passwordHash
        updated = await db.adminUser.update({
          where: { id },
          data: baselineData,
          select: {
            id: true,
            email: true,
            name: true,
            updatedAt: true,
          },
        })
      } else {
        throw err
      }
    }

    // Invalidate session cache immediately so deactivation or role change takes effect instantly
    if (isActive === false) {
      revokeAdminSessions(id)
    } else {
      invalidateAdminCache(id)
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1')

    logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: isActive === false ? 'ADMIN_DEACTIVATED' : 'ADMIN_UPDATED',
      entityType: 'AdminUser',
      entityId: id,
      summary: `Updated admin account ${existing.email}${isActive === false ? ' (DEACTIVATED)' : ''}`,
      ipAddress: ip,
    }).catch(() => {})

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating admin user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.USERS_DELETE)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params

    // Prevent self-deletion
    if (auth.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own administrator account while logged in.' },
        { status: 400 }
      )
    }

    const existing = await db.adminUser.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Administrator not found' }, { status: 404 })
    }

    // Protect last administrator
    const totalCount = await db.adminUser.count()
    if (totalCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last remaining administrator account.' },
        { status: 400 }
      )
    }

    await db.adminUser.delete({ where: { id } })

    // Revoke all sessions for deleted user
    revokeAdminSessions(id)

    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1')

    logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'ADMIN_DELETED',
      entityType: 'AdminUser',
      entityId: id,
      summary: `Deleted administrator account: ${existing.email}`,
      ipAddress: ip,
    }).catch(() => {})

    return NextResponse.json({ ok: true, message: 'Administrator deleted' })
  } catch (error) {
    console.error('Error deleting admin user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
