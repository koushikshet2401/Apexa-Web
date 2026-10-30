'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useReducedMotion } from 'framer-motion'
import { Play, Pause, Search } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoWrapRef = useRef<HTMLDivElement>(null)
  const heroRootRef = useRef<HTMLDivElement>(null)
  const logoScaleWrapRef = useRef<HTMLDivElement>(null)
  const transitionOverlayRef = useRef<HTMLDivElement>(null)
  const heroContentRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReduceMotion = useReducedMotion()

  // Safely play video on mount
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.playsInline = true
    const p = video.play()
    if (p !== undefined) {
      p.then(() => {
        setIsPlaying(true)
        setVideoLoaded(true)
      }).catch(() => {
        setIsPlaying(false)
        setVideoLoaded(true)
      })
    }
  }, [])

  // Show play/pause controls on user interaction and auto-hide
  const handleUserInteraction = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 2800)
  }, [])

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => { })
    } else {
      video.pause()
      setIsPlaying(false)
    }
    handleUserInteraction()
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/properties?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/properties')
    }
  }

  // Scroll transition with GSAP ScrollTrigger:
  // 1. Keeps hero video pinned.
  // 2. APEX "A" emblem emerges, captures center position over Burj Khalifa, and HOLDS.
  // 3. Smooth forward zoom through camera into the pinned launches sequence.
  useEffect(() => {
    if (shouldReduceMotion) return

    gsap.registerPlugin(ScrollTrigger)

    const heroRoot = heroRootRef.current
    const logoScaleWrap = logoScaleWrapRef.current
    const videoWrap = videoWrapRef.current
    const transitionOverlay = transitionOverlayRef.current
    const heroContent = heroContentRef.current

    if (!heroRoot || !logoScaleWrap) return

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRoot,
          start: 'top top',
          end: isMobile ? '+=80vh' : '+=110vh',
          pin: true,
          pinSpacing: true,
          scrub: 0.35,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (logoScaleWrap) {
              if (self.progress >= 0.94) {
                logoScaleWrap.style.visibility = 'hidden'
              } else {
                logoScaleWrap.style.visibility = 'visible'
              }
            }
          },
        },
      })

      // Layer 1 UI fades out gently as user starts scrolling
      if (heroContent) {
        tl.to(heroContent, { opacity: 0, duration: 0.12, ease: 'power1.out' }, 0)
      }

      // Phase 1 (0.0 to 0.18): A logo emerges sharply directly over the tower
      tl.fromTo(
        logoScaleWrap,
        { scale: 0.65, opacity: 0, transformOrigin: '50% 50%' },
        { scale: 1.0, opacity: 1, transformOrigin: '50% 50%', duration: 0.18, ease: 'power2.out' },
        0
      )

      // Phase 2 (0.18 to 0.68): HOLD the "A" logo firmly in that exact captured place
      tl.to(
        logoScaleWrap,
        { scale: 1.05, opacity: 1, duration: 0.50, ease: 'none' },
        0.18
      )

      // Phase 3 (0.68 to 0.94): Smooth cinematic forward zoom through the camera
      tl.to(
        logoScaleWrap,
        {
          scale: 20.0,
          opacity: 0,
          transformOrigin: '50% 50%',
          duration: 0.26,
          ease: 'power2.in',
        },
        0.68
      )

      // Phase 4 (0.60 to 0.94): Subtle dark transition vignette for seamless handoff
      if (transitionOverlay) {
        tl.fromTo(
          transitionOverlay,
          { opacity: 0 },
          { opacity: 0.55, duration: 0.34, ease: 'power1.out' },
          0.60
        )
      }
    }, heroRoot)

    return () => {
      ctx.revert()
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    }
  }, [shouldReduceMotion])

  return (
    <section
      ref={heroRootRef}
      id="home"
      onMouseEnter={handleUserInteraction}
      onMouseMove={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      className="relative w-full h-screen overflow-hidden select-none bg-[#040810]"
      aria-label="Apex Pacific Holdings Hero"
    >
      {/* ═══════ LAYER 0: CINEMATIC FULL-SCREEN VIDEO ════════════════════════ */}
      <div
        ref={videoWrapRef}
        className="absolute inset-0 overflow-hidden pointer-events-none will-change-[opacity]"
      >
        <video
          ref={videoRef}
          src="/videos/RealEstate Copyrightfree.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000"
          style={{ opacity: videoLoaded ? 1 : 0.85 }}
        >
          <source src="/videos/RealEstate Copyrightfree.mp4" type="video/mp4" />
        </video>

        {/* 1. Base Subtle Transparent Midnight Navy Blue Tint (18% opacity, pure architectural cinematic tone) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: '#071426',
            opacity: 0.18,
            mixBlendMode: 'multiply',
          }}
        />

        {/* 2. Restrained Midnight Navy Gradient for Depth & Readability (Zero blur, preserves bright highlights & skyline) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(7, 20, 38, 0.10) 0%, rgba(10, 27, 50, 0.16) 50%, rgba(7, 20, 38, 0.32) 100%)',
          }}
        />
      </div>

      {/* ═══════ LAYER 1: SVG BRANDING & EMAAR SEARCH BAR ═════════════════════ */}
      <div
        ref={heroContentRef}
        className="absolute inset-0 z-20 pointer-events-none will-change-[opacity]"
      >
        {/* Top Branding (Official Apex Pacific Holdings Emblem) */}
        <div className="absolute top-20 sm:top-24 left-5 right-5 sm:left-12 sm:right-12 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.8)] bg-black/40 flex-shrink-0">
              <Image
                src="/apex_pacific_holdings_logo.svg"
                alt="APEX PACIFIC HOLDINGS"
                fill
                className="object-cover scale-[1.08]"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xs sm:text-sm tracking-[0.26em] text-white uppercase font-light drop-shadow-md">
                APEX PACIFIC HOLDINGS
              </span>
              <span className="font-mono text-[9px] tracking-[0.22em] text-sky-300/80 uppercase">
                GLOBAL REAL ESTATE
              </span>
            </div>
          </div>

          {/* Floating Pause/Play control */}
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/20 bg-black/40 hover:bg-black/70 hover:border-sky-400 text-white hover:text-sky-300 flex items-center justify-center backdrop-blur-md transition-all shadow-xl cursor-pointer"
          >
            {isPlaying ? (
              <Pause size={14} strokeWidth={2} />
            ) : (
              <Play size={14} strokeWidth={2} className="ml-0.5" />
            )}
          </button>
        </div>

        {/* ─── BOTTOM SEARCH BAR (Safe clearance across all screens & devices) ─── */}
        <div className="absolute bottom-16 sm:bottom-12 md:bottom-14 lg:bottom-16 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] max-w-xl z-30 pointer-events-auto pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center justify-between rounded-lg border border-white/20 bg-black/60 backdrop-blur-xl px-4 py-3 sm:py-3.5 shadow-2xl transition-all duration-300 hover:border-sky-400/50 focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-400/50"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
              <Search size={18} className="text-[#94A3B8] flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find your home"
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-[#94A3B8] font-light focus:outline-none tracking-wide"
              />
            </div>
            <button
              type="submit"
              className="font-mono text-xs tracking-[0.2em] uppercase text-white hover:text-sky-300 font-medium px-2 py-1 transition-colors flex-shrink-0 cursor-pointer"
            >
              SEARCH
            </button>
          </form>
        </div>
      </div>

      {/* ═══════ LAYER 2: APEX A MARK ZOOM TRANSITION ═══════════════════════ */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-30 overflow-hidden">
        <div
          ref={logoScaleWrapRef}
          className="relative flex items-center justify-center will-change-transform"
          style={{
            width: 'clamp(280px, 40vw, 520px)',
            height: 'clamp(280px, 40vw, 520px)',
            transformOrigin: '50% 50%',
            opacity: 0,
          }}
        >
          <svg
            viewBox="0 0 1000 1000"
            className="w-full h-full overflow-visible pointer-events-none select-none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="heroApexSteel" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#BAE6FD" />
                <stop offset="70%" stopColor="#7DD3FC" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>

            {/* Atmospheric glow stroke */}
            <path
              d="M 486,290 L 514,290 L 695,715 L 628,715 L 573,575 L 427,575 L 372,715 L 305,715 Z"
              fill="none"
              stroke="#7DD3FC"
              strokeWidth="6"
              strokeLinejoin="round"
              opacity="0.25"
            />
            {/* Main titanium-steel gradient silhouette */}
            <path
              d="M 486,290 L 514,290 L 695,715 L 628,715 L 573,575 L 427,575 L 372,715 L 305,715 Z"
              fill="none"
              stroke="url(#heroApexSteel)"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            {/* Diamond white specular edge */}
            <path
              d="M 486,290 L 514,290 L 695,715 L 628,715 L 573,575 L 427,575 L 372,715 L 305,715 Z"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeLinejoin="round"
              opacity="0.75"
            />
            {/* Inner triangular counter */}
            <path
              d="M 500,388 L 550,520 L 450,520 Z"
              fill="none"
              stroke="url(#heroApexSteel)"
              strokeWidth="2.0"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </svg>
        </div>
      </div>

      {/* ═══════ LAYER 3: TRANSITION OVERLAY INTO NEXT SECTION ══════════════ */}
      <div
        ref={transitionOverlayRef}
        className="absolute inset-0 pointer-events-none z-25 bg-[#040810] opacity-0 will-change-[opacity]"
      />
    </section>
  )
}
