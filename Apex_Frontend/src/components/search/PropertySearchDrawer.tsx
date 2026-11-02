'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  MapPin,
  ArrowUpRight,
  ArrowUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PropertySearchDrawerProps {
  isOpen: boolean
  onClose: () => void
}

// ══════════════════════════════════════════════════════════════════
// 1. FIVE DESTINATIONS (Buttons Only)
// ══════════════════════════════════════════════════════════════════
interface DestinationItem {
  id: string
  label: string
  shortLabel: string
}

const DESTINATIONS: DestinationItem[] = [
  { id: 'dubai', label: 'Dubai / UAE', shortLabel: 'UAE' },
  { id: 'australia', label: 'Australia', shortLabel: 'Aus' },
  { id: 'malaysia', label: 'Malaysia', shortLabel: 'Malaysia' },
  { id: 'georgia', label: 'Georgia', shortLabel: 'Georgia' },
  { id: 'thailand', label: 'Thailand', shortLabel: 'Thailand' },
]

// ══════════════════════════════════════════════════════════════════
// 2. FOUR SERVICES / CATEGORIES (Buttons Only)
// ══════════════════════════════════════════════════════════════════
interface ServiceOption {
  id: string
  label: string
  canonicalName: string
}

const SERVICES_OPTIONS: ServiceOption[] = [
  { id: 'luxury-villa', label: 'Luxury Villa', canonicalName: 'Luxury Villas' },
  { id: 'commercial-property', label: 'Commercial Property', canonicalName: 'Commercial Properties' },
  { id: 'sky-residence', label: 'Sky Residence', canonicalName: 'Sky Residences' },
  { id: 'waterfront', label: 'Waterfront', canonicalName: 'Waterfront Residences' },
]

// ══════════════════════════════════════════════════════════════════
// 3. PROPERTY INVENTORY (Images only appear in Result section)
// ══════════════════════════════════════════════════════════════════
export interface SearchPropertyItem {
  id: string
  slug: string
  name: string
  destinationId: 'dubai' | 'australia' | 'malaysia' | 'georgia' | 'thailand'
  countryLabel: string
  location: string
  category: string
  price: string
  image: string
  href: string
}

