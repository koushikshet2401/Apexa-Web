'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Search,
  X,
} from 'lucide-react'
import { PERSPECTIVE_GALLERY_PROPERTIES, PropertyItem } from '@/data/properties'
import { PropertySearchDrawer } from '@/components/search/PropertySearchDrawer'
import { cn } from '@/lib/utils'

export interface VideoLaunch {
  id: string
  number: string
  tag: string
  title: string
  location: string
  type: string
  beds: string
  price: string
  videoSrc: string
  fallbackSrc?: string
  href: string
}

const LAUNCHES: VideoLaunch[] = [
  {
    id: 'launch-1',
    number: '01',
    tag: 'FEATURED LAUNCH · 01 OF 03',
    title: 'The Meridian',
    location: 'DUBAI MARITIME CITY, UAE',
    type: 'Signature Sky Residence',
    beds: '3–4 Bedrooms',
    price: 'AED 8.2M',
    videoSrc: '/videos/luxury-palm-beach.mp4',
    href: '/properties/the-meridian',
  },
  {
    id: 'launch-2',
    number: '02',
    tag: 'FEATURED LAUNCH · 02 OF 03',
    title: 'Aurelia Villa',
    location: 'JUBILEE HILLS, HYDERABAD',
    type: 'Contemporary Private Estate',
    beds: '5 Bedrooms',
    price: '₹ 12.5 Cr',
    videoSrc: '/videos/VID02.mp4',
    href: '/properties/aurelia-villa',
  },
  {
    id: 'launch-3',
    number: '03',
    tag: 'FEATURED LAUNCH · 03 OF 03',
    title: 'The Peninsula Reserve',
    location: 'PHUKET, THAILAND',
    type: 'Luxury Waterfront Villa',
    beds: '4–6 Bedrooms',
    price: 'THB 68M',
    videoSrc: '/videos/VID01.mp4',
    href: '/properties/the-peninsula-reserve',
  },
]

export interface CollectionCountry {
  id: string
  countryCode: string
  countryKey: 'UAE' | 'Thailand' | 'Georgia' | 'Australia' | 'Malaysia'
  countryName: string
  region: string
  title: string
  category: string
  location: string
  specs: string
  image: string
  href: string
  cities: string
  description: string
}

const COLLECTION_COUNTRIES: CollectionCountry[] = [
  {
    id: 'dubai-uae',
    countryCode: 'AE',
    countryKey: 'UAE',
    countryName: 'United Arab Emirates',
    region: 'Middle East',
    title: 'The Dubai Portfolio',
    category: 'WATERFRONT VILLAS & SKY RESIDENCES',
    location: 'DUBAI & PALM JUMEIRAH, UAE',
    specs: 'DUBAI · PALM JUMEIRAH · 3–6 BEDROOMS',
    image: '/images/DuabiCoolection.png',
    href: '/destinations/uae',
    cities: 'DUBAI · PALM JUMEIRAH · ABU DHABI',
    description: 'Architectural masterworks rising along the Arabian Gulf with private moorings and cantilevered terraces.',
  },
  {
    id: 'thailand',
    countryCode: 'TH',
    countryKey: 'Thailand',
    countryName: 'Thailand',
    region: 'Southeast Asia',
    title: 'Andaman & Samui Estates',
    category: 'TROPICAL POOL VILLAS & SANCTUARIES',
    location: 'PHUKET & KOH SAMUI, THAILAND',
    specs: 'PHUKET · KOH SAMUI · 4–6 BEDROOMS',
    image: '/images/Thailand.png',
    href: '/destinations/thailand',
    cities: 'PHUKET · BANGKOK · KOH SAMUI',
    description: 'Secluded hillside retreats and beachfront estates shaped by Thai craftsmanship overlooking the Andaman horizon.',
  },
  {
    id: 'georgia',
    countryCode: 'GE',
    countryKey: 'Georgia',
    countryName: 'Georgia',
    region: 'Caucasus & Black Sea',
    title: 'Caucasian Panoramic Estates',
    category: 'MOUNTAIN CHALETS & SEASIDE ESTATES',
    location: 'TBILISI & BATUMI, GEORGIA',
    specs: 'TBILISI · BATUMI · 3–5 BEDROOMS',
    image: '/images/GeorgiaCollection.png',
    href: '/destinations/georgia',
    cities: 'TBILISI · BATUMI · BORJOMI',
    description: 'Where ancient Caucasian heritage meets contemporary stone chalets and Black Sea coastal residences.',
  },
  {
    id: 'australia',
    countryCode: 'AU',
    countryKey: 'Australia',
    countryName: 'Australia',
    region: 'Australasia & Pacific',
    title: 'Pacific Coast Residences',
    category: 'HARBOURFRONT PENTHOUSES & ESTATES',
    location: 'SYDNEY & MELBOURNE, AUSTRALIA',
    specs: 'SYDNEY · MELBOURNE · 3–5 BEDROOMS',
    image: '/images/AusCollection.png',
    href: '/destinations/australia',
    cities: 'SYDNEY · MELBOURNE · GOLD COAST',
    description: 'Coastal architectural villas and harbourfront penthouses shaped by natural light and ocean panoramas.',
  },
  {
    id: 'malaysia',
    countryCode: 'MY',
    countryKey: 'Malaysia',
    countryName: 'Malaysia',
    region: 'Southeast Asia',
    title: 'Horizon Pavilion & Coastal Villas',
    category: 'SCULPTURAL RESIDENCES & SANCTUARIES',
    location: 'KUALA LUMPUR & COAST, MALAYSIA',
    specs: 'KUALA LUMPUR · PENANG · 2–4 BEDROOMS',
    image: '/images/MalaysiaCollection.png',
    href: '/destinations/malaysia',
    cities: 'KUALA LUMPUR · PENANG · LANGKAWI',
    description: 'Tropical sanctuaries nestled between lush rainforest canopies and cosmopolitan coastlines.',
  },
]

