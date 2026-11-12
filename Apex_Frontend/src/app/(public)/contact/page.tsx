import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { db } from '@/lib/db'
import { fetchPublishedServicesFromDb } from '@/lib/services-cms'
import { ContactForm } from './ContactForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Contact & Private Advisory — Apex Pacific Holdings',
  description:
    'Connect with our private advisory office for confidential acquisitions, bespoke villa commissions, and luxury portfolio management.',
}

export default async function ContactPage() {
  let advisoryVideoUrl: string | null = null
  const [homepage, services] = await Promise.all([
    db.homepageContent.findFirst({ select: { advisoryVideoUrl: true } }).catch(() => null),
    fetchPublishedServicesFromDb().catch(() => []),
  ])
  advisoryVideoUrl = homepage?.advisoryVideoUrl || null

  const serviceOptions = [...services.map((s) => s.title), 'General Enquiry']

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#FBF9F6] text-[#0B1325] dark:bg-[#040810] dark:text-[#F8FAFC] pt-32 pb-24 relative overflow-hidden">
        {/* Background Video (Admin-managed via Homepage Content advisoryVideoUrl) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          {advisoryVideoUrl && (
            <video
              src={advisoryVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover object-center opacity-20 dark:opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FBF9F6] via-[#FBF9F6]/80 to-[#FBF9F6] dark:from-[#040810] dark:via-transparent dark:to-[#040810]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8">
          <Suspense fallback={<div className="text-center py-20 text-xs font-mono text-sky-400">Loading advisory portal...</div>}>
            <ContactForm serviceOptions={serviceOptions} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
