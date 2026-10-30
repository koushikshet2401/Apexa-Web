'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Search, X, ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { DESTINATIONS, TOTAL_DESTINATIONS, TOTAL_PROJECTS, Destination } from '@/data/destinations'
import { GoldLetterA3D } from '@/components/ui/GoldLetterA3D'
import { cn } from '@/lib/utils'

export function CollectionSection() {
  const shouldReduceMotion = useReducedMotion()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Track responsive screen size for calibrated mobile 3D parameters
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Filter destination list dynamically based on search & country chips
  const filteredDestinations = useMemo(() => {
    return DESTINATIONS.filter((item) => {
      // Filter chip matching
      if (selectedFilter !== 'All' && item.country !== selectedFilter && item.slug !== selectedFilter) {
        return false
      }
      // Search query matching (matches country, cities, description, or project names)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesCountry = item.country.toLowerCase().includes(query)
        const matchesCities = item.cities.toLowerCase().includes(query)
        const matchesDescription = item.description.toLowerCase().includes(query)
        const matchesProjects = item.projects.some(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.city.toLowerCase().includes(query) ||
            p.type.toLowerCase().includes(query)
        )
        return matchesCountry || matchesCities || matchesDescription || matchesProjects
      }
      return true
    })
  }, [searchQuery, selectedFilter])

  // Clamp or reset activeIndex if filtered results change
  useEffect(() => {
    if (activeIndex >= filteredDestinations.length) {
      setActiveIndex(Math.max(0, filteredDestinations.length - 1))
    }
  }, [filteredDestinations.length, activeIndex])

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (filteredDestinations.length === 0) return
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredDestinations.length - 1))
  }, [filteredDestinations.length])

  const handleNext = useCallback(() => {
    if (filteredDestinations.length === 0) return
    setActiveIndex((prev) => (prev < filteredDestinations.length - 1 ? prev + 1 : 0))
  }, [filteredDestinations.length])

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in the search input
      if (document.activeElement?.tagName === 'INPUT') return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext])

  // Derived active item
  const activeDestination: Destination | undefined = filteredDestinations[activeIndex]

  // Filter chips list
  const filterChips = [
    { label: 'All destinations', value: 'All' },
    { label: 'United Arab Emirates', value: 'United Arab Emirates' },
    { label: 'Thailand', value: 'Thailand' },
    { label: 'Malaysia', value: 'Malaysia' },
    { label: 'Australia', value: 'Australia' },
    { label: 'Georgia', value: 'Georgia' },
  ]

  return (
    <section
      id="collection"
      className="relative w-full overflow-hidden bg-[#0A100D] text-[var(--text-primary)] py-20 sm:py-24 lg:py-32 select-none"
      aria-label="Apex Signature Collection and Destinations"
    >
      {/* ── Background subtle luxury glow & architectural grid ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full opacity-25 blur-[120px]"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, #161c16 65%, transparent 100%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(201,173,117,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(201,173,117,0.4) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* ── Optional Scroll-Driven 3D Gold Letter A (Background Layer) ── */}
      <GoldLetterA3D className="absolute right-[2%] top-[12%] w-[420px] h-[550px] hidden xl:block opacity-40 z-0" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-20">

        {/* ════════════════════════════════════════════════════════════════
            1. PAGE HEADER (Aligned with Reference 4)
           ════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 sm:mb-16">
          <div className="max-w-[720px]">
            {/* Small uppercase eyebrow label */}
            <motion.div
              className="flex items-center gap-3.5 mb-4"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="w-8 h-px bg-[var(--accent)]" />
              <span className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.28em] text-[var(--accent)] font-medium">
                SIGNATURE RESIDENCES
              </span>
            </motion.div>

            {/* Large editorial heading */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, delay: 0.08 }}
            >
              <h2
                className="font-serif font-light text-[var(--text-primary)] tracking-tight leading-[0.96]"
                style={{ fontSize: 'clamp(2.6rem, 5.2vw, 4.8rem)' }}
              >
                The <em className="italic text-[var(--accent-light)] font-serif not-italic" style={{ fontStyle: 'italic' }}>collection</em>
              </h2>

              {/* Decorative gold ring marker (as in Reference 4) */}
              <div className="flex items-center gap-2 mt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                <span className="w-4 h-4 rounded-full border border-[var(--accent)]/60" />
              </div>
            </motion.div>
          </div>

          {/* Supporting text & project count indicator */}
          <motion.div
            className="lg:max-w-[420px] flex flex-col justify-end gap-3 text-right lg:text-right"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.16 }}
          >
            <p className="font-sans text-[13px] sm:text-[14px] text-[var(--text-secondary)] leading-relaxed text-pretty text-left lg:text-right font-light">
              Explore our destinations and discover exceptional residences across the world. Drag, swipe or use the arrows to walk through the portfolio.
            </p>
            <div className="inline-flex items-center gap-2 self-start lg:self-end text-[11px] font-mono tracking-[0.22em] text-[var(--accent)] uppercase">
              <span>{String(TOTAL_DESTINATIONS).padStart(2, '0')} DESTINATIONS</span>
              <span className="text-[var(--accent)]/40">·</span>
              <span>{String(TOTAL_PROJECTS).padStart(2, '0')} SIGNATURE PROJECTS</span>
            </div>
          </motion.div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            2. SEARCH & DESTINATION FILTER CONTROLS
           ════════════════════════════════════════════════════════════════ */}
        <motion.div
          className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-10 sm:mb-14 pb-8 border-b border-[var(--accent)]/15"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <div className="relative flex items-center">
              <Search
                size={16}
                className="absolute left-4 text-[var(--accent)]/70 pointer-events-none"
                strokeWidth={1.75}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries or destinations..."
                className="w-full bg-[#111814] text-[var(--text-primary)] placeholder-[#737378] text-[13px] pl-11 pr-10 py-3 rounded-full border border-[var(--accent)]/25 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/50 transition-all font-sans"
                aria-label="Search countries or destinations"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 p-1 text-[#85858C] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Selectable destination chips */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {filterChips.map((chip) => {
              const isSelected = selectedFilter === chip.value
              return (
                <button
                  key={chip.value}
                  onClick={() => setSelectedFilter(chip.value)}
                  className={cn(
                    'px-4 py-2 text-[11px] sm:text-xs font-sans uppercase tracking-[0.16em] rounded-full transition-all duration-300 border',
                    isSelected
                      ? 'bg-[var(--accent)] text-[#0A100D] font-medium border-[var(--accent)] shadow-[0_0_15px_rgba(201,173,117,0.3)]'
                      : 'bg-[#111814]/60 text-[var(--text-secondary)] border-[var(--accent)]/20 hover:border-[var(--accent)]/60 hover:text-[var(--text-primary)]'
                  )}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* ════════════════════════════════════════════════════════════════
            3. INTERACTIVE 3D HORIZONTAL DESTINATION CAROUSEL
           ════════════════════════════════════════════════════════════════ */}
        {filteredDestinations.length === 0 ? (
          /* Empty state */
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <p className="font-serif text-2xl text-[var(--text-primary)] mb-3">No destinations found</p>
            <p className="font-sans text-sm text-[#85858C] mb-6 max-w-sm">
              We couldn’t find any countries or residences matching &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedFilter('All')
              }}
              className="px-6 py-2.5 text-xs uppercase tracking-[0.2em] font-sans font-medium text-[#0A100D] bg-[var(--accent)] hover:bg-[var(--accent-light)] rounded-full transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Carousel Stage Container */}
            <div
              className="relative w-full h-[460px] sm:h-[520px] lg:h-[600px] flex items-center justify-center overflow-hidden"
              style={{ perspective: isMobile ? '1200px' : '1600px', transformStyle: 'preserve-3d' }}
            >
              {/* Mobile Quick Tap Zones on screen edges */}
              <button
                type="button"
                onClick={handlePrev}
                className="md:hidden absolute left-0 top-0 bottom-0 w-[18%] z-30 cursor-pointer focus:outline-none bg-transparent"
                aria-label="Previous destination"
              />
              <button
                type="button"
                onClick={handleNext}
                className="md:hidden absolute right-0 top-0 bottom-0 w-[18%] z-30 cursor-pointer focus:outline-none bg-transparent"
                aria-label="Next destination"
              />

              <div className="relative w-full h-full flex items-center justify-center">
                <AnimatePresence initial={false} mode="popLayout">
                  {filteredDestinations.map((dest, idx) => {
                    const total = filteredDestinations.length
                    // Circular modulo offset so left and right cards are ALWAYS visible
                    let circularOffset = ((idx - activeIndex) % total + total) % total
                    if (circularOffset > total / 2) {
                      circularOffset -= total
                    }

                    const isActive = circularOffset === 0
                    const isPrev = circularOffset === -1
                    const isNext = circularOffset === 1
                    const isVisible = Math.abs(circularOffset) <= (total > 3 ? 2 : 1)

                    if (!isVisible) return null

                    // Calibrated 3D positioning for mobile vs desktop
                    const xTranslate = isMobile
                      ? circularOffset * 78 // peeks side cards cleanly on mobile
                      : circularOffset * 56 // spacious desktop curvature

                    const zTranslate = isActive
                      ? 0
                      : isMobile
                      ? -80
                      : -Math.abs(circularOffset) * 125

                    const rotateY = isActive
                      ? 0
                      : isMobile
                      ? circularOffset < 0 ? 16 : -16
                      : circularOffset < 0 ? 14 : -14

                    const scale = isActive
                      ? 1.0
                      : isMobile
                      ? 0.82
                      : 0.88 - Math.abs(circularOffset) * 0.08

                    const opacity = isActive
                      ? 1.0
                      : isMobile
                      ? 0.44
                      : Math.abs(circularOffset) === 1 ? 0.58 : 0.22

                    const zIndex = 25 - Math.abs(circularOffset) * 5

                    return (
                      <motion.div
                        key={dest.id}
                        className={cn(
                          'absolute will-change-transform select-none',
                          isActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                        )}
                        style={{
                          width: isMobile ? 'min(72vw, 300px)' : 'min(82vw, 560px)',
                          height: isMobile ? 'min(115vw, 440px)' : 'min(125vw, 540px)',
                          maxHeight: isMobile ? '450px' : '540px',
                          zIndex,
                        }}
                        initial={
                          shouldReduceMotion
                            ? { opacity: 0 }
                            : {
                                x: `${circularOffset * 80}%`,
                                scale: 0.8,
                                opacity: 0,
                              }
                        }
                        animate={{
                          x: `${xTranslate}%`,
                          y: 0,
                          z: zTranslate,
                          rotateY,
                          scale,
                          opacity,
                          filter: isActive
                            ? 'brightness(1) contrast(1)'
                            : isMobile
                            ? 'brightness(0.50) contrast(0.95)'
                            : 'brightness(0.68)',
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.75,
                          transition: { duration: 0.35 },
                        }}
                        transition={{
                          duration: shouldReduceMotion ? 0.01 : 0.55,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        onClick={() => {
                          if (isPrev) handlePrev()
                          else if (isNext) handleNext()
                          else if (!isActive) setActiveIndex(idx)
                        }}
                        drag={isActive ? 'x' : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_e, info) => {
                          if (info.offset.x < -30 || info.velocity.x < -200) handleNext()
                          else if (info.offset.x > 30 || info.velocity.x > 200) handlePrev()
                        }}
                      >
                        {/* ── Destination Card (Reference 3 & Reference 4) ── */}
                        <div
                          className={cn(
                            'relative w-full h-full rounded-[4px] overflow-hidden transition-all duration-500 group border',
                            isActive
                              ? 'border-[var(--accent)]/45 shadow-[0_25px_60px_rgba(0,0,0,0.88),0_0_22px_rgba(201,173,117,0.15)]'
                              : 'border-white/10 shadow-lg'
                          )}
                        >
                          {/* Background Architectural Image */}
                          <Image
                            src={dest.image}
                            alt={`${dest.country} luxury real estate destination`}
                            fill
                            priority={isActive}
                            className={cn(
                              'object-cover object-center transition-transform duration-700 ease-out',
                              isActive && 'group-hover:scale-105'
                            )}
                            sizes="(max-width: 768px) 72vw, 560px"
                          />

                          {/* Dark luxury gradient overlays for text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A100D] via-[#0A100D]/40 to-transparent opacity-95" />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#0A100D]/60 via-transparent to-transparent" />

                          {/* Top Badges: Index counter & Project count */}
                          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between text-xs font-mono">
                            <span className="px-2.5 sm:px-3 py-1 bg-[#0A100D]/80 backdrop-blur-md rounded-full border border-white/10 text-[var(--accent)] text-[9.5px] sm:text-[10px] tracking-[0.2em] uppercase">
                              {String(idx + 1).padStart(2, '0')} / {String(filteredDestinations.length).padStart(2, '0')}
                            </span>
                            <span className="px-2.5 sm:px-3 py-1 bg-[var(--accent)]/15 backdrop-blur-md rounded-full border border-[var(--accent)]/40 text-[var(--accent-light)] text-[9.5px] sm:text-[10px] tracking-[0.2em] uppercase font-sans font-medium">
                              {String(dest.projects.length).padStart(2, '0')} PROJECTS
                            </span>
                          </div>

                          {/* Bottom Card Content */}
                          <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8 flex flex-col">
                            {/* Geographical descriptor / cities */}
                            <span className="font-sans text-[9px] sm:text-[11px] uppercase tracking-[0.24em] text-[var(--accent)] mb-1.5 sm:mb-2 font-medium">
                              {dest.cities}
                            </span>

                            {/* Country name in large elegant serif */}
                            <h3
                              className="font-serif font-light text-[var(--text-primary)] tracking-tight mb-2 sm:mb-2.5"
                              style={{ fontSize: isMobile ? 'clamp(1.6rem, 5.5vw, 2.1rem)' : 'clamp(1.9rem, 3.8vw, 2.7rem)', lineHeight: 1.05 }}
                            >
                              {dest.country}
                            </h3>

                            {/* Short editorial description */}
                            <p className="font-sans text-[#B0AAA0] text-[11.5px] sm:text-[13.5px] font-light line-clamp-2 sm:line-clamp-3 mb-4 sm:mb-6 leading-relaxed">
                              {dest.description}
                            </p>

                            {/* Circular champagne-gold button leading to landing page */}
                            <Link
                              href={dest.route}
                              className="inline-flex items-center gap-2.5 sm:gap-3 self-start group/btn"
                              onClick={(e) => {
                                if (!isActive) {
                                  e.preventDefault()
                                  if (isPrev) handlePrev()
                                  else if (isNext) handleNext()
                                  else setActiveIndex(idx)
                                }
                              }}
                            >
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] group-hover/btn:bg-[var(--accent)] group-hover/btn:text-[#0A100D] transition-all duration-300">
                                <ArrowUpRight size={isMobile ? 14 : 16} strokeWidth={1.8} className="transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                              </div>
                              <span className="font-sans text-[10px] sm:text-xs uppercase tracking-[0.22em] text-[var(--text-primary)] group-hover/btn:text-[var(--accent)] transition-colors font-medium">
                                EXPLORE DESTINATION
                              </span>
                            </Link>
                          </div>

                          {/* Full-card tap target overlay for side cards to guarantee effortless tap navigation */}
                          {!isActive && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isPrev) handlePrev()
                                else if (isNext) handleNext()
                                else setActiveIndex(idx)
                              }}
                              className="absolute inset-0 z-20 cursor-pointer bg-black/15 hover:bg-black/5 transition-colors"
                              role="button"
                              tabIndex={0}
                              aria-label={isPrev ? 'Navigate to previous destination' : 'Navigate to next destination'}
                            />
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                4. BOTTOM CONTROLS & ACTIVE DESTINATION INFO (Reference 4)
               ════════════════════════════════════════════════════════════ */}
            {activeDestination && (
              <div className="mt-8 sm:mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Left: Counter & active destination meta */}
                <div className="flex items-center gap-6 self-start sm:self-center">
                  <div className="font-mono text-sm tracking-[0.25em] text-[var(--accent)]">
                    <span className="text-lg font-serif text-[var(--text-primary)]">
                      {String(activeIndex + 1).padStart(2, '0')}
                    </span>{' '}
                    / {String(filteredDestinations.length).padStart(2, '0')}
                  </div>

                  <div className="h-8 w-px bg-[var(--accent)]/25" />

                  <div>
                    <h4 className="font-serif text-lg sm:text-xl text-[var(--text-primary)] tracking-tight">
                      {activeDestination.country}
                    </h4>
                    <p className="font-sans text-[11px] text-[#85858C] uppercase tracking-[0.18em]">
                      {activeDestination.cities} · {activeDestination.projects.length} SIGNATURE HOMES
                    </p>
                  </div>
                </div>

                {/* Right: Circular Navigation Arrows */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={handlePrev}
                    aria-label="Previous destination"
                    className="w-11 h-11 rounded-full border border-[var(--accent)]/40 hover:border-[var(--accent)] flex items-center justify-center text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    <ArrowLeft size={16} strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next destination"
                    className="w-11 h-11 rounded-full border border-[var(--accent)]/40 hover:border-[var(--accent)] flex items-center justify-center text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    <ArrowRight size={16} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                5. THIN CHAMPAGNE-GOLD PROGRESS INDICATOR (Reference 4)
               ════════════════════════════════════════════════════════════ */}
            <div className="w-full h-px bg-[var(--accent)]/20 mt-6 relative overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 bottom-0 bg-[var(--accent)]"
                initial={{ width: '0%' }}
                animate={{
                  width: `${((activeIndex + 1) / Math.max(1, filteredDestinations.length)) * 100}%`,
                }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
