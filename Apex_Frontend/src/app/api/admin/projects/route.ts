import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'
import { reconcileFeaturedLaunches } from '@/lib/launchesQueue'
import { validateAndNormalizePricing } from '@/lib/projectValidation'
import { syncProjectMediaAssets } from '@/lib/mediaAssetStore'
import { revalidatePropertyCms } from '@/lib/revalidate'
import { Prisma } from '@prisma/client'

/**
 * GET /api/admin/projects
 * Lists projects with filtering for lifecycle status, country, and currency.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.PROPERTIES_READ)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all' // 'all', 'published', 'draft', 'archived', 'sold'
    const country = searchParams.get('country')
    const currency = searchParams.get('currency')

    const where: any = {}

    // Status filtering rules
    if (status === 'published') {
      where.isPublished = true
      where.isArchived = false
    } else if (status === 'draft') {
      where.isDraft = true
      where.isArchived = false
    } else if (status === 'archived') {
      where.isArchived = true
    } else if (status === 'sold') {
      where.hasCompletedDeal = true
      where.isArchived = false
    } else {
      // 'all' active listings: excludes soft-deleted archived records
      where.isArchived = false
    }

    if (country) {
      where.OR = [
        { countryId: country },
        { country: { slug: country.toLowerCase() } },
      ]
    }

    if (currency) {
      where.askingCurrency = currency.toUpperCase()
    }

    const projects = await db.property.findMany({
      where,
      include: {
        country: {
          select: { id: true, name: true, displayName: true, slug: true },
        },
        services: {
          include: {
            service: { select: { id: true, name: true, slug: true } },
          },
        },
        deals: {
          where: { status: 'COMPLETED' },
          select: { id: true, dealRef: true, status: true, actualSalePrice: true, saleCurrency: true, keepPubliclyVisible: true },
        },
        _count: {
          select: { images: true, enquiries: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error listing projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

/**
 * POST /api/admin/projects
 * Creates a project in DRAFT state with validated pricing state.
 */
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.PROPERTIES_CREATE)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const {
      name,
      slug,
      countryId,
      cardLabel,
      tagline,
      shortDescription,
      description,
      type,
      beds,
      baths,
      area,
      cityName,
      locationLine,
      mainVideoUrl,
      mainVideoThumb,
      mainImage,
      spaceRoundImage,
      highlights,
      layoutVariant,
      bedroomsCount,
      bathroomsCount,
      areaNumeric,
      areaUnit,
      latitude,
      longitude,
      mapUrl,
      isFeaturedLaunch,
      launchOrder,
      launchDate,
      isSpaceInRound,
      spaceOrder,
      serviceIds,
      images,
      // Pricing fields
      isPOA,
      askingPriceNumeric,
      askingCurrency,
      isPublished,
      price: customPrice,
    } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const trimmedName = name.trim()
    const generatedSlug = (slug && slug.trim()) || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    const existing = await db.property.findUnique({
      where: { slug: generatedSlug },
    })

    if (existing) {
      return NextResponse.json({ error: `Slug "${generatedSlug}" is already in use.` }, { status: 400 })
    }

    // Validate Pricing State (Priced, POA, or Unpriced)
    const pricingResult = validateAndNormalizePricing({
      isPOA,
      askingPriceNumeric,
      askingCurrency,
    })

    if (!pricingResult.valid) {
      return NextResponse.json({ error: pricingResult.error }, { status: 400 })
    }

    const pricing = pricingResult.data

    // Validate quantitative specs
    if (latitude !== undefined && latitude !== null) {
      const lat = typeof latitude === 'number' ? latitude : parseFloat(latitude)
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return NextResponse.json({ error: 'Latitude must be between -90 and 90 degrees.' }, { status: 400 })
      }
    }

    if (longitude !== undefined && longitude !== null) {
      const lng = typeof longitude === 'number' ? longitude : parseFloat(longitude)
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return NextResponse.json({ error: 'Longitude must be between -180 and 180 degrees.' }, { status: 400 })
      }
    }

    // Guard against legacy local /uploads/ paths on newly created projects
    const candidateUrls = [
      mainImage,
      mainVideoUrl,
      mainVideoThumb,
      spaceRoundImage,
      ...(Array.isArray(images) ? images.map((img: any) => (typeof img === 'string' ? img : img?.url)) : []),
    ]
    if (candidateUrls.some((u) => typeof u === 'string' && u.trim().startsWith('/uploads/'))) {
      return NextResponse.json(
        { error: 'Local /uploads/ storage is disabled. Upload all property media to Cloudflare R2.' },
        { status: 400 }
      )
    }

    const normalizedGalleryImages = Array.isArray(images)
      ? images
          .filter((img: any) => (typeof img === 'string' ? img.trim() : Boolean(img?.url && img.url.trim())))
          .map((img: any, idx: number) => ({
            url: typeof img === 'string' ? img.trim() : img.url.trim(),
            alt: typeof img === 'string' ? null : (img.alt || img.description || null),
            description: typeof img === 'string' ? null : (img.description || img.alt || null),
            order: typeof img?.order === 'number' ? img.order : idx,
          }))
      : []

    const project = await db.$transaction(async (tx) => {
      const created = await tx.property.create({
        data: {
          name: trimmedName,
          slug: generatedSlug,
          countryId: countryId || null,
          cardLabel: cardLabel || null,
          tagline: tagline || null,
          shortDescription: shortDescription || null,
          description: description || null,
          type: type || 'residential',
          beds: beds || null,
          baths: baths || null,
          area: area || null,
          price: (customPrice && typeof customPrice === 'string' && customPrice.trim()) ? customPrice.trim() : pricing.formattedPrice,
          askingPriceNumeric: pricing.askingPriceNumeric !== null ? new Prisma.Decimal(pricing.askingPriceNumeric) : null,
          askingCurrency: pricing.askingCurrency,
          isPOA: pricing.isPOA,
          bedroomsCount: bedroomsCount !== undefined && bedroomsCount !== null && bedroomsCount !== '' ? parseInt(bedroomsCount, 10) : null,
          bathroomsCount: bathroomsCount !== undefined && bathroomsCount !== null && bathroomsCount !== '' ? new Prisma.Decimal(bathroomsCount.toString()) : null,
          areaNumeric: areaNumeric !== undefined && areaNumeric !== null && areaNumeric !== '' ? new Prisma.Decimal(areaNumeric.toString()) : null,
          areaUnit: areaUnit || 'sqft',
          latitude: latitude !== undefined && latitude !== null && latitude !== '' ? parseFloat(latitude.toString()) : null,
          longitude: longitude !== undefined && longitude !== null && longitude !== '' ? parseFloat(longitude.toString()) : null,
          mapUrl: mapUrl ? mapUrl.trim() : null,
          cityName: cityName || null,
          locationLine: locationLine || null,
          mainVideoUrl: mainVideoUrl || null,
          mainVideoThumb: mainVideoThumb || null,
          mainImage: mainImage || null,
          spaceRoundImage: spaceRoundImage || null,
          highlights: Array.isArray(highlights) ? highlights : [],
          layoutVariant: typeof layoutVariant === 'number' ? layoutVariant : parseInt(layoutVariant || '1', 10),
          // Canonical lifecycle initialization (supports publishing directly on creation)
          isDraft: !Boolean(isPublished),
          isPublished: Boolean(isPublished),
          isPubliclyVisible: Boolean(isPublished),
          isArchived: false,
          hasCompletedDeal: false,
          isFeaturedLaunch: Boolean(isFeaturedLaunch),
          launchOrder: launchOrder !== null && launchOrder !== undefined && launchOrder !== '' ? parseInt(launchOrder, 10) : null,
          launchDate: launchDate ? new Date(launchDate) : null,
          isSpaceInRound: Boolean(isSpaceInRound),
          spaceOrder: spaceOrder !== null && spaceOrder !== undefined && spaceOrder !== '' ? parseInt(spaceOrder, 10) : null,
          images: normalizedGalleryImages.length > 0
            ? { create: normalizedGalleryImages }
            : undefined,
          services: Array.isArray(serviceIds) && serviceIds.length > 0
            ? {
                create: serviceIds.map((sid: string) => ({
                  service: { connect: { id: sid } },
                })),
              }
            : undefined,
        },
        include: {
          country: true,
          images: true,
          services: { include: { service: true } },
        },
      })

      await syncProjectMediaAssets(tx, {
        propertyId: created.id,
        mainImage: created.mainImage,
        mainVideoUrl: created.mainVideoUrl,
        spaceRoundImage: created.spaceRoundImage,
        galleryImages: normalizedGalleryImages,
      })

      return created
    })

    // Reconcile featured launches queue if marked as featured launch
    if (Boolean(isFeaturedLaunch)) {
      await reconcileFeaturedLaunches(project.id)
    }

    // Audit Log entry
    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'PROJECT_CREATED',
      entityType: 'Property',
      entityId: project.id,
      summary: `Project "${project.name}" created in DRAFT state (${pricing.pricingState})`,
      metadata: {
        projectId: project.id,
        name: project.name,
        slug: project.slug,
        pricingState: pricing.pricingState,
        askingPriceNumeric: pricing.askingPriceNumeric,
        askingCurrency: pricing.askingCurrency,
        isPOA: pricing.isPOA,
      },
    })

    revalidatePropertyCms({
      slug: project.slug,
      countrySlug: project.country?.slug,
      serviceSlugs: project.services.map((ps) => ps.service?.slug).filter(Boolean) as string[],
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
