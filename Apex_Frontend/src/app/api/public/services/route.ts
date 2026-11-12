import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const services = await db.serviceCategory.findMany({
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

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error in /api/public/services:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}
