import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'

/**
 * GET /api/admin/enquiries
 * Retrieves enquiries with comprehensive filtering, searching, and pagination.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, PERMISSIONS.ENQUIRIES_READ)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const country = searchParams.get('country')
    const propertyId = searchParams.get('propertyId') || searchParams.get('project')
    const assignedAdminId = searchParams.get('assignedAdminId')
    const search = searchParams.get('search')?.trim()
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const isClosed = searchParams.get('isClosed')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)))
    const skip = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'submittedAt'
    const sortOrder = searchParams.get('sortOrder')?.toLowerCase() === 'asc' ? 'asc' : 'desc'

    const where: any = {}

    // Status filter (case-insensitive mapping)
    if (status && status !== 'all') {
      const upperStatus = status.toUpperCase()
      where.OR = [
        { status: upperStatus },
        { status: status.toLowerCase() },
      ]
    }

    // Country filter
    if (country && country !== 'all') {
      where.country = { equals: country, mode: 'insensitive' }
    }

    // Property / Project filter
    if (propertyId && propertyId !== 'all') {
      where.propertyId = propertyId
    }

    // Assigned Admin filter
    if (assignedAdminId && assignedAdminId !== 'all') {
      where.assignedAdminId = assignedAdminId === 'unassigned' ? null : assignedAdminId
    }

    // Closed flag filter
    if (isClosed !== null && isClosed !== undefined && isClosed !== '') {
      where.isClosed = isClosed === 'true'
    }

    // Date range filter
    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) {
        where.submittedAt.gte = new Date(startDate)
      }
      if (endDate) {
        // Extend to end of day if only date is passed
        const end = new Date(endDate)
        if (endDate.length <= 10) {
          end.setUTCHours(23, 59, 59, 999)
        }
        where.submittedAt.lte = end
      }
    }

    // Search filter across name, email, phone, reference
    if (search) {
      const searchConditions = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { enquiryRef: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ]
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }]
        delete where.OR
      } else {
        where.OR = searchConditions
      }
    }

    // Execute query with total count
    const [enquiries, total] = await Promise.all([
      db.enquiry.findMany({
        where,
        include: {
          property: {
            select: { id: true, name: true, slug: true, locationLine: true },
          },
          assignedAdmin: {
            select: { id: true, name: true, email: true },
          },
          closedBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { notes: true, replies: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.enquiry.count({ where }),
    ])

    // Format output with pagination metadata
    return NextResponse.json({
      enquiries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    })
  } catch (error) {
    console.error('Error fetching enquiries:', error)
    return NextResponse.json({ error: 'Failed to fetch enquiries' }, { status: 500 })
  }
}
