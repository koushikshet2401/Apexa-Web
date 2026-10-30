import React from 'react'
import { db } from '@/lib/db'
import HomepageContentClient from '@/components/admin/HomepageContentClient'

export const dynamic = 'force-dynamic'

export default async function AdminHomepageContentPage() {
  let content = await db.homepageContent.findFirst()

  if (!content) {
    content = await db.homepageContent.create({
      data: {
        heroVideoUrl: '/videos/hero-unveil.mp4',
        heroVideoThumb: '/images/hero-thumb.jpg',
        unveilHeading: 'Elevating Global Horizons',
        unveilSubtext: 'A curated portfolio of ultra-prime residences across the world’s most dynamic markets.',
        oneTeamVideoUrl: '/videos/one-team.mp4',
        advisoryVideoUrl: '/videos/advisory.mp4',
      },
    })
  }

  return <HomepageContentClient initialContent={content} />
}
