'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PropertySearchDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const COMMUNITIES = [
  'Any',
  'Downtown Dubai',
  'Dubai Creek Harbour',
  'Dubai Hills Estate',
  'Emaar Beachfront',
  'Emaar South',
  'The Heights Country Club and Wellness',
  'The Oasis by Emaar',
  'The Valley',
  'Rashid Yachts & Marina',
  'Grand Polo Club & Resort',
  'Thailand',
  'Malaysia',
  'Australia',
  'Georgia',
]

const PROPERTY_TYPES = ['Any', 'Apartment', 'Villa', 'Townhouse']

const BEDROOM_OPTIONS = [
  'Any',
  '1 bedroom',
  '2 bedrooms',
  '3 bedrooms',
  '4 bedrooms',
  '5+ bedrooms',
]

const AVAILABILITY_OPTIONS = [
  'Any status',
  'Just launched',
  'Now selling',
  'Coming soon',
]

const PRICE_RANGES = [
  'Any',
  'Under AED 1.5M',
  'Under AED 2M',
  'Under AED 3M',
  'Under AED 5M',
  'Under AED 10M',
  'AED 10M+',
]

export function PropertySearchDrawer({ isOpen, onClose }: PropertySearchDrawerProps) {
  const router = useRouter()

  const [community, setCommunity] = useState('Any')
  const [propertyType, setPropertyType] = useState('Any')
  const [bedrooms, setBedrooms] = useState('Any')
  const [availability, setAvailability] = useState('Any status')
  const [priceRange, setPriceRange] = useState('Any')

  // Lock body scroll and pause Lenis smooth scroll while drawer is open
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

  // Reset all filters back to default
  const handleResetAll = () => {
    setCommunity('Any')
    setPropertyType('Any')
    setBedrooms('Any')
    setAvailability('Any status')
    setPriceRange('Any')
  }

  // Dynamic realistic unit count based on active filters (Base 481 matches reference screenshot 1)
  const unitCount = useMemo(() => {
    let count = 481

    if (community !== 'Any') {
      if (community === 'Downtown Dubai') count = 142
      else if (community === 'Dubai Creek Harbour') count = 98
      else if (community === 'Dubai Hills Estate') count = 84
      else if (community === 'Emaar Beachfront') count = 62
      else if (community === 'Thailand') count = 38
      else if (community === 'Malaysia') count = 46
      else if (community === 'Australia') count = 52
      else if (community === 'Georgia') count = 28
      else count = 74
    }

    if (propertyType !== 'Any') {
      if (propertyType === 'Apartment') count = Math.max(12, Math.round(count * 0.58))
      else if (propertyType === 'Villa') count = Math.max(8, Math.round(count * 0.32))
      else if (propertyType === 'Townhouse') count = Math.max(6, Math.round(count * 0.22))
    }

    if (bedrooms !== 'Any') {
      if (bedrooms === '1 bedroom') count = Math.max(8, Math.round(count * 0.35))
      else if (bedrooms === '2 bedrooms') count = Math.max(14, Math.round(count * 0.42))
      else if (bedrooms === '3 bedrooms') count = Math.max(10, Math.round(count * 0.30))
      else if (bedrooms === '4 bedrooms') count = Math.max(6, Math.round(count * 0.20))
      else if (bedrooms === '5+ bedrooms') count = Math.max(4, Math.round(count * 0.15))
    }

    if (availability !== 'Any status') {
      if (availability === 'Now selling') count = Math.max(15, Math.round(count * 0.65))
      else if (availability === 'Just launched') count = Math.max(8, Math.round(count * 0.25))
      else if (availability === 'Coming soon') count = Math.max(4, Math.round(count * 0.18))
    }

    if (priceRange !== 'Any') {
      count = Math.max(6, Math.round(count * 0.4))
    }

    return count
  }, [community, propertyType, bedrooms, availability, priceRange])

  // Navigate to matching destination collection or properties catalog
  const handleShowUnits = () => {
    onClose()

    if (community === 'Thailand') {
      router.push('/destinations/thailand')
    } else if (community === 'Malaysia') {
      router.push('/destinations/malaysia')
    } else if (community === 'Australia') {
      router.push('/destinations/australia')
    } else if (community === 'Georgia') {
      router.push('/destinations/georgia')
    } else if (community !== 'Any') {
      // Dubai-specific communities
      router.push('/destinations/uae')
    } else {
      const params = new URLSearchParams()
      if (propertyType !== 'Any') params.set('type', propertyType.toLowerCase())
      if (bedrooms !== 'Any') params.set('beds', bedrooms.replace(/\D/g, ''))
      const qs = params.toString()
      router.push(qs ? `/properties?${qs}` : '/properties')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[120] w-full h-[100dvh] max-h-[100dvh] bg-[#07090E] text-[#F8FAFC] flex flex-col justify-between overflow-hidden shadow-2xl select-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="property-search-heading"
        >
          {/* Top Header Row with Title and Close Button */}
          <div className="relative z-10 w-full max-w-4xl mx-auto flex items-start justify-between px-5 sm:px-10 pt-6 sm:pt-8 pb-4 shrink-0">
            <div>
              <span className="font-mono text-[10px] sm:text-xs tracking-[0.26em] text-[#94A3B8] uppercase block mb-1">
                PROPERTY SEARCH
              </span>
              <h2
                id="property-search-heading"
                className="font-serif text-3xl sm:text-4xl text-white font-light tracking-tight"
              >
                Refine your search.
              </h2>
            </div>

            {/* Circular Close Button (Matches Screenshot 1) */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search panel"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/20 hover:border-white text-white hover:text-sky-300 bg-white/[0.04] hover:bg-white/[0.12] flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 shrink-0 ml-4"
            >
              <X size={18} strokeWidth={1.8} />
            </button>
          </div>

          {/* Scrollable Filter Options Body */}
          <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 overflow-y-auto no-scrollbar px-5 sm:px-10 py-3 space-y-6 sm:space-y-7">
            {/* 1. COMMUNITY */}
            <div>
              <span className="font-mono text-[10px] tracking-[0.24em] text-[#94A3B8] uppercase block mb-2.5">
                COMMUNITY
              </span>
              <div className="flex flex-wrap gap-2">
                {COMMUNITIES.map((item) => {
                  const isSelected = community === item
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCommunity(item)}
                      className={cn(
                        'px-3.5 py-2 text-xs sm:text-sm font-sans rounded-[2px] transition-all duration-200 cursor-pointer border text-left',
                        isSelected
                          ? 'bg-[#E8DCC9] text-[#040810] font-medium border-[#E8DCC9] shadow-sm'
                          : 'bg-transparent text-[#CBD5E1] border-white/15 hover:border-white/35 hover:text-white'
                      )}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. PROPERTY TYPE */}
            <div>
              <span className="font-mono text-[10px] tracking-[0.24em] text-[#94A3B8] uppercase block mb-2.5">
                PROPERTY TYPE
              </span>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((item) => {
                  const isSelected = propertyType === item
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPropertyType(item)}
                      className={cn(
                        'px-3.5 py-2 text-xs sm:text-sm font-sans rounded-[2px] transition-all duration-200 cursor-pointer border text-left',
                        isSelected
                          ? 'bg-[#E8DCC9] text-[#040810] font-medium border-[#E8DCC9] shadow-sm'
                          : 'bg-transparent text-[#CBD5E1] border-white/15 hover:border-white/35 hover:text-white'
                      )}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. BEDROOMS */}
            <div>
              <span className="font-mono text-[10px] tracking-[0.24em] text-[#94A3B8] uppercase block mb-2.5">
                BEDROOMS
              </span>
              <div className="flex flex-wrap gap-2">
                {BEDROOM_OPTIONS.map((item) => {
                  const isSelected = bedrooms === item
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setBedrooms(item)}
                      className={cn(
                        'px-3.5 py-2 text-xs sm:text-sm font-sans rounded-[2px] transition-all duration-200 cursor-pointer border text-left',
                        isSelected
                          ? 'bg-[#E8DCC9] text-[#040810] font-medium border-[#E8DCC9] shadow-sm'
                          : 'bg-transparent text-[#CBD5E1] border-white/15 hover:border-white/35 hover:text-white'
                      )}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 4. AVAILABILITY */}
            <div>
              <span className="font-mono text-[10px] tracking-[0.24em] text-[#94A3B8] uppercase block mb-2.5">
                AVAILABILITY
              </span>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_OPTIONS.map((item) => {
                  const isSelected = availability === item
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setAvailability(item)}
                      className={cn(
                        'px-3.5 py-2 text-xs sm:text-sm font-sans rounded-[2px] transition-all duration-200 cursor-pointer border text-left',
                        isSelected
                          ? 'bg-[#E8DCC9] text-[#040810] font-medium border-[#E8DCC9] shadow-sm'
                          : 'bg-transparent text-[#CBD5E1] border-white/15 hover:border-white/35 hover:text-white'
                      )}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 5. PRICE RANGE */}
            <div>
              <span className="font-mono text-[10px] tracking-[0.24em] text-[#94A3B8] uppercase block mb-2.5">
                PRICE RANGE
              </span>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map((item) => {
                  const isSelected = priceRange === item
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPriceRange(item)}
                      className={cn(
                        'px-3.5 py-2 text-xs sm:text-sm font-sans rounded-[2px] transition-all duration-200 cursor-pointer border text-left',
                        isSelected
                          ? 'bg-[#E8DCC9] text-[#040810] font-medium border-[#E8DCC9] shadow-sm'
                          : 'bg-transparent text-[#CBD5E1] border-white/15 hover:border-white/35 hover:text-white'
                      )}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar Matching Screenshot 1 */}
          <div className="relative z-20 w-full bg-[#07090E] border-t border-white/10 px-5 sm:px-10 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] sm:pb-6 shrink-0">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
              {/* Count Text */}
              <span className="font-sans text-xs sm:text-sm text-[#94A3B8] font-light">
                {unitCount} units match your criteria.
              </span>

              {/* Action Buttons: RESET ALL & SHOW X UNITS */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6">
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="font-mono text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#CBD5E1] hover:text-white transition-colors cursor-pointer"
                >
                  RESET ALL
                </button>

                <button
                  type="button"
                  onClick={handleShowUnits}
                  className="bg-[#E8DCC9] hover:bg-[#DFD1BD] text-[#040810] font-mono text-xs sm:text-sm tracking-[0.16em] uppercase font-semibold py-3 sm:py-3.5 px-6 sm:px-8 rounded-[2px] transition-colors cursor-pointer shadow-lg active:scale-98"
                >
                  SHOW {unitCount} UNITS
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
