import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'

export async function requireAdmin(request: Request) {
  const admin = await getAdminFromRequest(request)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return admin
}
