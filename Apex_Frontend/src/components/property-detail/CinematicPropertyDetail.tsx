'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowDown,
  Check,
  ShieldCheck,
  Sparkles,
  Building,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { GatewayFlow } from '@/components/ui/gateway-flow'
import { CircularTestimonials, Testimonial } from '@/components/ui/circular-testimonials'

interface PropertyDetailData {
  id: string
  slug: string
  name: string
  cardLabel?: string
  country?: string
  city?: string
  type?: string
  beds?: string | number
  baths?: string | number
  area?: string
  price?: string
  tagline?: string
  shortDescription?: string
  description?: string
  highlights?: string[]
  image?: string
  gallery?: string[]
  mainVideoUrl?: string
  mainVideoThumb?: string
  services?: any[]
}

export function CinematicPropertyDetail({ property }: { property: PropertyDetailData }) {
  // 1. Video resolution
  const videoSrc =
    property.mainVideoUrl ||
    (property.slug === 'aurelia-villa' || property.slug === 'horizon-pavilion'
      ? '/videos/VID02.mp4'
      : '/videos/luxury-palm-beach.mp4')

  // 2. Prepare highlights with fallbacks if empty
  const highlights =
    property.highlights && property.highlights.length > 0
      ? property.highlights
      : [
          'Expansive cantilevered sky garden terraces with automated irrigation',
          'Private high-speed biometric elevator access directly to residence foyer',
          'Horizon infinity pool suspended over the marina with panoramic horizon',
          'Smart home climate, acoustic, and bespoke lighting automation',
          'Full valet, 24/7 dedicated concierge, and private yacht berth options',
        ]

  // 3. Prepare images for CircularTestimonials
  const rawImages = [
    property.image,
    ...(property.gallery || []),
  ].filter(Boolean) as string[]

  // Ensure at least 3 distinct images for the 3D circular presentation
  const defaultLuxuryImages = [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1600&auto=format&fit=crop',
  ]

  const galleryPool =
    rawImages.length >= 3
      ? rawImages
      : [...rawImages, ...defaultLuxuryImages].slice(0, Math.max(3, rawImages.length + 2))

  const featureLabels = [
    'Grand Horizon Living Salon',
    'Bespoke Culinary & Dining Atelier',
    'Private Primary Sanctuary & Terrace',
    'Suspended Sky Pool & Lanai',
    'Spa Wellness & Steam Suite',
    'Executive Observatory & Library',
  ]

  const testimonialsData: Testimonial[] = galleryPool.map((imgUrl, idx) => {
    const label = featureLabels[idx % featureLabels.length]
    const highlightDesc = highlights[idx % highlights.length] || property.description || ''
    return {
      src: imgUrl,
      name: label,
      designation: `${property.name} · Space 0${idx + 1}`,
      quote:
        idx === 0 && property.shortDescription
          ? property.shortDescription
          : highlightDesc.length > 30
          ? highlightDesc
          : `Crafted with custom bookmatched marble, floor-to-ceiling acoustic double glazing, and seamless indoor-outdoor architectural transitions overlooking ${property.city || 'the skyline'}.`,
    }
  })

  // 4. Form state for Section 4
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formMessage, setFormMessage] = useState(
    `I would like to register confidential interest and request a private dossier for ${property.name}.`
  )
  const [formConsent, setFormConsent] = useState(true)
  const [formHoneypot, setFormHoneypot] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [enquiryRef, setEnquiryRef] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (formHoneypot) return

    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      setFormError('Please complete all required fields.')
      return
    }

    setFormLoading(true)
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
          propertyId: property.id,
          consent: formConsent,
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
      setFormLoading(false)
    }
  }

  // Format specifications line
  const bedsStr = property.beds != null ? String(property.beds) : '3–4'
  const bedsText = bedsStr.toLowerCase().includes('bed') ? bedsStr : `${bedsStr} Bedrooms BR`
  const bathsStr = property.baths != null ? String(property.baths) : '4'
  const bathsText = bathsStr.toLowerCase().includes('bath') ? bathsStr : `${bathsStr} Baths BA`
  const areaText = property.area || '3,800 sq ft'
  const specsLine = `${bedsText} · ${bathsText} · ${areaText}`
  const priceDisplay = property.price || 'AED 8.2M'

  return (
    <div className="relative bg-[#040810] text-[#F8FAFC] selection:bg-[#7DD3FC]/20 selection:text-white">
      {/* Top Fixed Navigation */}
      <Navigation />

      {/* =========================================================================
          SECTION 1: FULL-SCREEN PROPERTY VIDEO (PINNED)
          - Occupies entire viewport
          - Displays property's video across full screen
          - Fills the entire page without other content initially
          - Pins in place while user scrolls, next section smoothly overlays it
      ========================================================================= */}
      <section
        id="property-hero-video"
        className="sticky top-0 h-screen w-full z-10 overflow-hidden bg-black flex items-center justify-center"
      >
        <video
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Cinematic gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040810]/80 via-black/30 to-black/50 pointer-events-none" />

        {/* Minimal Discrete Back Pill (Top Left, subtle) */}
        <div className="absolute top-24 left-6 sm:left-12 z-20">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 text-[11px] font-mono uppercase tracking-[0.2em] text-white/90 hover:text-white transition-all shadow-lg"
          >
            <ArrowLeft size={12} />
            <span>Residences</span>
          </Link>
        </div>

        {/* Cinematic Property Name Hero Title */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="max-w-5xl"
          >
            <h1 className="heading-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-light tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {property.name}
            </h1>
          </motion.div>
        </div>

        {/* Bottom subtle scroll invitation */}
        <div className="absolute bottom-8 sm:bottom-12 inset-x-0 z-20 flex flex-col items-center justify-center pointer-events-none animate-pulse">
          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.35em] text-white/70 mb-2 font-light">
            Scroll to explore
          </span>
          <ArrowDown size={14} className="text-[#7DD3FC]/80 animate-bounce" />
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: FULL-SCREEN PROPERTY DETAILS SECTION (PINNED OVERLAY)
          - Occupies entire viewport, smoothly overlays pinned video as user scrolls
          - Format:
              3–4 Bedrooms BR · 4 Baths BA · 3,800 sq ft
              AED 8.2M
              Description paragraph
              Highlights bullet points
          - Remains pinned during scrolling, next section smoothly overlays it
          - Background animation: 21.dev GatewayFlow
      ========================================================================= */}
      <section
        id="property-details-section"
        className="sticky top-0 min-h-screen h-screen w-full z-20 overflow-y-auto lg:overflow-hidden bg-[#040810] shadow-[0_-35px_80px_rgba(0,0,0,0.95)] border-t border-white/10 flex flex-col justify-center items-center relative"
      >
        {/* 21.dev GatewayFlow Background Animation */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-40">
          <GatewayFlow
            mode="dark"
            speed={0.85}
            density={1}
            size={1}
            opacity={0.9}
            className="w-full h-full"
          />
        </div>

        {/* Ambient Radial Gradient Mask for high contrast & elegance */}
        <div className="absolute inset-0 z-1 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(4,8,16,0.65)_0%,rgba(4,8,16,0.95)_100%)]" />

        {/* Centered Luxury Details Container */}
        <div className="relative z-10 max-w-4xl w-full mx-auto px-6 sm:px-10 py-12 md:py-16 text-center flex flex-col items-center justify-center">
          {/* Subtle Location & Name Header */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-6 sm:w-10 h-px bg-[#7DD3FC]/60" />
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] text-[#7DD3FC] font-medium">
              {property.city ? `${property.city}, ` : ''}{property.country || 'UNITED ARAB EMIRATES'} · {property.name}
            </span>
            <span className="w-6 sm:w-10 h-px bg-[#7DD3FC]/60" />
          </div>

          {/* Exact Format Requirement: Specs line */}
          <p className="font-mono text-xs sm:text-sm md:text-base text-white/90 font-medium tracking-wider mb-2">
            {specsLine}
          </p>

          {/* Exact Format Requirement: Price Display */}
          <h2 className="heading-display text-4xl sm:text-5xl md:text-6xl text-white font-light tracking-tight mb-6">
            {priceDisplay}
          </h2>

          {/* Exact Format Requirement: Description paragraph */}
          <p className="font-sans text-xs sm:text-sm md:text-base text-[#CBD5E1] font-light leading-relaxed max-w-2xl mx-auto mb-8 text-pretty">
            {property.description ||
              'Seven cantilevered floors with private landscaped sky gardens on every level. With only twenty-four residences, each occupies an entire quadrant with 270-degree horizons over the skyline and water.'}
          </p>

          {/* Exact Format Requirement: Highlights bullet points */}
          <div className="w-full max-w-2xl mx-auto pt-6 border-t border-white/10">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-xs sm:text-[13px] text-[#E2E8F0] font-light leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7DD3FC] mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(125,211,252,0.9)]" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: FULL-SCREEN PROPERTY IMAGES SECTION (PINNED OVERLAY)
          - Occupies entire viewport, smoothly overlays pinned property details
          - Uses CircularTestimonials for 3D interactive image presentation
          - Each image and accompanying description presents a specific feature
          - Pins in place while user scrolls, next section smoothly overlays it
      ========================================================================= */}
      <section
        id="property-images-section"
        className="sticky top-0 min-h-screen h-screen w-full z-30 overflow-y-auto lg:overflow-hidden bg-[#060D1A] shadow-[0_-35px_80px_rgba(0,0,0,0.95)] border-t border-white/10 flex flex-col justify-center items-center relative py-12"
      >
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#040810] to-transparent pointer-events-none" />
        <div className="absolute -top-32 right-12 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-12 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 flex flex-col items-center">
          {/* Section Header */}
          <div className="text-center mb-4 sm:mb-6">
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[#7DD3FC] block mb-1">
              Curated Residence Showcase
            </span>
            <h3 className="heading-display text-2xl sm:text-4xl text-white font-light tracking-wide">
              Architectural Spaces &amp; Finishes
            </h3>
          </div>

          {/* Circular 3D Interactive Testimonials / Features Carousel */}
          <div className="w-full">
            <CircularTestimonials
              testimonials={testimonialsData}
              autoplay={true}
              colors={{
                name: '#F8FAFC',
                designation: '#7DD3FC',
                testimony: '#CBD5E1',
                arrowBackground: '#040810',
                arrowForeground: '#F8FAFC',
                arrowHoverBackground: '#38BDF8',
              }}
              fontSizes={{
                name: '1.75rem',
                designation: '0.8rem',
                quote: '0.95rem',
              }}
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: FULL-SCREEN ENQUIRY SECTION (PINNED OVERLAY)
          - Titled "Enquire About This Property"
          - Occupies entire viewport, smoothly overlays pinned property images
          - Associated with current property for admin identification
          - Saves to DB and sends notifications via /api/enquiries
      ========================================================================= */}
      <section
        id="property-enquiry-section"
        className="sticky top-0 min-h-screen h-screen w-full z-40 overflow-y-auto lg:overflow-hidden bg-[#040810] shadow-[0_-35px_80px_rgba(0,0,0,0.95)] border-t border-white/10 flex flex-col justify-center items-center relative py-12 px-4 sm:px-6"
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(56,189,248,0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-3xl w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-[#7DD3FC] text-[11px] font-mono tracking-widest uppercase mb-3">
              <Sparkles size={12} />
              <span>Private Acquisition Desk</span>
            </div>
            <h2 className="heading-display text-3xl sm:text-5xl text-white font-light tracking-tight mb-2">
              Enquire About This Property
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#94A3B8] font-light max-w-lg mx-auto">
              Direct connection with our senior partners for {property.name}. Receive the comprehensive property dossier and confidential schedule of private viewings.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-white/10 bg-[#070D18]/90 p-6 sm:p-10 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.7)]">
            {formSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full border border-sky-400 bg-sky-400/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(56,189,248,0.3)]">
                  <Check size={28} className="text-[#7DD3FC]" strokeWidth={2} />
                </div>
                <h3 className="heading-display text-2xl sm:text-3xl text-white mb-2">
                  Enquiry Registered Confidentially
                </h3>
                <p className="text-sm text-[#94A3B8] max-w-md mx-auto mb-6 leading-relaxed">
                  Thank you for registering interest in <strong className="text-white">{property.name}</strong>. Our private advisory desk has been notified and will reach out directly.
                </p>
                {enquiryRef && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 font-mono text-xs text-[#7DD3FC] mb-6">
                    <span className="text-white/40 uppercase">Ref:</span>
                    <span className="font-semibold">{enquiryRef}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFormSubmitted(false)
                    setFormName('')
                    setFormEmail('')
                    setFormPhone('')
                  }}
                  className="px-6 py-2.5 rounded-full border border-sky-400/40 hover:border-sky-300 text-xs font-mono tracking-widest uppercase text-white hover:bg-sky-400/10 transition-colors"
                >
                  Submit Another Enquiry
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4 sm:space-y-5" noValidate>
                {/* Honeypot */}
                <input
                  type="text"
                  name="company_title_hp"
                  value={formHoneypot}
                  onChange={(e) => setFormHoneypot(e.target.value)}
                  tabIndex={-1}
                  className="sr-only"
                  aria-hidden="true"
                />

                {formError && (
                  <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-mono tracking-wider uppercase text-[#94A3B8] mb-1.5">
                      Full Name <span className="text-[#7DD3FC]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Lord Alexander Wright"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs sm:text-sm placeholder:text-white/20 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-mono tracking-wider uppercase text-[#94A3B8] mb-1.5">
                      Email Address <span className="text-[#7DD3FC]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs sm:text-sm placeholder:text-white/20 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-[11px] font-mono tracking-wider uppercase text-[#94A3B8] mb-1.5">
                      Phone (+Country Code) <span className="text-[#7DD3FC]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs sm:text-sm placeholder:text-white/20 focus:outline-none focus:border-[#7DD3FC] transition-colors"
                    />
                  </div>

                  {/* Property Context Badge */}
                  <div>
                    <label className="block text-[11px] font-mono tracking-wider uppercase text-[#94A3B8] mb-1.5">
                      Target Residence
                    </label>
                    <div className="px-3.5 py-2.5 rounded-lg bg-sky-500/[0.07] border border-sky-400/20 text-xs sm:text-sm text-white flex items-center justify-between">
                      <span className="font-medium truncate">{property.name}</span>
                      <span className="font-mono text-[10px] text-[#7DD3FC] uppercase ml-2 flex-shrink-0">
                        {property.city || 'Dubai'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[11px] font-mono tracking-wider uppercase text-[#94A3B8] mb-1.5">
                    Specific Requirements or Questions
                  </label>
                  <textarea
                    rows={3}
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs sm:text-sm placeholder:text-white/20 focus:outline-none focus:border-[#7DD3FC] transition-colors resize-none"
                  />
                </div>

                {/* Consent */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="property-enquiry-consent"
                    checked={formConsent}
                    onChange={(e) => setFormConsent(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#7DD3FC] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="property-enquiry-consent" className="text-[11px] text-[#94A3B8] cursor-pointer">
                    I authorize Apex Pacific Holdings to contact me regarding this residence in accordance with privacy policies.
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3.5 rounded-full bg-white text-[#040810] hover:bg-[#7DD3FC] font-mono text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,0.15)] disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Submitting Confidential Inquiry...' : 'Register Confidential Interest'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER (Follows the 4 stacked pinned sections)
      ========================================================================= */}
      <div className="relative z-50 bg-[#040810] border-t border-white/10">
        <Footer />
      </div>
    </div>
  )
}

export default CinematicPropertyDetail
