import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact & Private Advisory — Apex Pacific Holdings',
  description:
    'Connect with our private advisory office for confidential acquisitions, bespoke villa commissions, and luxury portfolio management.',
}

export default function ContactPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#040810] text-[#F8FAFC] pt-32 pb-24 relative overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <video
            src="/videos/gemini_generated_video_0e105bc8.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040810] via-transparent to-[#040810]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8">
          <Suspense fallback={<div className="text-center py-20 text-xs font-mono text-sky-400">Loading advisory portal...</div>}>
            <ContactForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
