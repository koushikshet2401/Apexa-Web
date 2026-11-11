import { NextResponse } from 'next/server'

interface ParsedMapData {
  valid: boolean
  url: string
  placeName: string | null
  latitude: number | null
  longitude: number | null
  error?: string
}

function parseGoogleMapsUrl(targetUrl: string): ParsedMapData {
  try {
    const trimmed = (targetUrl || '').trim()
    if (!trimmed) {
      return { valid: false, url: '', placeName: null, latitude: null, longitude: null, error: 'Map URL is empty.' }
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    } catch {
      return { valid: false, url: trimmed, placeName: null, latitude: null, longitude: null, error: 'Invalid URL format.' }
    }

    const host = parsedUrl.hostname.toLowerCase()
    const isGoogleMaps =
      host.includes('google.com') ||
      host.includes('goo.gl') ||
      host.includes('maps.app.goo.gl')

    if (!isGoogleMaps) {
      return {
        valid: false,
        url: trimmed,
        placeName: null,
        latitude: null,
        longitude: null,
        error: 'URL is not a recognized Google Maps link.',
      }
    }

    let placeName: string | null = null
    let latitude: number | null = null
    let longitude: number | null = null

    // 1. Extract place name from /place/<name>/
    const placeMatch = trimmed.match(/\/place\/([^/@?]+)/)
    if (placeMatch && placeMatch[1]) {
      try {
        placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim()
      } catch {
        placeName = placeMatch[1].replace(/\+/g, ' ').trim()
      }
    }

    // 2. Extract high-precision coordinates from !3d<lat>!4d<lng>
    const exactMatch = trimmed.match(/!3d(-?\d+(?:\.\d+)?)(?:!4d|.*!4d)(-?\d+(?:\.\d+)?)/)
    if (exactMatch && exactMatch[1] && exactMatch[2]) {
      latitude = parseFloat(exactMatch[1])
      longitude = parseFloat(exactMatch[2])
    }

    // 3. Fallback to @<lat>,<lng> viewport coordinates if exact pin not found
    if (latitude === null || longitude === null) {
      const atMatch = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
      if (atMatch && atMatch[1] && atMatch[2]) {
        latitude = parseFloat(atMatch[1])
        longitude = parseFloat(atMatch[2])
      }
    }

    // 4. Fallback to query params (?q=lat,lng or ?ll=lat,lng)
    if (latitude === null || longitude === null) {
      const q = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('ll')
      if (q) {
        const coordMatch = q.match(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
        if (coordMatch) {
          latitude = parseFloat(coordMatch[1])
          longitude = parseFloat(coordMatch[2])
        } else if (!placeName) {
          placeName = q.trim()
        }
      }
    }

    // Validate coordinate ranges if extracted
    if (latitude !== null && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
      latitude = null
    }
    if (longitude !== null && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
      longitude = null
    }

    return {
      valid: true,
      url: parsedUrl.toString(),
      placeName,
      latitude,
      longitude,
    }
  } catch (err: any) {
    return {
      valid: false,
      url: targetUrl,
      placeName: null,
      latitude: null,
      longitude: null,
      error: err?.message || 'Failed to parse Google Maps URL.',
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawUrl = body.url || ''

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json({ valid: false, error: 'Please provide a valid Google Maps URL.' }, { status: 400 })
    }

    let urlToParse = rawUrl.trim()

    // If it's a shortened link (maps.app.goo.gl or goo.gl/maps), resolve the redirect
    if (urlToParse.includes('maps.app.goo.gl') || urlToParse.includes('goo.gl/maps')) {
      try {
        const headRes = await fetch(urlToParse, {
          method: 'HEAD',
          redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        })
        if (headRes.url && headRes.url !== urlToParse) {
          urlToParse = headRes.url
        }
      } catch {
        // Fall back to original URL parsing if network resolution fails
      }
    }

    const result = parseGoogleMapsUrl(urlToParse)
    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error || 'Invalid Google Maps location.' }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      url: result.url,
      placeName: result.placeName,
      latitude: result.latitude,
      longitude: result.longitude,
    })
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err?.message || 'Verification failed.' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const rawUrl = searchParams.get('url') || ''

  if (!rawUrl) {
    return NextResponse.json({ valid: false, error: 'Missing url parameter.' }, { status: 400 })
  }

  const result = parseGoogleMapsUrl(rawUrl)
  return NextResponse.json(result)
}
