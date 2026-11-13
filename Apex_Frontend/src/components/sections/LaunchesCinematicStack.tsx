'use client'

import React, { useRef, useEffect, useLayoutEffect, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
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
  Loader2,
} from 'lucide-react'
import { PropertyItem } from '@/data/properties'
import { PropertySearchDrawer } from '@/components/search/PropertySearchDrawer'
import { OrbitalLoader } from '@/components/ui/orbital-loader'
import { ThreeDPhotoCarousel, CarouselCardItem } from '@/components/ui/3d-carousel'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/ThemeProvider'
import { themeTokens } from '@/lib/theme'

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

export interface CollectionCountry {
  id: string
  countryCode: string
  countryKey: string
  countryName: string
  displayName?: string
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

export interface HomepageContentProps {
  heroVideoUrl?: string | null
  heroVideoThumb?: string | null
  unveilLabel?: string | null
  unveilHeading?: string | null
  unveilSubtext?: string | null
  oneTeamVideoUrl?: string | null
  advisoryVideoUrl?: string | null
  collectionEyebrow?: string | null
  collectionHeading?: string | null
  collectionDescription?: string | null
  spacesHeading?: string | null
  spacesDescription?: string | null
  advisoryEyebrow?: string | null
  advisoryHeading?: string | null
  advisoryDescription?: string | null
  advisoryFooterNote?: string | null
}

export interface OneTeamServiceItem {
  id: string
  slug: string
  name: string
  subtitle?: string | null
  image?: string | null
  videoUrl?: string | null
}

export interface OneTeamMediaProps {
  sectionEyebrow?: string | null
  sectionHeading?: string | null
  sectionDescription?: string | null
  bannerLabel?: string | null
  bannerHeading?: string | null
  luxuryVillasImageUrl?: string | null
  commercialImageUrl?: string | null
  skyResidencesImageUrl?: string | null
  waterfrontImageUrl?: string | null
  centerVideoUrl?: string | null
}

export interface LaunchesCinematicStackProps {
  launches?: VideoLaunch[]
  countries?: CollectionCountry[]
  spaceProperties?: PropertyItem[]
  homepageContent?: HomepageContentProps | null
  services?: OneTeamServiceItem[]
  oneTeamContent?: OneTeamMediaProps | null
}

function renderSplitHeading(text: string, accentClass: string) {
  const trimmed = text.trim()
  if (!trimmed) return null
  const commaIdx = trimmed.indexOf(',')
  if (commaIdx !== -1 && commaIdx < trimmed.length - 1) {
    return (
      <>
        {trimmed.slice(0, commaIdx + 1)}{' '}
        <span className={accentClass}>{trimmed.slice(commaIdx + 1).trim()}</span>
      </>
    )
  }
  const inIdx = trimmed.toLowerCase().indexOf(' in ')
  if (inIdx > 0) {
    return (
      <>
        {trimmed.slice(0, inIdx)}{' '}
        <span className={accentClass}>{trimmed.slice(inIdx + 1)}</span>
      </>
    )
  }
  const lastSpace = trimmed.lastIndexOf(' ')
  if (lastSpace > 0) {
    return (
      <>
        {trimmed.slice(0, lastSpace)}{' '}
        <span className={accentClass}>{trimmed.slice(lastSpace + 1)}</span>
      </>
    )
  }
  return trimmed
}

export function LaunchesCinematicStack({
  launches,
  countries,
  spaceProperties,
  homepageContent,
  services,
  oneTeamContent,
}: LaunchesCinematicStackProps = {}) {
  const LAUNCHES = useMemo(() => {
    if (!launches || launches.length === 0) return []
    return launches.slice(0, 3)
  }, [launches])
  const COLLECTION_COUNTRIES = useMemo(() => countries ?? [], [countries])
  const COUNTRY_FILTERS = useMemo(() => {
    return [
      { label: 'All', value: 'All' },
      ...COLLECTION_COUNTRIES.map((c) => ({
        label: c.displayName || c.countryName,
        value: c.countryKey,
      })),
    ]
  }, [COLLECTION_COUNTRIES])
  const PERSPECTIVE_GALLERY_PROPERTIES = useMemo(() => spaceProperties ?? [], [spaceProperties])

  const serviceBySlug = useMemo(() => {
    const map = new Map<string, OneTeamServiceItem>()
    for (const s of services ?? []) {
      map.set(s.slug, s)
    }
    return map
  }, [services])

  const luxuryVillasCard = useMemo(() => {
    const svc = serviceBySlug.get('luxury-villas')
    return {
      title: svc?.name || 'Luxury Villas',
      href: svc ? `/services/${svc.slug}` : '/services/luxury-villas',
      image: oneTeamContent?.luxuryVillasImageUrl ?? svc?.image ?? null,
    }
  }, [serviceBySlug, oneTeamContent])

  const commercialCard = useMemo(() => {
    const svc = serviceBySlug.get('commercial-properties')
    return {
      title: svc?.name || 'Commercial Properties',
      href: svc ? `/services/${svc.slug}` : '/services/commercial-properties',
      image: oneTeamContent?.commercialImageUrl ?? svc?.image ?? null,
    }
  }, [serviceBySlug, oneTeamContent])

  const skyResidencesCard = useMemo(() => {
    const svc = serviceBySlug.get('sky-residences')
    return {
      title: svc?.name || 'Sky Residences',
      href: svc ? `/services/${svc.slug}` : '/services/sky-residences',
      image: oneTeamContent?.skyResidencesImageUrl ?? svc?.image ?? null,
    }
  }, [serviceBySlug, oneTeamContent])

  const waterfrontCard = useMemo(() => {
    const svc = serviceBySlug.get('waterfront-residences')
    return {
      title: svc?.name || 'Waterfront Residences',
      href: svc ? `/services/${svc.slug}` : '/services/waterfront-residences',
      image: oneTeamContent?.waterfrontImageUrl ?? svc?.image ?? null,
    }
  }, [serviceBySlug, oneTeamContent])

  const resolvedOneTeamVideoUrl =
    oneTeamContent?.centerVideoUrl ?? homepageContent?.oneTeamVideoUrl ?? null
  const router = useRouter()
  const { isLight } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const lastStepRef = useRef<number>(-1)

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

  const roundCarouselCards: CarouselCardItem[] = useMemo(() => {
    return PERSPECTIVE_GALLERY_PROPERTIES.map((prop) => ({
      id: prop.id,
      image: prop.image,
      title: prop.cardLabel || prop.name,
      subtitle: `${prop.city}, ${prop.country}`,
      href: prop.href,
    }))
  }, [PERSPECTIVE_GALLERY_PROPERTIES])

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
  const [activeStep, setActiveStep] = useState(() => {
    if (typeof window === 'undefined') return 0
    const hash = window.location.hash.replace('#', '').toLowerCase()
    if (hash === 'launches') return 1
    if (hash === 'collection' || hash === 'communities' || hash === 'residences') return 5
    if (hash === 'spaces') return 8
    if (hash === 'services') return 7
    return 0
  })

  // Collection carousel & filter state
  const [colSearchQuery, setColSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('All')
  const [activeColIndex, setActiveColIndex] = useState(0)
  const prevActiveColIndexRef = useRef(0)
  const isDraggingColRef = useRef(false)
  const colDragStartXRef = useRef(0)
  const colLastStepXRef = useRef(0)
  const colSteppedInGestureRef = useRef(false)
  const hasDraggedColRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const [mounted, setMounted] = useState(false)
  const [isGsapReady, setIsGsapReady] = useState(false)
  const [isPageReady, setIsPageReady] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('[Apex Lifecycle] Mounted LaunchesCinematicStack')
  }, [])

  // Mark homepage ready when GSAP is initialized and hero video (if configured) has loaded
  useEffect(() => {
    if (isGsapReady && (videoLoaded || !homepageContent?.heroVideoUrl)) {
      console.log('[Apex Lifecycle] Homepage ready. Dismissing loader.')
      setIsPageReady(true)
    }
  }, [isGsapReady, videoLoaded, homepageContent?.heroVideoUrl])

