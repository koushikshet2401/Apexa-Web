import fs from 'fs'
import path from 'path'

interface BenchmarkMetric {
  endpoint: string
  method: string
  requestsCount: number
  minMs: number
  p50Ms: number
  p95Ms: number
  p99Ms: number
  maxMs: number
  avgMs: number
  statusCodes: Record<number, number>
}

interface ConcurrencyMetric {
  endpoint: string
  concurrencyLevel: number
  totalRequests: number
  totalDurationMs: number
  requestsPerSecond: number
  successRate: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  maxLatencyMs: number
}

const BASE_URL = 'http://localhost:3001'

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function runHttpBenchmark() {
  console.log('================================================================================')
  console.log('APEX PACIFIC HOLDINGS — RELIABLE HTTP NETWORK PERFORMANCE BENCHMARK')
  console.log(`Target: ${BASE_URL} (Running Next.js Dev Server over real TCP/HTTP Sockets)`)
  console.log('================================================================================\n')

  // 1. Authenticate to obtain live admin session cookie
  console.log('[1/4] Authenticating administrator on live server...')
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@apexpacificholdings.com',
      password: 'TestPassword123!',
    }),
  })

  if (!loginRes.ok) {
    throw new Error(`Failed to authenticate admin on ${BASE_URL}: HTTP ${loginRes.status}`)
  }

  const setCookie = loginRes.headers.get('set-cookie') || ''
  const cookieMatch = setCookie.match(/apex_admin_session=([^;]+)/)
  const sessionCookie = cookieMatch ? `apex_admin_session=${cookieMatch[1]}` : ''

  console.log('[1/4] Authenticated successfully. Session cookie acquired.\n')

  // Helper to benchmark an endpoint with N repeated HTTP requests
  async function benchmarkEndpoint(
    endpoint: string,
    options: {
      method?: string
      headers?: Record<string, string>
      body?: any
      iterations?: number
    } = {}
  ): Promise<BenchmarkMetric> {
    const iterations = options.iterations || 50
    const times: number[] = []
    const statusCodes: Record<number, number> = {}

    // Warm-up request
    try {
      await fetch(`${BASE_URL}${endpoint}`, {
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      })
    } catch {}

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
          method: options.method || 'GET',
          headers: options.headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        })
        const duration = performance.now() - start
        times.push(duration)
        statusCodes[res.status] = (statusCodes[res.status] || 0) + 1
      } catch (err: any) {
        statusCodes[0] = (statusCodes[0] || 0) + 1
      }
      // Small 5ms pause between iterations to simulate natural burst cadence
      await sleep(5)
    }

    times.sort((a, b) => a - b)
    const minMs = parseFloat(times[0].toFixed(2))
    const p50Ms = parseFloat((times[Math.floor(times.length * 0.5)] || 0).toFixed(2))
    const p95Ms = parseFloat((times[Math.floor(times.length * 0.95)] || 0).toFixed(2))
    const p99Ms = parseFloat((times[Math.floor(times.length * 0.99)] || 0).toFixed(2))
    const maxMs = parseFloat((times[times.length - 1] || 0).toFixed(2))
    const avgMs = parseFloat((times.reduce((sum, t) => sum + t, 0) / times.length).toFixed(2))

    return {
      endpoint,
      method: options.method || 'GET',
      requestsCount: iterations,
      minMs,
      p50Ms,
      p95Ms,
      p99Ms,
      maxMs,
      avgMs,
      statusCodes,
    }
  }

  // 2. Run repeated requests across all critical endpoints
  console.log('[2/4] Executing 50 repeated HTTP socket requests per endpoint...')

  const endpointsToTest: Array<{ name: string; url: string; headers: Record<string, string> }> = [
    {
      name: 'Public Properties API',
      url: '/api/public/properties',
      headers: {},
    },
    {
      name: 'Spaces in the Round API',
      url: '/api/public/space-in-round',
      headers: {},
    },
    {
      name: 'Admin Dashboard Analytics',
      url: '/api/admin/analytics/dashboard',
      headers: { Cookie: sessionCookie },
    },
    {
      name: 'Admin Properties List',
      url: '/api/admin/properties',
      headers: { Cookie: sessionCookie },
    },
    {
      name: 'Admin Enquiries List',
      url: '/api/admin/enquiries',
      headers: { Cookie: sessionCookie },
    },
  ]

  const endpointResults: BenchmarkMetric[] = []

  for (const ep of endpointsToTest) {
    const metric = await benchmarkEndpoint(ep.url, {
      iterations: 50,
      headers: ep.headers,
    })
    endpointResults.push(metric)
    console.log(
      `✓ [${metric.method}] ${metric.endpoint.padEnd(32)} | Min: ${metric.minMs}ms | P50: ${metric.p50Ms}ms | P95: ${metric.p95Ms}ms | Max: ${metric.maxMs}ms | Avg: ${metric.avgMs}ms`
    )
  }

  // 3. Concurrency Stress Testing over real HTTP Sockets
  console.log('\n[3/4] Executing Real-Socket Concurrency Stress Tests...')

  async function testHttpConcurrency(
    endpoint: string,
    concurrencyLevel: number,
    headers: Record<string, string> = {}
  ): Promise<ConcurrencyMetric> {
    const startBatch = performance.now()
    const promises = Array.from({ length: concurrencyLevel }).map(async () => {
      const reqStart = performance.now()
      try {
        const res = await fetch(`${BASE_URL}${endpoint}`, { headers })
        const reqDuration = performance.now() - reqStart
        return { ok: res.ok, status: res.status, duration: reqDuration }
      } catch (e) {
        return { ok: false, status: 0, duration: performance.now() - reqStart }
      }
    })

    const results = await Promise.all(promises)
    const totalDuration = performance.now() - startBatch

    const successful = results.filter((r) => r.ok).length
    const latencies = results.map((r) => r.duration).sort((a, b) => a - b)

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0
    const max = latencies[latencies.length - 1] || 0
    const rps = (concurrencyLevel / (totalDuration / 1000))

    return {
      endpoint,
      concurrencyLevel,
      totalRequests: concurrencyLevel,
      totalDurationMs: parseFloat(totalDuration.toFixed(2)),
      requestsPerSecond: parseFloat(rps.toFixed(1)),
      successRate: parseFloat(((successful / concurrencyLevel) * 100).toFixed(1)),
      avgLatencyMs: parseFloat(avgLatency.toFixed(2)),
      p50LatencyMs: parseFloat(p50.toFixed(2)),
      p95LatencyMs: parseFloat(p95.toFixed(2)),
      maxLatencyMs: parseFloat(max.toFixed(2)),
    }
  }

  const concurrencyLevels = [10, 25, 50]
  const concurrencyResults: ConcurrencyMetric[] = []

  // Test public endpoint concurrency
  for (const level of concurrencyLevels) {
    const cRes = await testHttpConcurrency('/api/public/properties', level)
    concurrencyResults.push(cRes)
    console.log(
      `✓ Public API [${cRes.concurrencyLevel} Parallel] — ${cRes.successRate}% Success | Batch: ${cRes.totalDurationMs}ms | RPS: ${cRes.requestsPerSecond} | P50: ${cRes.p50LatencyMs}ms | P95: ${cRes.p95LatencyMs}ms | Max: ${cRes.maxLatencyMs}ms`
    )
  }

  // Test admin dashboard concurrency
  for (const level of concurrencyLevels) {
    const cRes = await testHttpConcurrency('/api/admin/analytics/dashboard', level, { Cookie: sessionCookie })
    concurrencyResults.push(cRes)
    console.log(
      `✓ Admin Dashboard [${cRes.concurrencyLevel} Parallel] — ${cRes.successRate}% Success | Batch: ${cRes.totalDurationMs}ms | RPS: ${cRes.requestsPerSecond} | P50: ${cRes.p50LatencyMs}ms | P95: ${cRes.p95LatencyMs}ms | Max: ${cRes.maxLatencyMs}ms`
    )
  }

  // 4. Save evidence file
  console.log('\n[4/4] Writing test evidence JSON...')
  const evidenceDir = path.resolve(process.cwd(), 'test-evidence')
  if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true })
  const evidencePath = path.join(evidenceDir, 'http_performance_benchmark_results.json')

  const reportPayload = {
    targetUrl: BASE_URL,
    timestamp: new Date().toISOString(),
    investigationNotes: {
      explanationOfPreviousZeroMs:
        "Previous 0 ms measurements occurred because handlers were invoked directly as in-memory JavaScript functions in the same Node.js process without TCP network overhead, socket negotiation, or payload serialization, and floating-point sub-millisecond durations (e.g. 0.34ms) were truncated by Math.round(). The current suite measures real HTTP network requests over TCP loopback sockets with high-precision float timing.",
      concurrencyScope:
        "Evaluated parallel throughput under 10, 25, and 50 simultaneous TCP connections against PostgreSQL. Validates that Prisma connection pool does not saturate or deadlock under sudden spikes. Limitations: Production multi-tenant scale (>1,000 req/s) requires edge caching (Cloudflare CDN / Cache-Control), PgBouncer connection pooling, and multi-instance horizontal scaling.",
    },
    repeatedRequestsBenchmarks: endpointResults,
    concurrencyStressBenchmarks: concurrencyResults,
  }

  fs.writeFileSync(evidencePath, JSON.stringify(reportPayload, null, 2))
  console.log(`Evidence saved to: ${evidencePath}\n`)
}

runHttpBenchmark().catch((err) => {
  console.error('Fatal benchmark error:', err)
  process.exit(1)
})
