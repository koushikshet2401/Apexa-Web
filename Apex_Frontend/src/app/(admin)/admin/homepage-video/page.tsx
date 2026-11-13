import React from 'react'
import { db } from '@/lib/db'
import { isMissingCmsExtensionError } from '@/lib/mediaAssetStore'
import HomepageVideoClient from '@/components/admin/HomepageVideoClient'

export const dynamic = 'force-dynamic'

export default async function AdminHomepageVideoPage() {
  let content: any = null

  try {
    content = await db.homepageContent.findFirst()
  } catch (err) {
    if (isMissingCmsExtensionError(err)) {
      try {
        const rows = await db.$queryRawUnsafe<any[]>('SELECT * FROM "HomepageContent" LIMIT 1')
        content = rows?.[0] || null
      } catch {
        content = null
      }
    } else {
      throw err
    }
  }

  if (!content) {
    try {
      content = await db.homepageContent.create({
        data: {
          heroVideoUrl: null,
          heroVideoThumb: null,
          unveilHeading: null,
          unveilSubtext: null,
        },
      })
    } catch {
      content = { id: 'fallback', heroVideoUrl: null, heroVideoThumb: null }
    }
  }

  return <HomepageVideoClient initialContent={content} defaultTab="media" />
}