const COUNTRY_FILTERS = [
  { label: 'All', value: 'All' },
  { label: 'Dubai / UAE', value: 'UAE' },
  { label: 'Thailand', value: 'Thailand' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Australia', value: 'Australia' },
  { label: 'Malaysia', value: 'Malaysia' },
]

export function LaunchesCinematicStack() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)

  // 8 Stacked Layer Refs
  const layer0Ref = useRef<HTMLDivElement>(null) // Pinned Hero Video & UI
  const layer1Ref = useRef<HTMLDivElement>(null) // New Launches Intro (Opaque Overlay)
  const layer2Ref = useRef<HTMLDivElement>(null) // Video 1: The Meridian
  const layer3Ref = useRef<HTMLDivElement>(null) // Video 2: Aurelia Villa
  const layer4Ref = useRef<HTMLDivElement>(null) // Video 3: The Peninsula Reserve
  const layer5Ref = useRef<HTMLDivElement>(null) // The Collection (Restored full-viewport overlay)
  const layer6Ref = useRef<HTMLDivElement>(null) // Layer 6: "One team, end to end" Dedicated Text Page
  const layer7Ref = useRef<HTMLDivElement>(null) // Layer 7: "One team, end to end" Pinned Media Stage
  const layer8Ref = useRef<HTMLDivElement>(null) // Layer 8: "Spaces in the round" 3D Rotating Carousel
  const layer9Ref = useRef<HTMLDivElement>(null) // Layer 9: "Private Advisory" Pinned Overlay with ContactBGC.mp4

  // Private advisory background video
  const advisoryVideoRef = useRef<HTMLVideoElement>(null)
  const [advisoryVideoLoaded, setAdvisoryVideoLoaded] = useState(false)

  // Spaces in the round: 3D rotating cylinder state & refs
  const stageRoundRef = useRef<HTMLDivElement>(null)
  const roundRotationRef = useRef<number>(0)
  const [roundRotation, setRoundRotation] = useState<number>(0)
  const isDraggingRoundRef = useRef<boolean>(false)
  const [isDraggingRound, setIsDraggingRound] = useState<boolean>(false)
  const isHoveredRoundRef = useRef<boolean>(false)
  const startXRoundRef = useRef<number>(0)
  const startYRoundRef = useRef<number>(0)
  const startRotationRoundRef = useRef<number>(0)
  const hasMovedRoundRef = useRef<boolean>(false)
  const isTouchVerticalRoundRef = useRef<boolean | null>(null)

  // One team media refs
  const oneTeamVideoRef = useRef<HTMLVideoElement>(null)
  const oneTeamVideoWrapRef = useRef<HTMLDivElement>(null)
  const oneTeamTopTilesRef = useRef<HTMLDivElement>(null)
  const oneTeamBottomTilesRef = useRef<HTMLDivElement>(null)
  const [oneTeamVideoLoaded, setOneTeamVideoLoaded] = useState(false)

  // Launch video refs for iOS auto-resumption & reliable playback
  const launch1VideoRef = useRef<HTMLVideoElement>(null)
  const launch2VideoRef = useRef<HTMLVideoElement>(null)
  const launch3VideoRef = useRef<HTMLVideoElement>(null)

  // Hero specific elements
  const heroVideoRef = useRef<HTMLVideoElement>(null)
  const heroContentRef = useRef<HTMLDivElement>(null)
  const apexTextRef = useRef<HTMLDivElement>(null)
  const logoScaleWrapRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(true)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  // Collection carousel & filter state
  const [colSearchQuery, setColSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('All')
  const [activeColIndex, setActiveColIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Universal iOS & Mobile WebKit safe play helper
  const playSafely = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return
    try {
      video.muted = true
      video.defaultMuted = true
      video.playsInline = true
      video.setAttribute('muted', '')
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', 'true')
      const p = video.play()
      if (p !== undefined) {
        p.then(() => {
          if (video === heroVideoRef.current) setIsPlaying(true)
        }).catch(() => {
          // Handled silently for strict autoplay policies
        })
      }
    } catch {
      // safe fallback
    }
  }, [])

  // Universal video playback initialization across desktop and mobile (iOS & Android)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hero-in-view', { detail: { isHero: true } }))
    }

    const allVideos = () => [
      heroVideoRef.current,
      launch1VideoRef.current,
      launch2VideoRef.current,
      launch3VideoRef.current,
      oneTeamVideoRef.current,
      advisoryVideoRef.current,
    ]

    const unlockAllVideos = () => {
      allVideos().forEach((v) => playSafely(v))
    }

    // Attempt playback immediately on mount
    unlockAllVideos()

    // Unlock WebKit/iOS media engine on first user interaction (touch or scroll)
    window.addEventListener('touchstart', unlockAllVideos, { once: true, passive: true })
    window.addEventListener('scroll', unlockAllVideos, { once: true, passive: true })
    window.addEventListener('pointerdown', unlockAllVideos, { once: true, passive: true })

    return () => {
      window.removeEventListener('touchstart', unlockAllVideos)
      window.removeEventListener('scroll', unlockAllVideos)
      window.removeEventListener('pointerdown', unlockAllVideos)
    }
  }, [playSafely])

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = heroVideoRef.current
    if (!video) return
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => { })
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/properties?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/properties')
    }
  }

  const totalItems = COLLECTION_COUNTRIES.length

  // Infinite looping in both directions
  const handlePrevCol = useCallback(() => {
    setActiveColIndex((prev) => (prev - 1 + totalItems) % totalItems)
  }, [totalItems])

  const handleNextCol = useCallback(() => {
    setActiveColIndex((prev) => (prev + 1) % totalItems)
  }, [totalItems])

  // Country selection filter
  const handleSelectCountry = (filterVal: string) => {
    setSelectedCountry(filterVal)
    if (filterVal !== 'All') {
      const idx = COLLECTION_COUNTRIES.findIndex((c) => c.countryKey === filterVal)
      if (idx !== -1) {
        setActiveColIndex(idx)
      }
    }
  }

  // Country / property search
  const handleColSearchChange = (val: string) => {
    setColSearchQuery(val)
    if (val.trim()) {
      const q = val.toLowerCase().trim()
      const idx = COLLECTION_COUNTRIES.findIndex(
        (c) =>
          c.countryName.toLowerCase().includes(q) ||
          c.countryKey.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.cities.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.specs.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
      if (idx !== -1) {
        setActiveColIndex(idx)
        setSelectedCountry(COLLECTION_COUNTRIES[idx].countryKey)
      }
    }
  }

  // Keyboard navigation for Collection carousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevCol()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNextCol()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrevCol, handleNextCol])

  // Spaces in the round: Continuous smooth clockwise auto-rotation (1 full rev every ~26s)
  useEffect(() => {
    let animId: number
    let lastTime: number | null = null

    // ~360 degrees in 26 seconds = 13.85 deg/sec
    const baseSpeed = 13.85

    const autoRotate = (now: number) => {
      if (lastTime === null) lastTime = now
      const deltaSec = Math.min((now - lastTime) / 1000, 0.1) // clamp delta to prevent jumps on tab switch
      lastTime = now

      // Clockwise rotation around central axis (angle increases continuously)
      if (!isDraggingRoundRef.current) {
        const speedMult = isHoveredRoundRef.current ? 0.35 : 1.0
        const deltaDeg = baseSpeed * deltaSec * speedMult
        roundRotationRef.current = (roundRotationRef.current + deltaDeg) % 360
        setRoundRotation(roundRotationRef.current)
      }

      animId = requestAnimationFrame(autoRotate)
    }

    animId = requestAnimationFrame(autoRotate)
    return () => cancelAnimationFrame(animId)
  }, [])

  // Unified Pointer Drag Handlers: bidirectional dragging with smooth continuation
  const handleRoundPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRoundRef.current = true
    setIsDraggingRound(true)
    startXRoundRef.current = e.clientX
    startRotationRoundRef.current = roundRotationRef.current
    hasMovedRoundRef.current = false
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // safe fallback
    }
  }

  const handleRoundPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRoundRef.current) return
    const deltaX = e.clientX - startXRoundRef.current
    if (Math.abs(deltaX) > 4) {
      hasMovedRoundRef.current = true
    }
    // Dragging right increases rotation (clockwise movement to right)
    // Dragging left decreases rotation (counter-clockwise movement to left)
    const sensitivity = isMobile ? 0.32 : 0.24
    const newAngle = (startRotationRoundRef.current + deltaX * sensitivity) % 360
    roundRotationRef.current = newAngle
    setRoundRotation(newAngle)
  }

  const handleRoundPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRoundRef.current) return
    isDraggingRoundRef.current = false
    setIsDraggingRound(false)
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // safe fallback
    }
  }

  const handleRoundPrev = () => {
    const step = 360 / PERSPECTIVE_GALLERY_PROPERTIES.length
    roundRotationRef.current = (roundRotationRef.current - step) % 360
    setRoundRotation(roundRotationRef.current)
  }

  const handleRoundNext = () => {
    const step = 360 / PERSPECTIVE_GALLERY_PROPERTIES.length
    roundRotationRef.current = (roundRotationRef.current + step) % 360
    setRoundRotation(roundRotationRef.current)
  }

  const handleRoundCardClick = (cardIndex: number, prop: PropertyItem, relAngle: number) => {
    if (hasMovedRoundRef.current) return

    // If card is front-center (within 22 degrees), click navigates to property details
    if (Math.abs(relAngle) < 22) {
      router.push(prop.href)
      return
    }

    // Otherwise clicking side card brings it smoothly to front-center
    roundRotationRef.current = (roundRotationRef.current - relAngle) % 360
    setRoundRotation(roundRotationRef.current)
  }

  // GSAP ScrollTrigger Master Pinned Stack
  // Pinned sequence:
  // Layer 0: Hero Video
  // Layer 1: New Launches Intro overlay
  // Layer 2: Video 1 (The Meridian) overlay
  // Layer 3: Video 2 (Aurelia Villa) overlay
  // Layer 4: Video 3 (The Peninsula Reserve) overlay
  // Layer 5: The Collection overlay (smoothly covers Video 3, occupies 100vh, holds pinned)
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const container = containerRef.current
    const pinEl = pinRef.current
    const l0 = layer0Ref.current
    const l1 = layer1Ref.current
    const l2 = layer2Ref.current
    const l3 = layer3Ref.current
    const l4 = layer4Ref.current
    const l5 = layer5Ref.current
    const l6 = layer6Ref.current
    const l7 = layer7Ref.current
    const l8 = layer8Ref.current
    const l9 = layer9Ref.current
    const topTiles = oneTeamTopTilesRef.current
    const bottomTiles = oneTeamBottomTilesRef.current
    const videoWrap = oneTeamVideoWrapRef.current
    const heroContent = heroContentRef.current
    const apexText = apexTextRef.current
    const logoScale = logoScaleWrapRef.current

    if (!container || !pinEl || !l0 || !l1 || !l2 || !l3 || !l4 || !l5 || !l6 || !l7 || !l8 || !l9) return

    const ctx = gsap.context(() => {
      const isMob = window.innerWidth < 768

      // Initial States:
      gsap.set(l0, { yPercent: 0, opacity: 1 })
      gsap.set(l1, { yPercent: 100, opacity: 1 })
      gsap.set(l2, { yPercent: 100, opacity: 1 })
      gsap.set(l3, { yPercent: 100, opacity: 1 })
      gsap.set(l4, { yPercent: 100, opacity: 1 })
      gsap.set(l5, { yPercent: 100, opacity: 1 })
      gsap.set(l6, { yPercent: 100, opacity: 1 })
      gsap.set(l7, { yPercent: 100, opacity: 1 })
      gsap.set(l8, { yPercent: 100, opacity: 1 })
      gsap.set(l9, { yPercent: 100, opacity: 1 })
      if (apexText) gsap.set(apexText, { y: 0, scale: 1.0, opacity: 0.95 })
      if (topTiles) gsap.set(topTiles, { yPercent: isMob ? -160 : -140, opacity: 0 })
      if (bottomTiles) gsap.set(bottomTiles, { yPercent: isMob ? 160 : 140, opacity: 0 })
      if (videoWrap) gsap.set(videoWrap, { scale: 1.0 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: isMob ? '+=3800vh' : '+=4800vh',
          pin: pinEl,
          pinSpacing: true,
          scrub: 1.0, // Responsive, fluid scrub without sluggishness
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('hero-in-view', { detail: { isHero: p < 0.032 } }))
            }
            if (p < 0.030) {
              setActiveStep(0) // Hero
              playSafely(heroVideoRef.current)
            } else if (p < 0.127) {
              setActiveStep(1) // New Launches Intro
            } else if (p < 0.224) {
              setActiveStep(2) // Video 1: The Meridian
              playSafely(launch1VideoRef.current)
            } else if (p < 0.321) {
              setActiveStep(3) // Video 2: Aurelia Villa
              playSafely(launch2VideoRef.current)
            } else if (p < 0.418) {
              setActiveStep(4) // Video 3: The Peninsula Reserve
              playSafely(launch3VideoRef.current)
            } else if (p < 0.515) {
              setActiveStep(5) // The Collection Section
            } else if (p < 0.612) {
              setActiveStep(6) // One Team Text Page
            } else if (p < 0.806) {
              setActiveStep(7) // One Team Media Stage (First scroll: Video solo, Second scroll: 4 images)
              playSafely(oneTeamVideoRef.current)
            } else if (p < 0.903) {
              setActiveStep(8) // Spaces in the round
            } else {
              setActiveStep(9) // Private Advisory
              playSafely(advisoryVideoRef.current)
            }
          },
        },
      })

      // ─── STAGE 0: HERO PINNED (0.0 to 2.0) ───
      // 1. APEX text smoothly pops up with upward movement, scale, and full brilliance
      if (apexText) {
        tl.to(
          apexText,
          {
            y: isMob ? -24 : -38,
            scale: isMob ? 1.05 : 1.08,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
          },
          0.1
        )
        // Remains firmly in intended animated position
        tl.to(
          apexText,
          {
            y: isMob ? -24 : -38,
            scale: isMob ? 1.05 : 1.08,
            opacity: 1,
            duration: 0.8,
            ease: 'none',
          },
          0.9
        )
        // Cleanly transitions as Stage 1 (New Launches) overlays the Hero
        tl.to(
          apexText,
          {
            opacity: 0,
            y: isMob ? -42 : -60,
            duration: 0.4,
            ease: 'power1.in',
          },
          1.7
        )
      }

      if (heroContent) {
        tl.to(heroContent, { opacity: 0, duration: 1.2, ease: 'power1.out' }, 0.5)
      }

      if (logoScale) {
        tl.fromTo(
          logoScale,
          { scale: 0.65, opacity: 0 },
          { scale: 1.0, opacity: 1, duration: 0.8, ease: 'power2.out' },
          0.2
        )
        tl.to(logoScale, { scale: 1.05, opacity: 1, duration: 0.6, ease: 'none' }, 1.0)
        tl.to(
          logoScale,
          { scale: 14.0, opacity: 0, duration: 0.6, ease: 'power2.in' },
          1.6
        )
      }

      // ─── STAGE 1: NEW LAUNCHES OVERLAYS PINNED HERO VIDEO (2.0 to 6.0) ───
      tl.to(
        l1,
        { yPercent: 0, duration: 4.0, ease: 'none' },
        2.0
      )

      // ─── STAGE 1 HOLD: NEW LAUNCHES PINNED (6.0 to 8.5) ───
      tl.to(
        l1,
        { yPercent: 0, duration: 2.5, ease: 'none' },
        6.0
      )

      // ─── STAGE 2: VIDEO 1 (THE MERIDIAN) OVERLAYS NEW LAUNCHES (8.5 to 12.5) ───
      tl.to(
        l2,
        { yPercent: 0, duration: 4.0, ease: 'none' },
        8.5
      )

      // ─── STAGE 2 HOLD: VIDEO 1 PINNED (12.5 to 15.0) ───
      tl.to(
        l2,
        { yPercent: 0, duration: 2.5, ease: 'none' },
        12.5
      )

      // ─── STAGE 3: VIDEO 2 (AURELIA VILLA) OVERLAYS VIDEO 1 (15.0 to 19.0) ───
      tl.to(
        l3,
        { yPercent: 0, duration: 4.0, ease: 'none' },
        15.0
      )

      // ─── STAGE 3 HOLD: VIDEO 2 PINNED (19.0 to 21.5) ───
      tl.to(
        l3,
        { yPercent: 0, duration: 2.5, ease: 'none' },
        19.0
      )

      // ─── STAGE 4: VIDEO 3 (THE PENINSULA RESERVE) OVERLAYS VIDEO 2 (21.5 to 25.5) ───
      tl.to(
        l4,
        { yPercent: 0, duration: 4.0, ease: 'none' },
        21.5
      )

      // ─── STAGE 4 HOLD: VIDEO 3 PINNED (25.5 to 28.0) ───
      tl.to(
        l4,
        { yPercent: 0, duration: 2.5, ease: 'none' },
        25.5
      )

      // ─── STAGE 5: THE COLLECTION OVERLAYS VIDEO 3 (28.0 to 32.0) ───
      // Smooth, natural rise matching the Launches pacing
      tl.to(
        l5,
        { yPercent: 0, duration: 4.0, ease: 'none' },
        28.0
      )

      // ─── STAGE 5 HOLD: THE COLLECTION PINNED (32.0 to 34.5) ───
      // Crisp 2.5 unit hold — identical to Launches, advances on a single natural swipe
      tl.to(
        l5,
        { yPercent: 0, duration: 2.5, ease: 'none' },
        32.0
      )

      // ─── STAGE 6: "ONE TEAM, END TO END" TEXT PAGE OVERLAYS THE COLLECTION (34.5 to 38.5) ───
      tl.to(
        l6,
        { yPercent: 0, duration: 4.0, ease: 'none' },
        34.5
      )

      // ─── STAGE 6 HOLD: TEXT PAGE (38.5 to 41.0) ───
      tl.to(
        l6,
        { yPercent: 0, duration: 2.5, ease: 'none' },
        38.5
      )

      // ─── STAGE 7: FIRST SCROLL — PINNED VIDEO RISES ALONE TO CENTER (41.0 to 45.0) ───
      // Top and bottom tiles stay completely off-screen above/below so ONLY the video rises to center!
      tl.to(
        l7,
        { yPercent: 0, duration: 4.0, ease: 'none' },
        41.0
      )

      // ─── STAGE 7 HOLD: PINNED VIDEO HOLDS CENTERED ALONE (45.0 to 47.5) ───
      tl.to(
        l7,
        { yPercent: 0, duration: 2.5, ease: 'none' },
        45.0
      )

      // ─── STAGE 8: SECOND SCROLL — 4 IMAGES REVEAL AROUND THE VIDEO (47.5 to 51.5) ───
      // Top 2 tiles slide down from top, bottom 2 tiles slide up from bottom
      if (topTiles) {
        tl.to(
          topTiles,
          { yPercent: 0, opacity: 1, duration: 4.0, ease: 'none' },
          47.5
        )
      }
      if (bottomTiles) {
        tl.to(
          bottomTiles,
          { yPercent: 0, opacity: 1, duration: 4.0, ease: 'none' },
          47.5
        )
      }

      // ─── STAGE 8 HOLD: COMPLETE 5-PANEL COMPOSITION (51.5 to 54.0) ───
      tl.to(
        l7,
        { yPercent: 0, duration: 2.5, ease: 'none' },
        51.5
      )

      // ─── STAGE 9: "SPACES IN THE ROUND" OVERLAYS ONE TEAM (54.0 to 58.0) ───
      tl.to(
        l8,
        { yPercent: 0, duration: 4.0, ease: 'none' },
        54.0
      )

      // ─── STAGE 9 HOLD: "SPACES IN THE ROUND" (58.0 to 60.5) ───
      tl.to(
        l8,
        { yPercent: 0, duration: 2.5, ease: 'none' },
        58.0
      )

      // ─── STAGE 10: "PRIVATE ADVISORY" OVERLAYS "SPACES IN THE ROUND" (60.5 to 64.5) ───
      tl.to(
        l9,
        { yPercent: 0, duration: 4.0, ease: 'none' },
        60.5
      )

      // ─── STAGE 10 HOLD: "PRIVATE ADVISORY" (64.5 to 67.0) ───
      tl.to(
        l9,
        { yPercent: 0, duration: 2.5, ease: 'none' },
        64.5
      )
    }, container)

    return () => ctx.revert()
  }, [])

  const activeColItem: CollectionCountry = COLLECTION_COUNTRIES[activeColIndex] || COLLECTION_COUNTRIES[0]

  return (
    <section ref={containerRef} id="home" className="relative w-full bg-[#040810]">
      {/* Pinned 100vh Viewport Stage */}
      <div
        ref={pinRef}
        className="relative w-full h-screen h-[100dvh] overflow-hidden bg-[#040810] flex items-center justify-center select-none"
      >
        {/* ══════════════════════════════════════════════════════════════════
            LAYER 0: PINNED HOMEPAGE HERO VIDEO (Stays fixed behind overlay)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer0Ref}
          style={{ zIndex: 10 }}
          className="absolute inset-0 w-full h-full select-none bg-[#040810] z-10 overflow-hidden"
        >
          {/* Background Video (Clickable to toggle play/pause) */}
          <div
            onClick={togglePlayPause}
            className="absolute inset-0 overflow-hidden cursor-pointer"
          >
            <video
              ref={heroVideoRef}
              src="/videos/RealEstate Copyrightfree.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onLoadedData={() => {
                setVideoLoaded(true)
                playSafely(heroVideoRef.current)
              }}
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 1,
              }}
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
                background: 'linear-gradient(to bottom, rgba(7, 20, 38, 0.10) 0%, rgba(10, 27, 50, 0.16) 50%, rgba(7, 20, 38, 0.32) 100%)',
              }}
            />
          </div>

          {/* Hero UI: Top Logo-Only Branding + Centered Play/Pause + Bottom High-Contrast Search Bar */}
          <div
            ref={heroContentRef}
            className="absolute inset-0 z-20 pointer-events-none will-change-[opacity]"
          >
            {/* Top Branding — Logo Only (Text lines removed as requested) */}
            <div className="absolute top-20 sm:top-24 left-5 right-5 sm:left-12 sm:right-12 flex items-center justify-between pointer-events-auto">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-white/25 shadow-[0_4px_20px_rgba(0,0,0,0.8)] bg-black/40 flex-shrink-0">
                <Image
                  src="/apex_pacific_holdings_logo.svg"
                  alt="APEX PACIFIC HOLDINGS"
                  fill
                  className="object-cover scale-[1.08]"
                  priority
                />
              </div>
            </div>

            {/* Center Video Play/Pause Control:
                - Kept invisible (opacity-0) while playing normally so no icon obstructs the screen.
                - Appears cleanly on hover or when paused so user can tap to resume. */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlayPause(e)
                }}
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
                className={cn(
                  "pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-white/30 hover:border-white bg-black/45 hover:bg-black/70 text-white hover:text-sky-300 flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:scale-105 active:scale-95 cursor-pointer",
                  isPlaying ? "opacity-0 hover:opacity-100 focus:opacity-100" : "opacity-100 scale-100"
                )}
              >
                {isPlaying ? (
                  <Pause size={20} strokeWidth={2} className="drop-shadow" />
                ) : (
                  <Play size={20} strokeWidth={2} className="ml-1 drop-shadow" />
                )}
              </button>
            </div>

            {/* Bottom Search Bar — Positioned with safe clearance across all mobile and desktop screens */}
            <div className="absolute bottom-16 sm:bottom-12 md:bottom-14 lg:bottom-16 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] max-w-xl z-30 pointer-events-auto pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]">
              <div
                onClick={() => setIsSearchOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsSearchOpen(true)
                  }
                }}
                className="relative flex items-center justify-between rounded-xl border border-white/35 hover:border-white/60 bg-black/60 hover:bg-black/75 backdrop-blur-xl px-4 py-3 sm:py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.7)] transition-all duration-300 cursor-pointer group select-none"
                aria-label="Open property search panel"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                  <Search size={18} className="text-white/85 group-hover:text-sky-300 transition-colors flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-white/90 font-light tracking-wide truncate">
                    Find your home
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 group-hover:bg-sky-400/20 text-white group-hover:text-sky-200 border border-white/20 group-hover:border-sky-400/40 transition-all font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium flex-shrink-0">
                  <span>SEARCH</span>
                </div>
              </div>
            </div>
          </div>

          {/* APEX Hero Brand Typography — Smooth Scroll-Linked Pop-Up */}
          <div
            ref={apexTextRef}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-20 will-change-transform px-4"
          >
            <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-[0.28em] text-white font-light uppercase text-center leading-none drop-shadow-[0_4px_35px_rgba(0,0,0,0.85)]">
              APEX
            </h1>
            <span className="font-mono text-[9px] sm:text-xs md:text-sm tracking-[0.38em] text-[#7DD3FC] uppercase mt-2.5 sm:mt-4 font-medium drop-shadow-md text-center">
              PACIFIC HOLDINGS
            </span>
          </div>

          {/* APEX A Emblem Mark Zoom */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-15 overflow-hidden">
            <div
              ref={logoScaleWrapRef}
              className="relative flex items-center justify-center will-change-transform"
              style={{
                width: 'clamp(260px, 38vw, 500px)',
                height: 'clamp(260px, 38vw, 500px)',
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
                  <linearGradient id="heroApexSteelMaster" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="35%" stopColor="#BAE6FD" />
                    <stop offset="70%" stopColor="#7DD3FC" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>
                <path
                  d="M 486,290 L 514,290 L 695,715 L 628,715 L 573,575 L 427,575 L 372,715 L 305,715 Z"
                  fill="none"
                  stroke="#7DD3FC"
                  strokeWidth="6"
                  strokeLinejoin="round"
                  opacity="0.25"
                />
                <path
                  d="M 486,290 L 514,290 L 695,715 L 628,715 L 573,575 L 427,575 L 372,715 L 305,715 Z"
                  fill="none"
                  stroke="url(#heroApexSteelMaster)"
                  strokeWidth="2.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M 500,388 L 550,520 L 450,520 Z"
                  fill="none"
                  stroke="url(#heroApexSteelMaster)"
                  strokeWidth="2.0"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 1: "NEW LAUNCHES" FULL-PAGE OVERLAY (Rises over Pinned Video)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer1Ref}
          id="launches"
          style={{ zIndex: 20 }}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center px-6 sm:px-12 z-20 will-change-[transform,filter] bg-[#040810] shadow-[0_-25px_60px_rgba(0,0,0,0.95)]"
        >
          {/* Ambient Lighting */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.22) 0%, transparent 68%)',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
              <span className="w-8 h-px bg-sky-400/60" />
              <span className="font-mono text-xs sm:text-sm tracking-[0.32em] uppercase text-[#7DD3FC] font-medium">
                NEW LAUNCHES
              </span>
              <span className="w-8 h-px bg-sky-400/60" />
            </div>

            {/* Headline */}
            <h2
              className="heading-display font-light text-white tracking-tight leading-[1.08] mb-5 sm:mb-8 text-balance"
              style={{ fontSize: 'clamp(2.3rem, 5.8vw, 4.8rem)' }}
            >
              Unveil the Latest in <em className="italic text-sky-200">Exceptional Living</em>
            </h2>

            {/* Subtext */}
            <p className="font-sans text-xs sm:text-base md:text-lg text-[#94A3B8] font-light max-w-2xl mx-auto leading-relaxed text-pretty mb-10 sm:mb-14">
              Discover exceptional properties across our international portfolio, each selected for its location, design and long-term potential.
            </p>

            {/* Scroll Indicator */}
            <div className="flex flex-col items-center justify-center gap-2.5 text-[10px] font-mono tracking-[0.25em] text-[#64748B] uppercase">
              <span>SCROLL TO EXPLORE</span>
              <div className="w-px h-8 sm:h-12 bg-gradient-to-b from-sky-400 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 2: LAUNCH 1 — THE MERIDIAN (Glides up from bottom)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer2Ref}
          style={{ zIndex: 30 }}
          className="absolute inset-0 w-full h-full will-change-[transform,filter] z-30 bg-black shadow-[0_-25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
        >
          <video
            ref={launch1VideoRef}
            src={LAUNCHES[0].videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => playSafely(launch1VideoRef.current)}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 1,
            }}
          />
          {/* Subtle bottom-only gradient: Top & middle stay 100% crisp, bright and clear */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#040810]/90 via-black/20 to-transparent pointer-events-none" />

          {/* Overlay Content with safe pb for mobile nav */}
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-10 md:p-14 lg:p-16 pb-[calc(env(safe-area-inset-bottom)+76px)] sm:pb-12 md:pb-16 z-20 pointer-events-none">
            <div className="max-w-xl pointer-events-auto">
              <span className="inline-block text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[#7DD3FC] mb-1">
                {LAUNCHES[0].tag}
              </span>
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-light tracking-tight mb-1">
                {LAUNCHES[0].title}
              </h2>
              <p className="text-[10px] sm:text-xs font-sans tracking-[0.18em] uppercase text-[#94A3B8] mb-1 sm:mb-2">
                {LAUNCHES[0].location}
              </p>
              <p className="text-xs sm:text-sm md:text-base text-white/90 font-light mb-1.5 sm:mb-2.5">
                {LAUNCHES[0].type} &nbsp;/&nbsp; {LAUNCHES[0].beds}
              </p>
              <div className="flex items-baseline gap-2 mb-2.5 sm:mb-4">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#94A3B8]">
                  From
                </span>
                <span className="font-display text-lg sm:text-2xl md:text-3xl text-white tracking-wide">
                  {LAUNCHES[0].price}
                </span>
              </div>
              <Link
                href={LAUNCHES[0].href}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 backdrop-blur-md shadow-lg"
              >
                <span>Explore Launch</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 3: LAUNCH 2 — AURELIA VILLA (Glides up from bottom)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer3Ref}
          style={{ zIndex: 40 }}
          className="absolute inset-0 w-full h-full will-change-[transform,filter] z-40 bg-black shadow-[0_-25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
        >
          <video
            ref={launch2VideoRef}
            src={LAUNCHES[1].videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => playSafely(launch2VideoRef.current)}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 1,
            }}
          />
          {/* Subtle bottom-only gradient: Top & middle stay 100% crisp, bright and clear */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#040810]/90 via-black/20 to-transparent pointer-events-none" />

          {/* Overlay Content with safe pb for mobile nav */}
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-10 md:p-14 lg:p-16 pb-[calc(env(safe-area-inset-bottom)+76px)] sm:pb-12 md:pb-16 z-20 pointer-events-none">
            <div className="max-w-xl pointer-events-auto">
              <span className="inline-block text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[#7DD3FC] mb-1">
                {LAUNCHES[1].tag}
              </span>
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-light tracking-tight mb-1">
                {LAUNCHES[1].title}
              </h2>
              <p className="text-[10px] sm:text-xs font-sans tracking-[0.18em] uppercase text-[#94A3B8] mb-1 sm:mb-2">
                {LAUNCHES[1].location}
              </p>
              <p className="text-xs sm:text-sm md:text-base text-white/90 font-light mb-1.5 sm:mb-2.5">
                {LAUNCHES[1].type} &nbsp;/&nbsp; {LAUNCHES[1].beds}
              </p>
              <div className="flex items-baseline gap-2 mb-2.5 sm:mb-4">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#94A3B8]">
                  From
                </span>
                <span className="font-display text-lg sm:text-2xl md:text-3xl text-white tracking-wide">
                  {LAUNCHES[1].price}
                </span>
              </div>
              <Link
                href={LAUNCHES[1].href}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 backdrop-blur-md shadow-lg"
              >
                <span>Explore Launch</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 4: LAUNCH 3 — THE PENINSULA RESERVE (Glides up from bottom)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer4Ref}
          style={{ zIndex: 50 }}
          className="absolute inset-0 w-full h-full will-change-[transform,filter] z-50 bg-black shadow-[0_-25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
        >
          <video
            ref={launch3VideoRef}
            src={LAUNCHES[2].videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => playSafely(launch3VideoRef.current)}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 1,
            }}
          />
          {/* Subtle bottom-only gradient: Top & middle stay 100% crisp, bright and clear */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#040810]/90 via-black/20 to-transparent pointer-events-none" />

          {/* Overlay Content with safe pb for mobile nav */}
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-10 md:p-14 lg:p-16 pb-[calc(env(safe-area-inset-bottom)+76px)] sm:pb-12 md:pb-16 z-20 pointer-events-none">
            <div className="max-w-xl pointer-events-auto">
              <span className="inline-block text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[#7DD3FC] mb-1">
                {LAUNCHES[2].tag}
              </span>
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-light tracking-tight mb-1">
                {LAUNCHES[2].title}
              </h2>
              <p className="text-[10px] sm:text-xs font-sans tracking-[0.18em] uppercase text-[#94A3B8] mb-1 sm:mb-2">
                {LAUNCHES[2].location}
              </p>
              <p className="text-xs sm:text-sm md:text-base text-white/90 font-light mb-1.5 sm:mb-2.5">
                {LAUNCHES[2].type} &nbsp;/&nbsp; {LAUNCHES[2].beds}
              </p>
              <div className="flex items-baseline gap-2 mb-2.5 sm:mb-4">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#94A3B8]">
                  From
                </span>
                <span className="font-display text-lg sm:text-2xl md:text-3xl text-white tracking-wide">
                  {LAUNCHES[2].price}
                </span>
              </div>
              <Link
                href={LAUNCHES[2].href}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white text-[10px] sm:text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 backdrop-blur-md shadow-lg"
              >
                <span>Explore Launch</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 5: "THE COLLECTION" RESTORED PINNED OVERLAY SECTION
            (Country Selection Carousel with 5 Exact Images & Direct Routes)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer5Ref}
          id="collection"
          style={{ zIndex: 60 }}
          className="absolute inset-0 w-full h-[100dvh] max-h-[100dvh] will-change-[transform,filter] z-[60] bg-[#040810] flex flex-col justify-between pt-[calc(env(safe-area-inset-top)+84px)] sm:pt-24 md:pt-28 px-4 sm:px-8 md:px-12 pb-[calc(env(safe-area-inset-bottom)+76px)] sm:pb-8 border-t border-white/10 shadow-[0_-30px_70px_rgba(0,0,0,0.98)] overflow-hidden"
        >
          {/* 1. Header & Controls: Eyebrow, Title, Description, Search Bar & Country Filters */}
          <div className="w-full max-w-7xl mx-auto flex flex-col gap-2 sm:gap-3 shrink-0">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <span className="w-5 h-px bg-sky-400" />
              <span className="font-mono text-[9px] sm:text-[11px] tracking-[0.24em] uppercase text-[#7DD3FC] font-medium">
                SIGNATURE RESIDENCES
              </span>
            </div>

            {/* Title & Description Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 sm:gap-6">
              <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl text-white font-light tracking-tight leading-none">
                The <em className="italic font-serif text-sky-200">collection</em>
              </h2>
              <p className="font-sans text-[11px] sm:text-xs md:text-sm text-[#94A3B8] max-w-md font-light leading-relaxed text-left sm:text-right line-clamp-1 sm:line-clamp-none">
                Five addresses, each designed around its site. Drag, swipe or click to explore the portfolio.
              </p>
            </div>

            {/* Search Input & Country Filter Chips Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1.5 border-t border-white/[0.08]">
              {/* Search bar */}
              <div className="relative w-full sm:w-64 md:w-72">
                <Search
                  size={13}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400/80 pointer-events-none"
                />
                <input
                  type="text"
                  value={colSearchQuery}
                  onChange={(e) => handleColSearchChange(e.target.value)}
                  placeholder="Search country or residence..."
                  className="w-full bg-white/[0.04] text-white placeholder-[#64748B] text-[11px] sm:text-xs pl-9 pr-7 py-1.5 sm:py-2 rounded-full border border-white/15 focus:border-sky-400 focus:outline-none transition-all font-sans"
                />
                {colSearchQuery && (
                  <button
                    onClick={() => {
                      setColSearchQuery('')
                      setSelectedCountry('All')
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Country Filters: Clean wrap on mobile so all 6 chips fit without horizontal scroll */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 py-0.5 max-w-full">
                {COUNTRY_FILTERS.map((chip) => {
                  const isSelected = selectedCountry === chip.value
                  return (
                    <button
                      key={chip.value}
                      onClick={() => handleSelectCountry(chip.value)}
                      className={cn(
                        'px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8.5px] sm:text-[10px] font-mono uppercase tracking-[0.12em] rounded-full transition-all duration-200 border cursor-pointer shrink-0',
                        isSelected
                          ? 'bg-sky-400 text-[#040810] font-semibold border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                          : 'bg-white/[0.04] text-[#CBD5E1] border-white/10 hover:border-white/30 hover:text-white'
                      )}
                    >
                      {chip.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 2. Centered Interactive 5-Country Carousel with Infinite Looping */}
          <div className="relative w-full max-w-7xl mx-auto flex-1 min-h-0 flex items-center justify-center my-auto overflow-hidden select-none pointer-events-auto">
            <div className="relative w-full h-[185px] sm:h-[260px] md:h-[320px] lg:h-[360px] flex items-center justify-center">
              {COLLECTION_COUNTRIES.map((item, idx) => {
                // Circular wrapped offset in [-2, 2] for smooth bidirectional infinite looping
                let diff = (idx - activeColIndex) % totalItems
                if (diff < -2) diff += totalItems
                if (diff > 2) diff -= totalItems

                const isActive = diff === 0
                const isLeft = diff === -1
                const isRight = diff === 1

                // Responsive card dimensions
                const cardWidth = isMobile ? 260 : 500
                const cardHeight = isMobile ? 180 : 330
                const spacing = isMobile ? 215 : 440
                const tx = diff * spacing
                const scale = isActive ? 1.0 : Math.abs(diff) === 1 ? 0.86 : 0.74
                const opacity = isActive ? 1.0 : Math.abs(diff) === 1 ? 0.50 : 0.20
                const zIndex = isActive ? 30 : 25 - Math.abs(diff)

                return (
                  <motion.div
                    key={item.id}
                    onClick={(e) => {
                      if (isActive) {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const clickX = e.clientX - rect.left
                        if (clickX < rect.width * 0.35) {
                          handlePrevCol()
                        } else if (clickX > rect.width * 0.65) {
                          handleNextCol()
                        }
                      } else if (diff > 0) {
                        handleNextCol()
                      } else {
                        handlePrevCol()
                      }
                    }}
                    drag={isActive ? 'x' : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.25}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -40) handleNextCol()
                      else if (info.offset.x > 40) handlePrevCol()
                    }}
                    animate={{
                      x: tx,
                      scale: scale,
                      opacity: opacity,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      zIndex,
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                    }}
                    className={cn(
                      'absolute rounded-2xl overflow-hidden shadow-2xl transition-shadow cursor-pointer will-change-transform group',
                      isActive
                        ? 'border border-sky-400/60 shadow-[0_20px_50px_rgba(0,0,0,0.95)]'
                        : 'border border-white/10 hover:opacity-70'
                    )}
                  >
                    {/* Exact Country Image with Cover Fit & No Stretching */}
                    <Image
                      src={item.image}
                      alt={`${item.countryName} Collection`}
                      fill
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 280px, 540px"
                      priority={isActive}
                    />

                    {/* Subtle Gradient Overlay for Clean Artwork Display */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

                    {/* Card Overlay: Place/country text removed as requested since artwork already contains it */}
                    <div className="absolute inset-0 flex flex-col justify-end p-3.5 sm:p-5 pointer-events-none">
                      <div className="flex items-center justify-end pointer-events-auto">
                        {/* Explore Action Button */}
                        <Link
                          href={item.href}
                          onClick={(e) => {
                            if (!isActive) {
                              e.preventDefault()
                              e.stopPropagation()
                              if (diff > 0) handleNextCol()
                              else handlePrevCol()
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-sky-400 hover:text-[#040810] text-white border border-white/30 text-[10px] sm:text-xs font-mono uppercase tracking-[0.16em] backdrop-blur-md shadow-lg transition-all duration-300 shrink-0 cursor-pointer"
                        >
                          <span>Explore</span>
                          <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* 3. Bottom Controls Bar: Active Destination Title & Specs + Direct Explore Action */}
          <div className="w-full max-w-7xl mx-auto shrink-0 pointer-events-auto pt-1">
            <div className="flex items-end justify-between gap-4">
              {/* Left: Active Country Details & Specs */}
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-mono text-[9px] sm:text-[10px] text-[#7DD3FC] tracking-[0.2em] uppercase">
                  DESTINATION · {activeColItem.countryKey}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-white font-light tracking-wide truncate mt-0.5">
                  {activeColItem.title}
                </h3>
                <p className="font-mono text-[9px] sm:text-[11px] text-sky-200/80 tracking-[0.18em] uppercase mt-0.5 truncate">
                  {activeColItem.specs}
                </p>
              </div>

              {/* Right: Direct Explore Destination Link */}
              <Link
                href={activeColItem.href}
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-sky-500/15 hover:bg-sky-400 text-sky-300 hover:text-[#040810] border border-sky-400/40 text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] font-medium transition-all duration-300 shrink-0 shadow-lg cursor-pointer"
              >
                <span>Explore {activeColItem.countryKey}</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>

            {/* Reference Bottom Horizontal Divider Rule */}
            <div className="w-full h-px bg-white/10 mt-2 sm:mt-3" />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 6: "ONE TEAM, END TO END" DEDICATED FULL-SCREEN TEXT PAGE
            (Overlays The Collection completely from bottom, 0% video/images)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer6Ref}
          style={{ zIndex: 70 }}
          className="absolute inset-0 w-full h-[100dvh] max-h-[100dvh] will-change-[transform,filter] z-[70] bg-[#040810] flex flex-col items-center justify-center text-center px-6 sm:px-12 shadow-[0_-30px_70px_rgba(0,0,0,0.98)] border-t border-white/10 overflow-hidden"
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
            LAYER 7: "ONE TEAM, END TO END" PINNED MEDIA STAGE
            (Video rises from bottom first, then 4 images reveal around it)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer7Ref}
          style={{ zIndex: 80 }}
          className="absolute inset-0 w-full h-[100dvh] max-h-[100dvh] will-change-[transform,filter] z-[80] bg-[#040810] flex flex-col justify-center items-center px-3 sm:px-6 md:px-8 lg:px-12 pb-[calc(env(safe-area-inset-bottom)+70px)] sm:pb-8 pt-4 sm:pt-6 overflow-hidden shadow-[0_-30px_70px_rgba(0,0,0,0.98)] border-t border-white/10"
        >
          {/* 5-Panel Content Grid: Enlarged sizing taking generous viewport space */}
          <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col justify-center my-auto gap-2.5 sm:gap-3.5 md:gap-4 overflow-hidden">
            {/* ─── ROW 1: TOP 2 IMAGE TILES (Slide down from top) ─── */}
            <div
              ref={oneTeamTopTilesRef}
              className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 will-change-[transform,opacity]"
            >
              {/* Top-Left: Luxury Villas */}
              <Link
                href="/services/luxury-villas"
                className="relative h-28 sm:h-36 md:h-44 lg:h-52 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-sky-400/50 transition-all duration-300 group shadow-xl"
              >
                <Image
                  src="/images/laxuryVillaImage.png"
                  alt="Luxury Villas"
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 30vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-10 flex flex-col">
                  <span className="w-3.5 h-px bg-sky-400/60 block mb-1" />
                  <span className="font-serif text-xs sm:text-base md:text-lg font-light text-white group-hover:text-sky-200 transition-colors truncate">
                    Luxury Villas
                  </span>
                </div>
              </Link>

              {/* Top-Right: Commercial Properties */}
              <Link
                href="/services/commercial-properties"
                className="relative h-28 sm:h-36 md:h-44 lg:h-52 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-sky-400/50 transition-all duration-300 group shadow-xl"
              >
                <Image
                  src="/images/commercialimage.png"
                  alt="Commercial Properties"
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 30vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-10 flex flex-col">
                  <span className="w-3.5 h-px bg-sky-400/60 block mb-1" />
                  <span className="font-serif text-xs sm:text-base md:text-lg font-light text-white group-hover:text-sky-200 transition-colors truncate">
                    Commercial Properties
                  </span>
                </div>
              </Link>
            </div>

            {/* ─── ROW 2: CENTRAL PINNED VIDEO (Rises from bottom first) ─── */}
            <div
              ref={oneTeamVideoWrapRef}
              className="relative w-full h-44 sm:h-64 md:h-76 lg:h-88 rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl will-change-transform"
            >
              <video
                ref={oneTeamVideoRef}
                src="/videos/one%20team%20end%20to%20end.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedData={() => {
                  setOneTeamVideoLoaded(true)
                  playSafely(oneTeamVideoRef.current)
                }}
                className="w-full h-full object-cover object-center"
                style={{ opacity: 1 }}
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
              ref={oneTeamBottomTilesRef}
              className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 will-change-[transform,opacity]"
            >
              {/* Bottom-Left: Sky Residences */}
              <Link
                href="/services/sky-residences"
                className="relative h-28 sm:h-36 md:h-44 lg:h-52 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-sky-400/50 transition-all duration-300 group shadow-xl"
              >
                <Image
                  src="/images/skyResidenceImage.png"
                  alt="Sky Residences"
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 30vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-10 flex flex-col">
                  <span className="w-3.5 h-px bg-sky-400/60 block mb-1" />
                  <span className="font-serif text-xs sm:text-base md:text-lg font-light text-white group-hover:text-sky-200 transition-colors truncate">
                    Sky Residences
                  </span>
                </div>
              </Link>

              {/* Bottom-Right: Waterfront Residences */}
              <Link
                href="/properties"
                className="relative h-28 sm:h-36 md:h-44 lg:h-52 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-sky-400/50 transition-all duration-300 group shadow-xl"
              >
                <Image
                  src="/images/waterFrontResidenceImage.png"
                  alt="Waterfront Residences"
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 30vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-10 flex flex-col">
                  <span className="w-3.5 h-px bg-sky-400/60 block mb-1" />
                  <span className="font-serif text-xs sm:text-base md:text-lg font-light text-white group-hover:text-sky-200 transition-colors truncate">
                    Waterfront Residences
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 8: "SPACES IN THE ROUND" 3D ROTATING PROPERTY CAROUSEL
            (Rises from bottom over pinned Layer 7, interactive continuous 3D ring)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer8Ref}
          style={{ zIndex: 90 }}
          className="absolute inset-0 w-full h-[100dvh] max-h-[100dvh] will-change-[transform,filter] z-[90] bg-[#040810] flex flex-col justify-between px-4 sm:px-8 lg:px-12 pt-16 sm:pt-20 pb-[calc(env(safe-area-inset-bottom)+75px)] sm:pb-8 shadow-[0_-30px_70px_rgba(0,0,0,0.98)] border-t border-white/10 overflow-hidden select-none"
        >
          {/* Subtle Ambient Radial Lighting */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-400/10 via-[#0B1528]/40 to-transparent blur-3xl pointer-events-none"
          />

          {/* 1. Top Header: Exact Match to Reference Screenshot 4 */}
          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 shrink-0 pointer-events-auto">
            <div>
              <h2 className="heading-display font-light text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-none">
                Spaces <em className="italic text-sky-200">in the round</em>
              </h2>
            </div>
            <p className="max-w-md font-sans text-xs sm:text-sm text-[#94A3B8] font-light leading-relaxed">
              Exteriors and interiors from across the portfolio. Drag the ring to turn it.
            </p>
          </div>

          {/* 2. 3D Rotating Circular Carousel Stage */}
          <div
            ref={stageRoundRef}
            onPointerDown={handleRoundPointerDown}
            onPointerMove={handleRoundPointerMove}
            onPointerUp={handleRoundPointerUp}
            onPointerCancel={handleRoundPointerUp}
            onMouseEnter={() => {
              isHoveredRoundRef.current = true
            }}
            onMouseLeave={() => {
              isHoveredRoundRef.current = false
            }}
            className="relative w-full flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y my-auto pointer-events-auto select-none"
            style={{
              perspective: isMobile ? '850px' : '1350px',
              perspectiveOrigin: 'center 50%',
            }}
          >
            {/* Cards Ring Container with 3D Preservation */}
            <div
              className="relative w-full h-full flex items-center justify-center pointer-events-none"
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {PERSPECTIVE_GALLERY_PROPERTIES.map((prop, i) => {
                const total = PERSPECTIVE_GALLERY_PROPERTIES.length
                const angleStep = 360 / total
                const baseAngle = i * angleStep
                let relAngle = (baseAngle + roundRotation) % 360
                if (relAngle > 180) relAngle -= 360
                if (relAngle < -180) relAngle += 360

                const isActive = Math.abs(relAngle) < 22
                const rad = (relAngle * Math.PI) / 180
                const cylinderRadius = isMobile ? 250 : 440
                const angleTuning = isMobile ? 0.62 : 0.66
                const tx = Math.sin(rad) * cylinderRadius
                const tz = Math.cos(rad) * cylinderRadius - cylinderRadius
                const ry = -relAngle * angleTuning

                const dist = Math.abs(relAngle)
                const cardScale = isMobile
                  ? 1.04 - (dist / 180) * 0.28
                  : 1.08 - (dist / 180) * 0.32

                // Smooth fade for cards moving around the rear so front 3 cards dominate
                const cardOpacity = dist <= 75
                  ? 1.0
                  : Math.max(0.18, 1.0 - ((dist - 75) / 105) * 0.82)

                // Depth-accurate zIndex
                const cardZIndex = Math.round(1000 + tz)

                return (
                  <div
                    key={prop.id}
                    onClick={() => handleRoundCardClick(i, prop, relAngle)}
                    className="absolute pointer-events-auto cursor-pointer will-change-transform"
                    style={{
                      width: isMobile ? '220px' : '300px',
                      height: isMobile ? '320px' : '430px',
                      transform: `translate3d(${tx}px, 0px, ${tz}px) rotateY(${ry}deg) scale(${cardScale})`,
                      opacity: cardOpacity,
                      zIndex: cardZIndex,
                    }}
                  >
                    <div
                      className={cn(
                        'relative w-full h-full rounded-2xl overflow-hidden border transition-all duration-300 group shadow-2xl bg-[#07090E]',
                        isActive
                          ? 'border-sky-400/50 shadow-[0_25px_60px_rgba(0,0,0,0.85)] ring-1 ring-sky-400/20'
                          : 'border-white/15 hover:border-white/35 shadow-[0_15px_35px_rgba(0,0,0,0.65)]'
                      )}
                    >
                      {/* Actual Property Image */}
                      <Image
                        src={prop.image}
                        alt={prop.name}
                        fill
                        className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes={isMobile ? '220px' : '300px'}
                        priority={i < 3}
                      />

                      {/* Subtle Ambient Gradient Overlay at Bottom only */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                      {/* Card Content: Clean uppercase label matching reference screenshot */}
                      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 pointer-events-none">
                        <span className="font-mono text-xs sm:text-sm uppercase tracking-[0.22em] text-white font-medium drop-shadow-md block">
                          {prop.cardLabel || prop.name}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3. Bottom Drag Indicator & Directional Controls */}
          <div className="w-full max-w-7xl mx-auto flex items-center justify-center gap-6 shrink-0 pointer-events-auto pt-3 pb-2">
            <button
              type="button"
              onClick={handleRoundPrev}
              aria-label="Rotate Previous"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/20 bg-black/50 hover:bg-white/10 hover:border-sky-400 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <ChevronLeft size={15} />
            </button>

            <span className="font-mono text-[10px] sm:text-xs tracking-[0.28em] text-[#94A3B8] uppercase select-none">
              ← DRAG TO ROTATE →
            </span>

            <button
              type="button"
              onClick={handleRoundNext}
              aria-label="Rotate Next"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/20 bg-black/50 hover:bg-white/10 hover:border-sky-400 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 9: "PRIVATE ADVISORY" FULL-SCREEN PINNED OVERLAY SECTION
            (Overlays "Spaces in the Round" smoothly from bottom, 100dvh,
             public/videos/gemini_generated_video_0e105bc8.mp4 background video + dark overlay)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer9Ref}
          id="speak-with-us"
          style={{ zIndex: 100 }}
          className="absolute inset-0 w-full h-[100dvh] max-h-[100dvh] will-change-[transform,filter] z-[100] bg-[#040810] flex flex-col items-center justify-center text-center px-6 sm:px-12 pb-[calc(env(safe-area-inset-bottom)+70px)] sm:pb-0 shadow-[0_-30px_70px_rgba(0,0,0,0.98)] border-t border-white/10 overflow-hidden select-none pointer-events-auto"
          aria-label="Private Advisory"
        >
          {/* Background Video: public/videos/gemini_generated_video_0e105bc8.mp4 */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <video
              ref={advisoryVideoRef}
              src="/videos/gemini_generated_video_0e105bc8.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onLoadedData={() => {
                setAdvisoryVideoLoaded(true)
                playSafely(advisoryVideoRef.current)
              }}
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 1,
              }}
            >
              <source src="/videos/gemini_generated_video_0e105bc8.mp4" type="video/mp4" />
            </video>
            {/* Subtle, crystal-clear dark overlay at ~12% opacity (preserving natural brightness and clarity) */}
            <div className="absolute inset-0 bg-black/12 pointer-events-none" />
          </div>

          {/* Content Container: Centered Vertically & Horizontally */}
          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-12 text-center flex flex-col items-center">
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
              <span className="w-8 h-px bg-sky-400/80 drop-shadow-sm" />
              <span className="font-mono text-xs sm:text-sm tracking-[0.32em] uppercase text-[#7DD3FC] font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
                PRIVATE ADVISORY
              </span>
              <span className="w-8 h-px bg-sky-400/80 drop-shadow-sm" />
            </div>

            {/* Main Title */}
            <h2
              className="heading-display font-light text-white tracking-tight leading-[1.08] mb-4 sm:mb-6 text-balance drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]"
              style={{ fontSize: 'clamp(2.3rem, 5.2vw, 4.4rem)' }}
            >
              Begin your <em className="italic text-sky-200">conversation</em>
            </h2>

            {/* Description */}
            <p className="font-sans text-xs sm:text-base md:text-lg text-[#E2E8F0] font-light max-w-xl mx-auto leading-relaxed text-pretty mb-8 sm:mb-10 drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]">
              Our senior partners advise private clients and family offices on prime residential acquisitions across the Gulf, Southeast Asia, and Australasia.
            </p>

            {/* Click-to-open “SPEAK WITH US” Button */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-contact'))
                }
              }}
              className="inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-4.5 rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-[#040810] font-sans font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_4px_30px_rgba(56,189,248,0.3)] hover:shadow-[0_4px_40px_rgba(56,189,248,0.5)] active:scale-98 cursor-pointer"
            >
              <span>SPEAK WITH US</span>
              <ArrowUpRight size={16} />
            </button>

            <span className="font-mono text-[10px] tracking-[0.22em] text-[#CBD5E1] uppercase mt-4 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
              CONFIDENTIAL · INVITATION ONLY
            </span>
          </div>
        </div>
      </div>

      {/* Full-screen Right-to-Left Property Search Drawer */}
      <PropertySearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </section>
  )
}
