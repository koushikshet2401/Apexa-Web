import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
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
    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching homepage content:', error)
    return NextResponse.json({ error: 'Failed to fetch homepage content' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const {
      heroVideoUrl,
      heroVideoThumb,
      unveilHeading,
      unveilSubtext,
      oneTeamVideoUrl,
      advisoryVideoUrl,
    } = body

    let content = await db.homepageContent.findFirst()
    if (!content) {
      content = await db.homepageContent.create({
        data: {
          heroVideoUrl: heroVideoUrl || null,
          heroVideoThumb: heroVideoThumb || null,
          unveilHeading: unveilHeading || null,
          unveilSubtext: unveilSubtext || null,
          oneTeamVideoUrl: oneTeamVideoUrl || null,
          advisoryVideoUrl: advisoryVideoUrl || null,
        },
      })
    } else {
      content = await db.homepageContent.update({
        where: { id: content.id },
        data: {
          ...(heroVideoUrl !== undefined && { heroVideoUrl: heroVideoUrl || null }),
          ...(heroVideoThumb !== undefined && { heroVideoThumb: heroVideoThumb || null }),
          ...(unveilHeading !== undefined && { unveilHeading: unveilHeading || null }),
          ...(unveilSubtext !== undefined && { unveilSubtext: unveilSubtext || null }),
          ...(oneTeamVideoUrl !== undefined && { oneTeamVideoUrl: oneTeamVideoUrl || null }),
          ...(advisoryVideoUrl !== undefined && { advisoryVideoUrl: advisoryVideoUrl || null }),
        },
      })
    }

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error updating homepage content:', error)
    return NextResponse.json({ error: 'Failed to update homepage content' }, { status: 500 })
  }
}
