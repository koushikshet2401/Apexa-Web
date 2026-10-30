import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Mail, Phone, Lock, FileText, UserCheck, Clock } from 'lucide-react'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Privacy Notice — Apex Pacific Holdings',
  description:
    'Comprehensive privacy notice in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and international data protection standards.',
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navigation />
      <main className="bg-[#070B09] text-[var(--text-primary)] min-h-screen pt-32 pb-24 border-t border-white/[0.06]">
        <div className="container-narrow px-6 max-w-4xl mx-auto">
          {/* Back link */}
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[var(--accent)] hover:underline uppercase mb-10 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Enquiries
          </Link>

          {/* Header */}
          <div className="mb-14 border-b border-white/10 pb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 mb-4">
              <ShieldCheck size={13} className="text-[var(--accent)]" />
              <span className="text-[11px] font-mono tracking-widest uppercase text-[var(--accent)]">
                DPDP Act, 2023 & Rules, 2025 Notice
              </span>
            </div>
            <h1 className="heading-display text-display-md sm:text-display-lg text-white mb-4">
              Privacy Notice & Data Protection Statement
            </h1>
            <p className="text-[var(--text-secondary)] font-light text-base leading-relaxed">
              This notice explains how <strong className="font-medium text-white">Apex Pacific Holdings</strong> collects, uses, protects, and stores personal data when you submit a private enquiry through our digital platforms, in compliance with the{' '}
              <strong className="font-medium text-white">
                Digital Personal Data Protection Act, 2023 (India)
              </strong>
              , the notified Digital Personal Data Protection Rules, 2025, and applicable global privacy principles.
            </p>
            <p className="text-xs font-mono text-white/50 mt-4">
              Effective Date: November 2026 · Version 1.2 · Data Fiduciary: Apex Pacific Holdings
            </p>
          </div>

          {/* Privacy Notice Sections */}
          <div className="space-y-12 text-[var(--text-secondary)] font-light leading-relaxed text-sm sm:text-base">
            {/* Section 1 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-[var(--accent)] flex-shrink-0" />
                <h2 className="heading-display text-xl sm:text-2xl text-white">
                  1. Information We Collect (Data Minimisation)
                </h2>
              </div>
              <p>
                In accordance with the principle of data minimisation, we collect only the personal information strictly necessary to acknowledge, review, and respond to your property enquiry:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-white/80">
                <li>
                  <strong className="text-white">Full Name:</strong> To address you formally and verify client communication.
                </li>
                <li>
                  <strong className="text-white">International Telephone Number:</strong> Including country calling code, to contact you regarding property viewing schedules or portfolio portfolios.
                </li>
                <li>
                  <strong className="text-white">Email Address:</strong> To transmit curated architectural dossiers, estate specifications, and formal advisory communications.
                </li>
                <li>
                  <strong className="text-white">Service Interest:</strong> The category of architecture or advisory requested (e.g., Luxury Villas, Sky Residences, Interior Studio, Global Advisory).
                </li>
                <li>
                  <strong className="text-white">Enquiry Message (Optional):</strong> Any specific architectural preferences or timeline requirements you choose to share.
                </li>
                <li>
                  <strong className="text-white">Consent Metadata:</strong> Exact timestamp, country selector context, and affirmative consent record for statutory audit compliance.
                </li>
              </ul>
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-white/70">
                <strong className="text-white">Sensitive Personal Data:</strong> Apex Pacific Holdings does not request or process biometric, financial account, genetic, or other sensitive personal data through our website contact forms.
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <UserCheck size={18} className="text-[var(--accent)] flex-shrink-0" />
                <h2 className="heading-display text-xl sm:text-2xl text-white">
                  2. Purpose of Processing & Legal Basis
                </h2>
              </div>
              <p>
                Under Section 5 and Section 6 of the DPDP Act, 2023, your personal data is processed solely on the basis of your{' '}
                <strong className="text-white">free, specific, informed, and unambiguous consent</strong> for the following specified purpose:
              </p>
              <blockquote className="border-l-2 border-[var(--accent)] pl-4 italic text-white/90 my-2">
                &ldquo;To evaluate, coordinate, and respond to your direct real-estate, architectural, or advisory enquiry, and to facilitate private viewings requested by you.&rdquo;
              </blockquote>
              <p>
                <strong className="text-white">No Unrelated Marketing:</strong> Giving consent to respond to your enquiry does not enroll you in unsolicited newsletters or unrelated commercial marketing. Any additional communication channels require separate, unbundled consent.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-[var(--accent)] flex-shrink-0" />
                <h2 className="heading-display text-xl sm:text-2xl text-white">
                  3. Storage, Retention & Purpose Limitation
                </h2>
              </div>
              <p>
                Under Section 8(7) of the DPDP Act, 2023, personal data is retained only for as long as necessary to satisfy the purpose for which it was collected, or until consent is formally withdrawn:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-white/80">
                <li>
                  Active enquiries are maintained during the consultation and active advisory relationship.
                </li>
                <li>
                  If an enquiry does not result in a property acquisition or ongoing advisory relationship, personal data is scheduled for secure erasure or irreversible anonymisation within{' '}
                  <strong className="text-white">180 days</strong> of concluding correspondence.
                </li>
                <li>
                  Enquiry logs are retained in encrypted, access-restricted formats with masked contact identifiers.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Lock size={18} className="text-[var(--accent)] flex-shrink-0" />
                <h2 className="heading-display text-xl sm:text-2xl text-white">
                  4. Data Sharing & Processors
                </h2>
              </div>
              <p>
                We do not sell, rent, or lease your personal information. Your personal details may be processed on our behalf by qualified Data Processors strictly bound by confidentiality and security agreements:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-white/80">
                <li>
                  <strong className="text-white">Cloud Hosting & Infrastructure:</strong> Enterprise-grade encrypted cloud infrastructure hosting our web platform.
                </li>
                <li>
                  <strong className="text-white">Client Relationship Infrastructure:</strong> Encrypted communications tooling used by our licensed estate advisors.
                </li>
                <li>
                  <strong className="text-white">Legal Obligations:</strong> Disclosures strictly mandated by applicable judicial orders, statutory authorities, or regulatory bodies in India or international jurisdictions where properties are situated.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-[var(--accent)] flex-shrink-0" />
                <h2 className="heading-display text-xl sm:text-2xl text-white">
                  5. Your Rights as a Data Principal (DPDP Act, 2023)
                </h2>
              </div>
              <p>
                Under Chapter III of the Digital Personal Data Protection Act, 2023, you hold the following rights:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
                  <h3 className="font-semibold text-white mb-1">Right to Access Information</h3>
                  <p className="text-xs text-white/70">
                    Request a summary of your personal data processed by us and the identities of data processors with whom it has been shared.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
                  <h3 className="font-semibold text-white mb-1">Right to Correction & Erasure</h3>
                  <p className="text-xs text-white/70">
                    Request correction of misleading data, completion of incomplete records, or erasure of personal data that is no longer required.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
                  <h3 className="font-semibold text-white mb-1">Right to Withdraw Consent</h3>
                  <p className="text-xs text-white/70">
                    Withdraw your consent at any time as easily as it was given, halting subsequent processing without affecting prior lawful processing.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/10">
                  <h3 className="font-semibold text-white mb-1">Right to Grievance Redressal</h3>
                  <p className="text-xs text-white/70">
                    Submit concerns or complaints to our designated Grievance Officer, with subsequent recourse to the Data Protection Board of India.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-4 p-6 rounded-xl bg-white/[0.02] border border-white/15">
              <h2 className="heading-display text-xl sm:text-2xl text-white">
                6. Contact Our Grievance & Privacy Officer
              </h2>
              <p>
                To exercise any of your statutory rights, withdraw consent, or file a privacy enquiry, please contact our designated office:
              </p>
              <div className="space-y-2 text-sm text-white/80 font-mono">
                <p>
                  <strong className="text-white font-sans">Attention:</strong> Mohammed Ehsanullah (Founder · Apex Pacific Holdings)
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-[var(--accent)]" />
                  <a href="mailto:mohammedehsanullah685@gmail.com" className="text-[var(--accent)] hover:underline">
                    mohammedehsanullah685@gmail.com
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-[var(--accent)]" />
                  <a href="tel:+919110656326" className="text-white hover:text-[var(--accent)]">
                    +91 91106 56326
                  </a>
                </p>
                <p className="text-xs text-white/50 pt-2 font-sans">
                  Grievance responses are provided within 30 days as prescribed under the statutory DPDP Rules framework.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
