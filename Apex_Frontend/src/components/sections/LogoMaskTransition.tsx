'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, MapPin, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

// Flagship estate views revealed through the letter "A" transition
const ESTATE_VIEWS = [
  {
    id: 'solaria-exterior',
    name: 'Cantilever Oceanfront',
    category: 'Exterior Architecture',
    image: 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=2400&q=90&auto=format&fit=crop',
    tag: 'Signature 01',
    specs: '16,400 sq.ft · 6 Suites · 45m Cantilever Pool',
  },
  {
    id: 'solaria-atrium',
    name: 'Double-Height Atrium',
    category: 'Grand Living Salon',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2400&q=90&auto=format&fit=crop',
    tag: 'Signature 02',
    specs: '12m Ceiling · Calacatta Marble · Internal Courtyard',
  },
  {
    id: 'solaria-twilight',
    name: 'Twilight Peninsula',
    category: 'Private Marina & Deck',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=2400&q=90&auto=format&fit=crop',
    tag: 'Signature 03',
    specs: 'Helipad Access · 90m Yacht Berth · Sunset West View',
  },
]

export function LogoMaskTransition() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pinnedStageRef = useRef<HTMLDivElement>(null)
  const maskGroupRef = useRef<SVGGElement>(null)
  const maskCounterRef = useRef<SVGPathElement>(null)
  const goldOutlineRef = useRef<SVGGElement>(null)
  const overlayRectRef = useRef<SVGRectElement>(null)
  const estateHudRef = useRef<HTMLDivElement>(null)
  const bgImageContainerRef = useRef<HTMLDivElement>(null)

  const [activeViewIndex, setActiveViewIndex] = useState(0)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const container = containerRef.current
    const pinnedStage = pinnedStageRef.current
    const maskGroup = maskGroupRef.current
    const maskCounter = maskCounterRef.current
    const goldOutline = goldOutlineRef.current
    const overlayRect = overlayRectRef.current
    const estateHud = estateHudRef.current
    const bgImageContainer = bgImageContainerRef.current

    if (!container || !pinnedStage || !maskGroup) return

    const ctx = gsap.context(() => {
      // Main master scroll-driven transition timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: '+=200%',
          pin: pinnedStage,
          scrub: 1,
          anticipatePin: 1,
        },
      })

      // 1. Initial emergence (0% - 20%):
      // The outlined letter 'A' emerges smoothly from the CENTER of the screen
      if (goldOutline) {
        tl.fromTo(
          goldOutline,
          {
            scale: 0.25,
            opacity: 0,
            transformOrigin: '500px 500px',
          },
          {
            scale: 1,
            opacity: 1,
            transformOrigin: '500px 500px',
            duration: 0.25,
            ease: 'power2.out',
          },
          0
        )
      }

      // 2. Inner counter of the 'A' dissolves as scale begins (10% - 25%)
      if (maskCounter) {
        tl.fromTo(
          maskCounter,
          { opacity: 1 },
          {
            opacity: 0,
            duration: 0.2,
            ease: 'power1.inOut',
          },
          0.1
        )
      }

      // 3. The Letter 'A' Mask expands smoothly and proportionally from center (10% - 85%)
      // Scales from 1x to 42x centered dead-center at (500px, 500px)
      tl.fromTo(
        maskGroup,
        {
          scale: 0.35,
          transformOrigin: '500px 500px',
        },
        {
          scale: 42,
          transformOrigin: '500px 500px',
          duration: 1.0,
          ease: 'power2.inOut',
        },
        0.08
      )

      // 4. Gold outline scales outward and disperses as mask opens up (20% - 55%)
      if (goldOutline) {
        tl.to(
          goldOutline,
          {
            scale: 16,
            opacity: 0,
            transformOrigin: '500px 500px',
            duration: 0.45,
            ease: 'power1.in',
          },
          0.25
        )
      }

      // 5. Revealed background image executes subtle counter-scale (1.12 to 1.0)
      if (bgImageContainer) {
        tl.fromTo(
          bgImageContainer,
          {
            scale: 1.14,
            filter: 'brightness(0.9)',
          },
          {
            scale: 1.0,
            filter: 'brightness(1.0)',
            duration: 1.0,
            ease: 'power1.out',
          },
          0.08
        )
      }

      // 6. As mask fills screen (75% - 95%), fade the dark overlay curtain completely out
      if (overlayRect) {
        tl.to(
          overlayRect,
          {
            opacity: 0,
            duration: 0.25,
            ease: 'power1.inOut',
          },
          0.72
        )
      }

      // 7. Reveal Estate HUD and specifications smoothly as section takes over (72% - 100%)
      if (estateHud) {
        tl.fromTo(
          estateHud,
          {
            opacity: 0,
            y: 40,
            pointerEvents: 'none',
          },
          {
            opacity: 1,
            y: 0,
            pointerEvents: 'auto',
            duration: 0.28,
            ease: 'power2.out',
          },
          0.72
        )
      }
    }, container)

    return () => ctx.revert()
  }, [])

  const activeEstate = ESTATE_VIEWS[activeViewIndex]

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#171411] text-[var(--text-primary)] overflow-clip"
      style={{ minHeight: '300vh' }}
      aria-label="Apex Architectural Transition"
    >
      {/* Pinned Stage Container */}
      <div
        ref={pinnedStageRef}
        className="relative w-full h-screen overflow-hidden flex items-center justify-center select-none"
      >
        {/* ============================================================ */}
        {/* LAYER 1: REVEALED CONTENT (Underneath the 'A' Mask) */}
        {/* ============================================================ */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {/* Background Estate Image with Subtle Counter-Scale */}
          <div
            ref={bgImageContainerRef}
            className="absolute inset-0 w-full h-full will-change-transform"
          >
            {ESTATE_VIEWS.map((view, idx) => (
              <div
                key={view.id}
                className={cn(
                  'absolute inset-0 transition-opacity duration-1000 ease-in-out',
                  idx === activeViewIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                )}
              >
                <Image
                  src={view.image}
                  alt={view.name}
                  fill
                  priority={idx === 0}
                  className="object-cover object-center"
                  sizes="100vw"
                  quality={90}
                />
              </div>
            ))}

            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
          </div>

          {/* Architectural HUD & Estate Showcase (revealed on scroll) */}
          <div
            ref={estateHudRef}
            className="absolute inset-0 z-20 flex flex-col justify-between p-6 sm:p-10 lg:p-16 pointer-events-none"
          >
            {/* Top Bar of Revealed Estate */}
            <div className="flex items-center justify-between pt-16 md:pt-12">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--steelblue)] animate-pulse" />
                <span className="font-mono text-xs tracking-[0.25em] text-[var(--steelblue)] uppercase">
                  Flagship Estate Commission · 2026
                </span>
              </div>

              {/* View Switcher Tabs */}
              <div className="hidden md:flex items-center gap-2 p-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full pointer-events-auto">
                {ESTATE_VIEWS.map((view, i) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveViewIndex(i)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300',
                      activeViewIndex === i
                        ? 'bg-[var(--steelblue)] text-black font-medium shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {view.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Panel of Revealed Estate */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              {/* Left Column: Residence Identity */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-[var(--steelblue)]" />
                  <span className="text-xs font-mono text-white/80 tracking-widest uppercase">
                    Emirates Hills · Waterfront Peninsula
                  </span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white font-light tracking-tight mb-3">
                  The Solaria Horizon
                </h2>

                <p className="font-sans text-xs sm:text-sm md:text-base text-white/70 max-w-xl font-light mb-5">
                  {activeEstate.specs}. Architectural masterwork sculpted with floating travertine planes,
                  frameless optical glass, and bespoke private superyacht mooring.
                </p>

                {/* Specs Pills */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 bg-black/40 backdrop-blur-sm border border-white/10 rounded-md text-xs font-mono text-white/90">
                    16,400 SQ. FT.
                  </span>
                  <span className="px-3 py-1 bg-black/40 backdrop-blur-sm border border-white/10 rounded-md text-xs font-mono text-white/90">
                    6 BEDROOM SUITES
                  </span>
                  <span className="px-3 py-1 bg-black/40 backdrop-blur-sm border border-white/10 rounded-md text-xs font-mono text-white/90">
                    45M CANTILEVER POOL
                  </span>
                  <span className="px-3 py-1 bg-black/40 backdrop-blur-sm border border-[var(--steelblue)]/40 rounded-md text-xs font-mono text-[var(--steelblue)]">
                    $42,500,000 USD
                  </span>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="lg:col-span-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3.5 pointer-events-auto">
                <Link
                  href="/#contact"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[var(--steelblue)] hover:bg-[#D9BC7A] text-[#171411] font-medium text-xs tracking-[0.18em] uppercase rounded-full transition-all duration-300 shadow-md group"
                >
                  <span>Inquire Residence</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>

                <Link
                  href="/properties"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/20 text-xs tracking-[0.18em] uppercase rounded-full transition-all duration-300 backdrop-blur-md"
                >
                  <Eye className="w-4 h-4 text-[var(--steelblue)]" />
                  <span>Full Portfolio</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* LAYER 2: SVG 'A' LOGO MASK & CURTAIN OVERLAY */}
        {/* ============================================================ */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Fine Champagne-Gold Gradients */}
            <linearGradient id="apexGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-light)" />
              <stop offset="40%" stopColor="var(--steelblue)" />
              <stop offset="80%" stopColor="#DFC08A" />
              <stop offset="100%" stopColor="#9C7E3A" />
            </linearGradient>

            {/* SVG Mask Definition */}
            {/* White area = visible dark curtain. Black area = cutout window into the estate */}
            <mask
              id="apex-logo-mask"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="1000"
              height="1000"
            >
              {/* Solid White Rect: keeps the entire overlay opaque */}
              <rect width="1000" height="1000" fill="white" />

              {/* The Letter 'A' Group that scales up from CENTER via GSAP */}
              <g ref={maskGroupRef} style={{ transformOrigin: '500px 500px' }}>
                {/* 
                  Letter 'A' Outer Silhouette Path (cutout hole = fill black)
                  Centered exactly at (500, 500)
                */}
                <path
                  d="M 486,290 L 514,290 L 690,710 L 626,710 L 572,575 L 428,575 L 374,710 L 310,710 Z"
                  fill="black"
                />

                {/* Inner Counter: Dissolves during first scroll phase */}
                <path
                  ref={maskCounterRef}
                  d="M 500,388 L 548,518 L 452,518 Z"
                  fill="white"
                />
              </g>
            </mask>
          </defs>

          {/* Solid Dark Obsidian Curtain Overlay with the 'A' Cutout Mask */}
          <rect
            ref={overlayRectRef}
            width="1000"
            height="1000"
            fill="#171411"
            mask="url(#apex-logo-mask)"
          />

          {/* Outlined Champagne-Gold Letter 'A' Monogram emerging from center */}
          <g ref={goldOutlineRef} style={{ transformOrigin: '500px 500px' }}>
            {/* Outer Letter Contour */}
            <path
              d="M 486,290 L 514,290 L 690,710 L 626,710 L 572,575 L 428,575 L 374,710 L 310,710 Z"
              fill="none"
              stroke="url(#apexGoldGrad)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Inner Triangle Contour */}
            <path
              d="M 500,388 L 548,518 L 452,518 Z"
              fill="none"
              stroke="url(#apexGoldGrad)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              opacity="0.8"
            />
          </g>
        </svg>
      </div>
    </section>
  )
}
