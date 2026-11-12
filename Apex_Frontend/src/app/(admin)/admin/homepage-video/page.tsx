import React from 'react'
import { db } from '@/lib/db'
import HomepageVideoClient from '@/components/admin/HomepageVideoClient'

export const dynamic = 'force-dynamic'

export default async function AdminHomepageVideoPage() {
  let content = await db.homepageContent.findFirst()

  if (!content) {
    content = await db.homepageContent.create({
      data: {
        heroVideoUrl: '/videos/home-page.mp4',
        heroVideoThumb: '/images/skyResidenceImage.png',
        unveilHeading: 'PRIVATE ARCHITECTURE & ESTATES',
        unveilSubtext: 'Bespoke residences sculpted to their terrain across the world’s most coveted territories.',
      },
    })
  }

  return <HomepageVideoClient initialContent={content} />
}
