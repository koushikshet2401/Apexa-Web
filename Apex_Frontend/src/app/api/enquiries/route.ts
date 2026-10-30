import { NextResponse } from 'next/server'

// Simple in-memory rate limiting map (IP -> timestamps[])
const rateLimitMap = new Map<string, number[]>()

const ALLOWED_SERVICES = [
  'Luxury Villas',
  'Commercial Properties',
  'Sky Residences',
  'General Enquiry',
]

export async function POST(request: Request) {
  try {
    // 1. IP rate limiting (max 5 requests per 10 minutes per IP)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous'
    const now = Date.now()
    const windowMs = 10 * 60 * 1000
    const timestamps = (rateLimitMap.get(ip) || []).filter((t) => now - t < windowMs)
    if (timestamps.length >= 5) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
    timestamps.push(now)
    rateLimitMap.set(ip, timestamps)

    // 2. Parse body
    const body = await request.json()
    const {
      name,
      phone,
      email,
      service,
      message,
      consent,
      consentTimestamp,
      honeypot, // Spam honeypot
    } = body

    // 3. Honeypot check
    if (honeypot) {
      return NextResponse.json({ success: true, message: 'Enquiry received' }, { status: 200 })
    }

    // 4. Validate Full Name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid full name (minimum 2 characters).' },
        { status: 400 }
      )
    }

    // 5. Validate Email Address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    // 6. Validate Phone (E.164 format)
    const phoneRegex = /^\+[1-9]\d{6,14}$/
    if (!phone || typeof phone !== 'string' || !phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid international phone number with country code.' },
        { status: 400 }
      )
    }

    // 7. Validate Service Interest
    if (!service || !ALLOWED_SERVICES.includes(service)) {
      return NextResponse.json(
        { success: false, error: 'Please select a valid service interest.' },
        { status: 400 }
      )
    }

    // 8. Validate DPDP Consent
    if (consent !== true) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Consent to process your enquiry is required in accordance with privacy and data protection standards.',
        },
        { status: 400 }
      )
    }

    // 9. Generate secure enquiry ID
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase()
    const enquiryId = `APX-${datePrefix}-${randomSuffix}`

    // 10. Privacy-safe audit log (redacting sensitive PII as per data minimisation standards)
    const maskedPhone = phone.length > 5 ? `${phone.slice(0, 4)}****${phone.slice(-2)}` : '***'
    const maskedEmail = email.includes('@')
      ? `${email[0]}***@${email.split('@')[1]}`
      : '***'

    console.log(
      `[ENQUIRY_RECEIVED] ID: ${enquiryId} | Service: ${service} | Phone: ${maskedPhone} | Email: ${maskedEmail} | Consent: ${consent} | Timestamp: ${consentTimestamp || new Date().toISOString()}`
    )

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your enquiry. Our team will be in touch.',
        enquiryId,
        submittedAt: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[ENQUIRY_ERROR]', error)
    return NextResponse.json(
      { success: false, error: 'Unable to process enquiry. Please try again.' },
      { status: 500 }
    )
  }
}
