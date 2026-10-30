import type { Metadata } from 'next'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <main className="bg-[var(--bg-primary)] pt-32 pb-24 min-h-screen">
        <div className="container-narrow">
          <span className="label text-[var(--text-muted)] block mb-4">Legal</span>
          <h1 className="heading-display text-display-lg text-[var(--text-primary)] mb-12">Terms of Service</h1>
          <div className="prose text-[var(--text-secondary)] font-light leading-relaxed space-y-6">
            <p>
              Welcome to Apex Pacific Holdings. By accessing this platform and reviewing our residential portfolio, you agree to comply with our terms of service and acceptable use policies.
            </p>
            <p>
              Property specifications, dimensions, architectural renders, and price guides presented on this website are indicative and subject to contractual verification. Nothing contained herein constitutes a binding offer to sell or lease.
            </p>
            <p className="text-[var(--text-muted)] text-sm">
              <strong className="font-medium text-[var(--text-secondary)]">Last updated:</strong> November 2026 · Full legal text to be provided by client before launch.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
