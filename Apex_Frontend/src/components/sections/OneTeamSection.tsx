'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface MediaTile {
  id: string
  title: string
  image: string
  href: string
}

const TILES: MediaTile[] = [
  {
    id: 'luxury-villas',
    title: 'Luxury Villas',
    image: '/images/laxuryVillaImage.png',
    href: '/services/luxury-villas',
  },
  {
    id: 'commercial',
    title: 'Commercial Properties',
    image: '/images/commercialimage.png',
    href: '/services/commercial-properties',
  },
  {
    id: 'sky-residences',
    title: 'Sky Residences',
    image: '/images/skyResidenceImage.png',
    href: '/services/sky-residences',
  },
  {
    id: 'waterfront',
    title: 'Waterfront Residences',
    image: '/images/waterFrontResidenceImage.png',
    href: '/properties',
  },
]

export function OneTeamSection() {
  const rootRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const mediaStageRef = useRef<HTMLDivElement>(null)
  const videoWrapperRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const topTilesRef = useRef<HTMLDivElement>(null)
  const bottomTilesRef = useRef<HTMLDivElement>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)

  // Safe video autoplay
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.playsInline = true
    const p = video.play()
    if (p !== undefined) {
      p.then(() => setVideoLoaded(true)).catch(() => setVideoLoaded(true))
    }
  }, [])

  // GSAP ScrollTrigger Sequence:
  // Phase 1: Full-Screen Dedicated Text Page (WHAT WE DO / One team, end to end)
  // Phase 2: Pinned Video rises smoothly from the bottom and becomes centered
  // Phase 3: Pinned Video holds centered and isolated
  // Phase 4: Four images reveal around the video from top and bottom
  // Phase 5: All five media panels settle together locked in complete composition
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const root = rootRef.current
    const pinEl = pinRef.current
    const textLayer = textLayerRef.current
    const mediaStage = mediaStageRef.current
    const topTiles = topTilesRef.current
    const bottomTiles = bottomTilesRef.current
    const videoWrap = videoWrapperRef.current

    if (!root || !pinEl || !textLayer || !mediaStage || !topTiles || !bottomTiles) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      gsap.set(mediaStage, { yPercent: 0, opacity: 1 })
      gsap.set(topTiles, { yPercent: 0, opacity: 1 })
      gsap.set(bottomTiles, { yPercent: 0, opacity: 1 })
      return
    }

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 1024

      // Initial States:
      // Text layer is stationary at yPercent: 0
      gsap.set(textLayer, { yPercent: 0, opacity: 1 })
      // Media stage is off-screen below
      gsap.set(mediaStage, { yPercent: 100, opacity: 1 })
      // Top 2 tiles are off-screen above
      gsap.set(topTiles, { yPercent: isMobile ? -160 : -140, opacity: 0 })
      // Bottom 2 tiles are off-screen below
      gsap.set(bottomTiles, { yPercent: isMobile ? 160 : 140, opacity: 0 })
      if (videoWrap) {
        gsap.set(videoWrap, { scale: 1.0 })
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: isMobile ? '+=2400vh' : '+=2800vh',
          pin: pinEl,
          pinSpacing: true,
          scrub: 1.2, // Cinematic dampening
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      // ─── PHASE 1: TEXT PAGE HOLDS STATIONARY & PINNED (0.0 to 2.5) ───
      // Dedicated, full-screen section with zero video or images
      tl.to(textLayer, { duration: 2.5 }, 0)

      // ─── PHASE 2: PINNED VIDEO RISES FROM THE BOTTOM (2.5 to 7.5, duration 5.0) ───
      // Media stage glides smoothly up from the bottom over the text page.
      // Top & bottom tiles stay off-screen, so ONLY the video rises and settles in the center!
      tl.to(
        mediaStage,
        { yPercent: 0, duration: 5.0, ease: 'none' },
        2.5
      )

      // ─── PHASE 3: VIDEO HOLDS STATIONARY & CENTERED (7.5 to 10.5, duration 3.0) ───
      // Video is completely centered in the viewport, playing inline
      tl.to(mediaStage, { duration: 3.0 }, 7.5)

      // ─── PHASE 4: FOUR IMAGES REVEAL AROUND THE VIDEO (10.5 to 16.5, duration 6.0) ───
      // Two tiles slide down from top, two tiles slide up from bottom
      tl.to(
        topTiles,
        {
          yPercent: 0,
          opacity: 1,
          duration: 6.0,
          ease: 'none',
        },
        10.5
      )
      tl.to(
        bottomTiles,
        {
          yPercent: 0,
          opacity: 1,
          duration: 6.0,
          ease: 'none',
        },
        10.5
      )

      // ─── PHASE 5: ALL FIVE MEDIA PANELS SETTLE TOGETHER LOCKED (16.5 to 22.5, duration 6.0) ───
      // Full 5-panel composition visible together, balanced, interactive, and clickable
      tl.to(mediaStage, { duration: 6.0 }, 16.5)
    }, root)

    return () => ctx.revert()
  }, [])

  const topLeft = TILES[0]     // Luxury Villas
  const topRight = TILES[1]    // Commercial Properties
  const bottomLeft = TILES[2]  // Sky Residences
  const bottomRight = TILES[3] // Waterfront Residences

  return (
    <section ref={rootRef} className="relative w-full bg-[#040810] text-[#F8FAFC]">
      {/* Pinned 100vh Viewport Container */}
      <div
        ref={pinRef}
        className="relative w-full h-screen h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#040810] select-none"
      >
        {/* ══════════════════════════════════════════════════════════════════
            LAYER 1: DEDICATED FULL-SCREEN TEXT PAGE
            (What We Do / One team, end to end — Zero video/images on this page)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={textLayerRef}
          style={{ zIndex: 10 }}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center px-6 sm:px-12 bg-[#040810]"
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.22) 0%, transparent 68%)',
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
              <span className="w-8 h-px bg-sky-400/60" />
              <span className="font-mono text-xs sm:text-sm tracking-[0.32em] uppercase text-[#7DD3FC] font-medium">
                WHAT WE DO
              </span>
              <span className="w-8 h-px bg-sky-400/60" />
            </div>

            {/* Main Title */}
            <h2
              className="heading-display font-light text-white tracking-tight leading-[1.08] mb-5 sm:mb-7 text-balance"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 4.8rem)' }}
            >
              One team, <em className="italic text-sky-200">end to end</em>
            </h2>

            {/* Description */}
            <p className="font-sans text-xs sm:text-base md:text-lg text-[#94A3B8] font-light max-w-xl mx-auto leading-relaxed text-pretty">
              Development, design and advice from a single studio, so nothing is lost between the drawing board and the front door.
            </p>

            {/* Subtle Scroll Cue */}
            <div className="flex flex-col items-center justify-center gap-2 mt-8 sm:mt-12 text-[10px] font-mono tracking-[0.25em] text-[#64748B] uppercase">
              <span>SCROLL TO EXPLORE</span>
              <div className="w-px h-6 sm:h-8 bg-gradient-to-b from-sky-400 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 2: MEDIA STAGE LAYER
            (Video rises from bottom first, then 4 images reveal around it)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={mediaStageRef}
          style={{ zIndex: 20 }}
          className="absolute inset-0 w-full h-full bg-[#040810] flex flex-col justify-center items-center px-3 sm:px-6 md:px-8 lg:px-12 pb-[calc(env(safe-area-inset-bottom)+70px)] sm:pb-8 pt-4 sm:pt-6 overflow-hidden shadow-[0_-30px_70px_rgba(0,0,0,0.98)] border-t border-white/10"
        >
          {/* 5-Panel Content Grid */}
          <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col justify-center my-auto gap-2 sm:gap-3 md:gap-4 overflow-hidden">
            {/* ─── ROW 1: TOP 2 IMAGE TILES (Slide down from top) ─── */}
            <div
              ref={topTilesRef}
              className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 will-change-[transform,opacity]"
            >
              {/* Top-Left: Luxury Villas */}
              <Link
                href={topLeft.href}
                className="relative h-20 sm:h-28 md:h-36 lg:h-40 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-sky-400/50 transition-all duration-300 group shadow-xl"
              >
                <Image
                  src={topLeft.image}
                  alt={topLeft.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 30vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-10 flex flex-col">
                  <span className="w-3.5 h-px bg-sky-400/60 block mb-1" />
                  <span className="font-serif text-xs sm:text-base md:text-lg font-light text-white group-hover:text-sky-200 transition-colors truncate">
                    {topLeft.title}
                  </span>
                </div>
              </Link>

              {/* Top-Right: Commercial Properties */}
              <Link
                href={topRight.href}
                className="relative h-20 sm:h-28 md:h-36 lg:h-40 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-sky-400/50 transition-all duration-300 group shadow-xl"
              >
                <Image
                  src={topRight.image}
                  alt={topRight.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 30vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-10 flex flex-col">
                  <span className="w-3.5 h-px bg-sky-400/60 block mb-1" />
                  <span className="font-serif text-xs sm:text-base md:text-lg font-light text-white group-hover:text-sky-200 transition-colors truncate">
                    {topRight.title}
                  </span>
                </div>
              </Link>
            </div>

            {/* ─── ROW 2: CENTRAL PINNED VIDEO (Rises from bottom first) ─── */}
            <div
              ref={videoWrapperRef}
              className="relative w-full h-32 sm:h-48 md:h-60 lg:h-72 rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl will-change-transform"
            >
              <video
                ref={videoRef}
                src="/videos/one%20team%20end%20to%20end.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedData={() => setVideoLoaded(true)}
                className="w-full h-full object-cover object-center transition-opacity duration-700"
                style={{ opacity: videoLoaded ? 1 : 0.85 }}
              >
                <source src="/videos/one%20team%20end%20to%20end.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-[#040810]/80 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-2 sm:bottom-3.5 left-2.5 sm:left-4 z-10">
                <span className="font-mono text-[8px] sm:text-[10px] tracking-widest uppercase text-[#7DD3FC] block mb-0.5">
                  APEX PACIFIC HOLDINGS
                </span>
                <p className="font-serif text-xs sm:text-base md:text-lg text-white font-light">
                  One team, end to end
                </p>
              </div>
            </div>

            {/* ─── ROW 3: BOTTOM 2 IMAGE TILES (Slide up from bottom) ─── */}
            <div
              ref={bottomTilesRef}
              className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 will-change-[transform,opacity]"
            >
              {/* Bottom-Left: Sky Residences */}
              <Link
                href={bottomLeft.href}
                className="relative h-20 sm:h-28 md:h-36 lg:h-40 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-sky-400/50 transition-all duration-300 group shadow-xl"
              >
                <Image
                  src={bottomLeft.image}
                  alt={bottomLeft.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 30vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-10 flex flex-col">
                  <span className="w-3.5 h-px bg-sky-400/60 block mb-1" />
                  <span className="font-serif text-xs sm:text-base md:text-lg font-light text-white group-hover:text-sky-200 transition-colors truncate">
                    {bottomLeft.title}
                  </span>
                </div>
              </Link>

              {/* Bottom-Right: Waterfront Residences */}
              <Link
                href={bottomRight.href}
                className="relative h-20 sm:h-28 md:h-36 lg:h-40 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-sky-400/50 transition-all duration-300 group shadow-xl"
              >
                <Image
                  src={bottomRight.image}
                  alt={bottomRight.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 30vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-10 flex flex-col">
                  <span className="w-3.5 h-px bg-sky-400/60 block mb-1" />
                  <span className="font-serif text-xs sm:text-base md:text-lg font-light text-white group-hover:text-sky-200 transition-colors truncate">
                    {bottomRight.title}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
