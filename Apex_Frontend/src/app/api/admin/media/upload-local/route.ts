import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/adminAuth'

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 })
    }

    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Destination: public/uploads/<key>
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadsDir, key)
    const fileDir = path.dirname(filePath)

    await fs.mkdir(fileDir, { recursive: true })
    await fs.writeFile(filePath, buffer)

    return NextResponse.json({
      ok: true,
      publicUrl: `/uploads/${key}`,
      key,
    })
  } catch (error) {
    console.error('Error in local file upload fallback:', error)
    return NextResponse.json({ error: 'Failed to save uploaded file' }, { status: 500 })
  }
}
