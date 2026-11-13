import { db } from '@/lib/db'
import { isMissingCmsExtensionError } from '@/lib/mediaAssetStore'

export interface ServiceDeliverable {
  title: string
  detail: string
}

export interface ServiceItem {
  id: string
  number: string
  slug: string
  title: string
  subtitle: string
  tagline: string
  description: string
  heroDescription: string
  image: string
  videoUrl?: string | null
  iconType: 'villa' | 'sky' | 'commercial'
  route: string
  architecturalFocus: string[]
  deliverables: ServiceDeliverable[]
}

export function inferServiceIconType(slug: string): ServiceItem['iconType'] {
  if (slug.includes('villa')) return 'villa'
  if (slug.includes('sky') || slug.includes('waterfront')) return 'sky'
  return 'commercial'
}

function normalizeDeliverables(raw: unknown): ServiceDeliverable[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const title = typeof record.title === 'string' ? record.title.trim() : ''
      const detailRaw =
        typeof record.detail === 'string'
          ? record.detail
          : typeof record.description === 'string'
            ? record.description
            : ''
      const detail = detailRaw.trim()
      if (!title && !detail) return null
      return { title, detail }
    })
    .filter((entry): entry is ServiceDeliverable => entry !== null)
}

function normalizeFocusList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

export function mapDbServiceToItem(row: {
  id: string
  slug: string
  name: string
  subtitle: string | null
  tagline: string | null
  description: string | null
  heroDescription: string | null
  image: string | null
  videoUrl?: string | null
  displayOrder: number
  architecturalFocus?: unknown
  deliverables?: unknown
}, indexFallback = 0): ServiceItem {
  const ord = row.displayOrder || indexFallback + 1
  return {
    id: row.id,
    number: ord < 10 ? `0${ord}` : `${ord}`,
    slug: row.slug,
    title: row.name,
    subtitle: row.subtitle || '',
    tagline: row.tagline || '',
    description: row.description || '',
    heroDescription: row.heroDescription || row.description || '',
    image: row.image || '',
    videoUrl: row.videoUrl || null,
    iconType: inferServiceIconType(row.slug),
    route: `/services/${row.slug}`,
    architecturalFocus: normalizeFocusList(row.architecturalFocus),
    deliverables: normalizeDeliverables(row.deliverables),
  }
}

export async function fetchPublishedServicesFromDb(): Promise<ServiceItem[]> {
  try {
    const rows = await db.serviceCategory.findMany({
      where: { isPublished: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        subtitle: true,
        tagline: true,
        description: true,
        heroDescription: true,
        image: true,
        videoUrl: true,
        displayOrder: true,
        architecturalFocus: true,
        deliverables: true,
      },
    })
    return rows.map((row, idx) => mapDbServiceToItem(row, idx))
  } catch (error) {
    if (!isMissingCmsExtensionError(error)) {
      console.error('Failed to load published services:', error)
      return []
    }
    try {
      const rows = await db.serviceCategory.findMany({
        where: { isPublished: true },
        orderBy: { displayOrder: 'asc' },
        select: {
          id: true,
          slug: true,
          name: true,
          subtitle: true,
          tagline: true,
          description: true,
          heroDescription: true,
          image: true,
          videoUrl: true,
          displayOrder: true,
        },
      })
      return rows.map((row, idx) => mapDbServiceToItem(row, idx))
    } catch (innerError) {
      console.error('Failed to load base published services:', innerError)
      return []
    }
  }
}

export async function fetchServiceBySlugFromDb(slug: string) {
  const includeProperties = {
    properties: {
      include: {
        property: {
          include: {
            images: { orderBy: { order: 'asc' as const } },
            country: true,
          },
        },
      },
    },
  }

  try {
    return await db.serviceCategory.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        subtitle: true,
        tagline: true,
        description: true,
        heroDescription: true,
        image: true,
        videoUrl: true,
        displayOrder: true,
        isPublished: true,
        architecturalFocus: true,
        deliverables: true,
        ...includeProperties,
      },
    })
  } catch (error) {
    if (!isMissingCmsExtensionError(error)) {
      console.error(`Failed to load service "${slug}":`, error)
      return null
    }
    try {
      const row = await db.serviceCategory.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          name: true,
          subtitle: true,
          tagline: true,
          description: true,
          heroDescription: true,
          image: true,
          videoUrl: true,
          displayOrder: true,
          isPublished: true,
          ...includeProperties,
        },
      })
      return row ? { ...row, architecturalFocus: null, deliverables: null } : null
    } catch (innerError) {
      console.error(`Failed to load base service "${slug}":`, innerError)
      return null
    }
  }
}
