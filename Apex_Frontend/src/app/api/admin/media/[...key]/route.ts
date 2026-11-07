import { NextRequest, NextResponse } from 'next/server'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import path from 'path'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { r2, isR2Configured, getR2BucketName } from '@/lib/r2'
import { validateUploadPath, safeUnlinkUploadFile } from '@/lib/pathSecurity'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.MEDIA_DELETE)
  if (auth instanceof Response) return auth

  try {
    const { key: keySegments } = await params
    const rawKey = Array.isArray(keySegments) ? keySegments.join('/') : keySegments

    if (!rawKey) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    if (isR2Configured()) {
      const decodedKey = decodeURIComponent(rawKey)
      const command = new DeleteObjectCommand({
        Bucket: getR2BucketName(),
        Key: decodedKey,
      })
      await r2.send(command)
      return NextResponse.json({ ok: true, message: 'Deleted from R2' })
    }

    // Local fallback deletion with containment validation
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const pathCheck = await validateUploadPath(rawKey, uploadsDir)

    if (!pathCheck.valid) {
      return NextResponse.json(
        { error: pathCheck.error || 'Invalid file key: Directory traversal attempt blocked.' },
        { status: 400 }
      )
    }

    try {
      await safeUnlinkUploadFile(pathCheck.safePath, uploadsDir)
    } catch {
      // File may already be absent or deletion failed
    }

    return NextResponse.json({ ok: true, message: 'Deleted locally' })
  } catch (error) {
    console.error('Error deleting media object:', error)
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
  }
}
