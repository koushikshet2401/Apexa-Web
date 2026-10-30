import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminFromRequest(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await db.adminUser.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 401 })
    }

    return NextResponse.json(admin)
  } catch (error) {
    console.error('Error fetching admin profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
