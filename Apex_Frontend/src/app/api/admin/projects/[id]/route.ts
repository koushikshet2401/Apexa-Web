import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'
import { reconcileFeaturedLaunches } from '@/lib/launchesQueue'
import { hasForbiddenFinancialFields } from '@/lib/projectValidation'
import { Prisma } from '@prisma/client'

/**
 * GET /api/admin/projects/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.PROPERTIES_READ)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const project = await db.property.findUnique({
      where: { id },
      include: {
        country: true,
        images: { orderBy: { order: 'asc' } },
        services: {
          include: { service: true },
        },
        deals: {
          include: {
            closedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/projects/[id]
 * Descriptive Updates Only. Rejects financial fields with HTTP 400.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.PROPERTIES_UPDATE)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const existing = await db.property.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (existing.isArchived) {
      return NextResponse.json(
        { error: 'Cannot edit an archived project. Restore it first.' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Enforce strict separation: reject forbidden financial fields
    const forbidden = hasForbiddenFinancialFields(body)
    if (forbidden.length > 0) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN_FINANCIAL_FIELDS',
          message: `Financial fields (${forbidden.join(', ')}) cannot be modified via descriptive updates. Use PATCH /api/admin/projects/[id]/price instead.`,
        },
        { status: 400 }
      )
    }

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
    } = body

    let newSlug = existing.slug
    if (slug && slug.trim() !== existing.slug) {
      newSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      const duplicate = await db.property.findUnique({
        where: { slug: newSlug },
      })
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { error: `Slug "${newSlug}" is already taken by another project.` },
          { status: 400 }
        )
      }
    }

    // Quantitative validations
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

    const updateData: any = {
      ...(name !== undefined && { name: name.trim() }),
      ...(slug !== undefined && { slug: newSlug }),
      ...(countryId !== undefined && { countryId: countryId || null }),
      ...(cardLabel !== undefined && { cardLabel: cardLabel || null }),
      ...(tagline !== undefined && { tagline: tagline || null }),
      ...(shortDescription !== undefined && { shortDescription: shortDescription || null }),
      ...(description !== undefined && { description: description || null }),
      ...(type !== undefined && { type }),
      ...(beds !== undefined && { beds: beds || null }),
      ...(baths !== undefined && { baths: baths || null }),
      ...(area !== undefined && { area: area || null }),
      ...(cityName !== undefined && { cityName: cityName || null }),
      ...(locationLine !== undefined && { locationLine: locationLine || null }),
      ...(mainVideoUrl !== undefined && { mainVideoUrl: mainVideoUrl || null }),
      ...(mainVideoThumb !== undefined && { mainVideoThumb: mainVideoThumb || null }),
      ...(mainImage !== undefined && { mainImage: mainImage || null }),
      ...(spaceRoundImage !== undefined && { spaceRoundImage: spaceRoundImage || null }),
      ...(highlights !== undefined && {
        highlights: Array.isArray(highlights) ? highlights : [],
      }),
      ...(layoutVariant !== undefined && {
        layoutVariant: typeof layoutVariant === 'number' ? layoutVariant : parseInt(layoutVariant || '1', 10),
      }),
      ...(bedroomsCount !== undefined && {
        bedroomsCount: bedroomsCount !== null && bedroomsCount !== '' ? parseInt(bedroomsCount, 10) : null,
      }),
      ...(bathroomsCount !== undefined && {
        bathroomsCount: bathroomsCount !== null && bathroomsCount !== '' ? new Prisma.Decimal(bathroomsCount.toString()) : null,
      }),
      ...(areaNumeric !== undefined && {
        areaNumeric: areaNumeric !== null && areaNumeric !== '' ? new Prisma.Decimal(areaNumeric.toString()) : null,
      }),
      ...(areaUnit !== undefined && { areaUnit: areaUnit || 'sqft' }),
      ...(latitude !== undefined && {
        latitude: latitude !== null && latitude !== '' ? parseFloat(latitude.toString()) : null,
      }),
      ...(longitude !== undefined && {
        longitude: longitude !== null && longitude !== '' ? parseFloat(longitude.toString()) : null,
      }),
      ...(mapUrl !== undefined && { mapUrl: mapUrl ? mapUrl.trim() : null }),
      ...(isFeaturedLaunch !== undefined && { isFeaturedLaunch: Boolean(isFeaturedLaunch) }),
      ...(launchOrder !== undefined && {
        launchOrder: launchOrder !== null && launchOrder !== '' ? parseInt(launchOrder, 10) : null,
      }),
      ...(launchDate !== undefined && {
        launchDate: launchDate ? new Date(launchDate) : null,
      }),
      ...(isSpaceInRound !== undefined && { isSpaceInRound: Boolean(isSpaceInRound) }),
      ...(spaceOrder !== undefined && {
        spaceOrder: spaceOrder !== null && spaceOrder !== '' ? parseInt(spaceOrder, 10) : null,
      }),
    }

    // Reconcile services if serviceIds provided
    if (Array.isArray(serviceIds)) {
      await db.propertyService.deleteMany({
        where: { propertyId: id },
      })
      if (serviceIds.length > 0) {
        await db.propertyService.createMany({
          data: serviceIds.map((sid: string) => ({
            propertyId: id,
            serviceId: sid,
          })),
        })
      }
    }

    // Reconcile gallery images if images provided
    if (Array.isArray(images)) {
      await db.propertyImage.deleteMany({
        where: { propertyId: id },
      })
      const validImages = images
        .filter((img: any) => Boolean(img?.url && String(img.url).trim()))
        .map((img: any, idx: number) => ({
          propertyId: id,
          url: String(img.url).trim(),
          alt: img.alt ? String(img.alt).trim() : (img.description ? String(img.description).trim() : null),
          description: img.description ? String(img.description).trim() : (img.alt ? String(img.alt).trim() : null),
          order: typeof img.order === 'number' ? img.order : idx,
        }))
      if (validImages.length > 0) {
        await db.propertyImage.createMany({
          data: validImages,
        })
      }
    }

    const updated = await db.property.update({
      where: { id },
      data: updateData,
      include: {
        country: true,
        images: { orderBy: { order: 'asc' } },
        services: { include: { service: true } },
      },
    })

    // Reconcile featured launches queue if isFeaturedLaunch was modified
    if (isFeaturedLaunch !== undefined) {
      if (Boolean(isFeaturedLaunch)) {
        await reconcileFeaturedLaunches(id)
      } else {
        await reconcileFeaturedLaunches(id, true)
      }
    }

    // Audit Log entry
    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'PROJECT_UPDATED',
      entityType: 'Property',
      entityId: updated.id,
      summary: `Project "${updated.name}" updated (descriptive fields)`,
      metadata: {
        projectId: updated.id,
        updatedFields: Object.keys(updateData),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/projects/[id]
 * Non-destructive soft-delete (archiving). Permanently preserves database record and media files.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.PROPERTIES_DELETE)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const project = await db.property.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.isArchived) {
      return NextResponse.json({ error: 'Project is already archived.' }, { status: 400 })
    }

    let reason = 'Administrative archive'
    try {
      const body = await request.json()
      if (body?.reason && typeof body.reason === 'string') {
        reason = body.reason.trim()
      }
    } catch {
      // Empty or absent body is acceptable
    }

    const archived = await db.property.update({
      where: { id },
      data: {
        isArchived: true,
        isPublished: false,
        isPubliclyVisible: false,
        archivedAt: new Date(),
        archivedById: auth.id,
        archivedReason: reason,
      },
    })

    // Reconcile featured launches queue: remove archived project from launches
    if (archived.isFeaturedLaunch) {
      await reconcileFeaturedLaunches(id, true)
    }

    // Audit Log entry
    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'PROJECT_ARCHIVED',
      entityType: 'Property',
      entityId: archived.id,
      summary: `Project "${archived.name}" moved to Deleted Projects archive: ${reason}`,
      metadata: {
        projectId: archived.id,
        reason,
        archivedAt: archived.archivedAt?.toISOString(),
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Project safely archived to Deleted Projects section.',
      project: archived,
    })
  } catch (error) {
    console.error('Error archiving project:', error)
    return NextResponse.json({ error: 'Failed to archive project' }, { status: 500 })
  }
}
