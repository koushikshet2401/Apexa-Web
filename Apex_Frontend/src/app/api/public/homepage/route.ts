import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isMissingCmsExtensionError } from '@/lib/mediaAssetStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [homepage, services] = await Promise.all([
      db.homepageContent.findFirst(),
      db.serviceCategory.findMany({
        where: { isPublished: true },
        orderBy: { displayOrder: 'asc' },
        select: { slug: true, name: true, image: true, videoUrl: true },
      }),
    ])

    let oneTeam: any = null
    try {
      oneTeam = await db.oneTeamContent.findFirst({ orderBy: { createdAt: 'asc' } })
    } catch (err) {
      if (!isMissingCmsExtensionError(err)) throw err
    }

    const luxuryVillasService = services.find((s) => s.slug === 'luxury-villas')
    const commercialService = services.find((s) => s.slug === 'commercial-properties')
    const skyService = services.find((s) => s.slug === 'sky-residences')
    const waterfrontService = services.find((s) => s.slug === 'waterfront-residences')

    return NextResponse.json({
      heroVideoUrl: homepage?.heroVideoUrl || null,
      heroVideoThumb: homepage?.heroVideoThumb || null,
      unveilHeading: homepage?.unveilHeading || null,
      unveilSubtext: homepage?.unveilSubtext || null,
      oneTeamVideoUrl: oneTeam?.centerVideoUrl ?? homepage?.oneTeamVideoUrl ?? null,
      advisoryVideoUrl: homepage?.advisoryVideoUrl || null,
      oneTeam: {
        luxuryVillasImageUrl: oneTeam?.luxuryVillasImageUrl ?? luxuryVillasService?.image ?? null,
        commercialImageUrl: oneTeam?.commercialImageUrl ?? commercialService?.image ?? null,
        skyResidencesImageUrl: oneTeam?.skyResidencesImageUrl ?? skyService?.image ?? null,
        waterfrontImageUrl: oneTeam?.waterfrontImageUrl ?? waterfrontService?.image ?? null,
        centerVideoUrl: oneTeam?.centerVideoUrl ?? homepage?.oneTeamVideoUrl ?? null,
      },
      services,
    })
  } catch (error) {
    console.error('Error in /api/public/homepage:', error)
    return NextResponse.json({ error: 'Failed to fetch homepage content' }, { status: 500 })
  }
}
