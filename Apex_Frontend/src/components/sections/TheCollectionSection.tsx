'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CollectionItem {
  id: string
  number: string
  title: string
  category: string
  location: string
  beds: string
  specs: string
  image: string
  href: string
}

const COLLECTION_ITEMS: CollectionItem[] = [
  {
    id: 'aurelia-villa',
    number: '01',
    title: 'Aurelia Villa',
    category: 'CONTEMPORARY VILLA',
    location: 'HYDERABAD',
    beds: '5 BEDROOMS',
    specs: 'CONTEMPORARY VILLA · HYDERABAD · 5 BEDROOMS',
    image: '/images/laxuryVillaImage.png',
    href: '/properties/aurelia-villa',
  },
  {
    id: 'horizon-pavilion',
    number: '02',
    title: 'Horizon Pavilion',
    category: 'COMMERCIAL LANDMARK',
    location: 'KUALA LUMPUR',
    beds: 'CONCEPT STUDY',
    specs: 'COMMERCIAL LANDMARK · CONCEPT STUDY',
    image: '/images/commercialimage.png',
    href: '/properties/horizon-pavilion',
  },
  {
    id: 'verdant-house',
    number: '03',
    title: 'Verdant House',
    category: 'BOUTIQUE SKY RESIDENCE',
    location: 'DUBAI',
    beds: '3 BEDROOMS',
    specs: 'BOUTIQUE SKY RESIDENCE · DUBAI · 3 BEDROOMS',
    image: '/images/skyResidenceImage.png',
    href: '/properties/verdant-house',
  },
  {
    id: 'peninsula-reserve',
    number: '04',
    title: 'The Peninsula Reserve',
    category: 'WATERFRONT ESTATE',
    location: 'PHUKET',
    beds: '5 BEDROOMS',
    specs: 'WATERFRONT ESTATE · PHUKET · 5 BEDROOMS',
    image: '/images/waterFrontResidenceImage.png',
    href: '/properties/the-peninsula-reserve',
  },
  {
    id: 'marble-sanctuary',
    number: '05',
    title: 'The Marble Sanctuary',
    category: 'CONTEMPORARY INTERIOR',
    location: 'MILAN',
    beds: '3 BEDROOMS',
    specs: 'CONTEMPORARY INTERIOR · MILAN · 3 BEDROOMS',
    image: '/images/image1.png',
    href: '/residences/contemporary-interior',
  },
]

export function TheCollectionSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const total = COLLECTION_ITEMS.length
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : total - 1))
  }, [total])

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < total - 1 ? prev + 1 : 0))
  }, [total])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext])

  const activeItem = COLLECTION_ITEMS[activeIndex]

  return (
    <section className="relative w-full bg-[#040810] text-[#F8FAFC] pt-12 sm:pt-20 pb-28 sm:pb-24 px-5 sm:px-12 md:px-16 lg:px-20 overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* TOP ROW: Title & Subtitle matching reference */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-12">
          <div>
            <h2 className="font-display text-3xl sm:text-5xl md:text-6xl text-white font-light tracking-tight">
              The <em className="italic font-serif text-[#F1F5F9]">collection</em>
            </h2>
          </div>
          <p className="font-sans text-xs sm:text-sm text-[#94A3B8] max-w-md font-light leading-relaxed">
            Five addresses, each designed around its site. Drag, swipe or use the arrows to walk through the portfolio.
          </p>
        </div>

        {/* 3D COVERFLOW STAGE — Scaled nicely for mobile */}
        <div
          ref={containerRef}
          className="relative w-full h-[260px] sm:h-[350px] md:h-[460px] flex items-center justify-center my-3 sm:my-6 overflow-visible select-none"
          style={{ perspective: isMobile ? '700px' : '1100px' }}
        >
          {COLLECTION_ITEMS.map((item, idx) => {
            let offset = idx - activeIndex
            if (offset > 2) offset -= total
            if (offset < -2) offset += total

            const isActive = offset === 0
            const absOffset = Math.abs(offset)
            const tx = offset * (isMobile ? 120 : 280)
            const tz = absOffset * (isMobile ? -90 : -130)
            const rotateY = offset * (isMobile ? -16 : -20)
            const scale = 1 - absOffset * (isMobile ? 0.10 : 0.12)
            const opacity = Math.max(0.18, 1 - absOffset * 0.38)
            const zIndex = 20 - absOffset

            return (
              <motion.div
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                className="absolute cursor-pointer will-change-transform"
                animate={{
                  x: tx,
                  z: tz,
                  rotateY: rotateY,
                  scale: scale,
                  opacity: opacity,
                }}
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  zIndex,
                  width: isMobile ? '190px' : '330px',
                  height: isMobile ? '230px' : '410px',
                  transformStyle: 'preserve-3d',
                }}
              >
                <div
                  className={cn(
                    'relative w-full h-full rounded-2xl overflow-hidden border transition-all duration-300 shadow-2xl',
                    isActive
                      ? 'border-sky-400/80 shadow-[0_15px_45px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/30'
                      : 'border-white/10 hover:border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.7)]'
                  )}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover object-center scale-[1.05]"
                    sizes="(max-width: 768px) 200px, 340px"
                    priority={isActive}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* BOTTOM CONTROLS: Structured cleanly to always clear mobile bottom nav */}
        <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          {/* Active Item Index & Name */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs text-[#7DD3FC] tracking-[0.25em] font-medium">
              {activeItem.number} &nbsp;/&nbsp; 05
            </span>
            <h3 className="font-display text-xl sm:text-2xl md:text-3xl text-white font-light tracking-wide">
              {activeItem.title}
            </h3>
            <p className="font-mono text-[10px] sm:text-xs text-[#94A3B8] tracking-[0.18em] uppercase">
              {activeItem.specs}
            </p>
          </div>

          {/* Action Button & Navigation Arrows Row */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-full bg-[#0E1A30] hover:bg-[#1E293B] text-white border border-[#38BDF8]/40 hover:border-[#38BDF8] text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_20px_rgba(56,189,248,0.15)] group"
            >
              <span>Explore All Launches</span>
              <ArrowUpRight
                size={13}
                className="text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                aria-label="Previous property"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 hover:border-white/60 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all duration-200"
              >
                <ArrowLeft size={15} />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next property"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 hover:border-white/60 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all duration-200"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
