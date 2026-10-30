import { NextRequest, NextResponse } from 'next/server'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { promises as fs } from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/adminAuth'
import { r2, isR2Configured, R2_BUCKET_NAME } from '@/lib/r2'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const { key: keySegments } = await params
    const rawKey = Array.isArray(keySegments) ? keySegments.join('/') : keySegments
    const decodedKey = decodeURIComponent(rawKey)

    if (!decodedKey) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    if (isR2Configured()) {
      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: decodedKey,
      })
      await r2.send(command)
      return NextResponse.json({ ok: true, message: 'Deleted from R2' })
    }

    // Local fallback deletion
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadsDir, decodedKey)

    try {
      await fs.unlink(filePath)
    } catch {
      // File may already be absent
    }

    return NextResponse.json({ ok: true, message: 'Deleted locally' })
  } catch (error) {
    console.error('Error deleting media object:', error)
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
  }
}
