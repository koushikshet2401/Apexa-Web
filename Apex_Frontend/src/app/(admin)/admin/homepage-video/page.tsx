import React from 'react'
import { db } from '@/lib/db'
import HomepageVideoClient from '@/components/admin/HomepageVideoClient'

export const dynamic = 'force-dynamic'

export default async function AdminHomepageVideoPage() {
  let content = await db.homepageContent.findFirst()

  if (!content) {
    content = await db.homepageContent.create({
      data: {
        heroVideoUrl: null,
        heroVideoThumb: null,
        unveilHeading: null,
        unveilSubtext: null,
      },
    })
  }

  return <HomepageVideoClient initialContent={content} />
}
