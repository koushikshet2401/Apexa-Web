import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isMissingCmsExtensionError } from '@/lib/mediaAssetStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [homepage, services, countries] = await Promise.all([
      db.homepageContent.findFirst(),
      db.serviceCategory.findMany({
        where: { isPublished: true },
        orderBy: { displayOrder: 'asc' },
        select: { id: true, slug: true, name: true, subtitle: true, image: true, videoUrl: true },
      }),
      db.country.findMany({
        where: { isPublished: true },
        orderBy: { displayOrder: 'asc' },
        select: {
          id: true,
          slug: true,
          name: true,
          displayName: true,
          region: true,
          cities: true,
          tagline: true,
        },
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
      unveilLabel: homepage?.unveilLabel || null,
      unveilHeading: homepage?.unveilHeading || null,
      unveilSubtext: homepage?.unveilSubtext || null,
      oneTeamVideoUrl: oneTeam?.centerVideoUrl ?? homepage?.oneTeamVideoUrl ?? null,
      advisoryVideoUrl: homepage?.advisoryVideoUrl || null,
      collectionEyebrow: homepage?.collectionEyebrow || null,
      collectionHeading: homepage?.collectionHeading || null,
      collectionDescription: homepage?.collectionDescription || null,
      spacesHeading: homepage?.spacesHeading || null,
      spacesDescription: homepage?.spacesDescription || null,
      advisoryEyebrow: homepage?.advisoryEyebrow || null,
      advisoryHeading: homepage?.advisoryHeading || null,
      advisoryDescription: homepage?.advisoryDescription || null,
      advisoryFooterNote: homepage?.advisoryFooterNote || null,
      contactEyebrow: homepage?.contactEyebrow || null,
      contactHeading: homepage?.contactHeading || null,
      contactDescription: homepage?.contactDescription || null,
      contactPhone: homepage?.contactPhone || null,
      contactEmail: homepage?.contactEmail || null,
      contactOfficeAddress: homepage?.contactOfficeAddress || null,
      contactWhatsappNumber: homepage?.contactWhatsappNumber || null,
      contactFormHeading: homepage?.contactFormHeading || null,
      contactFormSubtext: homepage?.contactFormSubtext || null,
      contactSuccessHeading: homepage?.contactSuccessHeading || null,
      contactSuccessSubtext: homepage?.contactSuccessSubtext || null,
      oneTeam: {
        sectionEyebrow: oneTeam?.sectionEyebrow || null,
        sectionHeading: oneTeam?.sectionHeading || null,
        sectionDescription: oneTeam?.sectionDescription || null,
        bannerLabel: oneTeam?.bannerLabel || null,
        bannerHeading: oneTeam?.bannerHeading || null,
        luxuryVillasImageUrl: oneTeam?.luxuryVillasImageUrl ?? luxuryVillasService?.image ?? null,
        commercialImageUrl: oneTeam?.commercialImageUrl ?? commercialService?.image ?? null,
        skyResidencesImageUrl: oneTeam?.skyResidencesImageUrl ?? skyService?.image ?? null,
        waterfrontImageUrl: oneTeam?.waterfrontImageUrl ?? waterfrontService?.image ?? null,
        centerVideoUrl: oneTeam?.centerVideoUrl ?? homepage?.oneTeamVideoUrl ?? null,
      },
      services,
      countries,
    })
  } catch (error) {
    console.error('Error in /api/public/homepage:', error)
    return NextResponse.json({ error: 'Failed to fetch homepage content' }, { status: 500 })
  }
}
