import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  verifyWhatsAppWebhookChallenge,
  verifyWhatsAppWebhookSignature,
  processWhatsAppWebhookEvent,
} from '@/lib/whatsapp'

/**
 * GET /api/webhooks/whatsapp
 * Webhook subscription verification endpoint for Meta WhatsApp Business Platform.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = verifyWhatsAppWebhookChallenge(searchParams)

  if (challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return NextResponse.json({ error: 'Forbidden: Invalid verification token' }, { status: 403 })
}

/**
 * POST /api/webhooks/whatsapp
 * Inbound webhook processor for WhatsApp delivery statuses and incoming messages.
 * Verifies authenticity via HMAC-SHA256 and idempotently processes events.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')

    // 1. Authenticity check
    if (!verifyWhatsAppWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid webhook signature' },
        { status: 401 }
      )
    }

    // 2. Parse payload
    let payload: any = {}
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Bad Request: Invalid JSON body' }, { status: 400 })
    }

    // 3. Process events idempotently
    const result = await processWhatsAppWebhookEvent(payload, db)

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      duplicate: result.duplicate,
      eventsProcessed: result.count,
    })
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error)
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 })
  }
}
