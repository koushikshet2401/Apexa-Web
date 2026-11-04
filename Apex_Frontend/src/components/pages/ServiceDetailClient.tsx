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
import { useTheme } from "@/components/providers/ThemeProvider"
import { themeTokens } from "@/lib/theme"
import { cn } from "@/lib/utils"

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
  const { isLight } = useTheme()
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
    ScrollTrigger.config({ ignoreMobileResize: true })

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

      // Balanced, luxury scroll distance across mobile and desktop:
      // Smooth, natural 1-swipe/wheel turn per property card and section transition
      const totalCards = Math.max(1, cardElements.length)
      const scrollDistance = isMob
        ? 1400 + totalCards * 500
        : 1800 + totalCards * 650

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: `+=${scrollDistance}`,
          pin: pinEl,
          pinSpacing: true,
          scrub: isMob ? 0.75 : 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      // ─── STAGE 1: Hero Section holds briefly ───
      tl.to({}, { duration: 0.15 })

      // ─── STAGE 2: Section 2 (Signature Properties) slides up over Section 1 while Section 1 fades ───
      tl.to(s2, {
        yPercent: 0,
        duration: 0.8,
        ease: "power2.out",
      }, 'stage2')
      tl.to(s1, {
        opacity: 0,
        duration: 0.5,
        ease: "power1.out",
      }, 'stage2+=0.3')

      // ─── STAGE 3: Card 0 holds briefly ───
      tl.to({}, { duration: 0.25 })

      // ─── STAGE 4: Scroll-scrubbed stacked cards reveal with parallax & zero void ───
      for (let i = 1; i < cardElements.length; i++) {
        const currentCard = cardElements[i]
        const prevCard = cardElements[i - 1]

        // Current card slides up and stacks directly over previous card
        tl.to(currentCard, {
          yPercent: 0,
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
        })

        // Previous card scales down and moves slightly up (parallax depth)
        tl.to(
          prevCard,
          {
            scale: 0.94,
            y: -14,
            opacity: 0.7,
            duration: 0.8,
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
              duration: 0.8,
              ease: "power2.out",
            },
            "<"
          )
        }

        // Brief hold per card so user can clearly view property
        tl.to({}, { duration: 0.25 })
      }

      // ─── STAGE 5: Hold all stacked cards briefly ───
      tl.to({}, { duration: 0.2 })

      // ─── STAGE 6: Section 3 (Structured Deliverables) slides up over Section 2 while Section 2 fades ───
      tl.to(s3, {
        yPercent: 0,
        duration: 0.8,
        ease: "power2.out",
      }, 'stage6')
      tl.to(s2, {
        opacity: 0,
        duration: 0.5,
        ease: "power1.out",
      }, 'stage6+=0.3')

      // ─── STAGE 7: Hold Section 3 pinned for reading & clicking Enquire / Next ───
      tl.to({}, { duration: 0.4 })
      ScrollTrigger.refresh()
      setIsGsapReady(true)
    }, container)

    return () => ctx.revert()
  }, [properties.length])

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full selection:bg-[#7DD3FC]/20 transition-colors duration-300", themeTokens.serviceDetail.pageBg(isLight))}
    >
      {/* Pinned 100vh Master Stage */}
      <div
        ref={pinRef}
        className={cn("relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden select-none transition-colors duration-300", isLight ? "bg-[#FBF9F6]" : "bg-[#040810]")}
      >
        {/* Subtle ambient luxury light glow */}
        {!isLight && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-sky-500/10 blur-[150px] pointer-events-none z-0" />
        )}

        {/* ════════════════════════════════════════════════════════════════
            PAGE 1 / SECTION 1: HERO & FOCUS (Pinned Initial Screen)
           ════════════════════════════════════════════════════════════════ */}
        <section
          ref={section1Ref}
          style={{ backgroundColor: isLight ? '#FBF9F6' : '#040810' }}
          className={cn(
            "absolute inset-0 w-full h-full z-10 flex flex-col justify-between pt-16 sm:pt-20 lg:pt-24 pb-[calc(env(safe-area-inset-bottom)+75px)] sm:pb-8 px-4 sm:px-8 lg:px-14 max-w-[1440px] mx-auto overflow-hidden select-auto transition-colors duration-300",
            isLight ? "bg-[#FBF9F6]" : "bg-[#040810]"
          )}
        >
          {/* Top Bar: Back to Services Navigation */}
          <div className="shrink-0 mb-1.5 sm:mb-4">
            <button
              onClick={handleBackToServices}
              className={cn(
                "inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.24em] transition-all font-mono py-1 px-2.5 -ml-2.5 rounded-full cursor-pointer",
                themeTokens.serviceDetail.backButton(isLight)
              )}
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
                <span className={cn("font-mono text-xs tracking-[0.25em] font-semibold transition-colors", themeTokens.serviceDetail.tag(isLight))}>
                  {service.number}
                </span>
                <span className={cn("w-6 sm:w-8 h-px transition-colors", themeTokens.serviceDetail.tagLine(isLight))} />
                <span className={cn("font-sans text-[10px] sm:text-xs uppercase tracking-[0.24em] font-medium truncate transition-colors", themeTokens.serviceDetail.tag(isLight))}>
                  {service.subtitle}
                </span>
              </div>

              <h1
                className={cn("font-serif font-light tracking-tight leading-[0.96] mb-1.5 sm:mb-3 transition-colors", themeTokens.serviceDetail.heading(isLight))}
                style={{ fontSize: "clamp(1.85rem, 5vw, 4.2rem)" }}
              >
                {service.title}
              </h1>

              {service.tagline && (
                <p className={cn("font-serif text-xs sm:text-base lg:text-xl font-light mb-1.5 sm:mb-3 leading-snug line-clamp-2 transition-colors", themeTokens.serviceDetail.subheading(isLight))}>
                  &ldquo;{service.tagline}&rdquo;
                </p>
              )}

              <p className={cn("font-sans text-xs sm:text-sm lg:text-base leading-relaxed font-light max-w-xl mb-3 sm:mb-6 line-clamp-3 transition-colors", themeTokens.serviceDetail.description(isLight))}>
                {service.heroDescription}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <Link
                  href="/contact"
                  className={cn(
                    "inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-sans rounded-full transition-all duration-300 hover:scale-[1.02] cursor-pointer",
                    themeTokens.serviceDetail.consultButton(isLight)
                  )}
                >
                  Schedule Consultation
                </Link>
                <Link
                  href="/collection"
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-3 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-sans font-medium rounded-full transition-all duration-300 cursor-pointer",
                    themeTokens.serviceDetail.exploreButton(isLight)
                  )}
                >
                  <span>Explore Portfolio</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>

            {/* Right Column: APEX ARCHITECTURAL FOCUS Card with Apex Logo beside text */}
            <div className={cn(
              "rounded-xl sm:rounded-2xl p-3.5 sm:p-6 lg:p-7 backdrop-blur-xl relative overflow-hidden transition-colors duration-300",
              themeTokens.serviceDetail.focusCard(isLight)
            )}>
              {/* Header: Apex Logo beside APEX ARCHITECTURAL FOCUS */}
              <div className={cn("flex items-center justify-between pb-2.5 sm:pb-4 mb-2.5 sm:mb-4 border-b transition-colors", themeTokens.serviceDetail.focusDivider(isLight))}>
                <div className="flex items-center gap-2.5">
                  <div className={cn("relative w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden p-1 flex items-center justify-center shrink-0 transition-colors", themeTokens.serviceDetail.focusIconWrap(isLight))}>
                    <Image
                      src="/images/legacy-logo-transparent.png"
                      alt="Apex Pacific Holdings"
                      width={22}
                      height={22}
                      className={cn("object-contain", isLight && "invert")}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className={cn("text-[10px] sm:text-[11px] font-mono tracking-[0.22em] uppercase font-semibold transition-colors", themeTokens.serviceDetail.tag(isLight))}>
                      APEX ARCHITECTURAL FOCUS
                    </span>
                    <span className={cn("text-[8px] sm:text-[9px] font-sans uppercase tracking-widest hidden sm:block transition-colors", themeTokens.serviceDetail.focusSubtext(isLight))}>
                      Studio Tenets &amp; Standards
                    </span>
                  </div>
                </div>
                <Sparkles size={14} className={cn("shrink-0 opacity-80 transition-colors", themeTokens.serviceDetail.tag(isLight))} />
              </div>

              {/* List of Focus Tenets: 2-column on mobile, vertical on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
                {service.architecturalFocus.map((focus, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors", themeTokens.serviceDetail.focusCheckCircle(isLight))}>
                      <CheckCircle2 size={10} strokeWidth={2.2} />
                    </div>
                    <span className={cn("font-sans text-[11px] sm:text-xs font-light leading-tight transition-colors", themeTokens.serviceDetail.focusItemText(isLight))}>
                      {focus}
                    </span>
                  </div>
                ))}
              </div>

              {/* Micro footer guarantee */}
              <div className={cn("mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t flex items-center justify-between text-[9px] font-mono uppercase tracking-wider transition-colors", themeTokens.serviceDetail.focusDivider(isLight))}>
                <span className={cn("transition-colors", themeTokens.serviceDetail.focusSubtext(isLight))}>Bespoke Execution</span>
                <span className={cn("transition-colors font-medium", themeTokens.serviceDetail.tag(isLight))}>100% End-to-End</span>
              </div>
            </div>
          </div>

          {/* Bottom Scroll Prompt */}
          <div className={cn("shrink-0 flex items-center justify-center gap-2 pt-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest transition-colors", themeTokens.serviceDetail.scrollPrompt(isLight))}>
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
          style={{ backgroundColor: isLight ? '#FBF9F6' : '#030712' }}
          className={cn(
            "absolute inset-0 w-full h-full z-20 flex flex-col justify-between pt-16 sm:pt-20 pb-[calc(env(safe-area-inset-bottom)+75px)] sm:pb-6 px-4 sm:px-8 max-w-[1440px] mx-auto overflow-hidden select-auto transition-colors duration-300",
            themeTokens.serviceDetail.propertiesSection(isLight)
          )}
        >
          {/* Fixed Section Header at Top */}
          <div className="shrink-0 pt-1 pb-1 text-center pointer-events-none">
            <div className={cn("flex items-center justify-center gap-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.28em] mb-0.5 transition-colors", themeTokens.serviceDetail.tag(isLight))}>
              <Compass size={12} />
              <span>REPRESENTATIVE RESIDENCES</span>
            </div>
            <h2 className={cn("font-serif text-lg sm:text-2xl lg:text-3xl font-light tracking-tight transition-colors", themeTokens.serviceDetail.heading(isLight))}>
              Signature Properties in {service.title}
            </h2>
            <p className={cn("font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em] mt-0.5 transition-colors", themeTokens.serviceDetail.scrollPrompt(isLight))}>
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
                    className={cn(
                      "rounded-2xl sm:rounded-3xl relative flex origin-top flex-col overflow-hidden w-[88vw] max-w-[340px] h-[310px] sm:max-w-[460px] sm:h-[350px] md:max-w-[600px] md:h-[380px] lg:max-w-[720px] lg:h-[410px] group transition-all duration-500",
                      themeTokens.serviceDetail.propertyCard(isLight)
                    )}
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
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em] transition-colors",
                            themeTokens.serviceDetail.propertyBadge(isLight)
                          )}>
                            {project.type}
                          </span>
                        )}
                        {project.city && (
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em] transition-colors",
                            themeTokens.serviceDetail.propertyBadgeSecondary(isLight)
                          )}>
                            {project.city}
                          </span>
                        )}
                      </div>

                      {/* Bottom Editorial Content Bar */}
                      <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5 z-10 flex items-end justify-between gap-3">
                        <div>
                          <span className={cn("font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.28em] block mb-0.5 transition-colors", isLight ? "text-white/80" : "text-[#7DD3FC]")}>
                            RESIDENCE 0{idx + 1}
                          </span>
                          <h3 className="heading-display font-light text-lg sm:text-2xl md:text-3xl text-white tracking-tight leading-tight">
                            {project.title}
                          </h3>
                          {(project.beds || project.price) && (
                            <p className="font-mono text-[9px] sm:text-xs text-white/80 mt-0.5">
                              {project.beds && <span>{project.beds}</span>}
                              {project.beds && project.price && <span> · </span>}
                              {project.price && (
                                <span className={cn("font-medium transition-colors", isLight ? "text-white font-semibold" : "text-[#7DD3FC]")}>{project.price}</span>
                              )}
                            </p>
                          )}
                        </div>

                        {project.href && (
                          <div className={cn(
                            "inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.16em] transition-all duration-300 backdrop-blur-md shrink-0 cursor-pointer",
                            themeTokens.serviceDetail.propertyViewBtn(isLight)
                          )}>
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
          <div className={cn("shrink-0 text-center text-[8px] sm:text-[9px] font-mono uppercase tracking-widest pb-0.5 transition-colors", themeTokens.serviceDetail.scrollPrompt(isLight))}>
            <span>Scroll to stack residences &amp; reveal deliverables ↓</span>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PAGE 3 / SECTION 3: STRUCTURED DELIVERABLES + ENQUIRE + NEXT
            (Overlays Section 2; 100dvh Single Page, Clean & Compact)
           ════════════════════════════════════════════════════════════════ */}
        <section
          ref={section3Ref}
          style={{ backgroundColor: isLight ? '#FBF9F6' : '#040810' }}
          className={cn(
            "absolute inset-0 w-full h-full z-30 flex flex-col justify-between pt-16 sm:pt-20 pb-[calc(env(safe-area-inset-bottom)+88px)] sm:pb-8 px-4 sm:px-8 lg:px-14 max-w-[1440px] mx-auto overflow-hidden select-auto transition-colors duration-300",
            themeTokens.serviceDetail.deliverablesSection(isLight)
          )}
        >
          {/* Top Header & Intro */}
          <div className="shrink-0 max-w-2xl">
            <div className={cn("flex items-center gap-2 font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.28em] mb-1 transition-colors", themeTokens.serviceDetail.tag(isLight))}>
              <span className={cn("w-4 sm:w-5 h-px transition-colors", themeTokens.serviceDetail.tagLine(isLight))} />
              <span>SCOPE OF ENGAGEMENT</span>
            </div>
            <h2 className={cn("font-serif text-xl sm:text-2xl lg:text-3xl font-light tracking-tight mb-1 transition-colors", themeTokens.serviceDetail.heading(isLight))}>
              Structured Deliverables
            </h2>
            <p className={cn("font-sans text-[11px] sm:text-xs leading-relaxed font-light line-clamp-2 transition-colors", themeTokens.serviceDetail.description(isLight))}>
              Every Apex residence is conceived through an uncompromising delivery framework, balancing creative liberty with rigorous architectural accountability.
            </p>
          </div>

          {/* 4 Pillars Grid (Compact 2x2 on mobile, 4 columns on large screens) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 my-auto py-1">
            {service.deliverables.slice(0, 4).map((item, index) => (
              <div
                key={index}
                className={cn(
                  "p-2.5 sm:p-4 rounded-xl transition-all duration-300 group flex flex-col justify-between min-h-[85px] sm:min-h-[120px]",
                  themeTokens.serviceDetail.deliverableCard(isLight)
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("font-mono text-[10px] sm:text-xs tracking-widest font-semibold transition-colors", themeTokens.serviceDetail.tag(isLight))}>
                      0{index + 1}
                    </span>
                    <span className={cn("text-[7px] sm:text-[8px] font-mono tracking-widest uppercase transition-colors", themeTokens.serviceDetail.deliverablePillarLabel(isLight))}>
                      Pillar
                    </span>
                  </div>
                  <h3 className={cn("font-serif text-xs sm:text-sm lg:text-base font-light mb-1 transition-colors leading-tight", themeTokens.serviceDetail.heading(isLight))}>
                    {item.title}
                  </h3>
                </div>
                <p className={cn("font-sans text-[9px] sm:text-[11px] leading-relaxed font-light line-clamp-2 sm:line-clamp-3 transition-colors", themeTokens.serviceDetail.deliverableDetail(isLight))}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom Bar: All Services, Enquire Button & Next Service Navigation */}
          <div className={cn("shrink-0 pt-2.5 border-t flex items-center justify-between gap-2 sm:gap-3 transition-colors", isLight ? "border-[#0B1325]/10" : "border-white/10")}>
            {/* Left: Back / Services Hub link */}
            <button
              onClick={handleBackToServices}
              className={cn(
                "inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-colors font-sans cursor-pointer py-1",
                themeTokens.serviceDetail.backButton(isLight)
              )}
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
                className={cn(
                  "inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-sans rounded-full transition-all duration-300 hover:scale-[1.03] cursor-pointer",
                  themeTokens.serviceDetail.enquireButton(isLight)
                )}
              >
                <span>ENQUIRE</span>
              </Link>

              {/* Next Service Link */}
              <Link
                href={nextService.route}
                className={cn(
                  "inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-[11px] uppercase tracking-[0.18em] transition-all font-sans group cursor-pointer",
                  themeTokens.serviceDetail.nextButton(isLight)
                )}
              >
                <span>Next: {nextService.title}</span>
                <div className={cn("w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center transition-all group-hover:translate-x-0.5", isLight ? "border-[#0B1325]/30 text-[#0B1325]" : "border-sky-400/40 text-sky-400")}>
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
              className={cn(
                "fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-auto select-none transition-colors",
                isLight ? "bg-[#FBF9F6]" : "bg-[#040810]"
              )}
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
