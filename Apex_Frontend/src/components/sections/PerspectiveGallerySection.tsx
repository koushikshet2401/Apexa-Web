'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { PERSPECTIVE_GALLERY_PROPERTIES, PropertyItem } from '@/data/properties'
import { cn } from '@/lib/utils'

export function PerspectiveGallerySection() {
  const router = useRouter()
  const properties = PERSPECTIVE_GALLERY_PROPERTIES
  const total = properties.length
  const angleStep = 360 / total // 60 degrees for 6 cards

  // rotationAngle is the continuous single source of truth (in degrees)
  const [rotationAngle, setRotationAngle] = useState(60)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef<number>(0)
  const startYRef = useRef<number>(0)
  const startRotationRef = useRef<number>(60)
  const currentDragDeltaRef = useRef<number>(0)
  const hasMovedRef = useRef<boolean>(false)
  const isTouchVerticalScrollRef = useRef<boolean | null>(null)
  const wheelCooldownRef = useRef<boolean>(false)

  // Track viewport width for responsive geometry
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Derive active card index from current rotationAngle
  const normalizedRotation = ((Math.round(rotationAngle / angleStep) % total) + total) % total
  const activeIndex = normalizedRotation
  const activeProperty = properties[activeIndex]

  // Smooth rotation steps
  const rotateNext = useCallback(() => {
    setRotationAngle((prev) => Math.round((prev + angleStep) / angleStep) * angleStep)
  }, [angleStep])

  const rotatePrev = useCallback(() => {
    setRotationAngle((prev) => Math.round((prev - angleStep) / angleStep) * angleStep)
  }, [angleStep])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        rotatePrev()
      } else if (e.key === 'ArrowRight') {
        rotateNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [rotatePrev, rotateNext])

  // Trackpad / Horizontal wheel support
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 20 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (wheelCooldownRef.current) return
      wheelCooldownRef.current = true
      if (e.deltaX > 0) {
        rotateNext()
      } else {
        rotatePrev()
      }
      setTimeout(() => {
        wheelCooldownRef.current = false
      }, 350)
    }
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    startXRef.current = e.clientX
    startRotationRef.current = rotationAngle
    currentDragDeltaRef.current = 0
    hasMovedRef.current = false
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - startXRef.current
    if (Math.abs(deltaX) > 5) {
      hasMovedRef.current = true
    }
    currentDragDeltaRef.current = deltaX
    setRotationAngle(startRotationRef.current + deltaX * 0.28)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    const snapAngle = Math.round(rotationAngle / angleStep) * angleStep
    setRotationAngle(snapAngle)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      const snapAngle = Math.round(rotationAngle / angleStep) * angleStep
      setRotationAngle(snapAngle)
    }
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    startXRef.current = e.touches[0].clientX
    startYRef.current = e.touches[0].clientY
    startRotationRef.current = rotationAngle
    currentDragDeltaRef.current = 0
    hasMovedRef.current = false
    isTouchVerticalScrollRef.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const deltaX = currentX - startXRef.current
    const deltaY = currentY - startYRef.current

    if (isTouchVerticalScrollRef.current === null) {
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
        isTouchVerticalScrollRef.current = true
        setIsDragging(false)
        return
      } else if (Math.abs(deltaX) > 8) {
        isTouchVerticalScrollRef.current = false
      }
    }

    if (isTouchVerticalScrollRef.current === false) {
      if (Math.abs(deltaX) > 5) {
        hasMovedRef.current = true
      }
      currentDragDeltaRef.current = deltaX
      setRotationAngle(startRotationRef.current + deltaX * 0.35)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging && isTouchVerticalScrollRef.current) return
    setIsDragging(false)
    isTouchVerticalScrollRef.current = null
    const snapAngle = Math.round(rotationAngle / angleStep) * angleStep
    setRotationAngle(snapAngle)
  }

  // Handle card click
  const handleCardClick = (cardIndex: number, prop: PropertyItem, relAngle: number) => {
    if (hasMovedRef.current) return

    if (Math.abs(relAngle) < 10) {
      router.push(prop.href)
      return
    }

    const targetAngle = Math.round((rotationAngle + relAngle) / angleStep) * angleStep
    setRotationAngle(targetAngle)
  }

  const cylinderRadius = isMobile ? 290 : 490
  const angleTuning = isMobile ? 0.50 : 0.55

  return (
    <section
      id="portfolio"
      className="relative w-full bg-[#070E1C] py-20 sm:py-32 overflow-hidden select-none border-t border-white/[0.06]"
      aria-label="Our Portfolio in Perspective"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-400/10 via-[#0B1528]/40 to-transparent blur-3xl pointer-events-none" />

      {/* Architectural subtle background grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="container-content relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 px-3.5 py-1 rounded-full border border-sky-400/30 bg-sky-400/5 mb-5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.22em] uppercase text-[#7DD3FC]">
              Curated Architectural Showcase
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="heading-display text-display-lg sm:text-display-xl text-white mb-5 text-balance"
          >
            Our Portfolio in <em className="italic-serif text-sky-300">Perspective</em>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[#94A3B8] font-light text-base sm:text-lg leading-relaxed text-pretty"
          >
            A curated view of architecture, signature estates and sky residences that define elevated living.
          </motion.p>
        </div>

        {/* 3D Perspective Stage */}
        <div
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="relative w-full h-[500px] sm:h-[600px] lg:h-[650px] flex items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y"
          style={{
            perspective: isMobile ? '850px' : '1200px',
            perspectiveOrigin: 'center 46%',
          }}
        >
          {/* Cards Ring Container with 3D Preservation */}
          <div
            className="relative w-full h-full flex items-center justify-center pointer-events-none"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {properties.map((prop, i) => {
              const baseAngle = i * angleStep
              let relAngle = (baseAngle - rotationAngle) % 360
              if (relAngle > 180) relAngle -= 360
              if (relAngle < -180) relAngle += 360

              const isActive = Math.abs(relAngle) < 18
              const rad = (relAngle * Math.PI) / 180
              const tx = Math.sin(rad) * cylinderRadius
              const tz = Math.cos(rad) * cylinderRadius - cylinderRadius
              const ry = -relAngle * angleTuning

              const dist = Math.abs(relAngle)
              const cardScale = isMobile
                ? 1 - (dist / 180) * 0.16
                : 1 - (dist / 180) * 0.20
              const cardOpacity = Math.max(0.15, 1 - (dist / 180) * 0.70)
              const cardZIndex = Math.round(100 - dist)

              return (
                <div
                  key={prop.id}
                  onClick={() => handleCardClick(i, prop, relAngle)}
                  className="absolute pointer-events-auto cursor-pointer will-change-transform"
                  style={{
                    width: isMobile ? '280px' : '380px',
                    height: isMobile ? '390px' : '520px',
                    transform: `translate3d(${tx}px, 0px, ${tz}px) rotateY(${ry}deg) scale(${cardScale})`,
                    opacity: cardOpacity,
                    zIndex: cardZIndex,
                    transition: isDragging
                      ? 'none'
                      : 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease',
                  }}
                >
                  <div
                    className={cn(
                      'relative w-full h-full rounded-2xl overflow-hidden border transition-all duration-300 group',
                      isActive
                        ? 'border-sky-400/60 shadow-[0_20px_50px_rgba(56,189,248,0.25)]'
                        : 'border-white/10 hover:border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.5)]'
                    )}
                  >
                    <Image
                      src={prop.image}
                      alt={prop.name}
                      fill
                      priority={i < 3}
                      className={cn(
                        'object-cover transition-transform duration-700 ease-out',
                        isActive ? 'scale-100 group-hover:scale-105' : 'scale-100 filter brightness-[0.75]'
                      )}
                      sizes={isMobile ? '280px' : '380px'}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#040810] via-[#040810]/40 to-transparent" />

                    <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between z-10">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs uppercase tracking-widest text-sky-400 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                          {prop.city}, {prop.country}
                        </span>

                        {isActive && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-400/20 border border-sky-400/40 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                            <span className="font-mono text-[9px] uppercase tracking-widest text-[#7DD3FC] font-semibold">
                              Active
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="font-mono text-xs font-semibold tracking-[0.24em] text-white/90 uppercase mb-1">
                          {prop.cardLabel}
                        </div>

                        <h3 className="heading-display text-xl sm:text-2xl text-white font-serif leading-tight mb-2">
                          {prop.name}
                        </h3>

                        <p className="text-[#CBD5E1] text-xs font-light tracking-wide line-clamp-1 mb-4">
                          {prop.category} · {prop.area}
                        </p>

                        <div
                          className={cn(
                            'inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase transition-all duration-300',
                            isActive
                              ? 'text-sky-300 translate-x-0 opacity-100'
                              : 'text-white/50 -translate-x-1 opacity-70 group-hover:opacity-100'
                          )}
                        >
                          <span>{isActive ? 'Explore Property' : 'Focus Residence'}</span>
                          <ArrowUpRight
                            size={14}
                            className={cn(
                              'transition-transform duration-300',
                              isActive ? 'translate-x-0.5 -translate-y-0.5' : ''
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Gallery Controls & Instructions */}
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/[0.08] pt-8">
          <div className="text-center sm:text-left">
            <span className="font-mono text-[11px] tracking-[0.2em] text-[#7DD3FC] uppercase block mb-1">
              Currently Selected
            </span>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <span className="text-lg font-serif text-white">
                {activeProperty.name}
              </span>
              <span className="text-white/30">|</span>
              <span className="text-xs font-mono text-[#94A3B8]">
                {activeProperty.country} · {activeProperty.price}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={rotatePrev}
              aria-label="Previous property"
              className="w-10 h-10 rounded-full border border-white/10 hover:border-sky-400 bg-black/40 hover:bg-sky-400/10 text-white/70 hover:text-sky-300 flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs tracking-[0.28em] text-[#7DD3FC] uppercase font-medium px-4 py-2 rounded-full border border-sky-400/20 bg-black/30 backdrop-blur-sm">
              <span className="opacity-60">←</span>
              <span>DRAG TO ROTATE</span>
              <span className="opacity-60">→</span>
            </div>

            <button
              onClick={rotateNext}
              aria-label="Next property"
              className="w-10 h-10 rounded-full border border-white/10 hover:border-sky-400 bg-black/40 hover:bg-sky-400/10 text-white/70 hover:text-sky-300 flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono text-xs text-white/40 tracking-widest">
              <span className="text-sky-400 font-semibold">
                {String(activeIndex + 1).padStart(2, '0')}
              </span>
              <span className="mx-1">/</span>
              <span>{String(total).padStart(2, '0')}</span>
            </div>

            <Link
              href={activeProperty.href}
              className="px-5 py-2.5 rounded-full bg-white text-[#040810] hover:bg-sky-200 text-xs font-mono tracking-widest uppercase font-semibold inline-flex items-center gap-2 transition-all"
            >
              <span>View Details</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