const ALL_PROPERTIES: SearchPropertyItem[] = [
  // ── Dubai / UAE ──
  {
    id: 'the-meridian',
    slug: 'the-meridian',
    name: 'The Meridian',
    destinationId: 'dubai',
    countryLabel: 'Dubai / UAE',
    location: 'Downtown Dubai',
    category: 'Sky Residences',
    price: 'AED 8.2M',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/dubai/the-meridian',
  },
  {
    id: 'aurelia-villa',
    slug: 'aurelia-villa',
    name: 'Aurelia Villa',
    destinationId: 'dubai',
    countryLabel: 'Dubai / UAE',
    location: 'Emirates Hills, Dubai',
    category: 'Luxury Villas',
    price: 'AED 12.5M',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/dubai/aurelia-villa',
  },
  {
    id: 'verdant-house',
    slug: 'verdant-house',
    name: 'Verdant House',
    destinationId: 'dubai',
    countryLabel: 'Dubai / UAE',
    location: 'Palm Jumeirah, Dubai',
    category: 'Waterfront Residences',
    price: 'AED 28.0M',
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/dubai/verdant-house',
  },
  {
    id: 'marble-sanctuary',
    slug: 'marble-sanctuary',
    name: 'The Marble Sanctuary',
    destinationId: 'dubai',
    countryLabel: 'Dubai / UAE',
    location: 'Jumeirah Bay Island',
    category: 'Luxury Villas',
    price: 'AED 16.5M',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/dubai/marble-sanctuary',
  },

  // ── Thailand ──
  {
    id: 'the-peninsula-reserve',
    slug: 'the-peninsula-reserve',
    name: 'The Peninsula Reserve',
    destinationId: 'thailand',
    countryLabel: 'Thailand',
    location: 'Phuket Promontory',
    category: 'Waterfront Residences',
    price: 'THB 68M',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/thailand/the-peninsula-reserve',
  },
  {
    id: 'andaman-villa',
    slug: 'andaman-villa',
    name: 'Andaman Cliffside Villa',
    destinationId: 'thailand',
    countryLabel: 'Thailand',
    location: 'Phuket West Coast',
    category: 'Luxury Villas',
    price: 'THB 48M',
    image: 'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/thailand',
  },
  {
    id: 'samui-estate',
    slug: 'samui-estate',
    name: 'Samui Beachfront Estate',
    destinationId: 'thailand',
    countryLabel: 'Thailand',
    location: 'Koh Samui',
    category: 'Waterfront Residences',
    price: 'THB 58M',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/thailand',
  },

  // ── Malaysia ──
  {
    id: 'horizon-pavilion',
    slug: 'horizon-pavilion',
    name: 'Horizon Pavilion',
    destinationId: 'malaysia',
    countryLabel: 'Malaysia',
    location: 'Kuala Lumpur City Centre',
    category: 'Commercial Properties',
    price: 'MYR 4.6M',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/malaysia/horizon-pavilion',
  },
  {
    id: 'the-lantern-house',
    slug: 'the-lantern-house',
    name: 'The Lantern House',
    destinationId: 'malaysia',
    countryLabel: 'Malaysia',
    location: 'Penang Rainforest Coast',
    category: 'Luxury Villas',
    price: 'MYR 3.8M',
    image: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/malaysia',
  },
  {
    id: 'banyan-residence',
    slug: 'banyan-residence',
    name: 'Banyan Ocean Residence',
    destinationId: 'malaysia',
    countryLabel: 'Malaysia',
    location: 'Langkawi Archipelago',
    category: 'Waterfront Residences',
    price: 'MYR 6.5M',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/malaysia',
  },

  // ── Australia ──
  {
    id: 'ivory-residences',
    slug: 'ivory-residences',
    name: 'Ivory Residences',
    destinationId: 'australia',
    countryLabel: 'Australia',
    location: 'Melbourne Harbour',
    category: 'Sky Residences',
    price: 'AUD 2.85M',
    image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/australia/ivory-residences',
  },
  {
    id: 'point-piper-villa',
    slug: 'point-piper-villa',
    name: 'Point Piper Villa',
    destinationId: 'australia',
    countryLabel: 'Australia',
    location: 'Sydney Harbour',
    category: 'Waterfront Residences',
    price: 'AUD 8.5M',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/australia',
  },
  {
    id: 'travertine-pavilion',
    slug: 'travertine-pavilion',
    name: 'The Travertine Pavilion',
    destinationId: 'australia',
    countryLabel: 'Australia',
    location: 'Gold Coast Ocean Promenade',
    category: 'Luxury Villas',
    price: 'AUD 4.2M',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/australia',
  },

  // ── Georgia ──
  {
    id: 'colchis-manor',
    slug: 'colchis-manor',
    name: 'Colchis Manor',
    destinationId: 'georgia',
    countryLabel: 'Georgia',
    location: 'Old City, Tbilisi',
    category: 'Luxury Villas',
    price: '$1.85M',
    image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/georgia',
  },
  {
    id: 'batumi-heights',
    slug: 'batumi-heights',
    name: 'Batumi Heights Penthouse',
    destinationId: 'georgia',
    countryLabel: 'Georgia',
    location: 'Black Sea Boulevard, Batumi',
    category: 'Sky Residences',
    price: '$1.4M',
    image: 'https://images.unsplash.com/photo-1504615755583-2916b52192a3?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/georgia',
  },
  {
    id: 'borjomi-chalet',
    slug: 'borjomi-chalet',
    name: 'Borjomi Alpine Chalet',
    destinationId: 'georgia',
    countryLabel: 'Georgia',
    location: 'Borjomi Valley',
    category: 'Luxury Villas',
    price: '$2.1M',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&auto=format&fit=crop',
    href: '/collection/georgia',
  },
]

