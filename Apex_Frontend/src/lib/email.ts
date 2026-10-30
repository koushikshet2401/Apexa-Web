import nodemailer from 'nodemailer'

export interface EnquiryEmailData {
  enquiryRef: string
  name: string
  email: string
  phone: string
  serviceInterest?: string | null
  message?: string | null
  propertyId?: string | null
  propertyName?: string | null
  submittedAt?: Date | string
  ipAddress?: string | null
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })
}

/**
 * Sends notification email to internal administrator
 */
export async function sendEnquiryNotification(enquiry: EnquiryEmailData): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@apexpacificholdings.com'
  const from = process.env.EMAIL_FROM || 'Apex Pacific Holdings <noreply@apexpacificholdings.com>'

  if (!isSmtpConfigured()) {
    console.info(`[EMAIL_NOTICE] SMTP credentials not configured. Enquiry [${enquiry.enquiryRef}] recorded in database for manual follow-up.`);
    return
  }

  try {
    const transporter = getTransporter()
    if (!transporter) return

    const subject = `New Enquiry [${enquiry.enquiryRef}] — ${enquiry.name} — ${enquiry.serviceInterest || 'General Inquiry'}`

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #040810; color: #F8FAFC; padding: 32px 20px; max-width: 640px; margin: 0 auto; border-radius: 8px;">
        <div style="border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 20px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 6px 0; color: #7DD3FC; font-size: 20px; letter-spacing: 0.1em; text-transform: uppercase;">Apex Pacific Holdings</h2>
          <p style="margin: 0; color: #94A3B8; font-size: 13px;">New Investor & Client Inquiry Received</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
            <td style="padding: 10px 0; color: #94A3B8; width: 140px; font-weight: 500;">Reference #</td>
            <td style="padding: 10px 0; color: #7DD3FC; font-family: monospace; font-size: 14px; font-weight: bold;">${enquiry.enquiryRef}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
            <td style="padding: 10px 0; color: #94A3B8;">Client Name</td>
            <td style="padding: 10px 0; color: #FFFFFF; font-weight: 600;">${enquiry.name}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
            <td style="padding: 10px 0; color: #94A3B8;">Email Address</td>
            <td style="padding: 10px 0;"><a href="mailto:${enquiry.email}" style="color: #7DD3FC; text-decoration: none;">${enquiry.email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
            <td style="padding: 10px 0; color: #94A3B8;">Phone / WhatsApp</td>
            <td style="padding: 10px 0; color: #FFFFFF;">${enquiry.phone}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
            <td style="padding: 10px 0; color: #94A3B8;">Service / Interest</td>
            <td style="padding: 10px 0; color: #FFFFFF;">${enquiry.serviceInterest || 'General Advisory'}</td>
          </tr>
          ${enquiry.propertyName ? `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
            <td style="padding: 10px 0; color: #94A3B8;">Target Property</td>
            <td style="padding: 10px 0; color: #7DD3FC; font-weight: 600;">${enquiry.propertyName}</td>
          </tr>
          ` : ''}
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
            <td style="padding: 10px 0; color: #94A3B8;">Submitted At</td>
            <td style="padding: 10px 0; color: #94A3B8;">${new Date(enquiry.submittedAt || Date.now()).toUTCString()}</td>
          </tr>
        </table>

        <div style="background: rgba(255,255,255,0.04); border-left: 3px solid #7DD3FC; padding: 14px 18px; margin-bottom: 24px; border-radius: 4px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #7DD3FC; letter-spacing: 0.1em; margin-bottom: 6px;">Client Message:</div>
          <div style="font-size: 13px; line-height: 1.6; color: #E2E8F0; white-space: pre-wrap;">${enquiry.message || 'No additional message provided.'}</div>
        </div>

        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; font-size: 11px; color: #64748B; text-align: center;">
          Apex Pacific Holdings Administrative System • IP: ${enquiry.ipAddress || 'Not recorded'}
        </div>
      </div>
    `

    await transporter.sendMail({
      from,
      to: adminEmail,
      subject,
      html: htmlBody,
    })
  } catch (error) {
    console.error(`[EMAIL_FAILED] Failed sending admin notification for [${enquiry.enquiryRef}]:`, error)
  }
}

/**
 * Sends confirmation receipt email to the inquiring visitor
 */
export async function sendEnquiryConfirmation(to: string, enquiryRef: string, name?: string): Promise<void> {
  const from = process.env.EMAIL_FROM || 'Apex Pacific Holdings <noreply@apexpacificholdings.com>'

  if (!isSmtpConfigured()) {
    console.info(`[EMAIL_NOTICE] SMTP credentials not configured. Confirmation for [${enquiryRef}] skipped.`);
    return
  }

  try {
    const transporter = getTransporter()
    if (!transporter) return

    const clientName = name ? name.trim() : 'Valued Client'
    const subject = 'Your enquiry has been received — Apex Pacific Holdings'

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #040810; color: #F8FAFC; padding: 36px 24px; max-width: 600px; margin: 0 auto; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 24px; margin-bottom: 28px;">
          <h1 style="margin: 0 0 6px 0; color: #7DD3FC; font-size: 22px; letter-spacing: 0.15em; text-transform: uppercase;">Apex Pacific Holdings</h1>
          <p style="margin: 0; color: #94A3B8; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">Elevated Living, Globally</p>
        </div>

        <div style="font-size: 14px; line-height: 1.7; color: #E2E8F0; margin-bottom: 28px;">
          <p style="margin-top: 0;">Dear ${clientName},</p>
          <p>Thank you for reaching out to Apex Pacific Holdings. We have received your inquiry regarding our international portfolio of ultra-prime residences and advisory services.</p>
          <p>Your unique inquiry reference is:</p>
          <div style="background: rgba(125,211,252,0.1); border: 1px solid rgba(125,211,252,0.3); padding: 14px; text-align: center; font-family: monospace; font-size: 18px; font-weight: bold; color: #7DD3FC; letter-spacing: 0.15em; border-radius: 6px; margin: 20px 0;">
            ${enquiryRef}
          </div>
          <p>A member of our private client advisory team will review your requirements and be in touch within <strong>24–48 hours</strong>.</p>
        </div>

        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; font-size: 11px; color: #64748B; text-align: center; line-height: 1.5;">
          This is an automated confirmation receipt. Please retain your reference number for future correspondence.<br />
          © ${new Date().getFullYear()} Apex Pacific Holdings. All rights reserved.
        </div>
      </div>
    `

    await transporter.sendMail({
      from,
      to,
      subject,
      html: htmlBody,
    })
  } catch (error) {
    console.error(`[EMAIL_CONFIRM_FAILED] Failed sending confirmation email to [${to}] for [${enquiryRef}]:`, error)
  }
}
