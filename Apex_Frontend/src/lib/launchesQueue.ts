import { db } from '@/lib/db'

export interface ReconciledLaunch {
  id: string
  name: string
  launchOrder: number
}

/**
 * Reconciles featured launches to enforce strict queue constraints:
 * 1. Exactly 3 properties are featured launches (unless fewer than 3 published exist).
 * 2. launchOrder is strictly 1, 2, and 3 without duplicate slot numbers.
 * 3. Operates in FIFO queue manner:
 *    - When a new project is promoted to featured launch, it takes slot #1,
 *      existing #1 shifts to #2, #2 shifts to #3, and any previous #3 is evicted.
 *    - When an existing featured launch is deleted, archived, unpublished, or demoted:
 *      the remaining featured launches shift up to fill consecutive slots (#1, #2),
 *      and the empty slot (#3) is automatically fulfilled by the newest ("last in")
 *      active published project in the database.
 * 4. Changes are persisted to the database and returned for frontend state synchronization.
 */
export async function reconcileFeaturedLaunches(
  promotedPropertyId?: string,
  isExplicitlyDemoted?: boolean
): Promise<ReconciledLaunch[]> {
  try {
    // 1. If demoting/removing a property, ensure its launch flag is cleared first
    if (isExplicitlyDemoted && promotedPropertyId) {
      await db.property.update({
        where: { id: promotedPropertyId },
        data: { isFeaturedLaunch: false, launchOrder: null },
      })
    }

    // 2. Fetch all currently active, published, non-archived featured launches
    const currentLaunches = await db.property.findMany({
      where: {
        isFeaturedLaunch: true,
        isArchived: false,
        isPublished: true,
        isPubliclyVisible: true,
        ...(promotedPropertyId && isExplicitlyDemoted ? { id: { not: promotedPropertyId } } : {}),
      },
      orderBy: [
        { launchOrder: 'asc' },
        { launchDate: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: { id: true, name: true, launchOrder: true },
    })

    let orderedIds: string[] = []

    if (!isExplicitlyDemoted && promotedPropertyId) {
      // Put the newly promoted project at the front of the queue (#1)
      orderedIds.push(promotedPropertyId)
      for (const p of currentLaunches) {
        if (p.id !== promotedPropertyId && !orderedIds.includes(p.id)) {
          orderedIds.push(p.id)
        }
      }
    } else {
      orderedIds = currentLaunches.map((p) => p.id)
    }

    // 3. Backfill empty slots up to 3 using the newest ("last in") active published projects
    if (orderedIds.length < 3) {
      const needed = 3 - orderedIds.length
      const candidates = await db.property.findMany({
        where: {
          isArchived: false,
          isPublished: true,
          isPubliclyVisible: true,
          isDraft: false,
          id: { notIn: orderedIds },
        },
        orderBy: [
          { createdAt: 'desc' }, // newest ("last in") project in portfolio
        ],
        take: needed,
        select: { id: true, name: true },
      })

      for (const cand of candidates) {
        if (!orderedIds.includes(cand.id)) {
          orderedIds.push(cand.id)
        }
      }
    }

    // 4. Take the top 3 items for slots 1, 2, 3
    const top3Ids = orderedIds.slice(0, 3)
    const reconciledResults: ReconciledLaunch[] = []

    // 5. Update top 3 with slots 1, 2, 3 in the database
    for (let idx = 0; idx < top3Ids.length; idx++) {
      const propId = top3Ids[idx]
      const order = idx + 1
      const updated = await db.property.update({
        where: { id: propId },
        data: {
          isFeaturedLaunch: true,
          launchOrder: order,
        },
        select: { id: true, name: true, launchOrder: true },
      })
      reconciledResults.push({
        id: updated.id,
        name: updated.name,
        launchOrder: order,
      })
    }

    // 6. Evict any properties beyond top 3 that still have isFeaturedLaunch: true
    await db.property.updateMany({
      where: {
        isFeaturedLaunch: true,
        id: { notIn: top3Ids },
      },
      data: {
        isFeaturedLaunch: false,
        launchOrder: null,
      },
    })

    return reconciledResults
  } catch (error) {
    console.error('Error reconciling featured launches queue:', error)
    return []
  }
}
