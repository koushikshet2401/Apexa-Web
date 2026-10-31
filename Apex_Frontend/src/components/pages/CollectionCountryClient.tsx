'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  Plus,
  Check,
  ShieldCheck,
  Mail,
  Phone,
  User,
  Sparkles,
} from 'lucide-react'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import {
  Dialog,
  DialogTrigger,
  DialogContainer,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
  DialogImage,
} from '@/components/ui/linear-card'

export interface CountryData {
  id: string
  slug: string
  name: string
  displayName?: string
  region?: string
  cities?: string
  tagline?: string
  description?: string
  heroVideoUrl?: string
  heroVideoThumb?: string
  cardImage?: string
}

export interface CountryProjectData {
  id: string
  slug: string
  title: string
  type: string
  city: string
  beds: string
  baths?: string
  area?: string
  price?: string
  tagline?: string
  shortDescription?: string
  description?: string
  highlights?: string[]
  image: string
}

interface CollectionCountryClientProps {
  country: CountryData
  projects: CountryProjectData[]
}

export function CollectionCountryClient({ country, projects }: CollectionCountryClientProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoSrc = country.heroVideoUrl ? encodeURI(country.heroVideoUrl) : '/videos/luxury-palm-beach.mp4'

  // Form state for Section 3: Direct Confidential Inquiry
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formMessage, setFormMessage] = useState(
    `I would like to register confidential interest and request a private dossier for properties in ${country.displayName || country.name}.`
  )
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [enquiryRef, setEnquiryRef] = useState<string | null>(null)

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      setFormError('Please complete all required fields.')
      return
    }

    setFormSubmitting(true)
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim().startsWith('+') ? formPhone.trim() : `+${formPhone.replace(/\D/g, '')}`,
          service: 'Luxury Villas',
          message: formMessage.trim(),
          countryId: country.id,
          consent: true,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setEnquiryRef(data.enquiryRef || data.enquiryId || 'APX-CONFIDENTIAL')
        setFormSubmitted(true)
      } else {
        setFormError(data.error || 'Unable to register enquiry. Please retry.')
      }
    } catch {
      setFormError('Connection error. Please try again or contact our private advisory directly.')
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <div className="relative bg-[#040810] text-[#F8FAFC] selection:bg-[#7DD3FC]/20 selection:text-white">
      {/* Top Fixed Navigation */}
      <Navigation />

      {/* =========================================================================
          SECTION 1: PINNED COUNTRY PRESENTATION SECTION (STICKY TOP-0)
          - Occupies entire viewport
          - Mobile safe clearance at bottom to never be covered by mobile bottom nav
          - Balanced vertical distribution (~45% text, ~55% video)
          - Video is always muted, clean without overlay buttons
      ========================================================================= */}
      <section
        id="country-hero-section"
        className="sticky top-0 h-screen min-h-screen w-full z-10 overflow-hidden bg-[#040810] flex flex-col justify-between"
      >
        {/* Subtle ambient deep glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#38BDF8]/10 blur-[150px] pointer-events-none" />

        <div className="relative max-w-[1440px] w-full mx-auto px-4 sm:px-8 lg:px-16 h-full flex flex-col justify-between pt-24 sm:pt-28 pb-[calc(env(safe-area-inset-bottom,0px)+74px)] sm:pb-6">
          {/* Top Editorial Header */}
          <div className="flex-none flex flex-col justify-center py-1 sm:py-2">
            {/* Back Pill Button */}
            <div className="mb-2.5 sm:mb-3">
              <Link
                href="/collection"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/15 text-[11px] font-mono uppercase tracking-[0.2em] text-[#7DD3FC] hover:text-white transition-all shadow-md cursor-pointer"
              >
                <ArrowLeft size={12} />
                <span>Back to Collection</span>
              </Link>
            </div>

            {/* Country Editorial Details */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-2.5 sm:gap-6 my-1">
              <div>
                {/* Region */}
                {country.region && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-px bg-[#7DD3FC]" />
                    <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[#7DD3FC]">
                      {country.region}
                    </span>
                  </div>
                )}

                {/* Country Name */}
                <h1 className="heading-display font-light text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-none mb-1">
                  {country.displayName || country.name}
                </h1>

                {/* Cities */}
                {country.cities && (
                  <p className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.22em] text-white/50">
                    {country.cities}
                  </p>
                )}
              </div>

              {/* Description Paragraph */}
              {country.description && (
                <p className="font-sans text-xs sm:text-sm lg:text-base text-white/80 font-light leading-relaxed max-w-xl md:text-right mt-1 md:mt-1.5">
                  {country.description}
                </p>
              )}
            </div>
          </div>

          {/* Balanced ~55% Height Video Container */}
          <div className="flex-1 min-h-0 w-full flex flex-col justify-center pb-2 sm:pb-3">
            <div className="relative w-full h-[36vh] sm:h-[46vh] lg:h-[50vh] max-h-[52vh] rounded-xl sm:rounded-2xl overflow-hidden border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.9)] bg-black">
              <video
                ref={videoRef}
                src={videoSrc}
                poster={country.heroVideoThumb || country.cardImage || undefined}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover object-center pointer-events-none"
              />

              {/* Cinematic Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

              {/* Scroll down prompt overlay at bottom edge */}
              <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-15 pointer-events-none flex flex-col items-center">
                <span className="font-mono text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-white/70 mb-1 font-light drop-shadow">
                  Scroll to explore signature projects
                </span>
                <ArrowDown size={11} className="text-[#7DD3FC] animate-bounce drop-shadow" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: SIGNATURE PROJECTS OVERLAY (SLIDES UP OVER PINNED HERO)
          - Higher z-index (z-20)
          - Fully responsive: 1 card on mobile (generous proportions), 2 on tablet, 3 on desktop
          - Interactive 21st.dev linear-card dialogs
      ========================================================================= */}
      <section
        id="signature-projects"
        className="relative z-20 min-h-screen w-full bg-[#040810] shadow-[0_-35px_80px_rgba(0,0,0,0.95)] border-t border-white/10 pt-16 sm:pt-24 pb-20 sm:pb-28"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-6 sm:pb-10 border-b border-white/10 mb-8 sm:mb-12">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-px bg-[#7DD3FC]" />
                <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#7DD3FC]">
                  PORTFOLIO
                </span>
              </div>
              <h2 className="heading-display font-light text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight">
                Signature Projects in {country.displayName || country.name}
              </h2>
            </div>
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.22em] text-white/50 uppercase">
              {projects.length} {projects.length === 1 ? 'RESIDENCE' : 'RESIDENCES'} RECORDED
            </span>
          </div>

          {/* Fully Responsive Grid: 1 column on mobile, 2 on tablet, 3 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {projects.map((project) => (
              <Dialog
                key={project.id}
                transition={{
                  type: 'spring',
                  bounce: 0.05,
                  duration: 0.5,
                }}
              >
                {/* Unexpanded Card */}
                <DialogTrigger
                  style={{ borderRadius: '16px' }}
                  className="group relative flex w-full flex-col overflow-hidden border border-white/10 hover:border-[#7DD3FC]/50 bg-[#070E1C] hover:bg-[#0A162B] transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.6)] cursor-pointer"
                >
                  {/* Card Image */}
                  <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-black">
                    <DialogImage
                      src={project.image}
                      alt={project.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070E1C] via-transparent to-transparent opacity-80" />
                  </div>

                  {/* Card Bottom Bar */}
                  <div className="relative flex flex-grow items-end justify-between p-4 sm:p-5">
                    <div className="min-w-0 pr-2 flex-1">
                      <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#7DD3FC] block truncate mb-1">
                        {project.type} · {project.city}
                      </span>
                      <DialogTitle className="heading-display font-light text-xl sm:text-2xl text-white group-hover:text-[#7DD3FC] transition-colors leading-tight truncate">
                        {project.title}
                      </DialogTitle>
                      {project.price && (
                        <p className="font-mono text-xs text-white/60 mt-1 font-light truncate">
                          {project.price}
                        </p>
                      )}
                    </div>

                    {/* Circular Plus Icon Button */}
                    <div
                      aria-label={`Open details for ${project.title}`}
                      className="p-2 sm:p-2.5 rounded-full bg-[#0B1528] border border-white/20 group-hover:border-[#7DD3FC] group-hover:bg-[#7DD3FC]/20 text-white group-hover:text-[#7DD3FC] transition-all shadow-md shrink-0 ml-2"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-90" />
                    </div>
                  </div>
                </DialogTrigger>

                {/* Expanded Dialog Modal — Fits 100% in mobile screen without requiring internal scroll */}
                <DialogContainer className="p-2 sm:p-6 lg:p-8 pb-16 sm:pb-8 flex items-center justify-center">
                  <DialogContent
                    style={{ borderRadius: '24px' }}
                    className="relative flex h-auto max-h-[86vh] sm:max-h-[88vh] mx-auto flex-col overflow-hidden sm:overflow-y-auto border border-white/20 bg-[#070E1C] text-white shadow-[0_25px_80px_rgba(0,0,0,0.95)] w-full max-w-2xl"
                  >
                    {/* Modal Hero Image */}
                    <div className="relative w-full aspect-[16/9] max-h-[22vh] sm:max-h-[36vh] overflow-hidden bg-black shrink-0">
                      <DialogImage
                        src={project.image}
                        alt={project.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070E1C] via-transparent to-black/30 pointer-events-none" />
                    </div>

                    {/* Modal Content Body — Perfectly balanced for 1-screen mobile view */}
                    <div className="p-4 sm:p-7 md:p-8 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Type & City */}
                        <span className="font-mono text-[9px] sm:text-xs uppercase tracking-[0.25em] text-[#7DD3FC] block mb-1">
                          {project.type} · {project.city}
                        </span>

                        {/* Title */}
                        <DialogTitle className="heading-display font-light text-xl sm:text-4xl text-white tracking-tight mb-1 sm:mb-2">
                          {project.title}
                        </DialogTitle>

                        {/* Specifications Line */}
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] sm:text-xs text-white/70 mb-2 sm:mb-4 pb-2 sm:pb-3 border-b border-white/10">
                          {project.beds && <span>{project.beds}</span>}
                          {project.baths && <span>· {project.baths} Baths</span>}
                          {project.area && <span>· {project.area}</span>}
                          {project.price && <span className="text-[#7DD3FC]">· {project.price}</span>}
                        </div>

                        {/* Detailed Description — Clean 2-line clamp on mobile so button is directly visible without scrolling */}
                        <DialogDescription
                          disableLayoutAnimation
                          variants={{
                            initial: { opacity: 0, scale: 0.95, y: -20 },
                            animate: { opacity: 1, scale: 1, y: 0 },
                            exit: { opacity: 0, scale: 0.95, y: -20 },
                          }}
                        >
                          <p className="font-sans text-xs sm:text-sm text-white/80 font-light leading-relaxed mb-2 sm:mb-5 line-clamp-2 sm:line-clamp-none">
                            {project.description || project.shortDescription || 'An extraordinary private architectural sanctuary curated by Apex Pacific Holdings.'}
                          </p>

                          {/* Highlights — Displayed on tablet/desktop, omitted on narrow mobile to ensure 0 scroll */}
                          {project.highlights && project.highlights.length > 0 && (
                            <div className="hidden sm:block mb-5 space-y-1.5">
                              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/50 block mb-1.5">
                                RESIDENCE HIGHLIGHTS
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {project.highlights.map((h, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs text-white/75 font-light">
                                    <Check size={13} className="text-[#7DD3FC] mt-0.5 shrink-0" />
                                    <span>{h}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </DialogDescription>
                      </div>

                      {/* Explore Button — Immediately visible without scrolling */}
                      <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-white/10 shrink-0">
                        <Link
                          href={`/collection/${country.slug}/${project.slug}`}
                          className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#0C1F38] via-[#123157] to-[#0C1F38] hover:from-[#123157] hover:to-[#1E4D82] border border-[#7DD3FC]/40 hover:border-[#7DD3FC] text-white font-mono text-xs uppercase tracking-[0.25em] transition-all duration-300 shadow-[0_0_25px_rgba(56,189,248,0.2)] group cursor-pointer"
                        >
                          <span>Explore Residence</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>

                    {/* Dialog Close Icon */}
                    <DialogClose className="text-white bg-black/60 hover:bg-black/90 p-2 sm:p-2.5 rounded-full border border-white/20 transition-colors" />
                  </DialogContent>
                </DialogContainer>
              </Dialog>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: DIRECT CONFIDENTIAL INQUIRY FORM
          - Appears right after Signature Projects upon scrolling
          - Dedicated inquiry card for the active country collection
          - Name, Email, Phone, and Residence Interest
      ========================================================================= */}
      <section
        id="country-inquiry"
        className="relative z-20 w-full bg-[#040810] border-t border-white/10 py-16 sm:py-24 px-4 sm:px-8"
      >
        <div className="max-w-2xl mx-auto bg-[#070E1C] border border-white/15 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.9)]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[#7DD3FC] font-mono text-[10px] uppercase tracking-[0.25em] mb-3">
              <Sparkles size={12} />
              <span>CONFIDENTIAL ADVISORY</span>
            </div>
            <h2 className="heading-display font-light text-2xl sm:text-4xl text-white tracking-tight mb-2">
              Register Interest in {country.displayName || country.name}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-white/70 font-light max-w-lg mx-auto leading-relaxed">
              Request a private portfolio dossier, floorplans, and confidential acquisition consultation with our international advisory partners.
            </p>
          </div>

          {formSubmitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Check size={24} />
              </div>
              <h3 className="heading-display text-xl sm:text-2xl text-white font-light">
                Dossier Request Received
              </h3>
              <p className="font-sans text-xs sm:text-sm text-white/70 max-w-md mx-auto font-light">
                Our private advisory director for {country.displayName || country.name} has been notified. A confidential portfolio dossier will be delivered to <span className="text-white font-medium">{formEmail}</span> within 24 hours.
              </p>
              <div className="inline-block mt-3 px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono tracking-widest text-[#7DD3FC] uppercase">
                REFERENCE: {enquiryRef}
              </div>
            </div>
          ) : (
            <form onSubmit={handleEnquirySubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-sans">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Jonathan Sterling"
                    className="w-full bg-[#040810] border border-white/15 focus:border-[#7DD3FC] rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="jonathan@domain.com"
                      className="w-full bg-[#040810] border border-white/15 focus:border-[#7DD3FC] rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 mb-1.5">
                    Phone / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+971 50 000 0000"
                      className="w-full bg-[#040810] border border-white/15 focus:border-[#7DD3FC] rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/60 mb-1.5">
                  Residence / Portfolio Requirement
                </label>
                <textarea
                  rows={3}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full bg-[#040810] border border-white/15 focus:border-[#7DD3FC] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#0C1F38] via-[#123157] to-[#0C1F38] hover:from-[#123157] hover:to-[#1E4D82] border border-[#7DD3FC]/40 hover:border-[#7DD3FC] text-white font-mono text-xs uppercase tracking-[0.25em] transition-all duration-300 shadow-[0_0_30px_rgba(56,189,248,0.25)] cursor-pointer disabled:opacity-50"
              >
                <span>{formSubmitting ? 'Registering Interest...' : 'Request Confidential Dossier'}</span>
                <ArrowRight size={14} />
              </button>

              <div className="flex items-center justify-center gap-2 pt-2 text-[10px] font-mono text-white/40">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>Strict Non-Disclosure Protocol · Direct Developer Representation</span>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: FOOTER (SOLID OPAQUE Z-30 BACKGROUND)
          - Higher z-index (z-30)
          - 100% solid #040810 background
          - Completely prevents pinned hero video from bleeding through
      ========================================================================= */}
      <div className="relative z-30 w-full bg-[#040810]">
        <Footer />
      </div>
    </div>
  )
}