  // Safety fallback timer ensuring loading overlay dismisses cleanly after at most 2500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[Apex Lifecycle] Homepage safety fallback triggered, dismissing loader.')
      setIsPageReady(true)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null)
  const [roundVisitingHref, setRoundVisitingHref] = useState<string | null>(null)
  const [navigatingMessage, setNavigatingMessage] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      setNavigatingHref(null)
      setRoundVisitingHref(null)
    }
  }, [])

  const handleExploreCountry = (e: React.MouseEvent, href: string, title?: string) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('[Apex Navigation] Navigating to collection:', href, title || '')
    setNavigatingHref(href)
    if (title) {
      setNavigatingMessage(`Opening ${title}...`)
    } else {
      setNavigatingMessage('Entering Destination...')
    }
    router.push(href)
  }

  const handleExploreLaunch = (e: React.MouseEvent, href: string, title?: string) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('[Apex Navigation] Navigating to launch:', href, title || '')
    setNavigatingHref(href)
    setNavigatingMessage(title ? `Entering ${title}...` : 'Entering Residence...')
    router.push(href)
  }

  const handleServiceCardClick = (e: React.MouseEvent, href: string, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('[Apex Navigation] Navigating to service:', href, title)
    setNavigatingHref(href)
    setNavigatingMessage(`Opening ${title}...`)
    router.push(href)
  }

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
    router.push('/collection')
  }

  const totalItems = COLLECTION_COUNTRIES.length
  const normalizedActiveColIndex =
    totalItems > 0 ? ((activeColIndex % totalItems) + totalItems) % totalItems : 0

  useEffect(() => {
    prevActiveColIndexRef.current = normalizedActiveColIndex
  }, [normalizedActiveColIndex])

  // Infinite looping in both directions
  const handlePrevCol = useCallback(() => {
    if (totalItems === 0) return
    setActiveColIndex((prev) => (((prev - 1) % totalItems) + totalItems) % totalItems)
  }, [totalItems])

  const handleNextCol = useCallback(() => {
    if (totalItems === 0) return
    setActiveColIndex((prev) => ((prev + 1) % totalItems + totalItems) % totalItems)
  }, [totalItems])

  const handleColPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (totalItems <= 1) return
    const target = e.target as HTMLElement | null
    if (target?.closest('button, a, input')) return
    isDraggingColRef.current = true
    colDragStartXRef.current = e.clientX
    colLastStepXRef.current = e.clientX
    colSteppedInGestureRef.current = false
    hasDraggedColRef.current = false
  }

  const handleColPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingColRef.current) return
    const totalDelta = e.clientX - colDragStartXRef.current
    if (Math.abs(totalDelta) > 10) {
      hasDraggedColRef.current = true
      try {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.setPointerCapture(e.pointerId)
        }
      } catch {
        // safe fallback
      }
    }

    const stepThreshold = isMobile ? 65 : 95
    const stepDelta = e.clientX - colLastStepXRef.current
    if (stepDelta <= -stepThreshold) {
      handleNextCol()
      colLastStepXRef.current = e.clientX
      colSteppedInGestureRef.current = true
    } else if (stepDelta >= stepThreshold) {
      handlePrevCol()
      colLastStepXRef.current = e.clientX
      colSteppedInGestureRef.current = true
    }
  }

  const handleColPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingColRef.current) return
    isDraggingColRef.current = false
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // safe fallback
    }

    const totalDelta = e.clientX - colDragStartXRef.current
    if (!colSteppedInGestureRef.current) {
      if (totalDelta < -35) {
        handleNextCol()
        hasDraggedColRef.current = true
      } else if (totalDelta > 35) {
        handlePrevCol()
        hasDraggedColRef.current = true
      }
    }

    if (hasDraggedColRef.current) {
      setTimeout(() => {
        hasDraggedColRef.current = false
      }, 50)
    }
  }

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
    if (Math.abs(deltaX) > 10) {
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
    const count = Math.max(PERSPECTIVE_GALLERY_PROPERTIES.length, 1)
    const step = 360 / count
    roundRotationRef.current = (roundRotationRef.current - step) % 360
    setRoundRotation(roundRotationRef.current)
  }

  const handleRoundNext = () => {
    const count = Math.max(PERSPECTIVE_GALLERY_PROPERTIES.length, 1)
    const step = 360 / count
    roundRotationRef.current = (roundRotationRef.current + step) % 360
    setRoundRotation(roundRotationRef.current)
  }

  const handleVisitButtonClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!href) return
    const targetHref = href.includes('?') ? href : `${href}?from=spaces`
    console.log('[Apex Navigation] Visiting round property:', targetHref)
    setRoundVisitingHref(targetHref)
    router.push(targetHref)
  }

  const handleRoundCardClick = (cardIndex: number, prop: PropertyItem, relAngle: number) => {
    // If user dragged more than 10px, treat as rotation gesture
    if (hasMovedRoundRef.current) return

    // Clicking any card directly navigates to that property's details page with ?from=spaces
    if (prop?.href) {
      const targetHref = prop.href.includes('?') ? prop.href : `${prop.href}?from=spaces`
      console.log('[Apex Navigation] Clicked round card:', targetHref)
      setRoundVisitingHref(targetHref)
      router.push(targetHref)
    }
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
    ScrollTrigger.config({ ignoreMobileResize: true })

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

    if (!container || !pinEl || !l0 || !l1 || !l2 || !l3 || !l4 || !l5 || !l6 || !l7 || !l8 || !l9) {
      setIsGsapReady(true)
      return
    }

    const ctx = gsap.context(() => {
      const isMob = window.innerWidth < 768

      // Initial States:
      gsap.set(l0, { yPercent: 0, opacity: 1 })
      gsap.set([l1, l2, l3, l4, l5, l6, l7, l8, l9], { yPercent: 100, opacity: 1 })
      if (apexText && apexText.style.visibility !== 'hidden') gsap.set(apexText, { y: 0, scale: 1.0, opacity: 0.95 })
      if (topTiles) gsap.set(topTiles, { yPercent: isMob ? -160 : -140, opacity: 0 })
      if (bottomTiles) gsap.set(bottomTiles, { yPercent: isMob ? 160 : 140, opacity: 0 })
      if (videoWrap) gsap.set(videoWrap, { scale: 1.0 })
      if (heroContent) gsap.set(heroContent, { opacity: 1 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * (window.innerWidth < 768 ? 9.5 : 12.0))}`,
          pin: pinEl,
          pinSpacing: true,
          scrub: isMob ? 0.8 : 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('hero-in-view', { detail: { isHero: p < 0.03 } }))
              window.dispatchEvent(new CustomEvent('apex-step-change', { detail: { progress: p } }))
            }
            let nextStep = 0
            if (p < 0.03) {
              nextStep = 0
            } else if (p < 0.125) {
              nextStep = 1
            } else if (p < 0.220) {
              nextStep = 2
            } else if (p < 0.315) {
              nextStep = 3
            } else if (p < 0.405) {
              nextStep = 4
            } else if (p < 0.515) {
              nextStep = 5
            } else if (p < 0.615) {
              nextStep = 6
            } else if (p < 0.790) {
              nextStep = 7
            } else if (p < 0.895) {
              nextStep = 8
            } else {
              nextStep = 9
            }

            if (nextStep !== lastStepRef.current) {
              lastStepRef.current = nextStep
              if (nextStep === 0) playSafely(heroVideoRef.current)
              else if (nextStep === 2) playSafely(launch1VideoRef.current)
              else if (nextStep === 3) playSafely(launch2VideoRef.current)
              else if (nextStep === 4) playSafely(launch3VideoRef.current)
              else if (nextStep === 7) playSafely(oneTeamVideoRef.current)
              else if (nextStep === 9) playSafely(advisoryVideoRef.current)
            }
          },
        },
      })

      // ─── STAGE 0: HERO PINNED (0.0 to 2.5) ───
      if (apexText && apexText.style.visibility !== 'hidden') {
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
        tl.to(
          apexText,
          {
            y: isMob ? -24 : -38,
            scale: isMob ? 1.05 : 1.08,
            opacity: 1,
            duration: 1.0,
            ease: 'none',
          },
          0.9
        )
        tl.to(
          apexText,
          {
            opacity: 0,
            y: isMob ? -42 : -60,
            duration: 0.5,
            ease: 'power1.in',
          },
          2.0
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
        tl.to(logoScale, { scale: 1.05, opacity: 1, duration: 0.8, ease: 'none' }, 1.0)
        tl.to(
          logoScale,
          { scale: 14.0, opacity: 0, duration: 0.7, ease: 'power2.in' },
          1.8
        )
      }

      // ─── STAGE 1: NEW LAUNCHES OVERLAYS PINNED HERO VIDEO (2.5 to 6.0, duration 3.5) ───
      tl.to(
        l1,
        { yPercent: 0, duration: 3.5, ease: 'none' },
        2.5
      )

      // ─── STAGE 1 HOLD: NEW LAUNCHES PINNED (6.0 to 10.5, duration 4.5) ───
      tl.to(
        l1,
        { yPercent: 0, duration: 4.5, ease: 'none' },
        6.0
      )

      // ─── STAGE 2: VIDEO 1 (THE MERIDIAN) OVERLAYS NEW LAUNCHES (10.5 to 14.0, duration 3.5) ───
      tl.to(
        l2,
        { yPercent: 0, duration: 3.5, ease: 'none' },
        10.5
      )

      // ─── STAGE 2 HOLD: VIDEO 1 PINNED (14.0 to 18.5, duration 4.5) ───
      tl.to(
        l2,
        { yPercent: 0, duration: 4.5, ease: 'none' },
        14.0
      )

      // ─── STAGE 3: VIDEO 2 (AURELIA VILLA) OVERLAYS VIDEO 1 (18.5 to 22.0, duration 3.5) ───
      tl.to(
        l3,
        { yPercent: 0, duration: 3.5, ease: 'none' },
        18.5
      )

      // ─── STAGE 3 HOLD: VIDEO 2 PINNED (22.0 to 26.5, duration 4.5) ───
      tl.to(
        l3,
        { yPercent: 0, duration: 4.5, ease: 'none' },
        22.0
      )

      // ─── STAGE 4: VIDEO 3 (THE PENINSULA RESERVE) OVERLAYS VIDEO 2 (26.5 to 30.0, duration 3.5) ───
      tl.to(
        l4,
        { yPercent: 0, duration: 3.5, ease: 'none' },
        26.5
      )

      // ─── STAGE 4 HOLD: VIDEO 3 PINNED (30.0 to 34.5, duration 4.5) ───
      tl.to(
        l4,
        { yPercent: 0, duration: 4.5, ease: 'none' },
        30.0
      )

      // ─── STAGE 5: THE COLLECTION OVERLAYS VIDEO 3 (34.5 to 38.0, duration 3.5) ───
      tl.to(
        l5,
        { yPercent: 0, duration: 3.5, ease: 'none' },
        34.5
      )

      // ─── STAGE 5 HOLD: THE COLLECTION PINNED (38.0 to 44.0, duration 6.0) ───
      // Generous hold allowing full browsing of destination cards & filters
      tl.to(
        l5,
        { yPercent: 0, duration: 6.0, ease: 'none' },
        38.0
      )

      // ─── STAGE 6: "ONE TEAM, END TO END" TEXT PAGE OVERLAYS THE COLLECTION (44.0 to 47.5, duration 3.5) ───
      tl.to(
        l6,
        { yPercent: 0, duration: 3.5, ease: 'none' },
        44.0
      )

      // ─── STAGE 6 HOLD: TEXT PAGE (47.5 to 52.5, duration 5.0) ───
      tl.to(
        l6,
        { yPercent: 0, duration: 5.0, ease: 'none' },
        47.5
      )

      // ─── STAGE 7: ONE TEAM PINNED VIDEO RISES TO CENTER (52.5 to 56.0, duration 3.5) ───
      tl.to(
        l7,
        { yPercent: 0, duration: 3.5, ease: 'none' },
        52.5
      )

      // ─── STAGE 7 HOLD: PINNED VIDEO HOLDS CENTERED ALONE (56.0 to 59.5, duration 3.5) ───
      tl.to(
        l7,
        { yPercent: 0, duration: 3.5, ease: 'none' },
        56.0
      )

      // ─── STAGE 8: 4 SERVICE TILES REVEAL AROUND CENTRAL VIDEO (59.5 to 63.0, duration 3.5) ───
      if (topTiles) {
        tl.to(
          topTiles,
          { yPercent: 0, opacity: 1, duration: 3.5, ease: 'none' },
          59.5
        )
      }
      if (bottomTiles) {
        tl.to(
          bottomTiles,
          { yPercent: 0, opacity: 1, duration: 3.5, ease: 'none' },
          59.5
        )
      }

      // ─── STAGE 8 HOLD: COMPLETE 5-PANEL COMPOSITION (63.0 to 68.0, duration 5.0) ───
      tl.to(
        l7,
        { yPercent: 0, duration: 5.0, ease: 'none' },
        63.0
      )

      // ─── STAGE 9: "SPACES IN THE ROUND" OVERLAYS ONE TEAM (68.0 to 71.5, duration 3.5) ───
      tl.to(
        l8,
        { yPercent: 0, duration: 3.5, ease: 'none' },
        68.0
      )

      // ─── STAGE 9 HOLD: "SPACES IN THE ROUND" (71.5 to 77.5, duration 6.0) ───
      // Generous hold allowing interactive exploration of 3D rotating carousel
      tl.to(
        l8,
        { yPercent: 0, duration: 6.0, ease: 'none' },
        71.5
      )

      // ─── STAGE 10: "PRIVATE ADVISORY" OVERLAYS "SPACES IN THE ROUND" (77.5 to 81.0, duration 3.5) ───
      tl.to(
        l9,
        { yPercent: 0, duration: 3.5, ease: 'none' },
        77.5
      )

      // ─── STAGE 10 HOLD: "PRIVATE ADVISORY" (81.0 to 87.0, duration 6.0) ───
      // Generous hold allowing full appreciation of advisory invitation before natural footer unpin
      tl.to(
        l9,
        { yPercent: 0, duration: 6.0, ease: 'none' },
        81.0
      )

      const getProgressForTarget = (targetName: string): number | null => {
        const clean = (targetName || '').replace('#', '').toLowerCase()
        if (clean === 'home' || clean === '') return 0.0
        if (clean === 'launches') return 8.25 / 87.0
        if (clean === 'collection' || clean === 'communities' || clean === 'residences') return 41.0 / 87.0
        if (clean === 'services' || clean === 'about' || clean === 'portfolio') return 50.0 / 87.0
        if (clean === 'spaces') return 74.5 / 87.0
        if (clean === 'contact' || clean === 'advisory' || clean === 'speak-with-us' || clean === 'enquiry') return 84.0 / 87.0
        return null
      }

      // Enforce manual scroll restoration so browser does not snap back to (0,0) before our target
      if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
        history.scrollRestoration = 'manual'
      }

      const computeTargetY = (targetProgress: number): number => {
        const isMob = window.innerWidth < 768
        const fallbackDist = (isMob ? 9.5 : 12.0) * window.innerHeight
        const st = tl.scrollTrigger
        const start = (st && typeof st.start === 'number') ? st.start : 0
        const end = (st && typeof st.end === 'number' && st.end > start) ? st.end : (start + fallbackDist)
        return start + (end - start) * targetProgress
      }

      const applyScroll = (targetY: number, immediate = true) => {
        const lenis = (window as unknown as { __lenis?: { resize: () => void; scrollTo: (target: number, opts?: { immediate?: boolean; duration?: number }) => void } }).__lenis
        if (lenis) {
          lenis.resize()
          lenis.scrollTo(targetY, { immediate, duration: immediate ? 0 : 1.1 })
        } else {
          window.scrollTo({ top: targetY, behavior: immediate ? 'auto' : 'smooth' })
        }
      }

      ScrollTrigger.refresh()
      // Synchronous initial placement if arriving with hash
      const initialProgress = typeof window !== 'undefined' ? getProgressForTarget(window.location.hash) : null
      if (initialProgress !== null && initialProgress > 0) {
        tl.progress(initialProgress)
        const targetY = computeTargetY(initialProgress)
        applyScroll(targetY, true)
      }

      const handleNavigateTarget = (targetName: string, immediate = true) => {
        if (typeof window === 'undefined') return
        const targetProgress = getProgressForTarget(targetName)
        if (targetProgress === null) return

        document.body.style.overflow = ''

        const targetY = computeTargetY(targetProgress)
        const lenis = (window as unknown as { __lenis?: { resize: () => void; scrollTo: (target: number, opts?: { immediate?: boolean; duration?: number }) => void } }).__lenis

        if (immediate) {
          tl.progress(targetProgress)
          if (lenis) {
            lenis.resize()
            lenis.scrollTo(targetY, { immediate: true })
          } else {
            window.scrollTo({ top: targetY, behavior: 'auto' })
          }
        } else {
          if (lenis) {
            lenis.resize()
            lenis.scrollTo(targetY, { immediate: false, duration: 1.1 })
          } else {
            window.scrollTo({ top: targetY, behavior: 'smooth' })
          }
        }
      }

      const onApexNavigate = (e: Event) => {
        const ce = e as CustomEvent<{ target: string; immediate?: boolean }>
        if (ce.detail?.target) {
          handleNavigateTarget(ce.detail.target, ce.detail.immediate ?? false)
        }
      }

      const onHashChange = () => {
        handleNavigateTarget(window.location.hash, true)
      }

      window.addEventListener('apex-navigate', onApexNavigate)
      window.addEventListener('hashchange', onHashChange)
      window.addEventListener('popstate', onHashChange)

      // On mount with hash: apply target immediately
      if (window.location.hash) {
        handleNavigateTarget(window.location.hash, true)
        requestAnimationFrame(() => {
          handleNavigateTarget(window.location.hash, true)
        })
      }

      return () => {
        window.removeEventListener('apex-navigate', onApexNavigate)
        window.removeEventListener('hashchange', onHashChange)
        window.removeEventListener('popstate', onHashChange)
      }
    }, container)

    ScrollTrigger.refresh()
    setIsGsapReady(true)
    return () => ctx.revert()
  }, [])

  const activeColItem: CollectionCountry =
    COLLECTION_COUNTRIES[normalizedActiveColIndex] || COLLECTION_COUNTRIES[0]

  return (
    <section ref={containerRef} id="home" className={cn("relative w-full transition-colors duration-300", isLight ? "bg-[#FBF9F6]" : "bg-[#040810]")}>
      {/* Pinned 100vh Viewport Stage */}
      <div
        ref={pinRef}
        className={cn(
          "relative w-full h-screen h-[100dvh] overflow-hidden flex items-center justify-center select-none transition-colors duration-300",
          isLight ? "bg-[#FBF9F6]" : "bg-[#040810]"
        )}
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
            {homepageContent?.heroVideoUrl ? (
              <video
                ref={heroVideoRef}
                src={encodeURI(homepageContent.heroVideoUrl)}
                poster={homepageContent.heroVideoThumb || undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedData={() => {
                  console.log('[Apex Lifecycle] Homepage hero video loaded successfully')
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
                <source src={encodeURI(homepageContent.heroVideoUrl)} type="video/mp4" />
              </video>
            ) : homepageContent?.heroVideoThumb ? (
              <img
                src={homepageContent.heroVideoThumb}
                alt="Apex Pacific Holdings"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-[#040810]" />
            )}

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
                  "pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full border flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer",
                  isLight
                    ? "border-[#0B1325]/20 hover:border-[#0B1325] bg-white/80 hover:bg-white text-[#0B1325] shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
                    : "border-white/30 hover:border-white bg-black/45 hover:bg-black/70 text-white hover:text-sky-300 shadow-[0_8px_32px_rgba(0,0,0,0.6)]",
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

            {/* Bottom Search Bar — Elevated on mobile so it sits comfortably upside with generous clearance */}
            <div className="absolute bottom-28 sm:bottom-14 md:bottom-16 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] sm:w-[calc(100%-4rem)] max-w-xl z-30 pointer-events-auto">
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
                className={cn(
                  "relative flex items-center justify-between rounded-xl border backdrop-blur-xl px-4 py-3 sm:py-3.5 transition-all duration-300 cursor-pointer group select-none",
                  isLight
                    ? "border-[#0B1325]/20 hover:border-[#0B1325]/50 bg-white/85 hover:bg-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-[#0B1325]"
                    : "border-white/35 hover:border-white/60 bg-black/60 hover:bg-black/75 shadow-[0_8px_30px_rgba(0,0,0,0.7)] text-white"
                )}
                aria-label="Open property search panel"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                  <Search
                    size={18}
                    className={cn(
                      "transition-colors flex-shrink-0",
                      isLight ? "text-[#0B1325]" : "text-white/85 group-hover:text-sky-300"
                    )}
                  />
                  <span className={cn(
                    "text-xs sm:text-sm font-light tracking-wide truncate",
                    isLight ? "text-[#0B1325] font-medium" : "text-white/90"
                  )}>
                    Find your home
                  </span>
                </div>
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium flex-shrink-0",
                  isLight
                    ? "bg-white text-[#0B1325] border-[#0B1325]/20 hover:border-[#0B1325]/50 hover:bg-[#F5F2EC] shadow-sm"
                    : "bg-white/10 group-hover:bg-sky-400/20 text-white group-hover:text-sky-200 border-white/20 group-hover:border-sky-400/40"
                )}>
                  <span>SEARCH</span>
                </div>
              </div>
            </div>
          </div>

          {/* APEX Hero Brand Typography — Completely removed as requested */}
          <div
            ref={apexTextRef}
            className="hidden pointer-events-none select-none"
            style={{ display: 'none', opacity: 0, visibility: 'hidden' }}
          />

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
          data-section="launches"
          style={{ zIndex: 20 }}
          className={cn(
            "absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center px-6 sm:px-12 z-20 will-change-transform transition-colors duration-300",
            isLight
              ? "bg-[#FBF9F6] shadow-[0_-25px_60px_rgba(0,0,0,0.06)]"
              : "bg-[#040810] shadow-[0_-25px_60px_rgba(0,0,0,0.95)]"
          )}
        >
          {/* Ambient Lighting */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              background: isLight
                ? 'radial-gradient(ellipse at 50% 50%, rgba(11, 19, 37, 0.04) 0%, transparent 68%)'
                : 'radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.22) 0%, transparent 68%)',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
              <span className={cn("w-8 h-px transition-colors", isLight ? "bg-[#0B1325]/30" : "bg-sky-400/60")} />
              <span className={cn(
                "font-mono text-xs sm:text-sm tracking-[0.32em] uppercase font-medium transition-colors",
                isLight ? "text-[#6B6661]" : "text-[#7DD3FC]"
              )}>
                {homepageContent?.unveilLabel || 'NEW LAUNCHES'}
              </span>
              <span className={cn("w-8 h-px transition-colors", isLight ? "bg-[#0B1325]/30" : "bg-sky-400/60")} />
            </div>

            {/* Headline */}
            <h2
              className={cn(
                "heading-display font-light tracking-tight leading-[1.08] mb-5 sm:mb-8 text-balance transition-colors",
                isLight ? "text-[#0B1325]" : "text-white"
              )}
              style={{ fontSize: 'clamp(2.3rem, 5.8vw, 4.8rem)' }}
            >
              {homepageContent?.unveilHeading ? (
                renderSplitHeading(
                  homepageContent.unveilHeading,
                  isLight ? "text-[#1D263B] font-normal" : "text-sky-200"
                )
              ) : (
                <>Unveil the Latest in <span className={isLight ? "text-[#1D263B] font-normal" : "text-sky-200"}>Exceptional Living</span></>
              )}
            </h2>

            {/* Subtext */}
            <p className={cn(
              "font-sans text-xs sm:text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed text-pretty mb-10 sm:mb-14 transition-colors",
              isLight ? "text-[#6B6661]" : "text-[#94A3B8]"
            )}>
              {homepageContent?.unveilSubtext || "Discover exceptional properties across our international portfolio, each selected for its location, design and long-term potential."}
            </p>

            {/* Scroll Indicator */}
            <div className={cn(
              "flex flex-col items-center justify-center gap-2.5 text-[10px] font-mono tracking-[0.25em] uppercase transition-colors",
              isLight ? "text-[#6B6661]" : "text-[#64748B]"
            )}>
              <span>SCROLL TO EXPLORE</span>
              <div className={cn(
                "w-px h-8 sm:h-12 animate-pulse transition-colors",
                isLight ? "bg-gradient-to-b from-[#0B1325]/40 to-transparent" : "bg-gradient-to-b from-sky-400 to-transparent"
              )} />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 2: LAUNCH 1 (Glides up from bottom)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer2Ref}
          style={{ zIndex: 30 }}
          className="absolute inset-0 w-full h-full will-change-transform z-30 bg-black shadow-[0_-25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
        >
          {LAUNCHES[0] ? (
            <>
              {LAUNCHES[0].videoSrc ? (
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
              ) : LAUNCHES[0].fallbackSrc ? (
                <img
                  src={LAUNCHES[0].fallbackSrc}
                  alt={LAUNCHES[0].title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : null}
              <div className={cn(
                "absolute inset-0 pointer-events-none transition-colors duration-300",
                isLight
                  ? "bg-gradient-to-t from-[#FBF9F6]/80 via-transparent to-transparent"
                  : "bg-gradient-to-t from-[#040810]/90 via-black/20 to-transparent"
              )} />
              <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-10 md:p-14 lg:p-16 pb-20 sm:pb-12 md:pb-16 z-20 pointer-events-none">
                <div className={cn(
                  "max-w-xl pointer-events-auto backdrop-blur-md p-5 sm:p-6 rounded-2xl border transition-all duration-300",
                  isLight
                    ? "bg-white/75 border-[#0B1325]/15 shadow-xl text-[#0B1325]"
                    : "bg-black/50 border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.8)] text-white"
                )}>
                  <span className={cn(
                    "inline-block text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase mb-0.5 sm:mb-1 transition-colors",
                    isLight ? "text-[#6B6661] font-semibold" : "text-[#7DD3FC]"
                  )}>
                    {LAUNCHES[0].tag}
                  </span>
                  <h2 className={cn(
                    "font-display text-xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-0.5 sm:mb-1 transition-colors",
                    isLight ? "text-[#0B1325]" : "text-white"
                  )}>
                    {LAUNCHES[0].title}
                  </h2>
                  <div className={cn(
                    "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs font-sans tracking-[0.18em] uppercase mb-0.5 sm:mb-2 transition-colors",
                    isLight ? "text-[#6B6661]" : "text-[#94A3B8]"
                  )}>
                    {[LAUNCHES[0].location, LAUNCHES[0].type, LAUNCHES[0].beds].filter(Boolean).map((tok, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span>·</span>}
                        <span>{tok}</span>
                      </React.Fragment>
                    ))}
                  </div>
                  {LAUNCHES[0].price && (
                    <div className="flex items-baseline gap-2 mb-2.5 sm:mb-4">
                      <span className={cn(
                        "text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-colors",
                        isLight ? "text-[#6B6661]" : "text-[#94A3B8]"
                      )}>
                        From
                      </span>
                      <span className={cn(
                        "font-display text-base sm:text-2xl md:text-3xl tracking-wide transition-colors",
                        isLight ? "text-[#0B1325] font-normal" : "text-white"
                      )}>
                        {LAUNCHES[0].price}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleExploreLaunch(e, `${LAUNCHES[0].href}?from=launches`)}
                    disabled={navigatingHref?.startsWith(LAUNCHES[0].href)}
                    className={cn(
                      "inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer disabled:opacity-90",
                      isLight
                        ? "bg-white text-[#0B1325] border border-[#0B1325]/20 hover:border-[#0B1325]/50 hover:bg-[#FDFCFB] shadow-md"
                        : "bg-white text-black hover:bg-sky-200 border border-white shadow-[0_4px_25px_rgba(0,0,0,0.9)]"
                    )}
                  >
                    {navigatingHref?.startsWith(LAUNCHES[0].href) ? (
                      <>
                        <OrbitalLoader size="xs" className="w-3.5 h-3.5" />
                        <span>Entering...</span>
                      </>
                    ) : (
                      <>
                        <span>Explore Launch</span>
                        <ArrowUpRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#040810] text-center px-6">
              <div className="max-w-md space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#7DD3FC]">
                  Featured Launch · 01
                </span>
                <p className="font-display text-2xl text-white/80 font-light">
                  New Residences Unveiling Soon
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 3: LAUNCH 2 (Glides up from bottom)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer3Ref}
          style={{ zIndex: 40 }}
          className="absolute inset-0 w-full h-full will-change-transform z-40 bg-black shadow-[0_-25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
        >
          {LAUNCHES[1] ? (
            <>
              {LAUNCHES[1].videoSrc ? (
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
              ) : LAUNCHES[1].fallbackSrc ? (
                <img
                  src={LAUNCHES[1].fallbackSrc}
                  alt={LAUNCHES[1].title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : null}
              <div className={cn(
                "absolute inset-0 pointer-events-none transition-colors duration-300",
                isLight
                  ? "bg-gradient-to-t from-[#FBF9F6]/80 via-transparent to-transparent"
                  : "bg-gradient-to-t from-[#040810]/90 via-black/20 to-transparent"
              )} />
              <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-10 md:p-14 lg:p-16 pb-20 sm:pb-12 md:pb-16 z-20 pointer-events-none">
                <div className={cn(
                  "max-w-xl pointer-events-auto backdrop-blur-md p-5 sm:p-6 rounded-2xl border transition-all duration-300",
                  isLight
                    ? "bg-white/75 border-[#0B1325]/15 shadow-xl text-[#0B1325]"
                    : "bg-black/50 border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.8)] text-white"
                )}>
                  <span className={cn(
                    "inline-block text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase mb-0.5 sm:mb-1 transition-colors",
                    isLight ? "text-[#6B6661] font-semibold" : "text-[#7DD3FC]"
                  )}>
                    {LAUNCHES[1].tag}
                  </span>
                  <h2 className={cn(
                    "font-display text-xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-0.5 sm:mb-1 transition-colors",
                    isLight ? "text-[#0B1325]" : "text-white"
                  )}>
                    {LAUNCHES[1].title}
                  </h2>
                  <div className={cn(
                    "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs font-sans tracking-[0.18em] uppercase mb-0.5 sm:mb-2 transition-colors",
                    isLight ? "text-[#6B6661]" : "text-[#94A3B8]"
                  )}>
                    {[LAUNCHES[1].location, LAUNCHES[1].type, LAUNCHES[1].beds].filter(Boolean).map((tok, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span>·</span>}
                        <span>{tok}</span>
                      </React.Fragment>
                    ))}
                  </div>
                  {LAUNCHES[1].price && (
                    <div className="flex items-baseline gap-2 mb-2.5 sm:mb-4">
                      <span className={cn(
                        "text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-colors",
                        isLight ? "text-[#6B6661]" : "text-[#94A3B8]"
                      )}>
                        From
                      </span>
                      <span className={cn(
                        "font-display text-base sm:text-2xl md:text-3xl tracking-wide transition-colors",
                        isLight ? "text-[#0B1325] font-normal" : "text-white"
                      )}>
                        {LAUNCHES[1].price}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleExploreLaunch(e, `${LAUNCHES[1].href}?from=launches`)}
                    disabled={navigatingHref?.startsWith(LAUNCHES[1].href)}
                    className={cn(
                      "inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer disabled:opacity-90",
                      isLight
                        ? "bg-white text-[#0B1325] border border-[#0B1325]/20 hover:border-[#0B1325]/50 hover:bg-[#FDFCFB] shadow-md"
                        : "bg-white text-black hover:bg-sky-200 border border-white shadow-[0_4px_25px_rgba(0,0,0,0.9)]"
                    )}
                  >
                    {navigatingHref?.startsWith(LAUNCHES[1].href) ? (
                      <>
                        <OrbitalLoader size="xs" className="w-3.5 h-3.5" />
                        <span>Entering...</span>
                      </>
                    ) : (
                      <>
                        <span>Explore Launch</span>
                        <ArrowUpRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#040810] text-center px-6">
              <div className="max-w-md space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#7DD3FC]">
                  Featured Launch · 02
                </span>
                <p className="font-display text-2xl text-white/80 font-light">
                  New Residences Unveiling Soon
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 4: LAUNCH 3 (Glides up from bottom)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer4Ref}
          style={{ zIndex: 50 }}
          className="absolute inset-0 w-full h-full will-change-transform z-50 bg-black shadow-[0_-25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
        >
          {LAUNCHES[2] ? (
            <>
              {LAUNCHES[2].videoSrc ? (
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
              ) : LAUNCHES[2].fallbackSrc ? (
                <img
                  src={LAUNCHES[2].fallbackSrc}
                  alt={LAUNCHES[2].title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : null}
              <div className={cn(
                "absolute inset-0 pointer-events-none transition-colors duration-300",
                isLight
                  ? "bg-gradient-to-t from-[#FBF9F6]/80 via-transparent to-transparent"
                  : "bg-gradient-to-t from-[#040810]/90 via-black/20 to-transparent"
              )} />
              <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-10 md:p-14 lg:p-16 pb-20 sm:pb-12 md:pb-16 z-20 pointer-events-none">
                <div className={cn(
                  "max-w-xl pointer-events-auto backdrop-blur-md p-5 sm:p-6 rounded-2xl border transition-all duration-300",
                  isLight
                    ? "bg-white/75 border-[#0B1325]/15 shadow-xl text-[#0B1325]"
                    : "bg-black/50 border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.8)] text-white"
                )}>
                  <span className={cn(
                    "inline-block text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase mb-0.5 sm:mb-1 transition-colors",
                    isLight ? "text-[#6B6661] font-semibold" : "text-[#7DD3FC]"
                  )}>
                    {LAUNCHES[2].tag}
                  </span>
                  <h2 className={cn(
                    "font-display text-xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-0.5 sm:mb-1 transition-colors",
                    isLight ? "text-[#0B1325]" : "text-white"
                  )}>
                    {LAUNCHES[2].title}
                  </h2>
                  <div className={cn(
                    "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs font-sans tracking-[0.18em] uppercase mb-0.5 sm:mb-2 transition-colors",
                    isLight ? "text-[#6B6661]" : "text-[#94A3B8]"
                  )}>
                    {[LAUNCHES[2].location, LAUNCHES[2].type, LAUNCHES[2].beds].filter(Boolean).map((tok, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span>·</span>}
                        <span>{tok}</span>
                      </React.Fragment>
                    ))}
                  </div>
                  {LAUNCHES[2].price && (
                    <div className="flex items-baseline gap-2 mb-2.5 sm:mb-4">
                      <span className={cn(
                        "text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-colors",
                        isLight ? "text-[#6B6661]" : "text-[#94A3B8]"
                      )}>
                        From
                      </span>
                      <span className={cn(
                        "font-display text-base sm:text-2xl md:text-3xl tracking-wide transition-colors",
                        isLight ? "text-[#0B1325] font-normal" : "text-white"
                      )}>
                        {LAUNCHES[2].price}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleExploreLaunch(e, `${LAUNCHES[2].href}?from=launches`)}
                    disabled={navigatingHref?.startsWith(LAUNCHES[2].href)}
                    className={cn(
                      "inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer disabled:opacity-90",
                      isLight
                        ? "bg-white text-[#0B1325] border border-[#0B1325]/20 hover:border-[#0B1325]/50 hover:bg-[#FDFCFB] shadow-md"
                        : "bg-white text-black hover:bg-sky-200 border border-white shadow-[0_4px_25px_rgba(0,0,0,0.9)]"
                    )}
                  >
                    {navigatingHref?.startsWith(LAUNCHES[2].href) ? (
                      <>
                        <OrbitalLoader size="xs" className="w-3.5 h-3.5" />
                        <span>Entering...</span>
                      </>
                    ) : (
                      <>
                        <span>Explore Launch</span>
                        <ArrowUpRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#040810] text-center px-6">
              <div className="max-w-md space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#7DD3FC]">
                  Featured Launch · 03
                </span>
                <p className="font-display text-2xl text-white/80 font-light">
                  New Residences Unveiling Soon
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 5: "THE COLLECTION" RESTORED PINNED OVERLAY SECTION
            (Country Selection Carousel with 5 Exact Images & Direct Routes)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer5Ref}
          data-section="collection"
          style={{ zIndex: 60 }}
          className={cn(
            "absolute inset-0 w-full h-[100dvh] max-h-[100dvh] will-change-transform z-[60] flex flex-col justify-between pt-[calc(env(safe-area-inset-top)+84px)] sm:pt-24 md:pt-28 px-4 sm:px-8 md:px-12 pb-[calc(env(safe-area-inset-bottom)+76px)] sm:pb-8 border-t overflow-hidden transition-colors duration-300",
            themeTokens.collection.container(isLight)
          )}
        >
          {/* 1. Header & Controls: Eyebrow, Title, Description, Search Bar & Country Filters */}
          <div className="w-full max-w-7xl mx-auto flex flex-col gap-2 sm:gap-3 shrink-0">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <span className={cn("w-5 h-px transition-colors duration-300", themeTokens.collection.eyebrowLine(isLight))} />
              <span className={cn("font-mono text-[9px] sm:text-[11px] tracking-[0.24em] uppercase font-medium transition-colors duration-300", themeTokens.collection.eyebrow(isLight))}>
                {homepageContent?.collectionEyebrow || 'SIGNATURE RESIDENCES'}
              </span>
            </div>

            {/* Title & Description Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 sm:gap-6">
              <h2 className={cn("font-serif text-2xl sm:text-4xl md:text-5xl font-light tracking-tight leading-none transition-colors duration-300", themeTokens.collection.title(isLight))}>
                {renderSplitHeading(
                  homepageContent?.collectionHeading || 'The collection',
                  themeTokens.collection.titleAccent(isLight)
                )}
              </h2>
              <p className={cn("font-sans text-[11px] sm:text-xs md:text-sm max-w-md font-light leading-relaxed text-left sm:text-right line-clamp-1 sm:line-clamp-none transition-colors duration-300", themeTokens.collection.description(isLight))}>
                {homepageContent?.collectionDescription ||
                  'Five addresses, each designed around its site. Drag, swipe or click to explore the portfolio.'}
              </p>
            </div>

            {/* Search Input & Country Filter Chips Row */}
            <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1.5 border-t transition-colors duration-300", isLight ? "border-[#0B1325]/10" : "border-white/[0.08]")}>
              {/* Search bar */}
              <div className="relative w-full sm:w-64 md:w-72">
                <Search
                  size={13}
                  className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300", themeTokens.collection.searchIcon(isLight))}
                />
                <input
                  type="text"
                  value={colSearchQuery}
                  onChange={(e) => handleColSearchChange(e.target.value)}
                  placeholder="Search country or residence..."
                  className={cn(
                    "w-full text-[11px] sm:text-xs pl-9 pr-7 py-1.5 sm:py-2 rounded-full border transition-all font-sans focus:outline-none",
                    themeTokens.collection.searchInput(isLight)
                  )}
                />
                {colSearchQuery && (
                  <button
                    onClick={() => {
                      setColSearchQuery('')
                      setSelectedCountry('All')
                    }}
                    className={cn(
                      "absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors",
                      isLight ? "text-[#6B6661] hover:text-[#0B1325]" : "text-[#94A3B8] hover:text-white"
                    )}
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
                        themeTokens.collection.filterChip(isLight, isSelected)
                      )}
                    >
                      {chip.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 2. Centered Interactive Country Carousel with Infinite Looping */}
          <div
            onPointerDown={handleColPointerDown}
            onPointerMove={handleColPointerMove}
            onPointerUp={handleColPointerEnd}
            onPointerCancel={handleColPointerEnd}
            onPointerLeave={() => {
              if (!hasDraggedColRef.current) {
                isDraggingColRef.current = false
              }
            }}
            style={{ touchAction: 'pan-y' }}
            className="relative w-full max-w-7xl mx-auto flex-1 min-h-0 flex items-center justify-center my-auto overflow-hidden select-none pointer-events-auto cursor-grab active:cursor-grabbing"
          >
            <div className="relative w-full h-[185px] sm:h-[260px] md:h-[320px] lg:h-[360px] flex items-center justify-center">
              {COLLECTION_COUNTRIES.length === 0 ? (
                <div className="text-center px-6">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#94A3B8]">
                    No collections published yet
                  </p>
                </div>
              ) : (
                COLLECTION_COUNTRIES.map((item, idx) => {
                  const computeWrappedDiff = (index: number, active: number) => {
                    let d = ((index - active) % totalItems + totalItems) % totalItems
                    if (d > totalItems / 2) d -= totalItems
                    return d
                  }
                  const diff = computeWrappedDiff(idx, normalizedActiveColIndex)
                  const prevDiff = computeWrappedDiff(idx, prevActiveColIndexRef.current)
                  const isWrappingAround = Math.abs(diff - prevDiff) > Math.max(2, totalItems / 2)

                  const isActive = diff === 0
                  const spacing = isMobile ? 215 : 440
                  const tx = diff * spacing
                  const scale = isActive ? 1.0 : Math.abs(diff) === 1 ? 0.86 : 0.74
                  const opacity = isActive ? 1.0 : Math.abs(diff) === 1 ? 0.50 : 0.20
                  const zIndex = isActive ? 30 : 25 - Math.abs(diff)

                  return (
                    <motion.div
                      suppressHydrationWarning
                      key={item.id}
                      onClick={(e) => {
                        if (hasDraggedColRef.current) return
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
                      initial={false}
                      animate={{
                        x: tx,
                        scale: scale,
                        opacity: opacity,
                      }}
                      transition={
                        isWrappingAround
                          ? { duration: 0 }
                          : {
                              duration: 0.45,
                              ease: [0.22, 1, 0.36, 1],
                            }
                      }
                      style={{
                        zIndex,
                      }}
                      className={cn(
                        'absolute w-[260px] h-[180px] md:w-[500px] md:h-[330px] rounded-2xl overflow-hidden shadow-2xl transition-shadow cursor-pointer will-change-transform group',
                        themeTokens.collection.carouselCard(isLight, isActive)
                      )}
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={`${item.displayName || item.countryName} Collection`}
                          fill
                          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 768px) 280px, 540px"
                          priority={isActive}
                        />
                      ) : (
                        <div className="w-full h-full bg-[#070E1C] flex items-center justify-center">
                          <span className="font-display text-xl text-white/75">
                            {item.displayName || item.countryName}
                          </span>
                        </div>
                      )}

                    {/* Subtle Gradient Overlay for Clean Artwork Display */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

                    {/* Card Overlay: Place/country text removed as requested since artwork already contains it */}
                    <div className="absolute inset-0 flex flex-col justify-end p-3.5 sm:p-5 pointer-events-none">
                      <div className="flex items-center justify-end pointer-events-auto">
                        {/* Explore Action Button with immediate loading state */}
                        <button
                          type="button"
                          onClick={(e) => handleExploreCountry(e, item.href)}
                          disabled={navigatingHref === item.href}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-[0.16em] transition-all duration-300 shrink-0 cursor-pointer disabled:opacity-80",
                            themeTokens.collection.cardExploreButton(isLight)
                          )}
                        >
                          {navigatingHref === item.href ? (
                            <>
                              <OrbitalLoader size="xs" className="w-3 h-3" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <span>Explore</span>
                              <ArrowUpRight size={13} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              }))}
            </div>
          </div>

          {/* 3. Bottom Controls Bar: Active Destination Title & Specs + Direct Explore Action */}
          <div className="w-full max-w-7xl mx-auto shrink-0 pointer-events-auto pt-1">
            {activeColItem && (
            <div className="flex items-end justify-between gap-4">
              {/* Left: Active Country Details & Specs */}
              <div className="flex flex-col min-w-0 pr-2">
                <span className={cn(
                  "font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-300",
                  themeTokens.collection.bottomLabel(isLight)
                )}>
                  DESTINATION · {activeColItem.countryKey}
                </span>
                <h3 className={cn(
                  "font-serif text-xl sm:text-2xl md:text-3xl font-light tracking-wide truncate mt-0.5 transition-colors duration-300",
                  themeTokens.collection.bottomTitle(isLight)
                )}>
                  {activeColItem.title}
                </h3>
                <p className={cn(
                  "font-mono text-[9px] sm:text-[11px] tracking-[0.18em] uppercase mt-0.5 truncate transition-colors duration-300",
                  themeTokens.collection.bottomSpecs(isLight)
                )}>
                  {activeColItem.specs}
                </p>
              </div>

              {/* Right: Direct Explore Destination Link with immediate loading state */}
              <button
                type="button"
                onClick={(e) => handleExploreCountry(e, activeColItem.href)}
                disabled={navigatingHref === activeColItem.href}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] font-medium transition-all duration-300 shrink-0 cursor-pointer disabled:opacity-80",
                  themeTokens.collection.bottomExploreButton(isLight)
                )}
              >
                {navigatingHref === activeColItem.href ? (
                  <>
                    <OrbitalLoader size="xs" className="w-3.5 h-3.5" />
                    <span>Opening {activeColItem.countryKey}...</span>
                  </>
                ) : (
                  <>
                    <span>Explore {activeColItem.countryKey}</span>
                    <ArrowUpRight size={14} />
                  </>
                )}
              </button>
            </div>
            )}

            {/* Reference Bottom Horizontal Divider Rule */}
            <div className={cn("w-full h-px mt-2 sm:mt-3 transition-colors duration-300", themeTokens.collection.divider(isLight))} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 6: "ONE TEAM, END TO END" DEDICATED FULL-SCREEN TEXT PAGE
            (Overlays The Collection completely from bottom, 0% video/images)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer6Ref}
          style={{ zIndex: 70 }}
          className={cn(
            "absolute inset-0 w-full h-[100dvh] max-h-[100dvh] will-change-transform z-[70] flex flex-col items-center justify-center text-center px-6 sm:px-12 border-t overflow-hidden transition-colors duration-300",
            themeTokens.oneTeam.container(isLight)
          )}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              background: isLight
                ? 'radial-gradient(ellipse at 50% 50%, rgba(11, 19, 37, 0.04) 0%, transparent 68%)'
                : 'radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.22) 0%, transparent 68%)',
              opacity: isLight ? 1 : 0.25,
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
              <span className={cn("w-8 h-px transition-colors duration-300", themeTokens.oneTeam.eyebrowLine(isLight))} />
              <span className={cn("font-mono text-xs sm:text-sm tracking-[0.32em] uppercase font-medium transition-colors duration-300", themeTokens.oneTeam.eyebrow(isLight))}>
                {oneTeamContent?.sectionEyebrow || 'WHAT WE DO'}
              </span>
              <span className={cn("w-8 h-px transition-colors duration-300", themeTokens.oneTeam.eyebrowLine(isLight))} />
            </div>

            {/* Main Title */}
            <h2
              className={cn("heading-display font-light tracking-tight leading-[1.08] mb-5 sm:mb-7 text-balance transition-colors duration-300", themeTokens.oneTeam.title(isLight))}
              style={{ fontSize: 'clamp(2.4rem, 6vw, 4.8rem)' }}
            >
              {renderSplitHeading(
                oneTeamContent?.sectionHeading || 'One team, end to end',
                themeTokens.oneTeam.titleAccent(isLight)
              )}
            </h2>

            {/* Description */}
            <p className={cn("font-sans text-xs sm:text-base md:text-lg font-light max-w-xl mx-auto leading-relaxed text-pretty transition-colors duration-300", themeTokens.oneTeam.description(isLight))}>
              {oneTeamContent?.sectionDescription ||
                'Development, design and advice from a single studio, so nothing is lost between the drawing board and the front door.'}
            </p>

            {/* Subtle Scroll Cue */}
            <div className={cn("flex flex-col items-center justify-center gap-2 mt-8 sm:mt-12 text-[10px] font-mono tracking-[0.25em] uppercase transition-colors duration-300", themeTokens.oneTeam.scrollCue(isLight))}>
              <span>SCROLL TO EXPLORE</span>
              <div className={cn("w-px h-6 sm:h-8 animate-pulse transition-all duration-300", themeTokens.oneTeam.scrollLine(isLight))} />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 7: "ONE TEAM, END TO END" PINNED MEDIA STAGE
            (Video rises from bottom first, then 4 images reveal around it)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer7Ref}
          data-section="services"
          style={{ zIndex: 80 }}
          className={cn(
            "absolute inset-0 w-full h-[100dvh] max-h-[100dvh] will-change-transform z-[80] flex flex-col justify-center items-center px-3 sm:px-6 md:px-8 lg:px-12 pb-[calc(env(safe-area-inset-bottom)+70px)] sm:pb-8 pt-4 sm:pt-6 overflow-hidden border-t transition-colors duration-300",
            themeTokens.oneTeam.container(isLight)
          )}
        >
          {/* 5-Panel Content Grid: Enlarged sizing taking generous viewport space */}
          <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col justify-center my-auto gap-2.5 sm:gap-3.5 md:gap-4 overflow-hidden">
            {/* ─── ROW 1: TOP 2 IMAGE TILES (Slide down from top) ─── */}
            <div
              ref={oneTeamTopTilesRef}
              className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 will-change-[transform,opacity]"
            >
              {/* Top-Left: Luxury Villas */}
              <div
                role="link"
                tabIndex={0}
                onClick={(e) => handleServiceCardClick(e, luxuryVillasCard.href, luxuryVillasCard.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleServiceCardClick(e as unknown as React.MouseEvent, luxuryVillasCard.href, luxuryVillasCard.title)
                  }
                }}
                className={cn(
                  "relative h-28 sm:h-36 md:h-44 lg:h-52 rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-300 group shadow-xl cursor-pointer select-none",
                  navigatingHref === luxuryVillasCard.href
                    ? "border-sky-400 ring-2 ring-sky-400/50 shadow-[0_0_30px_rgba(56,189,248,0.4)]"
                    : themeTokens.oneTeam.cardBorder(isLight)
                )}
              >
                {luxuryVillasCard.image ? (
                  <Image
                    src={luxuryVillasCard.image}
                    alt={luxuryVillasCard.title}
                    fill
                    className={cn(
                      "object-cover object-center transition-transform duration-700 group-hover:scale-105",
                      navigatingHref === luxuryVillasCard.href && "scale-105 filter brightness-75"
                    )}
                    sizes="(max-width: 768px) 50vw, 30vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#070E1C]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-10 flex items-end justify-between gap-2">
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="w-3.5 h-px bg-sky-400/60 block mb-1" />
                    <span className="font-serif text-xs sm:text-base md:text-lg font-light text-white group-hover:text-sky-200 transition-colors truncate">
                      {luxuryVillasCard.title}
                    </span>
                  </div>
                  <div className="shrink-0 pointer-events-none">
                    {navigatingHref === luxuryVillasCard.href ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-400 text-black text-[9px] sm:text-[10px] font-mono uppercase tracking-wider font-semibold shadow-lg">
                        <OrbitalLoader size="xs" className="w-3 h-3 text-black" />
                        <span>Loading...</span>
                      </span>
                    ) : (
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full font-mono text-[8px] sm:text-[9px] uppercase tracking-wider transition-all duration-300",
                        themeTokens.oneTeam.exploreButton(isLight)
                      )}>
                        <span className="hidden sm:inline">Explore</span>
                        <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Top-Right: Commercial Properties */}
              <div
                role="link"
                tabIndex={0}
                onClick={(e) => handleServiceCardClick(e, commercialCard.href, commercialCard.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleServiceCardClick(e as unknown as React.MouseEvent, commercialCard.href, commercialCard.title)
                  }
                }}
                className={cn(
                  "relative h-28 sm:h-36 md:h-44 lg:h-52 rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-300 group shadow-xl cursor-pointer select-none",
                  navigatingHref === commercialCard.href
                    ? "border-sky-400 ring-2 ring-sky-400/50 shadow-[0_0_30px_rgba(56,189,248,0.4)]"
                    : themeTokens.oneTeam.cardBorder(isLight)
                )}
              >
                {commercialCard.image ? (
                  <Image
                    src={commercialCard.image}
                    alt={commercialCard.title}
                    fill
                    className={cn(
                      "object-cover object-center transition-transform duration-700 group-hover:scale-105",
                      navigatingHref === commercialCard.href && "scale-105 filter brightness-75"
                    )}
                    sizes="(max-width: 768px) 50vw, 30vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#070E1C]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-10 flex items-end justify-between gap-2">
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="w-3.5 h-px bg-sky-400/60 block mb-1" />
                    <span className="font-serif text-xs sm:text-base md:text-lg font-light text-white group-hover:text-sky-200 transition-colors truncate">
                      {commercialCard.title}
                    </span>
                  </div>
                  <div className="shrink-0 pointer-events-none">
                    {navigatingHref === commercialCard.href ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-400 text-black text-[9px] sm:text-[10px] font-mono uppercase tracking-wider font-semibold shadow-lg">
                        <OrbitalLoader size="xs" className="w-3 h-3 text-black" />
                        <span>Loading...</span>
                      </span>
                    ) : (
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full font-mono text-[8px] sm:text-[9px] uppercase tracking-wider transition-all duration-300",
                        themeTokens.oneTeam.exploreButton(isLight)
                      )}>
                        <span className="hidden sm:inline">Explore</span>
                        <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── ROW 2: CENTRAL PINNED VIDEO (Rises from bottom first) ─── */}
            <div
              ref={oneTeamVideoWrapRef}
              className={cn(
                "relative w-full h-44 sm:h-64 md:h-76 lg:h-88 rounded-xl sm:rounded-2xl overflow-hidden bg-black will-change-transform pointer-events-none select-none transition-all duration-300",
                themeTokens.oneTeam.videoContainer(isLight)
              )}
            >
              {resolvedOneTeamVideoUrl ? (
                <video
                  ref={oneTeamVideoRef}
                  src={encodeURI(resolvedOneTeamVideoUrl)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  onLoadedData={() => {
                    setOneTeamVideoLoaded(true)
                    playSafely(oneTeamVideoRef.current)
                  }}
                  className="w-full h-full object-cover object-center pointer-events-none select-none"
                  style={{ opacity: 1 }}
                >
                  <source src={encodeURI(resolvedOneTeamVideoUrl)} type="video/mp4" />
                </video>
              ) : (
                <div className="w-full h-full bg-[#070E1C]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#040810]/80 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-2 sm:bottom-3.5 left-2.5 sm:left-4 z-10">
                <span className="font-mono text-[8px] sm:text-[10px] tracking-widest uppercase text-[#7DD3FC] block mb-0.5">
                  {oneTeamContent?.bannerLabel || 'APEX PACIFIC HOLDINGS'}
                </span>
                <p className="font-serif text-xs sm:text-base md:text-lg text-white font-light">
                  {oneTeamContent?.bannerHeading || 'One team, end to end'}
                </p>
              </div>
            </div>

            {/* ─── ROW 3: BOTTOM 2 IMAGE TILES (Slide up from bottom) ─── */}
            <div
              ref={oneTeamBottomTilesRef}
              className="grid grid-cols-2 gap-2 sm:gap-3.5 md:gap-4 will-change-[transform,opacity]"
            >
              {/* Bottom-Left: Sky Residences */}
              <div
                role="link"
                tabIndex={0}
                onClick={(e) => handleServiceCardClick(e, skyResidencesCard.href, skyResidencesCard.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleServiceCardClick(e as unknown as React.MouseEvent, skyResidencesCard.href, skyResidencesCard.title)
                  }
                }}
                className={cn(
                  "relative h-28 sm:h-36 md:h-44 lg:h-52 rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-300 group shadow-xl cursor-pointer select-none",
                  navigatingHref === skyResidencesCard.href
                    ? "border-sky-400 ring-2 ring-sky-400/50 shadow-[0_0_30px_rgba(56,189,248,0.4)]"
                    : themeTokens.oneTeam.cardBorder(isLight)
                )}
              >
                {skyResidencesCard.image ? (
                  <Image
                    src={skyResidencesCard.image}
                    alt={skyResidencesCard.title}
                    fill
                    className={cn(
                      "object-cover object-center transition-transform duration-700 group-hover:scale-105",
                      navigatingHref === skyResidencesCard.href && "scale-105 filter brightness-75"
                    )}
                    sizes="(max-width: 768px) 50vw, 30vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#070E1C]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-10 flex items-end justify-between gap-2">
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="w-3.5 h-px bg-sky-400/60 block mb-1" />
                    <span className="font-serif text-xs sm:text-base md:text-lg font-light text-white group-hover:text-sky-200 transition-colors truncate">
                      {skyResidencesCard.title}
                    </span>
                  </div>
                  <div className="shrink-0 pointer-events-none">
                    {navigatingHref === skyResidencesCard.href ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-400 text-black text-[9px] sm:text-[10px] font-mono uppercase tracking-wider font-semibold shadow-lg">
                        <OrbitalLoader size="xs" className="w-3 h-3 text-black" />
                        <span>Loading...</span>
                      </span>
                    ) : (
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full font-mono text-[8px] sm:text-[9px] uppercase tracking-wider transition-all duration-300",
                        themeTokens.oneTeam.exploreButton(isLight)
                      )}>
                        <span className="hidden sm:inline">Explore</span>
                        <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom-Right: Waterfront Residences */}
              <div
                role="link"
                tabIndex={0}
                onClick={(e) => handleServiceCardClick(e, waterfrontCard.href, waterfrontCard.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleServiceCardClick(e as unknown as React.MouseEvent, waterfrontCard.href, waterfrontCard.title)
                  }
                }}
                className={cn(
                  "relative h-28 sm:h-36 md:h-44 lg:h-52 rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-300 group shadow-xl cursor-pointer select-none",
                  navigatingHref === waterfrontCard.href
                    ? "border-sky-400 ring-2 ring-sky-400/50 shadow-[0_0_30px_rgba(56,189,248,0.4)]"
                    : themeTokens.oneTeam.cardBorder(isLight)
                )}
              >
                {waterfrontCard.image ? (
                  <Image
                    src={waterfrontCard.image}
                    alt={waterfrontCard.title}
                    fill
                    className={cn(
                      "object-cover object-center transition-transform duration-700 group-hover:scale-105",
                      navigatingHref === waterfrontCard.href && "scale-105 filter brightness-75"
                    )}
                    sizes="(max-width: 768px) 50vw, 30vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#070E1C]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 sm:bottom-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-10 flex items-end justify-between gap-2">
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="w-3.5 h-px bg-sky-400/60 block mb-1" />
                    <span className="font-serif text-xs sm:text-base md:text-lg font-light text-white group-hover:text-sky-200 transition-colors truncate">
                      {waterfrontCard.title}
                    </span>
                  </div>
                  <div className="shrink-0 pointer-events-none">
                    {navigatingHref === waterfrontCard.href ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-400 text-black text-[9px] sm:text-[10px] font-mono uppercase tracking-wider font-semibold shadow-lg">
                        <OrbitalLoader size="xs" className="w-3 h-3 text-black" />
                        <span>Loading...</span>
                      </span>
                    ) : (
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full font-mono text-[8px] sm:text-[9px] uppercase tracking-wider transition-all duration-300",
                        themeTokens.oneTeam.exploreButton(isLight)
                      )}>
                        <span className="hidden sm:inline">Explore</span>
                        <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
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
          className={cn(
            "absolute inset-0 w-full h-[100dvh] max-h-[100dvh] will-change-transform z-[90] flex flex-col justify-between px-4 sm:px-8 lg:px-12 pt-16 sm:pt-20 pb-[calc(env(safe-area-inset-bottom)+75px)] sm:pb-8 border-t overflow-hidden select-none transition-colors duration-300",
            themeTokens.spacesInTheRound.container(isLight)
          )}
        >
          {/* Subtle Ambient Radial Lighting */}
          <div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[500px] blur-3xl pointer-events-none transition-all duration-500",
              isLight
                ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0B1325]/5 via-transparent to-transparent"
                : "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-400/10 via-[#0B1528]/40 to-transparent"
            )}
          />

          {/* 1. Top Header: Exact Match to Reference Screenshot 4 */}
          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 shrink-0 pointer-events-auto">
            <div>
              <h2 className={cn("heading-display font-light text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-none transition-colors duration-300", themeTokens.spacesInTheRound.title(isLight))}>
                {renderSplitHeading(
                  homepageContent?.spacesHeading || 'Spaces in the round',
                  themeTokens.spacesInTheRound.titleAccent(isLight)
                )}
              </h2>
            </div>
            <p className={cn("max-w-md font-sans text-xs sm:text-sm font-light leading-relaxed transition-colors duration-300", themeTokens.spacesInTheRound.description(isLight))}>
              {homepageContent?.spacesDescription ||
                'Exteriors and interiors from across the portfolio. Drag the ring to turn it.'}
            </p>
          </div>

          {/* 2. 3D Rotating Circular Carousel Stage using Framer Motion 3D Physics */}
          <div className="relative w-full flex-1 flex items-center justify-center pointer-events-auto my-auto overflow-visible">
            {roundCarouselCards.length === 0 ? (
              <div className="text-center px-6 py-12">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#94A3B8]">
                  No residences currently assigned to Spaces in the Round
                </p>
              </div>
            ) : (
              <ThreeDPhotoCarousel
                cards={roundCarouselCards}
                showControls={true}
                enableLightbox={false}
                autoRotateSpeed={10}
                heightClassName="h-[320px] sm:h-[460px]"
                isLight={isLight}
                renderItem={(item) => (
                  <div
                    className={cn(
                      "relative w-full h-[220px] sm:h-[390px] rounded-2xl overflow-hidden transition-all duration-300 group",
                      themeTokens.spacesInTheRound.cardBorder(isLight)
                    )}
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title || 'Property'}
                        className="w-full h-full object-cover object-center pointer-events-none transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#070E1C]" />
                    )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

                  <div className="absolute inset-x-0 bottom-0 p-2 sm:p-4 flex items-center justify-between gap-1 sm:gap-2 z-20">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-mono text-[8px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.16em] text-white font-medium drop-shadow-md truncate">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span className={cn(
                          "font-mono text-[7px] sm:text-[9px] uppercase tracking-wider truncate",
                          isLight ? "text-neutral-300" : "text-[#7DD3FC]/80"
                        )}>
                          {item.subtitle}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (item.href) handleVisitButtonClick(e, item.href)
                      }}
                      disabled={roundVisitingHref === item.href}
                      className={cn(
                        "pointer-events-auto inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-mono text-[7px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.18em] transition-all duration-300 cursor-pointer shrink-0",
                        roundVisitingHref === item.href
                          ? "bg-sky-400 text-black border-sky-400 font-semibold shadow-[0_0_15px_rgba(56,189,248,0.5)] cursor-wait"
                          : themeTokens.spacesInTheRound.visitButton(isLight)
                      )}
                      aria-label={`Visit ${item.title}`}
                    >
                      {roundVisitingHref === item.href ? (
                        <>
                          <OrbitalLoader size="xs" className="w-3 h-3" />
                          <span>ENTERING...</span>
                        </>
                      ) : (
                        <>
                          <span>VISIT</span>
                          <ArrowUpRight size={10} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              />
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 9: "PRIVATE ADVISORY" FULL-SCREEN PINNED OVERLAY SECTION
            (Overlays "Spaces in the Round" smoothly from bottom, 100dvh,
             public/videos/gemini_generated_video_0e105bc8.mp4 background video + dark overlay)
           ══════════════════════════════════════════════════════════════════ */}
        <div
          ref={layer9Ref}
          data-section="speak-with-us"
          style={{ zIndex: 100 }}
          className={cn(
            "absolute inset-0 w-full h-[100dvh] max-h-[100dvh] will-change-transform z-[100] flex flex-col items-center justify-center text-center px-6 sm:px-12 pb-[calc(env(safe-area-inset-bottom)+70px)] sm:pb-0 border-t overflow-hidden select-none pointer-events-auto transition-colors duration-300",
            themeTokens.privateAdvisory.container(isLight)
          )}
          aria-label="Private Advisory"
        >
          {/* Background Video */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {homepageContent?.advisoryVideoUrl ? (
              <video
                ref={advisoryVideoRef}
                src={encodeURI(homepageContent.advisoryVideoUrl)}
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
                <source src={encodeURI(homepageContent.advisoryVideoUrl)} type="video/mp4" />
              </video>
            ) : (
              <div className="absolute inset-0 bg-[#040810]" />
            )}
            {/* Subtle, crystal-clear dark overlay at ~12% opacity (preserving natural brightness and clarity) */}
            <div className={cn(
              "absolute inset-0 pointer-events-none transition-colors duration-500",
              themeTokens.privateAdvisory.videoOverlay(isLight)
            )} />
          </div>

          {/* Content Container: Centered Vertically & Horizontally */}
          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-12 text-center flex flex-col items-center">
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
              <span className={cn("w-8 h-px transition-colors duration-300", themeTokens.privateAdvisory.eyebrowLine(isLight))} />
              <span className={cn("font-mono text-xs sm:text-sm tracking-[0.32em] uppercase font-medium transition-colors duration-300", themeTokens.privateAdvisory.eyebrow(isLight))}>
                {homepageContent?.advisoryEyebrow || 'PRIVATE ADVISORY'}
              </span>
              <span className={cn("w-8 h-px transition-colors duration-300", themeTokens.privateAdvisory.eyebrowLine(isLight))} />
            </div>

            {/* Main Title */}
            <h2
              className={cn("heading-display font-light tracking-tight leading-[1.08] mb-4 sm:mb-6 text-balance transition-colors duration-300", themeTokens.privateAdvisory.title(isLight))}
              style={{ fontSize: 'clamp(2.3rem, 5.2vw, 4.4rem)' }}
            >
              {renderSplitHeading(
                homepageContent?.advisoryHeading || 'Begin your conversation',
                themeTokens.privateAdvisory.titleAccent(isLight)
              )}
            </h2>

            {/* Description */}
            <p className={cn("font-sans text-xs sm:text-base md:text-lg font-light max-w-xl mx-auto leading-relaxed text-pretty mb-8 sm:mb-10 transition-colors duration-300", themeTokens.privateAdvisory.description(isLight))}>
              {homepageContent?.advisoryDescription ||
                'Our senior partners advise private clients and family offices on prime residential acquisitions across the Gulf, Southeast Asia, and Australasia.'}
            </p>

            {/* Click-to-open “SPEAK WITH US” Button */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-contact'))
                }
              }}
              className={cn(
                "inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-4.5 rounded-full font-sans font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-300 active:scale-98 cursor-pointer",
                themeTokens.privateAdvisory.button(isLight)
              )}
            >
              <span>SPEAK WITH US</span>
              <ArrowUpRight size={16} />
            </button>

            <span className={cn("font-mono text-[10px] tracking-[0.22em] uppercase mt-4 transition-colors duration-300", themeTokens.privateAdvisory.confidentialText(isLight))}>
              {homepageContent?.advisoryFooterNote || 'CONFIDENTIAL · INVITATION ONLY'}
            </span>
          </div>
        </div>
      </div>

      {/* Full-screen Right-to-Left Property Search Drawer */}
      <PropertySearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Cinematic Transition Overlay with OrbitalLoader */}
      <AnimatePresence>
        {(!isPageReady || navigatingHref || roundVisitingHref) && (
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
              message={navigatingMessage || (!isPageReady ? "Apex Pacific Holdings" : "Entering Residence...")}
              messagePlacement="bottom"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