export function PropertySearchDrawer({ isOpen, onClose }: PropertySearchDrawerProps) {
  const router = useRouter()
  const drawerScrollRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Selection states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)

  // Has user performed search? (Images only show in results after search)
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<SearchPropertyItem[]>([])

  // Pause Lenis and lock body scroll while modal is open
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis

    if (isOpen) {
      if (lenis) lenis.stop()
      document.body.style.overflow = 'hidden'
    } else {
      if (lenis) lenis.start()
      document.body.style.overflow = ''
    }

    return () => {
      if (lenis) lenis.start()
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Reset state on close or re-open
  const handleReset = () => {
    setSearchQuery('')
    setSelectedDestination(null)
    setSelectedService(null)
    setHasSearched(false)
    setResults([])
    if (drawerScrollRef.current) {
      drawerScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Scroll back to top search controls
  const handleScrollToTop = () => {
    if (drawerScrollRef.current) {
      drawerScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Handle Search Execution
  const handleExecuteSearch = () => {
    const query = searchQuery.trim().toLowerCase()

    const matched = ALL_PROPERTIES.filter((p) => {
      // 1. Text Query Filter
      if (query) {
        const matchName = p.name.toLowerCase().includes(query)
        const matchLoc = p.location.toLowerCase().includes(query)
        const matchCountry = p.countryLabel.toLowerCase().includes(query)
        const matchCat = p.category.toLowerCase().includes(query)
        if (!matchName && !matchLoc && !matchCountry && !matchCat) {
          return false
        }
      }

      // 2. Destination Filter
      if (selectedDestination && p.destinationId !== selectedDestination) {
        return false
      }

      // 3. Service / Category Filter
      if (selectedService) {
        const option = SERVICES_OPTIONS.find((s) => s.id === selectedService)
        if (option && p.category !== option.canonicalName) {
          return false
        }
      }

      return true
    })

    setResults(matched)
    setHasSearched(true)

    // Smooth scroll down to results section inside the drawer
    setTimeout(() => {
      if (resultsRef.current && drawerScrollRef.current) {
        const targetTop = resultsRef.current.offsetTop - 80
        drawerScrollRef.current.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
      }
    }, 120)
  }

  // Handle Explore click (redirects to the property route and closes drawer)
  const handleExploreProperty = (href: string) => {
    onClose()
    router.push(href)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={drawerScrollRef}
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          style={{
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
          className="fixed inset-0 z-[120] w-full h-[100dvh] max-h-[100dvh] bg-[#040810] text-[#F8FAFC] overflow-y-auto overscroll-contain shadow-2xl select-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discover-places-heading"
        >
          {/* Ambient luxury light glows */}
          <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-sky-500/10 blur-[150px] pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-[500px] h-[300px] bg-blue-600/10 blur-[160px] pointer-events-none" />

          {/* ══════════════════════════════════════════════════════════════════
              TOP CLOSE BAR (Sticky at top of scrollable drawer)
             ══════════════════════════════════════════════════════════════════ */}
          <header
            data-lenis-prevent="true"
            className="sticky top-0 z-30 w-full bg-[#040810]/95 backdrop-blur-md border-b border-white/10 px-5 sm:px-10 py-4 shrink-0 shadow-md"
          >
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.28em] text-sky-400 uppercase font-semibold">
                APEX PROPERTY FINDER
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="w-10 h-10 rounded-full border border-white/20 hover:border-sky-400 text-white hover:text-sky-300 bg-white/[0.04] hover:bg-sky-500/15 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 group"
              >
                <X size={18} strokeWidth={1.8} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </header>

          {/* ══════════════════════════════════════════════════════════════════
              SCROLLABLE MAIN CONTENT (Strictly Follows User Wireframe)
             ══════════════════════════════════════════════════════════════════ */}
          <main
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            style={{
              touchAction: 'pan-y',
              overscrollBehavior: 'contain',
            }}
            className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-10 py-5 pb-32 space-y-7 sm:space-y-8"
          >
            
            {/* ─── 1. HEADING: "Discover places" ─── */}
            <div>
              <h1
                id="discover-places-heading"
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#38BDF8]"
              >
                Discover places
              </h1>
            </div>

            {/* ─── 2. SEARCH BAR & COUNTRY QUICK SELECTOR (Same Row) ─── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search input field */}
              <div className="relative flex-1 max-w-xl">
                <div className="relative flex items-center rounded-2xl bg-[#070E1C] border border-[#38BDF8]/60 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/30 shadow-lg px-4 py-2.5 sm:py-3 transition-all">
                  <Search size={18} className="text-[#38BDF8] shrink-0 mr-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleExecuteSearch()
                      }
                    }}
                    placeholder="Search bar..."
                    className="w-full bg-transparent text-sm sm:text-base text-white placeholder-neutral-400 focus:outline-none font-sans"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Country Links beside Search Bar */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-sans text-xs sm:text-sm font-medium">
                {DESTINATIONS.map((dest) => {
                  const isSelected = selectedDestination === dest.id
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => {
                        setSelectedDestination(isSelected ? null : dest.id)
                      }}
                      className={cn(
                        'transition-colors cursor-pointer py-1',
                        isSelected
                          ? 'text-[#38BDF8] font-semibold underline decoration-sky-400 underline-offset-4'
                          : 'text-white hover:text-[#38BDF8]'
                      )}
                    >
                      {dest.shortLabel}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ─── 3. SELECT DESTINATION (Clean Buttons Only, NO Images) ─── */}
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-light text-white mb-3 tracking-wide">
                Select Destination
              </h2>

              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {DESTINATIONS.map((dest) => {
                  const isSelected = selectedDestination === dest.id
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => setSelectedDestination(isSelected ? null : dest.id)}
                      className={cn(
                        'px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg border text-xs sm:text-sm font-sans font-medium transition-all duration-200 cursor-pointer text-center min-w-[100px] sm:min-w-[120px]',
                        isSelected
                          ? 'bg-sky-500/25 border-[#38BDF8] text-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.25)] scale-[1.02]'
                          : 'bg-[#070E1C]/80 border-white/20 text-neutral-200 hover:border-white/50 hover:text-white'
                      )}
                    >
                      {dest.label.split(' / ')[0]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ─── 4. SELECT SERVICES (Clean Buttons Only, NO Images) ─── */}
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-light text-white mb-3 tracking-wide">
                Select Services
              </h2>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 sm:gap-3">
                {SERVICES_OPTIONS.map((srv) => {
                  const isSelected = selectedService === srv.id
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedService(isSelected ? null : srv.id)}
                      className={cn(
                        'px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border text-xs sm:text-sm font-sans font-medium transition-all duration-200 cursor-pointer text-center',
                        isSelected
                          ? 'bg-sky-500/25 border-[#38BDF8] text-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.25)] scale-[1.02]'
                          : 'bg-[#070E1C]/80 border-white/20 text-neutral-200 hover:border-white/50 hover:text-white'
                      )}
                    >
                      {srv.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ─── 5. SEARCH ACTION BUTTON ─── */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleExecuteSearch}
                className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3 sm:py-3.5 bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 text-black font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] font-sans rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-lg shadow-sky-500/25 cursor-pointer active:scale-98"
              >
                <Search size={16} strokeWidth={2.5} />
                <span>Search</span>
              </button>
            </div>

            {/* ─── 6. RESULTS SECTION (Only displays after user clicks Search) ─── */}
            {hasSearched && (
              <div ref={resultsRef} className="pt-6 sm:pt-8 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#38BDF8]" />
                    <h3 className="font-serif text-xl sm:text-2xl font-light text-white tracking-wide">
                      Result
                    </h3>
                    <span className="font-mono text-xs text-sky-400 ml-1">
                      ({results.length} found)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleScrollToTop}
                      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-sky-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowUp size={12} />
                      <span>Search Options</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <RotateCcw size={11} />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {results.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {results.map((prop) => (
                        <div
                          key={prop.id}
                          className="group relative rounded-xl overflow-hidden border border-white/15 hover:border-sky-400/60 bg-[#070E1C] transition-all duration-300 shadow-xl flex flex-col justify-between"
                        >
                          {/* Property Image Frame */}
                          <div className="relative aspect-[16/10] overflow-hidden">
                            <Image
                              src={prop.image}
                              alt={prop.name}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#070E1C] via-black/25 to-black/15 pointer-events-none" />

                            {/* Category Badge */}
                            <div className="absolute top-2.5 left-2.5 z-10">
                              <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 font-mono text-[8px] uppercase tracking-widest text-sky-300">
                                {prop.category}
                              </span>
                            </div>
                          </div>

                          {/* Property Details & Explore Button */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-sans mb-1">
                                <MapPin size={12} className="text-sky-400 shrink-0" />
                                <span className="truncate">{prop.location}</span>
                              </div>

                              <h4 className="font-serif text-lg sm:text-xl font-light text-white group-hover:text-sky-200 transition-colors mb-2 leading-snug">
                                {prop.name}
                              </h4>

                              {prop.price && (
                                <p className="text-xs font-mono text-sky-400 font-semibold mb-3">
                                  {prop.price}
                                </p>
                              )}
                            </div>

                            {/* Explore Button */}
                            <button
                              type="button"
                              onClick={() => handleExploreProperty(prop.href)}
                              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/20 group-hover:border-sky-400 bg-white/[0.04] group-hover:bg-sky-500/20 text-white group-hover:text-sky-200 font-mono text-xs uppercase tracking-[0.2em] transition-all cursor-pointer shadow-md"
                            >
                              <span>Explore</span>
                              <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Return To Top Button */}
                    <div className="pt-6 pb-6 flex justify-center">
                      <button
                        type="button"
                        onClick={handleScrollToTop}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/20 hover:border-sky-400 bg-[#070E1C] hover:bg-sky-500/10 text-xs font-mono uppercase tracking-[0.16em] text-neutral-200 hover:text-sky-300 transition-all cursor-pointer shadow-lg active:scale-95"
                      >
                        <ArrowUp size={13} />
                        <span>Return to Search Options</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Empty state */
                  <div className="text-center py-12 px-4 rounded-xl border border-white/10 bg-[#070E1C]/60 my-2">
                    <p className="font-serif text-lg sm:text-xl text-white font-light mb-1">
                      No properties found for this selection
                    </p>
                    <p className="font-sans text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mb-4 leading-relaxed">
                      Try selecting another destination, service, or clearing your search.
                    </p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400 font-mono text-xs uppercase tracking-widest transition-all cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>Reset Filters</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PropertySearchDrawer
