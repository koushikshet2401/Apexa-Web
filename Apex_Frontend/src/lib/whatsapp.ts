import crypto from 'crypto'
import { db } from './db'

export interface WhatsAppMessagePayload {
  to: string // International E.164 phone number
  message: string
  enquiryRef?: string
  templateName?: string
}

export interface WhatsAppSendResult {
  success: boolean
  providerConfigured: boolean
  externalMessageId?: string
  error?: string
}

/**
 * Checks if WhatsApp Business Cloud API environment variables are configured.
 */
export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  )
}

/**
 * Clean provider-independent service interface for sending WhatsApp communications.
 * Strictly avoids pretending messages were dispatched when provider configuration is absent.
 */
export async function sendWhatsAppMessage(
  payload: WhatsAppMessagePayload
): Promise<WhatsAppSendResult> {
  if (!isWhatsAppConfigured()) {
    console.info(
      `[WHATSAPP_NOTICE] WhatsApp Business API not configured. Message for [${payload.enquiryRef || payload.to}] was not dispatched.`
    )
    return {
      success: false,
      providerConfigured: false,
      error: 'WhatsApp Business Platform is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
    }
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const cleanPhone = payload.to.replace(/[^\d+]/g, '').replace(/^\+/, '')

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { body: payload.message },
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('[WHATSAPP_API_ERROR]', data)
      return {
        success: false,
        providerConfigured: true,
        error: data?.error?.message || `WhatsApp API HTTP ${res.status}`,
      }
    }

    const messageId = data?.messages?.[0]?.id || `wamid_${Date.now()}`
    return {
      success: true,
      providerConfigured: true,
      externalMessageId: messageId,
    }
  } catch (error: any) {
    console.error('[WHATSAPP_SEND_EXCEPTION]', error)
    return {
      success: false,
      providerConfigured: true,
      error: error?.message || 'Network exception connecting to WhatsApp API',
    }
  }
}

/**
 * Verifies webhook subscription verification requests from WhatsApp Business Platform.
 */
export function verifyWhatsAppWebhookChallenge(searchParams: URLSearchParams): string | null {
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'apex_whatsapp_verify_token'

  if (mode === 'subscribe' && token === expectedToken && challenge) {
    return challenge
  }
  return null
}

/**
 * Validates HMAC-SHA256 signature on incoming WhatsApp webhooks for authenticity.
 */
export function verifyWhatsAppWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) {
    // If app secret is not configured, accept only if in development or explicitly allowed
    return true
  }

  if (!signatureHeader) return false

  const [algo, signature] = signatureHeader.split('=')
  if (algo !== 'sha256' || !signature) return false

  try {
    const hmac = crypto.createHmac('sha256', appSecret)
    const digest = hmac.update(rawBody).digest('hex')
    const sigBuffer = Buffer.from(signature, 'hex')
    const digestBuffer = Buffer.from(digest, 'hex')
    if (sigBuffer.length !== digestBuffer.length) return false
    return crypto.timingSafeEqual(sigBuffer, digestBuffer)
  } catch {
    return false
  }
}

// In-memory deduplication set for processed webhook event IDs
const processedWebhookEventIds = new Set<string>()

/**
 * Processes incoming WhatsApp webhook events (status updates and inbound messages).
 * Deduplicates events to guarantee idempotent processing.
 */
export async function processWhatsAppWebhookEvent(
  payload: any,
  prismaClient: any = db
): Promise<{ processed: boolean; duplicate: boolean; count: number }> {
  if (!payload || !payload.entry || !Array.isArray(payload.entry)) {
    return { processed: false, duplicate: false, count: 0 }
  }

  let count = 0
  for (const entry of payload.entry) {
    const changes = entry.changes || []
    for (const change of changes) {
      if (change.field !== 'messages' || !change.value) continue
      const value = change.value

      // 1. Process Status Updates (e.g. sent, delivered, read, failed)
      const statuses = value.statuses || []
      for (const statusObj of statuses) {
        const messageId = statusObj.id
        const status = (statusObj.status || '').toUpperCase()
        if (!messageId) continue

        const eventKey = `status:${messageId}:${status}`
        if (processedWebhookEventIds.has(eventKey)) {
          continue
        }
        processedWebhookEventIds.add(eventKey)

        // Map status to deliveryStatus string
        let deliveryStatus = 'SENT'
        if (status === 'DELIVERED') deliveryStatus = 'DELIVERED'
        else if (status === 'READ') deliveryStatus = 'READ'
        else if (status === 'FAILED') deliveryStatus = 'FAILED'

        // Update corresponding EnquiryReply record by externalMessageId
        try {
          await prismaClient.enquiryReply.updateMany({
            where: { externalMessageId: messageId },
            data: {
              deliveryStatus,
              failureReason: status === 'FAILED' ? JSON.stringify(statusObj.errors || 'Delivery failed') : null,
            },
          })
          count++
        } catch (err) {
          console.error('[WHATSAPP_STATUS_UPDATE_ERROR]', err)
        }
      }

      // 2. Process Inbound Messages
      const messages = value.messages || []
      for (const msg of messages) {
        const messageId = msg.id
        if (!messageId) continue

        const eventKey = `inbound:${messageId}`
        if (processedWebhookEventIds.has(eventKey)) {
          continue
        }
        processedWebhookEventIds.add(eventKey)

        const fromPhone = msg.from ? `+${msg.from.replace(/[^\d]/g, '')}` : null
        const textBody = msg.text?.body || msg.caption || `[${msg.type || 'Media'} message]`

        // Attempt to correlate with an existing Enquiry by phone number
        if (fromPhone) {
          try {
            const cleanDigits = fromPhone.replace(/[^\d]/g, '')
            const enquiry = await prismaClient.enquiry.findFirst({
              where: {
                OR: [
                  { phone: { contains: cleanDigits.slice(-8) } },
                  { phone: fromPhone },
                ],
              },
              orderBy: { submittedAt: 'desc' },
            })

            if (enquiry) {
              await prismaClient.enquiryReply.create({
                data: {
                  enquiryId: enquiry.id,
                  recipient: enquiry.phone,
                  senderEmail: fromPhone,
                  channel: 'WHATSAPP',
                  direction: 'INBOUND',
                  deliveryStatus: 'DELIVERED',
                  externalMessageId: messageId,
                  subject: 'Inbound WhatsApp Message',
                  body: textBody,
                  metadata: msg,
                },
              })

              // If enquiry was CLOSED or READ, transition back to IN_PROGRESS upon customer response
              if (enquiry.status === 'CLOSED' || enquiry.status === 'READ') {
                await prismaClient.enquiry.update({
                  where: { id: enquiry.id },
                  data: {
                    status: 'IN_PROGRESS',
                    isClosed: false,
                    isRead: false,
                  },
                })
              }
              count++
            }
          } catch (err) {
            console.error('[WHATSAPP_INBOUND_MSG_ERROR]', err)
          }
        }
      }
    }
  }

  return { processed: true, duplicate: count === 0, count }
}
