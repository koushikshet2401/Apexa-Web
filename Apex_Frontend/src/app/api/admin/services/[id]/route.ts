import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireAnyPermission, requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.CONTENT_READ)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const service = await db.serviceCategory.findUnique({
      where: { id },
      include: {
        properties: {
          include: { property: true },
        },
      },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAnyPermission(request, [PERMISSIONS.SERVICES_UPDATE, PERMISSIONS.CONTENT_UPDATE])
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const existing = await db.serviceCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

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

    let newSlug = existing.slug
    if (slug && slug.trim() !== existing.slug) {
      newSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      const duplicate = await db.serviceCategory.findUnique({
        where: { slug: newSlug },
      })
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: `Slug "${newSlug}" is already in use.` }, { status: 400 })
      }
    }

    const parsedFocus =
      architecturalFocus !== undefined
        ? Array.isArray(architecturalFocus)
          ? architecturalFocus.map((s) => String(s).trim()).filter(Boolean)
          : []
        : undefined

    const parsedDeliverables =
      deliverables !== undefined
        ? Array.isArray(deliverables)
          ? deliverables
              .filter((d: any) => d && (d.title || d.description || d.detail))
              .map((d: any) => ({
                title: String(d.title || '').trim(),
                description: String(d.description || d.detail || '').trim(),
              }))
          : Prisma.DbNull
        : undefined

    const updated = await db.serviceCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && { slug: newSlug }),
        ...(subtitle !== undefined && { subtitle: subtitle || null }),
        ...(tagline !== undefined && { tagline: tagline || null }),
        ...(description !== undefined && { description: description || null }),
        ...(heroDescription !== undefined && { heroDescription: heroDescription || null }),
        ...(image !== undefined && { image: image || null }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
        ...(parsedFocus !== undefined && { architecturalFocus: parsedFocus }),
        ...(parsedDeliverables !== undefined && { deliverables: parsedDeliverables }),
        ...(displayOrder !== undefined && {
          displayOrder: displayOrder !== '' ? parseInt(displayOrder, 10) : 0,
        }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
      },
    })

    try {
      revalidatePath('/')
      revalidatePath('/services')
      revalidatePath(`/services/${updated.slug}`)
      revalidatePath('/admin/services')
      revalidatePath('/admin/one-team')
    } catch (revalidateErr) {
      console.warn('Revalidation warning:', revalidateErr)
    }

    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'UPDATE',
      entityType: 'ServiceCategory',
      entityId: updated.id,
      summary: `Updated service category "${updated.name}" (${updated.slug})`,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.CONTENT_UPDATE)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const existing = await db.serviceCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Cascade delete propertyServices association
    await db.propertyService.deleteMany({ where: { serviceId: id } })
    await db.serviceCategory.delete({ where: { id } })

    return NextResponse.json({ ok: true, message: 'Service deleted' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
