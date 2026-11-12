import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isMissingCmsExtensionError } from '@/lib/mediaAssetStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let countries: any[] = []
    try {
      countries = await db.country.findMany({
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
          description: true,
          cardImage: true,
          heroVideoUrl: true,
          heroVideoThumb: true,
          displayOrder: true,
          collectionMedia: {
            select: {
              coverImageUrl: true,
              heroVideoUrl: true,
            },
          },
        },
      })
    } catch (err) {
      if (isMissingCmsExtensionError(err)) {
        countries = await db.country.findMany({
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
            description: true,
            cardImage: true,
            heroVideoUrl: true,
            heroVideoThumb: true,
            displayOrder: true,
          },
        })
      } else {
        throw err
      }
    }

    const data = countries.map((c) => {
      const resolvedCover = c.collectionMedia?.coverImageUrl ?? c.cardImage ?? c.heroVideoThumb ?? null
      const resolvedHeroVideo = c.collectionMedia?.heroVideoUrl ?? c.heroVideoUrl ?? null
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        displayName: c.displayName,
        region: c.region,
        cities: c.cities,
        tagline: c.tagline,
        description: c.description,
        cardImage: resolvedCover,
        heroVideoUrl: resolvedHeroVideo,
        heroVideoThumb: resolvedCover,
        displayOrder: c.displayOrder,
        href: `/collection/${c.slug}`,
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in /api/public/collection-countries:', error)
    return NextResponse.json({ error: 'Failed to fetch collection countries' }, { status: 500 })
  }
}
