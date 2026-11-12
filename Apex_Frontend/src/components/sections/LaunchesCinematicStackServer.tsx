import { db } from '@/lib/db'
import { reconcileFeaturedLaunches } from '@/lib/launchesQueue'
import { isMissingCmsExtensionError } from '@/lib/mediaAssetStore'
import {
  LaunchesCinematicStack,
  VideoLaunch,
  CollectionCountry,
  OneTeamServiceItem,
  OneTeamMediaProps,
} from './LaunchesCinematicStack'
import { PropertyItem } from '@/data/properties'

export async function LaunchesCinematicStackServer() {
  let dbLaunches: any[] = []
  let dbCountries: any[] = []
  let dbSpaceProps: any[] = []
  let dbHomepageContent: any = null
  let dbServices: any[] = []
  let dbOneTeam: any = null
  const startTime = performance.now()

  try {
    const fetchCountries = async () => {
      try {
        return await db.country.findMany({
          where: { isPublished: true },
          orderBy: { displayOrder: 'asc' },
          include: { collectionMedia: true },
        })
      } catch (err) {
        if (isMissingCmsExtensionError(err)) {
          return await db.country.findMany({
            where: { isPublished: true },
            orderBy: { displayOrder: 'asc' },
          })
        }
        throw err
      }
    }

    const fetchOneTeam = async () => {
      try {
        return await db.oneTeamContent.findFirst({
          orderBy: { createdAt: 'asc' },
        })
      } catch (err) {
        if (isMissingCmsExtensionError(err)) return null
        throw err
      }
    }

    const results = await Promise.all([
      db.property.findMany({
        where: {
          isPublished: true,
          isPubliclyVisible: true,
          isArchived: false,
          isFeaturedLaunch: true,
        },
        orderBy: [
          { launchOrder: 'asc' },
          { launchDate: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 3,
        include: {
          country: {
            select: {
              slug: true,
              displayName: true,
              name: true,
            },
          },
        },
      }),

      fetchCountries(),

      db.property.findMany({
        where: {
          isPublished: true,
          isPubliclyVisible: true,
          isArchived: false,
          isSpaceInRound: true,
        },
        orderBy: { spaceOrder: 'asc' },
        include: {
          country: true,
          images: { orderBy: { order: 'asc' } },
        },
      }),

      db.homepageContent.findFirst(),

      db.serviceCategory.findMany({
        where: { isPublished: true },
        orderBy: { displayOrder: 'asc' },
        select: {
          id: true,
          slug: true,
          name: true,
          subtitle: true,
          image: true,
          videoUrl: true,
        },
      }),

      fetchOneTeam(),
    ])

    const elapsed = Math.round(performance.now() - startTime)
    dbLaunches = results[0]
    dbCountries = results[1]
    dbSpaceProps = results[2]
    dbHomepageContent = results[3]
    dbServices = results[4]
    dbOneTeam = results[5]

    if (dbLaunches.length < 3) {
      await reconcileFeaturedLaunches()
      dbLaunches = await db.property.findMany({
        where: {
          isPublished: true,
          isPubliclyVisible: true,
          isArchived: false,
          isFeaturedLaunch: true,
        },
        orderBy: [
          { launchOrder: 'asc' },
          { launchDate: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 3,
        include: {
          country: {
            select: {
              slug: true,
              displayName: true,
              name: true,
            },
          },
        },
      })
    }

    console.log(
      `[Database Timing] Homepage data fetched in ${elapsed}ms (Launches: ${dbLaunches?.length || 0}, Countries: ${dbCountries?.length || 0}, Spaces: ${dbSpaceProps?.length || 0}, Services: ${dbServices?.length || 0})`
    )
  } catch (error) {
    const elapsed = Math.round(performance.now() - startTime)
    console.warn(
      `[Database Timing] Homepage DB query failed after ${elapsed}ms:`,
      error instanceof Error ? error.message : error
    )
  }

  const launches: VideoLaunch[] = dbLaunches.map((p, idx) => {
    const countrySlug = p.country?.slug || 'dubai'
    return {
      id: p.id,
      number: `0${idx + 1}`,
      tag: `FEATURED LAUNCH · 0${idx + 1} OF 0${dbLaunches.length}`,
      title: p.name,
      location: p.locationLine || p.cityName || p.country?.displayName || '',
      type: p.type || '',
      beds: p.beds || '',
      price: p.price || '',
      videoSrc: p.mainVideoUrl || '',
      fallbackSrc: p.mainImage || '',
      href: `/collection/${countrySlug}/${p.slug}`,
    }
  })

  const countries: CollectionCountry[] = dbCountries.map((c) => {
    const countryKey =
      c.slug === 'dubai' || c.slug === 'uae'
        ? 'UAE'
        : c.displayName || c.name || c.slug

    const resolvedCover = c.collectionMedia?.coverImageUrl ?? c.cardImage ?? c.heroVideoThumb ?? ''

    return {
      id: c.id,
      countryCode: c.slug === 'dubai' ? 'AE' : c.slug.slice(0, 2).toUpperCase(),
      countryKey,
      countryName: c.name,
      displayName: c.displayName || c.name,
      region: c.region,
      title: `${c.displayName || c.name} Portfolio`,
      category: c.tagline ? c.tagline.toUpperCase() : '',
      location: [c.cities, c.name].filter(Boolean).join(', ').toUpperCase(),
      specs: c.cities || '',
      image: resolvedCover,
      href: `/collection/${c.slug}`,
      cities: c.cities,
      description: c.description || '',
    }
  })

  const spaceProperties: PropertyItem[] = dbSpaceProps.map((p) => {
    const countrySlug = p.country?.slug || 'dubai'

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      cardLabel: p.cardLabel || p.name.toUpperCase(),
      category: p.type || '',
      country: p.country?.displayName || p.country?.name || '',
      city: p.cityName || '',
      type: p.type || 'residential',
      beds: p.beds || '',
      baths: p.baths || '',
      area: p.area || '',
      price: p.price || '',
      tagline: p.tagline || '',
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      highlights: p.highlights || [],
      image: p.spaceRoundImage || p.mainImage || p.images[0]?.url || '',
      gallery: p.images.map((img: { url: string }) => img.url),
      layoutVariant: p.layoutVariant || 1,
      lat: 0,
      lng: 0,
      href: `/collection/${countrySlug}/${p.slug}`,
    } as PropertyItem
  })

  const services: OneTeamServiceItem[] = dbServices.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    subtitle: s.subtitle,
    image: s.image,
    videoUrl: s.videoUrl,
  }))

  const luxuryVillasSvc = services.find((s) => s.slug === 'luxury-villas')
  const commercialSvc = services.find((s) => s.slug === 'commercial-properties')
  const skyResidencesSvc = services.find((s) => s.slug === 'sky-residences')
  const waterfrontSvc = services.find((s) => s.slug === 'waterfront-residences')

  const oneTeamContent: OneTeamMediaProps = {
    luxuryVillasImageUrl: dbOneTeam?.luxuryVillasImageUrl ?? luxuryVillasSvc?.image ?? null,
    commercialImageUrl: dbOneTeam?.commercialImageUrl ?? commercialSvc?.image ?? null,
    skyResidencesImageUrl: dbOneTeam?.skyResidencesImageUrl ?? skyResidencesSvc?.image ?? null,
    waterfrontImageUrl: dbOneTeam?.waterfrontImageUrl ?? waterfrontSvc?.image ?? null,
    centerVideoUrl: dbOneTeam?.centerVideoUrl ?? dbHomepageContent?.oneTeamVideoUrl ?? null,
  }

  return (
    <LaunchesCinematicStack
      launches={launches}
      countries={countries}
      spaceProperties={spaceProperties}
      homepageContent={dbHomepageContent}
      services={services}
      oneTeamContent={oneTeamContent}
    />
  )
}
