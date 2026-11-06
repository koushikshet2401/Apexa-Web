import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { logAdminActivity } from '@/lib/activityLog'
import { sendEnquiryReply } from '@/lib/email'
import { sendWhatsAppMessage, isWhatsAppConfigured } from '@/lib/whatsapp'

/**
 * GET /api/admin/enquiries/[id]/replies
 * Retrieves communication and reply history for the enquiry.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.ENQUIRIES_READ)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const enquiry = await db.enquiry.findUnique({ where: { id }, select: { id: true } })
    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    }

    const replies = await db.enquiryReply.findMany({
      where: { enquiryId: id },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
      orderBy: { sentAt: 'desc' },
    })

    return NextResponse.json(replies)
  } catch (error) {
    console.error('Error fetching enquiry replies:', error)
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })
  }
}

/**
 * POST /api/admin/enquiries/[id]/replies
 * Dispatches an administrative reply via Email or WhatsApp.
 * Supports idempotency keys to prevent duplicate sends on network retries.
 * Resilient to SMTP transport failures: preserves outgoing message records with deliveryStatus FAILED.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, PERMISSIONS.ENQUIRIES_REPLY)
  if (auth instanceof Response) return auth

  try {
    const { id } = await params
    const enquiry = await db.enquiry.findUnique({
      where: { id },
      select: {
        id: true,
        enquiryRef: true,
        name: true,
        email: true,
        phone: true,
        status: true,
      },
    })

    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    }

    const body = await request.json()
    const { message, subject, channel = 'EMAIL', idempotencyKey } = body

    // 1. Message body validation
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json(
        { error: 'Reply message text is required (minimum 5 characters).' },
        { status: 400 }
      )
    }

    const normalizedChannel = String(channel).toUpperCase()
    if (!['EMAIL', 'WHATSAPP'].includes(normalizedChannel)) {
      return NextResponse.json(
        { error: 'Invalid communication channel. Supported channels: EMAIL, WHATSAPP.' },
        { status: 400 }
      )
    }

    // 2. Idempotency Check: Prevent duplicate sends on retries
    if (idempotencyKey && typeof idempotencyKey === 'string') {
      const existingReply = await db.enquiryReply.findUnique({
        where: { idempotencyKey: idempotencyKey.trim() },
        include: {
          sender: { select: { id: true, name: true, email: true } },
        },
      })
      if (existingReply) {
        return NextResponse.json(
          {
            ok: true,
            idempotent: true,
            message: 'Duplicate request safely filtered by idempotency key.',
            reply: existingReply,
          },
          { status: 200 }
        )
      }
    }

    const replySubject =
      subject && typeof subject === 'string' && subject.trim().length > 0
        ? subject.trim()
        : `Re: Enquiry [${enquiry.enquiryRef}] — Apex Pacific Holdings`

    let deliveryStatus = 'SENT'
    let externalMessageId: string | null = null
    let failureReason: string | null = null
    const recipientTarget = normalizedChannel === 'EMAIL' ? enquiry.email : enquiry.phone

    // 3. Dispatch Channel: EMAIL
    if (normalizedChannel === 'EMAIL') {
      const emailResult = await sendEnquiryReply({
        to: enquiry.email,
        subject: replySubject,
        message: message.trim(),
        enquiryRef: enquiry.enquiryRef,
        adminName: auth.name || 'Private Client Advisory',
        adminEmail: auth.email,
      })

      if (emailResult.success) {
        deliveryStatus = 'SENT'
        externalMessageId = emailResult.messageId || null
      } else {
        // Resilience: Capture SMTP failure without failing the API or losing record
        deliveryStatus = 'FAILED'
        failureReason = emailResult.error || 'SMTP transmission failure'
      }
    }

    // 4. Dispatch Channel: WHATSAPP
    if (normalizedChannel === 'WHATSAPP') {
      if (!isWhatsAppConfigured()) {
        return NextResponse.json(
          {
            error:
              'WhatsApp Business Platform is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
            providerConfigured: false,
          },
          { status: 422 }
        )
      }

      const waResult = await sendWhatsAppMessage({
        to: enquiry.phone,
        message: message.trim(),
        enquiryRef: enquiry.enquiryRef,
      })

      if (waResult.success) {
        deliveryStatus = 'SENT'
        externalMessageId = waResult.externalMessageId || null
      } else {
        deliveryStatus = 'FAILED'
        failureReason = waResult.error || 'WhatsApp API transmission failure'
      }
    }

    // 5. Store Reply Record in PostgreSQL inside transaction
    const [savedReply, updatedEnquiry] = await db.$transaction(async (tx) => {
      const reply = await tx.enquiryReply.create({
        data: {
          enquiryId: enquiry.id,
          senderId: auth.id,
          senderEmail: auth.email,
          recipient: recipientTarget,
          channel: normalizedChannel,
          direction: 'OUTBOUND',
          deliveryStatus,
          idempotencyKey: idempotencyKey ? String(idempotencyKey).trim() : null,
          externalMessageId,
          subject: replySubject,
          body: message.trim(),
          failureReason,
        },
        include: {
          sender: { select: { id: true, name: true, email: true } },
        },
      })

      // Advance enquiry status to IN_PROGRESS if currently NEW
      let updated = null
      if (enquiry.status === 'NEW' || enquiry.status === 'new') {
        updated = await tx.enquiry.update({
          where: { id: enquiry.id },
          data: {
            status: 'IN_PROGRESS',
            isRead: true,
            readAt: new Date(),
          },
        })
      }

      return [reply, updated]
    })

    // 6. Audit Log
    await logAdminActivity({
      adminId: auth.id,
      adminEmail: auth.email,
      action: 'ENQUIRY_REPLIED',
      entityType: 'Enquiry',
      entityId: enquiry.id,
      summary: `Reply sent to ${recipientTarget} via ${normalizedChannel} for enquiry ${enquiry.enquiryRef} (Status: ${deliveryStatus})`,
      metadata: {
        enquiryId: enquiry.id,
        enquiryRef: enquiry.enquiryRef,
        channel: normalizedChannel,
        recipient: recipientTarget,
        deliveryStatus,
        failureReason,
        externalMessageId,
        idempotencyKey: idempotencyKey || null,
      },
    })

    return NextResponse.json(
      {
        ok: true,
        message:
          deliveryStatus === 'SENT'
            ? 'Reply successfully dispatched.'
            : 'Reply recorded with delivery failure notice.',
        reply: savedReply,
        enquiryStatus: updatedEnquiry ? updatedEnquiry.status : enquiry.status,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error dispatching enquiry reply:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch reply' },
      { status: 500 }
    )
  }
}
