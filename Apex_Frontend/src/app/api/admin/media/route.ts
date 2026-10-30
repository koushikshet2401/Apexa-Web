import { NextRequest, NextResponse } from 'next/server'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { promises as fs } from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/adminAuth'
import { r2, isR2Configured, R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/r2'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') // optional: "properties", "countries", etc.

    // If R2 is configured, query R2 bucket
    if (isR2Configured()) {
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: folder && folder !== 'all' ? `${folder}/` : undefined,
      })

      const response = await r2.send(command)
      const objects = (response.Contents || []).map((item) => {
        const key = item.Key || ''
        const publicUrl = R2_PUBLIC_URL
          ? `${R2_PUBLIC_URL}/${key}`
          : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`

        const isVideo = key.endsWith('.mp4') || key.endsWith('.mov')
        const contentType = isVideo ? 'video/mp4' : 'image/jpeg'

        return {
          key,
          url: publicUrl,
          size: item.Size || 0,
          lastModified: item.LastModified?.toISOString() || new Date().toISOString(),
          contentType,
        }
      })

      return NextResponse.json(objects)
    }

    // Local file fallback if R2 credentials are not set
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const results: Array<{
      key: string
      url: string
      size: number
      lastModified: string
      contentType: string
    }> = []

    try {
      const scanDir = async (currentDir: string, relativePath: string) => {
        const entries = await fs.readdir(currentDir, { withFileTypes: true })
        for (const entry of entries) {
          const res = path.resolve(currentDir, entry.name)
          const rel = path.join(relativePath, entry.name).replace(/\\/g, '/')
          if (entry.isDirectory()) {
            await scanDir(res, rel)
          } else {
            const stats = await fs.stat(res)
            const isVideo = entry.name.endsWith('.mp4')
            results.push({
              key: rel,
              url: `/uploads/${rel}`,
              size: stats.size,
              lastModified: stats.mtime.toISOString(),
              contentType: isVideo ? 'video/mp4' : 'image/jpeg',
            })
          }
        }
      }

      await scanDir(uploadsDir, '')
    } catch {
      // Directory may not exist yet if no uploads made
    }

    // Filter by folder if requested
    const filtered =
      folder && folder !== 'all'
        ? results.filter((item) => item.key.startsWith(`${folder}/`))
        : results

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Error listing media objects:', error)
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 })
  }
}
