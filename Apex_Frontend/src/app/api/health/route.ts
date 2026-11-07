import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 * Production health and uptime monitoring probe.
 * Verifies Node.js runtime and database connectivity without exposing internal topology.
 */
export async function GET() {
  const startTime = performance.now()
  try {
    // 1. Shallow database ping (1 query)
    await db.$queryRawUnsafe('SELECT 1')

    const latencyMs = Math.round(performance.now() - startTime)

    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        checks: {
          database: 'UP',
          databaseLatencyMs: latencyMs,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[HEALTH_CHECK_FAILURE]', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'DOWN',
        },
      },
      { status: 503 }
    )
  }
}
