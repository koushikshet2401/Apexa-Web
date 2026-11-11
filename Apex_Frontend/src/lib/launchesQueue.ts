import { db } from '@/lib/db'

/**
 * Reconciles featured launches to enforce strict queue constraints:
 * 1. At most 3 properties are featured launches.
 * 2. launchOrder is strictly 1, 2, and 3 without duplicate slot numbers.
 * 3. Operates in FIFO queue manner: newly featured project takes slot #1,
 *    existing #1 shifts to #2, #2 shifts to #3, and any 4th project is automatically
 *    removed from featured launches (isFeaturedLaunch = false, launchOrder = null).
 */
export async function reconcileFeaturedLaunches(promotedPropertyId?: string, isExplicitlyDemoted?: boolean) {
  try {
    // 1. Fetch all currently active featured launches
    const currentLaunches = await db.property.findMany({
      where: {
        isFeaturedLaunch: true,
        isArchived: false,
      },
      orderBy: [
        { launchOrder: 'asc' },
        { launchDate: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: { id: true, name: true, launchOrder: true },
    })

    let orderedIds: string[] = []

    if (isExplicitlyDemoted && promotedPropertyId) {
      // The property is being removed from launches
      orderedIds = currentLaunches.map((p) => p.id).filter((id) => id !== promotedPropertyId)
      await db.property.update({
        where: { id: promotedPropertyId },
        data: { isFeaturedLaunch: false, launchOrder: null },
      })
    } else if (promotedPropertyId) {
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

    // 2. Keep at most 3 items in the queue
    const top3 = orderedIds.slice(0, 3)
    const evicted = orderedIds.slice(3)

    // 3. Update top 3 with slots 1, 2, 3
    for (let idx = 0; idx < top3.length; idx++) {
      await db.property.update({
        where: { id: top3[idx] },
        data: {
          isFeaturedLaunch: true,
          launchOrder: idx + 1,
        },
      })
    }

    // 4. Evict older items beyond 3
    for (const id of evicted) {
      await db.property.update({
        where: { id },
        data: {
          isFeaturedLaunch: false,
          launchOrder: null,
        },
      })
    }
  } catch (error) {
    console.error('Error reconciling featured launches queue:', error)
  }
}
