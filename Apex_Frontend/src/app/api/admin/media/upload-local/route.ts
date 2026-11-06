import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { validateUploadPath, safeWriteUploadFile } from '@/lib/pathSecurity'

export async function PUT(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.MEDIA_UPLOAD)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const pathCheck = await validateUploadPath(key, uploadsDir)

    if (!pathCheck.valid) {
      return NextResponse.json(
        { error: pathCheck.error || 'Invalid file path traversal attempt.' },
        { status: 400 }
      )
    }

    const safePath = pathCheck.safePath
    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await safeWriteUploadFile(safePath, buffer, uploadsDir)

    return NextResponse.json({
      ok: true,
      publicUrl: `/uploads/${key.replace(/\\/g, '/')}`,
      key,
    })
  } catch (error) {
    console.error('Error in local file upload fallback:', error)
    return NextResponse.json({ error: 'Failed to save uploaded file' }, { status: 500 })
  }
}
