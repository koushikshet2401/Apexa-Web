'use client'

import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { OrbitalLoader } from '@/components/ui/orbital-loader'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
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
import { useTheme } from '@/components/providers/ThemeProvider'
import { themeTokens } from '@/lib/theme'
import { cn } from '@/lib/utils'
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
  const { isLight } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const section1Ref = useRef<HTMLElement>(null)
  const videoWrapperRef = useRef<HTMLDivElement>(null)
  const section2Ref = useRef<HTMLElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const section3Ref = useRef<HTMLElement>(null)
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
  const [mounted, setMounted] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isGsapReady, setIsGsapReady] = useState(false)
  const [isPageReady, setIsPageReady] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('[Apex Lifecycle] Mounted CollectionCountryClient for:', country.slug)
  }, [country.slug])

  // Mark collection page ready when both GSAP is initialized and hero video/fallback has loaded
  useEffect(() => {
    if (isGsapReady) {
      console.log('[Apex Lifecycle] Collection page ready (GSAP ready). Dismissing loader.')
      setIsPageReady(true)
    }
  }, [isGsapReady])

  // Safety fallback timer ensuring loading overlay dismisses cleanly after at most 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[Apex Lifecycle] Collection safety fallback triggered, dismissing loader.')
      setIsPageReady(true)
    }, 250)
    return () => clearTimeout(timer)
  }, [])

  // GSAP ScrollTrigger Master Pinned Stack
  // 1. Hero Section: video expands from scale 0.84 -> 1.0, brief pause.
  // 2. Section 2 (Signature Projects Stage) slides up as card overlay over Section 1.
  // 3. One Card at a time under one container:
  //    As user continues vertical scrolling down:
  //    Card 0 slides out to LEFT (xPercent: -100), Card 1 enters from RIGHT (xPercent: 0).
  //    Continues for all properties in sequence.
  //    Scrolling upward smoothly reverses the sequence (cards enter from left to right).
  // 4. Section 3 (Register Interest Inquiry Form) slides up over Section 2 once all cards are viewed.
  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const container = containerRef.current
    const pinEl = pinRef.current
    const s1 = section1Ref.current
    const videoWrap = videoWrapperRef.current
    const s2 = section2Ref.current
    const s3 = section3Ref.current

    if (!container || !pinEl || !s1 || !videoWrap || !s2 || !s3) {
      setIsGsapReady(true)
      return
    }

    const ctx = gsap.context(() => {
      const isMob = window.innerWidth < 768

      // Initial positions
      gsap.set(s1, { yPercent: 0, opacity: 1 })
      gsap.set(videoWrap, { scale: 0.84, opacity: 0.92, transformOrigin: 'center center' })
      gsap.set(s2, { yPercent: 100 })
      gsap.set(s3, { yPercent: 100 })

      // Set initial state for all property cards in the stage:
      // Card 0 starts active at xPercent: 0
      // All subsequent cards start off-screen to the right (xPercent: 100)
      projects.forEach((_, idx) => {
        const card = cardRefs.current[idx]
        if (card) {
          gsap.set(card, {
            xPercent: idx === 0 ? 0 : 100,
            opacity: 1,
            zIndex: 10 + idx,
          })
        }
      })

      // Calculate responsive scroll travel:
      // ~420px per card swipe on mobile, ~550px on desktop for 1 natural swipe per transition
      const totalCards = Math.max(1, projects.length)
      const perCardTravel = isMob ? 550 : 650
      const totalScrollTravel = (isMob ? 1000 : 1200) + totalCards * perCardTravel

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: `+=${totalScrollTravel}`,
          pin: pinEl,
          pinSpacing: true,
          scrub: isMob ? 0.75 : 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      // STAGE 1: Video expands/zooms smoothly from 0.84 to 1.0
      tl.to(videoWrap, {
        scale: 1.0,
        opacity: 1.0,
        duration: 1.0,
        ease: 'power2.out',
      })

      // STAGE 2: Crisp hold so video is appreciated full-screen
      tl.to({}, { duration: 0.35 })

      // STAGE 3: Section 2 (Signature Projects Stage) slides up smoothly over Section 1 while Section 1 fades
      tl.to(s2, {
        yPercent: 0,
        duration: 1.1,
        ease: 'power2.inOut',
      }, 'stage3')
      tl.to(s1, {
        opacity: 0,
        duration: 0.5,
        ease: 'power1.out',
      }, 'stage3+=0.5')

      // STAGE 4: Hold first property card in view
      tl.to({}, { duration: 0.4 })

      // STAGE 5: Horizontal sliding animation for all properties!
      // When scrolling down: Card i slides OUT to the left, Card i+1 enters from the RIGHT.
      // When scrolling up: GSAP scrub cleanly reverses (Card i+1 exits right, Card i enters from left).
      for (let i = 0; i < projects.length - 1; i++) {
        const currentCard = cardRefs.current[i]
        const nextCard = cardRefs.current[i + 1]
        const shiftLabel = `card-shift-${i}`

        if (currentCard && nextCard) {
          // Current card slides out to the left
          tl.to(
            currentCard,
            {
              xPercent: -100,
              opacity: 0.25,
              duration: 1.0,
              ease: 'power2.inOut',
            },
            shiftLabel
          )

          // Next card enters from the right to center
          tl.to(
            nextCard,
            {
              xPercent: 0,
              opacity: 1,
              duration: 1.0,
              ease: 'power2.inOut',
            },
            shiftLabel
          )

          // Hold next card in view so user can read details and interact
          tl.to({}, { duration: 0.45 })
        }
      }

      // STAGE 6: Section 3 (Register Interest Inquiry Form) slides up over Section 2 while Section 2 fades
      tl.to(s3, {
        yPercent: 0,
        duration: 1.1,
        ease: 'power2.inOut',
      }, 'stage6')
      tl.to(s2, {
        opacity: 0,
        duration: 0.5,
        ease: 'power1.out',
      }, 'stage6+=0.5')

      // STAGE 7: Brief hold on inquiry form before page unpins to footer
      tl.to({}, { duration: 0.3 })
      ScrollTrigger.refresh()
      setIsGsapReady(true)
    })

    return () => ctx.revert()
  }, [projects])

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
    <div className={cn("relative selection:bg-[#7DD3FC]/20 selection:text-white transition-colors duration-300", themeTokens.collectionCountry.pageBg(isLight))}>
      {/* Top Fixed Navigation */}
      <Navigation />

      {/* =========================================================================
          MASTER PINNED OVERLAY SCROLL CONTAINER
          - Section 1: Hero Video (Zooms from 0.84 -> 1.0)
          - Section 2: Signature Projects Stage
                       One card at a time under one container.
                       Vertical scroll animates cards horizontally (right to left).
                       Upward scroll animates cards in reverse (left to right).
          - Section 3: Register Interest Form (Overlay card rising from bottom, pinned)
      ========================================================================= */}
      <div ref={containerRef} className="relative w-full">
        <div
          ref={pinRef}
          className={cn("relative w-full h-screen overflow-hidden transition-colors duration-300", isLight ? "bg-[#FBF9F6]" : "bg-[#040810]")}
        >
          {/* Subtle ambient deep glow */}
          {!isLight && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#38BDF8]/10 blur-[150px] pointer-events-none z-0" />
          )}

          {/* =========================================================================
              SECTION 1: COUNTRY HERO (EDITORIAL + EXPANDING VIDEO)
          ========================================================================= */}
          <section
            ref={section1Ref}
            id="country-hero-section"
            style={{ backgroundColor: isLight ? '#FBF9F6' : '#040810' }}
            className={cn(
              "absolute inset-0 w-full h-full z-10 overflow-hidden flex flex-col justify-between pt-24 sm:pt-28 pb-[calc(env(safe-area-inset-bottom,0px)+74px)] sm:pb-6 px-4 sm:px-8 lg:px-16 transition-colors duration-300",
              isLight ? "bg-[#FBF9F6]" : "bg-[#040810]"
            )}
          >
            <div className="relative max-w-[1440px] w-full mx-auto h-full flex flex-col justify-between">
              {/* Top Editorial Header — ~25-30% of screen */}
              <div className="flex-none flex flex-col justify-center py-1 sm:py-2">
                {/* Back Pill Button */}
                <div className="mb-2 sm:mb-2.5">
                  <Link
                    href="/#collection"
                    className={cn(
                      "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.2em] transition-all shadow-md cursor-pointer",
                      themeTokens.collectionCountry.backButton(isLight)
                    )}
                  >
                    <ArrowLeft size={12} />
                    <span>Back to Collection</span>
                  </Link>
                </div>

                {/* Country Editorial Details */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 sm:gap-6 my-1">
                  <div>
                    {country.region && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("w-5 h-px transition-colors duration-300", themeTokens.collectionCountry.tagLine(isLight))} />
                        <span className={cn("font-mono text-[10px] sm:text-xs uppercase tracking-[0.28em] transition-colors duration-300", themeTokens.collectionCountry.tag(isLight))}>
                          {country.region}
                        </span>
                      </div>
                    )}

                    <h1 className={cn("heading-display font-light text-2xl sm:text-4xl lg:text-5xl tracking-tight leading-none mb-1 transition-colors duration-300", themeTokens.collectionCountry.heading(isLight))}>
                      {country.displayName || country.name}
                    </h1>

                    {country.cities && (
                      <p className={cn("font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.22em] transition-colors duration-300", themeTokens.collectionCountry.subheading(isLight))}>
                        {country.cities}
                      </p>
                    )}
                  </div>

                  {country.description && (
                    <p className={cn("font-sans text-xs sm:text-sm lg:text-base font-light leading-relaxed max-w-xl md:text-right mt-1 md:mt-1.5 transition-colors duration-300", themeTokens.collectionCountry.description(isLight))}>
                      {country.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Balanced Video Container — Takes ~65-70% of viewport, zooms to full size on scroll */}
              <div className="flex-1 min-h-0 w-full flex flex-col justify-center pb-2 sm:pb-3 items-center">
                <div
                  ref={videoWrapperRef}
                  className={cn(
                    "relative w-full h-[52vh] sm:h-[62vh] lg:h-[65vh] max-h-[68vh] rounded-2xl sm:rounded-3xl overflow-hidden will-change-transform transition-all duration-300",
                    themeTokens.collectionCountry.videoFrame(isLight)
                  )}
                >
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    poster={country.heroVideoThumb || country.cardImage || undefined}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    onLoadedData={() => {
                      console.log('[Apex Lifecycle] Hero video loaded for:', country.slug)
                      setVideoLoaded(true)
                    }}
                    className="w-full h-full object-cover object-center pointer-events-none"
                  />

                  {/* Cinematic Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  {/* Scroll down prompt overlay at bottom edge */}
                  <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-15 pointer-events-none flex flex-col items-center">
                    <span className="font-mono text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-white/70 mb-1 font-light drop-shadow">
                      Scroll to expand video &amp; explore projects
                    </span>
                    <ArrowDown size={11} className="text-[#7DD3FC] animate-bounce drop-shadow" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 2: SIGNATURE PROJECTS STAGE (SLIDES UP OVER SECTION 1, PINS AT TOP: 0)
              - Occupies viewport under one clean central div
              - One property card visible at a time
              - On vertical scroll down: Card 1 slides out to LEFT, Card 2 enters from RIGHT
              - On upward scroll: previous cards enter from LEFT to RIGHT in reverse
          ========================================================================= */}
          <section
            ref={section2Ref}
            id="signature-projects"
            style={{ backgroundColor: isLight ? '#FBF9F6' : '#040810' }}
            className={cn(
              "absolute inset-0 w-full h-full z-20 flex flex-col justify-between pt-16 sm:pt-20 pb-16 sm:pb-8 px-3 sm:px-8 lg:px-12 overflow-hidden transition-colors duration-300",
              themeTokens.collectionCountry.sectionContainer(isLight)
            )}
          >
            <div className="max-w-[1440px] mx-auto w-full h-full flex flex-col justify-between">
              {/* Section Header */}
              <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-2 sm:pb-3 border-b shrink-0 transition-colors duration-300", isLight ? "border-[#0B1325]/10" : "border-white/10")}>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn("w-5 h-px transition-colors duration-300", themeTokens.collectionCountry.tagLine(isLight))} />
                    <span className={cn("font-mono text-[9px] sm:text-xs uppercase tracking-[0.25em] transition-colors duration-300", themeTokens.collectionCountry.tag(isLight))}>
                      PORTFOLIO · CURATED RESIDENCES
                    </span>
                  </div>
                  <h2 className={cn("heading-display font-light text-lg sm:text-2xl lg:text-3xl tracking-tight transition-colors duration-300", themeTokens.collectionCountry.heading(isLight))}>
                    Signature Projects in {country.displayName || country.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn("font-mono text-[9px] sm:text-[11px] tracking-[0.2em] uppercase transition-colors duration-300", themeTokens.collectionCountry.tag(isLight))}>
                    {projects.length} {projects.length === 1 ? 'RESIDENCE' : 'RESIDENCES'} RECORDED
                  </span>
                </div>
              </div>

              {/* =====================================================================
                  THE CENTRAL CARD STAGE (FRAMED UNDER ONE DIV)
                  Occupies viewport space cleanly with rounded border & deep shadow
              ===================================================================== */}
              <div className={cn(
                "relative flex-1 min-h-0 w-full max-w-5xl mx-auto my-2 sm:my-3 rounded-2xl sm:rounded-3xl overflow-hidden transition-colors duration-300",
                themeTokens.collectionCountry.cardStageFrame(isLight)
              )}>
                {projects.map((project, idx) => (
                  <div
                    key={project.id}
                    ref={(el) => {
                      cardRefs.current[idx] = el
                    }}
                    className={cn(
                    "absolute inset-0 w-full h-full flex flex-col md:flex-row overflow-hidden will-change-transform transition-colors duration-300",
                    themeTokens.collectionCountry.cardItem(isLight)
                  )}
                  >
                    {/* Visual Half (Desktop: Left 54%, Mobile: Top 48%) */}
                    <div className="relative w-full md:w-[54%] h-[48%] md:h-full overflow-hidden bg-black shrink-0">
                      <img
                        src={encodeURI(project.image)}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                      <div className={cn(
                        "absolute inset-0 opacity-90 pointer-events-none transition-colors duration-300",
                        isLight
                          ? "bg-gradient-to-t md:bg-gradient-to-r from-white via-transparent to-black/30"
                          : "bg-gradient-to-t md:bg-gradient-to-r from-[#070E1C] via-transparent to-black/30"
                      )} />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em] transition-colors",
                          themeTokens.collectionCountry.cardBadge(isLight)
                        )}>
                          {project.type}
                        </span>
                        <span className={cn(
                          "px-2.5 py-1 rounded-full font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em] transition-colors",
                          themeTokens.collectionCountry.cardBadgeSecondary(isLight)
                        )}>
                          {project.city}
                        </span>
                      </div>

                      {/* Watermark Index */}
                      <div className={cn(
                        "absolute bottom-2 left-3 sm:bottom-4 sm:left-4 z-10 font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase transition-colors",
                        isLight ? "text-[#0B1325]/50" : "text-white/50"
                      )}>
                        0{idx + 1} / 0{projects.length}
                      </div>
                    </div>

                    {/* Editorial Details Half (Desktop: Right 46%, Mobile: Bottom 52%) */}
                    <div className="relative flex-1 p-4 sm:p-7 md:p-8 flex flex-col justify-between overflow-y-auto">
                      <div>
                        {/* Property Tag & Price */}
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                          <span className={cn("font-mono text-[8px] sm:text-[10px] uppercase tracking-[0.25em] transition-colors", themeTokens.collectionCountry.tag(isLight))}>
                            RESIDENCE · 0{idx + 1} OF 0{projects.length}
                          </span>
                          {project.price && (
                            <span className={cn("font-mono text-xs sm:text-base font-semibold drop-shadow transition-colors", themeTokens.collectionCountry.cardPrice(isLight))}>
                              {project.price}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className={cn("heading-display font-light text-xl sm:text-3xl md:text-4xl tracking-tight mb-1 sm:mb-2 leading-tight transition-colors", themeTokens.collectionCountry.heading(isLight))}>
                          {project.title}
                        </h3>

                        {/* Specifications Line */}
                        <div className={cn("flex flex-wrap items-center gap-2 font-mono text-[9px] sm:text-xs mb-2 sm:mb-3 pb-2 sm:pb-3 border-b transition-colors", themeTokens.collectionCountry.cardSpecs(isLight))}>
                          {project.beds && <span>{project.beds}</span>}
                          {project.baths && <span>· {project.baths} Baths</span>}
                          {project.area && <span>· {project.area}</span>}
                        </div>

                        {/* Description */}
                        <p className={cn("font-sans text-xs sm:text-sm font-light leading-relaxed mb-3 line-clamp-3 md:line-clamp-4 transition-colors", themeTokens.collectionCountry.cardDesc(isLight))}>
                          {project.description ||
                            project.shortDescription ||
                            'An extraordinary private architectural sanctuary curated by Apex Pacific Holdings.'}
                        </p>

                        {/* Highlights (visible on tablet/desktop) */}
                        {project.highlights && project.highlights.length > 0 && (
                          <div className="hidden sm:flex flex-wrap gap-2 mb-3">
                            {project.highlights.slice(0, 3).map((h, hIdx) => (
                              <span
                                key={hIdx}
                                className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-light transition-colors", themeTokens.collectionCountry.cardHighlightTag(isLight))}
                              >
                                <Check size={11} className={cn("shrink-0 transition-colors", themeTokens.collectionCountry.cardHighlightIcon(isLight))} />
                                <span>{h}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions: Direct Link + Linear Dialog Modal */}
                      <div className={cn("pt-2 sm:pt-3 border-t flex items-center gap-2 sm:gap-3 shrink-0 transition-colors", isLight ? "border-[#0B1325]/10" : "border-white/10")}>
                        {/* Primary Explore Button */}
                        <Link
                          href={`/collection/${country.slug}/${project.slug}?from=collection`}
                          className={cn(
                            "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all group cursor-pointer",
                            themeTokens.collectionCountry.exploreButton(isLight)
                          )}
                        >
                          <span>Explore Residence</span>
                          <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                        </Link>

                        {/* Details Modal Trigger */}
                        <Dialog>
                          <DialogTrigger
                            style={{ borderRadius: '12px' }}
                            className={cn(
                              "p-2.5 sm:py-3 sm:px-4 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
                              themeTokens.collectionCountry.detailsButton(isLight)
                            )}
                            aria-label={`View dossier for ${project.title}`}
                          >
                            <Plus size={15} />
                            <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider">Details</span>
                          </DialogTrigger>

                          {/* Expanded Dialog Modal Matching Accordion Reference */}
                          <DialogContainer className="p-3 sm:p-6 lg:p-8 pb-16 sm:pb-8 flex items-center justify-center">
                            <DialogContent
                              style={{ borderRadius: '24px' }}
                              className={cn(
                                "relative flex h-auto max-h-[86vh] sm:max-h-[88vh] mx-auto flex-col overflow-hidden sm:overflow-y-auto w-full max-w-2xl transition-colors duration-300",
                                themeTokens.collectionCountry.dialogContent(isLight)
                              )}
                            >
                              <DialogClose className={cn(
                                "p-2 sm:p-2.5 rounded-full transition-colors shadow-lg z-30",
                                themeTokens.collectionCountry.dialogClose(isLight)
                              )} />

                              {/* Modal Hero Image */}
                              <div className="relative w-full aspect-[16/9] max-h-[24vh] sm:max-h-[36vh] overflow-hidden bg-black shrink-0">
                                <DialogImage
                                  src={project.image}
                                  alt={project.title}
                                  className="h-full w-full object-cover"
                                />
                                <div className={cn(
                                  "absolute inset-0 pointer-events-none transition-colors",
                                  isLight ? "bg-gradient-to-t from-white via-transparent to-black/30" : "bg-gradient-to-t from-[#070E1C] via-transparent to-black/30"
                                )} />
                              </div>

                              {/* Modal Content Body */}
                              <div className="p-4 sm:p-7 md:p-8 flex-1 flex flex-col justify-between">
                                <div>
                                  <span className={cn("font-mono text-[9px] sm:text-xs uppercase tracking-[0.25em] block mb-1 transition-colors", themeTokens.collectionCountry.tag(isLight))}>
                                    {project.type} · {project.city}
                                  </span>

                                  <DialogTitle className={cn("heading-display font-light text-xl sm:text-4xl tracking-tight mb-1 sm:mb-2 transition-colors", themeTokens.collectionCountry.heading(isLight))}>
                                    {project.title}
                                  </DialogTitle>

                                  <div className={cn("flex flex-wrap items-center gap-2 font-mono text-[10px] sm:text-xs mb-2 sm:mb-4 pb-2 sm:pb-3 border-b transition-colors", themeTokens.collectionCountry.cardSpecs(isLight))}>
                                    {project.beds && <span>{project.beds}</span>}
                                    {project.baths && <span>· {project.baths} Baths</span>}
                                    {project.area && <span>· {project.area}</span>}
                                    {project.price && <span className={cn(isLight ? "text-[#0B1325] font-semibold" : "text-[#7DD3FC]")}>· {project.price}</span>}
                                  </div>

                                  <DialogDescription
                                    disableLayoutAnimation
                                    variants={{
                                      initial: { opacity: 0, scale: 0.95, y: -20 },
                                      animate: { opacity: 1, scale: 1, y: 0 },
                                      exit: { opacity: 0, scale: 0.95, y: -20 },
                                    }}
                                  >
                                    <p className="font-sans text-xs sm:text-sm text-white/85 font-light leading-relaxed mb-2 sm:mb-5 line-clamp-3 sm:line-clamp-none">
                                      {project.description ||
                                        project.shortDescription ||
                                        'An extraordinary private architectural sanctuary curated by Apex Pacific Holdings.'}
                                    </p>

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

                                <div className={cn("pt-2 sm:pt-3 mt-2 sm:mt-3 border-t shrink-0 transition-colors", isLight ? "border-[#0B1325]/10" : "border-white/10")}>
                                  <Link
                                    href={`/collection/${country.slug}/${project.slug}?from=collection`}
                                    className={cn(
                                      "w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 sm:py-3.5 rounded-xl font-mono text-xs uppercase tracking-[0.25em] transition-all duration-300 group cursor-pointer",
                                      themeTokens.collectionCountry.exploreButton(isLight)
                                    )}
                                  >
                                    <span>Explore Residence</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                  </Link>
                                </div>
                              </div>
                            </DialogContent>
                          </DialogContainer>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Stage Progress Sub-label */}
              <div className={cn("flex items-center justify-between px-2 pt-1 font-mono text-[9px] shrink-0 transition-colors", isLight ? "text-[#6B6661]" : "text-white/40")}>
                <span>Scroll vertically to slide through residences</span>
                <span>{projects.length} curated properties</span>
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 3: DIRECT CONFIDENTIAL INQUIRY FORM (SLIDES UP OVER SECTION 2)
          ========================================================================= */}
          <section
            ref={section3Ref}
            id="country-inquiry"
            style={{ backgroundColor: isLight ? '#FBF9F6' : '#040810' }}
            className={cn(
              "absolute inset-0 w-full h-full z-30 flex flex-col justify-center items-center py-12 sm:py-16 px-4 sm:px-8 overflow-y-auto transition-colors duration-300",
              themeTokens.collectionCountry.sectionContainer(isLight)
            )}
          >
            <div className={cn(
              "max-w-2xl mx-auto rounded-2xl sm:rounded-3xl p-6 sm:p-10 transition-colors duration-300",
              themeTokens.collectionCountry.inquiryCard(isLight)
            )}>
              <div className="text-center mb-8">
                <div className={cn(
                  "inline-flex items-center gap-2 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.25em] mb-3 transition-colors",
                  themeTokens.collectionCountry.inquiryBadge(isLight)
                )}>
                  <Sparkles size={12} />
                  <span>CONFIDENTIAL ADVISORY</span>
                </div>
                <h2 className={cn("heading-display font-light text-2xl sm:text-4xl tracking-tight mb-2 transition-colors", themeTokens.collectionCountry.heading(isLight))}>
                  Register Interest in {country.displayName || country.name}
                </h2>
                <p className={cn("font-sans text-xs sm:text-sm font-light max-w-lg mx-auto leading-relaxed transition-colors", themeTokens.collectionCountry.subheading(isLight))}>
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
                  <p className="font-sans text-xs sm:text-sm text-white/70 max-w-md mx-auto">
                    Our private acquisitions desk has registered your confidential interest. An executive advisor will connect with you via secure channel.
                  </p>
                  {enquiryRef && (
                    <div className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] text-[#7DD3FC]">
                      REF: {enquiryRef}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                      {formError}
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label className={cn("block text-[10px] font-mono uppercase tracking-[0.2em] mb-1.5 transition-colors", themeTokens.collectionCountry.inquiryLabel(isLight))}>
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={14} className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors", themeTokens.collectionCountry.inquiryIcon(isLight))} />
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Lord Alexander Wright"
                        className={cn("w-full rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors", themeTokens.collectionCountry.inquiryInput(isLight))}
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={cn("block text-[10px] font-mono uppercase tracking-[0.2em] mb-1.5 transition-colors", themeTokens.collectionCountry.inquiryLabel(isLight))}>
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail size={14} className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors", themeTokens.collectionCountry.inquiryIcon(isLight))} />
                        <input
                          type="email"
                          required
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="name@example.com"
                          className={cn("w-full rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors", themeTokens.collectionCountry.inquiryInput(isLight))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={cn("block text-[10px] font-mono uppercase tracking-[0.2em] mb-1.5 transition-colors", themeTokens.collectionCountry.inquiryLabel(isLight))}>
                        Phone (+Country Code) *
                      </label>
                      <div className="relative">
                        <Phone size={14} className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors", themeTokens.collectionCountry.inquiryIcon(isLight))} />
                        <input
                          type="tel"
                          required
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          placeholder="+971 50 123 4567"
                          className={cn("w-full rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors", themeTokens.collectionCountry.inquiryInput(isLight))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className={cn("block text-[10px] font-mono uppercase tracking-[0.2em] mb-1.5 transition-colors", themeTokens.collectionCountry.inquiryLabel(isLight))}>
                      Residence / Portfolio Requirement
                    </label>
                    <textarea
                      rows={3}
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      className={cn("w-full rounded-xl p-3 text-xs sm:text-sm focus:outline-none transition-colors resize-none", themeTokens.collectionCountry.inquiryInput(isLight))}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-mono text-xs uppercase tracking-[0.25em] transition-all duration-300 cursor-pointer disabled:opacity-50",
                      themeTokens.collectionCountry.inquiryButton(isLight)
                    )}
                  >
                    <span>{formSubmitting ? 'Registering Interest...' : 'Request Confidential Dossier'}</span>
                    <ArrowRight size={14} />
                  </button>

                  <div className={cn("flex items-center justify-center gap-2 pt-2 text-[10px] font-mono transition-colors", isLight ? "text-[#6B6661]" : "text-white/40")}>
                    <ShieldCheck size={12} className={isLight ? "text-emerald-600" : "text-emerald-400"} />
                    <span>Strict Non-Disclosure Protocol · Direct Developer Representation</span>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: FOOTER (SOLID OPAQUE Z-40 BACKGROUND)
      ========================================================================= */}
      <div className={cn("relative z-40 w-full transition-colors duration-300", themeTokens.collectionCountry.footerSection(isLight))}>
        <Footer />
      </div>

      {/* Luxury Loading Transition Overlay */}
      <AnimatePresence>
        {!isPageReady && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={cn(
              "fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-auto select-none transition-colors",
              isLight ? "bg-[#FBF9F6]" : "bg-[#040810]"
            )}
          >
            <OrbitalLoader
              size="md"
              message={`Loading ${country.displayName || country.name} Collection...`}
              messagePlacement="bottom"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
