import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { revalidateOneTeamAndServices } from '@/lib/revalidate'

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.CONTENT_READ)
  if (auth instanceof Response) return auth

  try {
    const services = await db.serviceCategory.findMany({
      include: {
        _count: { select: { properties: true } },
      },
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.CONTENT_UPDATE)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const {
      name,
      slug,
      subtitle,
      tagline,
      description,
      heroDescription,
      image,
      videoUrl,
      architecturalFocus,
      deliverables,
      displayOrder,
      isPublished,
    } = body

    if ([image, videoUrl].some((u) => typeof u === 'string' && u.trim().startsWith('/uploads/'))) {
      return NextResponse.json(
        { error: 'Local /uploads/ storage is disabled. Upload media to Cloudflare R2.' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 })
    }

    const cleanSlug = (slug && slug.trim()) || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    const existing = await db.serviceCategory.findUnique({
      where: { slug: cleanSlug },
    })

    if (existing) {
      return NextResponse.json({ error: `Service with slug "${cleanSlug}" already exists.` }, { status: 400 })
    }

    const parsedFocus = Array.isArray(architecturalFocus)
      ? architecturalFocus.map((s) => String(s).trim()).filter(Boolean)
      : []

    const parsedDeliverables = Array.isArray(deliverables)
      ? deliverables
          .filter((d: any) => d && (d.title || d.description))
          .map((d: any) => ({
            title: String(d.title || '').trim(),
            description: String(d.description || '').trim(),
          }))
      : undefined

    const service = await db.serviceCategory.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        subtitle: subtitle || null,
        tagline: tagline || null,
        description: description || null,
        heroDescription: heroDescription || null,
        image: image || null,
        videoUrl: videoUrl || null,
        architecturalFocus: parsedFocus,
        ...(parsedDeliverables !== undefined ? { deliverables: parsedDeliverables } : {}),
        displayOrder: displayOrder !== undefined && displayOrder !== '' ? parseInt(displayOrder, 10) : 0,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      },
    })

    revalidateOneTeamAndServices([service.slug])

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
