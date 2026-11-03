"use client"

import React, { useEffect, useRef, useState, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { OrbitalLoader } from "@/components/ui/orbital-loader"

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, Sparkles, Compass } from "lucide-react"
import { ServiceItem } from "@/data/services"
import { ScrollingProjectItem } from "@/components/ui/images-scrolling-animation"

interface ServiceDetailClientProps {
  service: ServiceItem
  nextService: ServiceItem
  properties: ScrollingProjectItem[]
}

export function ServiceDetailClient({
  service,
  nextService,
  properties,
}: ServiceDetailClientProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const section1Ref = useRef<HTMLElement>(null)
  const section2Ref = useRef<HTMLElement>(null)
  const section3Ref = useRef<HTMLElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const [isGsapReady, setIsGsapReady] = useState(false)

  // Safety fallback timer ensuring loading overlay always dismisses cleanly
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGsapReady(true)
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  const handleBackToServices = (e: React.MouseEvent) => {
    e.preventDefault()
    if (typeof window !== "undefined") {
      router.push('/#services')
    }
  }

  // Ensure cardRefs array matches properties length
  cardRefs.current = cardRefs.current.slice(0, properties.length)

  // Master GSAP ScrollTrigger Pinned Stack & Vertical Overlapping Cards Reveal
  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const container = containerRef.current
    const pinEl = pinRef.current
    const s1 = section1Ref.current
    const s2 = section2Ref.current
    const s3 = section3Ref.current

    if (!container || !pinEl || !s1 || !s2 || !s3) {
      setIsGsapReady(true)
      return
    }

    const ctx = gsap.context(() => {
      const isMob = window.innerWidth < 768
      const cardElements = cardRefs.current.filter(Boolean) as HTMLDivElement[]

      // Initial state of sections
      gsap.set(s1, { yPercent: 0, opacity: 1 })
      gsap.set(s2, { yPercent: 100 })
      gsap.set(s3, { yPercent: 100 })

      // Initial state of cards inside Section 2
      // Card 0 is in center; subsequent cards start stacked just beneath with compact offset (no large gap!)
      if (cardElements.length > 0) {
        gsap.set(cardElements[0], { yPercent: 0, scale: 1, opacity: 1 })
        for (let i = 1; i < cardElements.length; i++) {
          gsap.set(cardElements[i], { yPercent: 75, scale: 0.96, opacity: 0.4 })
        }
      }

      // Fast, responsive scroll distance: 1 swift scroll/swipe per card!
      const totalCards = Math.max(1, cardElements.length)
      const scrollDistance = isMob
        ? 320 + totalCards * 160
        : 450 + totalCards * 220

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: `+=${scrollDistance}`,
          pin: pinEl,
          pinSpacing: true,
          scrub: isMob ? 0.2 : 0.35,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      // ─── STAGE 1: Hero Section holds briefly ───
      tl.to({}, { duration: 0.05 })

      // ─── STAGE 2: Section 2 (Signature Properties) slides up over Section 1 ───
      tl.to(s2, {
        yPercent: 0,
        duration: 0.6,
        ease: "power2.out",
      })

      // ─── STAGE 3: Card 0 holds briefly ───
      tl.to({}, { duration: 0.05 })

      // ─── STAGE 4: Scroll-scrubbed stacked cards reveal with parallax & zero void ───
      for (let i = 1; i < cardElements.length; i++) {
        const currentCard = cardElements[i]
        const prevCard = cardElements[i - 1]

        // Current card slides up and stacks directly over previous card
        tl.to(currentCard, {
          yPercent: 0,
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
        })

        // Previous card scales down and moves slightly up (parallax depth)
        tl.to(
          prevCard,
          {
            scale: 0.94,
            y: -14,
            opacity: 0.7,
            duration: 0.6,
            ease: "power2.out",
          },
          "<"
        )

        // Card before previous scales down further
        if (i >= 2 && cardElements[i - 2]) {
          tl.to(
            cardElements[i - 2],
            {
              scale: 0.88,
              y: -26,
              opacity: 0.45,
              duration: 0.6,
              ease: "power2.out",
            },
            "<"
          )
        }

        // Brief hold per card
        tl.to({}, { duration: 0.05 })
      }

      // ─── STAGE 5: Hold all stacked cards briefly ───
      tl.to({}, { duration: 0.05 })

      // ─── STAGE 6: Section 3 (Structured Deliverables) slides up over Section 2 ───
      tl.to(s3, {
        yPercent: 0,
        duration: 0.6,
        ease: "power2.out",
      })

      // ─── STAGE 7: Hold Section 3 pinned for reading & clicking Enquire / Next ───
      tl.to({}, { duration: 0.3 })
      ScrollTrigger.refresh()
      setIsGsapReady(true)
    }, container)

    return () => ctx.revert()
  }, [properties.length])

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30"
    >
      {/* Pinned 100vh Master Stage */}
      <div
        ref={pinRef}
        className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-[var(--bg-primary)] select-none"
      >
        {/* Subtle ambient luxury light glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-sky-500/10 blur-[150px] pointer-events-none z-0" />

        {/* ════════════════════════════════════════════════════════════════
            PAGE 1 / SECTION 1: HERO & FOCUS (Pinned Initial Screen)
           ════════════════════════════════════════════════════════════════ */}
        <section
          ref={section1Ref}
          className="absolute inset-0 w-full h-full z-10 flex flex-col justify-between pt-16 sm:pt-20 lg:pt-24 pb-[calc(env(safe-area-inset-bottom)+75px)] sm:pb-8 px-4 sm:px-8 lg:px-14 max-w-[1440px] mx-auto overflow-hidden bg-[var(--bg-primary)] select-auto"
        >
          {/* Top Bar: Back to Services Navigation */}
          <div className="shrink-0 mb-1.5 sm:mb-4">
            <button
              onClick={handleBackToServices}
              className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.24em] text-[var(--accent)] hover:text-white transition-all font-mono py-1 px-2.5 -ml-2.5 rounded-full hover:bg-white/5 cursor-pointer"
            >
              <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1" />
              <span>Back to Services</span>
            </button>
          </div>

          {/* Hero Editorial Grid: Fits 100% inside single screen */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 sm:gap-6 lg:gap-12 items-center my-auto flex-1 max-h-[calc(100dvh-140px)]">
            {/* Left Column: Title, Subtitle, Description & Actions */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2.5 mb-1.5 sm:mb-3">
                <span className="font-mono text-xs tracking-[0.25em] text-[var(--accent)] font-semibold">
                  {service.number}
                </span>
                <span className="w-6 sm:w-8 h-px bg-[var(--accent)]/60" />
                <span className="font-sans text-[10px] sm:text-xs uppercase tracking-[0.24em] text-[var(--accent)] font-medium truncate">
                  {service.subtitle}
                </span>
              </div>

              <h1
                className="font-serif font-light text-white tracking-tight leading-[0.96] mb-1.5 sm:mb-3"
                style={{ fontSize: "clamp(1.85rem, 5vw, 4.2rem)" }}
              >
                {service.title}
              </h1>

              {service.tagline && (
                <p className="font-serif text-xs sm:text-base lg:text-xl text-sky-200/90 font-light mb-1.5 sm:mb-3 leading-snug line-clamp-2">
                  &ldquo;{service.tagline}&rdquo;
                </p>
              )}

              <p className="font-sans text-neutral-300 text-xs sm:text-sm lg:text-base leading-relaxed font-light max-w-xl mb-3 sm:mb-6 line-clamp-3">
                {service.heroDescription}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-[var(--accent)] hover:bg-[#93c5fd] text-black font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-sans rounded-full transition-all duration-300 hover:scale-[1.02] shadow-md shadow-sky-500/20"
                >
                  Schedule Consultation
                </Link>
                <Link
                  href="/collection"
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-3 border border-white/20 hover:border-white text-white text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-sans font-medium rounded-full transition-all duration-300 hover:bg-white/10"
                >
                  <span>Explore Portfolio</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>

            {/* Right Column: APEX ARCHITECTURAL FOCUS Card with Apex Logo beside text */}
            <div className="bg-gradient-to-b from-[#0B1528]/95 to-[#050B16]/95 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 lg:p-7 border border-sky-400/20 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden">
              {/* Header: Apex Logo beside APEX ARCHITECTURAL FOCUS */}
              <div className="flex items-center justify-between pb-2.5 sm:pb-4 mb-2.5 sm:mb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-black/50 border border-white/20 p-1 flex items-center justify-center shrink-0">
                    <Image
                      src="/images/legacy-logo-transparent.png"
                      alt="Apex Pacific Holdings"
                      width={22}
                      height={22}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.22em] text-[var(--accent)] uppercase font-semibold">
                      APEX ARCHITECTURAL FOCUS
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-sans text-neutral-400 uppercase tracking-widest hidden sm:block">
                      Studio Tenets &amp; Standards
                    </span>
                  </div>
                </div>
                <Sparkles size={14} className="text-[var(--accent)] shrink-0 opacity-80" />
              </div>

              {/* List of Focus Tenets: 2-column on mobile, vertical on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
                {service.architecturalFocus.map((focus, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-sky-500/10 border border-sky-400/30 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={10} className="text-[var(--accent)]" strokeWidth={2.2} />
                    </div>
                    <span className="font-sans text-[11px] sm:text-xs text-neutral-200 font-light leading-tight">
                      {focus}
                    </span>
                  </div>
                ))}
              </div>

              {/* Micro footer guarantee */}
              <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
                <span>Bespoke Execution</span>
                <span className="text-[var(--accent)]">100% End-to-End</span>
              </div>
            </div>
          </div>

          {/* Bottom Scroll Prompt */}
          <div className="shrink-0 flex items-center justify-center gap-2 pt-1 text-[9px] sm:text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
            <span>Scroll to explore signature residences</span>
            <span className="animate-bounce">↓</span>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PAGE 2 / SECTION 2: SIGNATURE PROPERTIES STACKED CARDS
            (Overlays Section 1; cards slide up and stack over each other)
           ════════════════════════════════════════════════════════════════ */}
        <section
          ref={section2Ref}
          className="absolute inset-0 w-full h-full z-20 flex flex-col justify-between pt-16 sm:pt-20 pb-[calc(env(safe-area-inset-bottom)+75px)] sm:pb-6 px-4 sm:px-8 max-w-[1440px] mx-auto bg-[#030712] overflow-hidden border-t border-white/10 shadow-[0_-30px_70px_rgba(0,0,0,0.98)] select-auto"
        >
          {/* Fixed Section Header at Top */}
          <div className="shrink-0 pt-1 pb-1 text-center pointer-events-none">
            <div className="flex items-center justify-center gap-2 text-sky-400 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.28em] mb-0.5">
              <Compass size={12} />
              <span>REPRESENTATIVE RESIDENCES</span>
            </div>
            <h2 className="font-serif text-lg sm:text-2xl lg:text-3xl font-light text-white tracking-tight">
              Signature Properties in {service.title}
            </h2>
            <p className="font-mono text-[8px] sm:text-[9px] text-neutral-400 uppercase tracking-[0.2em] mt-0.5">
              {properties.length} Architectural Masterworks Recorded · Scroll To Stack
            </p>
          </div>

          {/* Stacked Cards Stage: Centered in the remaining viewport */}
          <div className="relative flex-1 w-full max-w-4xl mx-auto flex items-center justify-center overflow-hidden my-auto">
            {properties.map((project, idx) => {
              const CardWrapper = project.href ? Link : "div"
              const wrapperProps = project.href
                ? { href: project.href, className: "block w-full h-full" }
                : { className: "w-full h-full" }

              return (
                <div
                  key={`card_${idx}_${project.title}`}
                  ref={(el) => {
                    cardRefs.current[idx] = el
                  }}
                  style={{ zIndex: 10 + idx }}
                  className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 will-change-[transform,opacity]"
                >
                  <div
                    className="rounded-2xl sm:rounded-3xl relative flex origin-top flex-col overflow-hidden
                               w-[88vw] max-w-[340px] h-[310px]
                               sm:max-w-[460px] sm:h-[350px] 
                               md:max-w-[600px] md:h-[380px] 
                               lg:max-w-[720px] lg:h-[410px]
                               border border-white/20 bg-[#070E1C] shadow-[0_25px_60px_rgba(0,0,0,0.95)] 
                               group transition-shadow duration-500 hover:shadow-[0_25px_80px_rgba(56,189,248,0.25)]"
                  >
                    <CardWrapper {...(wrapperProps as any)}>
                      {/* Main Visual Image */}
                      <img
                        src={project.src || "/placeholder.svg"}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />

                      {/* Luxury Vignette Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/20 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-10 flex items-center gap-2">
                        {project.type && (
                          <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-[#7DD3FC]">
                            {project.type}
                          </span>
                        )}
                        {project.city && (
                          <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white/80">
                            {project.city}
                          </span>
                        )}
                      </div>

                      {/* Bottom Editorial Content Bar */}
                      <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5 z-10 flex items-end justify-between gap-3">
                        <div>
                          <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.28em] text-[#7DD3FC] block mb-0.5">
                            RESIDENCE 0{idx + 1}
                          </span>
                          <h3 className="heading-display font-light text-lg sm:text-2xl md:text-3xl text-white tracking-tight leading-tight">
                            {project.title}
                          </h3>
                          {(project.beds || project.price) && (
                            <p className="font-mono text-[9px] sm:text-xs text-white/70 mt-0.5">
                              {project.beds && <span>{project.beds}</span>}
                              {project.beds && project.price && <span> · </span>}
                              {project.price && (
                                <span className="text-[#7DD3FC] font-medium">{project.price}</span>
                              )}
                            </p>
                          )}
                        </div>

                        {project.href && (
                          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black border border-white/25 group-hover:border-white font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.16em] transition-all duration-300 backdrop-blur-md shrink-0 shadow-lg">
                            <span>View</span>
                            <ArrowUpRight
                              size={11}
                              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                            />
                          </div>
                        )}
                      </div>
                    </CardWrapper>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom Card Counter / Stack Hint */}
          <div className="shrink-0 text-center text-[8px] sm:text-[9px] font-mono text-neutral-400 uppercase tracking-widest pb-0.5">
            <span>Scroll to stack residences &amp; reveal deliverables ↓</span>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PAGE 3 / SECTION 3: STRUCTURED DELIVERABLES + ENQUIRE + NEXT
            (Overlays Section 2; 100dvh Single Page, Clean & Compact)
           ════════════════════════════════════════════════════════════════ */}
        <section
          ref={section3Ref}
          className="absolute inset-0 w-full h-full z-30 flex flex-col justify-between pt-16 sm:pt-20 pb-[calc(env(safe-area-inset-bottom)+88px)] sm:pb-8 px-4 sm:px-8 lg:px-14 max-w-[1440px] mx-auto bg-[#040810] overflow-hidden border-t border-white/10 shadow-[0_-30px_70px_rgba(0,0,0,0.98)] select-auto"
        >
          {/* Top Header & Intro */}
          <div className="shrink-0 max-w-2xl">
            <div className="flex items-center gap-2 text-[var(--accent)] font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.28em] mb-1">
              <span className="w-4 sm:w-5 h-px bg-[var(--accent)]" />
              <span>SCOPE OF ENGAGEMENT</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-light text-white tracking-tight mb-1">
              Structured Deliverables
            </h2>
            <p className="font-sans text-[11px] sm:text-xs text-neutral-300 leading-relaxed font-light line-clamp-2">
              Every Apex residence is conceived through an uncompromising delivery framework, balancing creative liberty with rigorous architectural accountability.
            </p>
          </div>

          {/* 4 Pillars Grid (Compact 2x2 on mobile, 4 columns on large screens) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 my-auto py-1">
            {service.deliverables.slice(0, 4).map((item, index) => (
              <div
                key={index}
                className="p-2.5 sm:p-4 rounded-xl bg-gradient-to-b from-[#091122]/90 to-[#040812]/95 border border-white/10 hover:border-sky-400/40 transition-all duration-300 group shadow-lg flex flex-col justify-between min-h-[85px] sm:min-h-[120px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] sm:text-xs text-[var(--accent)] tracking-widest font-semibold">
                      0{index + 1}
                    </span>
                    <span className="text-[7px] sm:text-[8px] font-mono tracking-widest uppercase text-neutral-500 group-hover:text-sky-300 transition-colors">
                      Pillar
                    </span>
                  </div>
                  <h3 className="font-serif text-xs sm:text-sm lg:text-base text-white font-light mb-1 group-hover:text-sky-100 transition-colors leading-tight">
                    {item.title}
                  </h3>
                </div>
                <p className="font-sans text-[9px] sm:text-[11px] text-neutral-400 leading-relaxed font-light line-clamp-2 sm:line-clamp-3">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom Bar: All Services, Enquire Button & Next Service Navigation */}
          <div className="shrink-0 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 sm:gap-3">
            {/* Left: Back / Services Hub link */}
            <button
              onClick={handleBackToServices}
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors font-sans cursor-pointer py-1"
            >
              <ArrowLeft size={12} />
              <span className="hidden sm:inline">All Services</span>
              <span className="sm:hidden">Services</span>
            </button>

            {/* Right: Direct Enquire Button & Next Service Navigation */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Direct Enquire Button */}
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-black font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-sans rounded-full transition-all duration-300 hover:scale-[1.03] shadow-lg shadow-sky-500/25"
              >
                <span>ENQUIRE</span>
              </Link>

              {/* Next Service Link */}
              <Link
                href={nextService.route}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/20 hover:border-white text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-white hover:text-sky-200 transition-all font-sans group hover:bg-white/5"
              >
                <span>Next: {nextService.title}</span>
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-sky-400/40 group-hover:border-sky-400 flex items-center justify-center text-sky-400 transition-all group-hover:translate-x-0.5">
                  <ArrowRight size={10} />
                </div>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Luxury Loading Transition Overlay */}
      {mounted && createPortal(
        <AnimatePresence>
          {!isGsapReady && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="fixed inset-0 z-[9999] bg-[#040810] flex flex-col items-center justify-center pointer-events-auto select-none"
            >
              <OrbitalLoader
                size="md"
                message={`Loading ${service.title}...`}
                messagePlacement="bottom"
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
