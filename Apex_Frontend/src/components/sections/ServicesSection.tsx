'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, ArrowLeft, ArrowRight } from 'lucide-react'
import { SERVICES, ServiceItem } from '@/data/services'
import { cn } from '@/lib/utils'

// Architectural line emblems for each service category
function ServiceCardIcon({ type }: { type: ServiceItem['iconType'] }) {
  if (type === 'villa') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-[#7DD3FC]">
        <path d="M3 22L14 6L25 22H3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M10 22V15H18V22" stroke="currentColor" strokeWidth="1.2" />
        <line x1="6" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
  if (type === 'sky') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-[#7DD3FC]">
        <rect x="8" y="5" width="12" height="18" stroke="currentColor" strokeWidth="1.2" />
        <line x1="5" y1="23" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" />
        <line x1="11" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1" />
        <line x1="11" y1="13" x2="17" y2="13" stroke="currentColor" strokeWidth="1" />
        <line x1="11" y1="17" x2="17" y2="17" stroke="currentColor" strokeWidth="1" />
      </svg>
    )
  }
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-[#7DD3FC]">
      <path d="M4 23V8L14 3L24 8V23H4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="3" y1="23" x2="25" y2="23" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="11" width="3" height="3" stroke="currentColor" strokeWidth="1" />
      <rect x="16" y="11" width="3" height="3" stroke="currentColor" strokeWidth="1" />
      <rect x="9" y="16" width="3" height="3" stroke="currentColor" strokeWidth="1" />
      <rect x="16" y="16" width="3" height="3" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

export function ServicesSection() {
  const [isMobile, setIsMobile] = useState(false)
  const [mobileIndex, setMobileIndex] = useState(0)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handlePrev = useCallback(() => {
    setMobileIndex((prev) => (prev > 0 ? prev - 1 : SERVICES.length - 1))
  }, [])

  const handleNext = useCallback(() => {
    setMobileIndex((prev) => (prev < SERVICES.length - 1 ? prev + 1 : 0))
  }, [])

  return (
    <section
      id="services"
      className="relative w-full overflow-hidden bg-[#040810] text-[#F8FAFC] py-20 sm:py-28 lg:py-36 border-t border-white/[0.06]"
      aria-label="Apex What We Do — Core Practice"
    >
      {/* Background ambient steel-blue glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] rounded-full opacity-20 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.25) 0%, #070E1C 70%, transparent 100%)' }}
        />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section Header */}
        <div className="flex items-center gap-4 mb-12 sm:mb-16">
          <div className="w-8 h-px bg-sky-400" />
          <span className="font-mono text-xs uppercase tracking-[0.28em] text-[#7DD3FC] font-medium">
            WHAT WE DO · INTEGRATED PRACTICE
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-14 sm:mb-20">
          <motion.h2
            className="font-serif font-light text-white tracking-tight leading-[0.96]"
            style={{ fontSize: 'clamp(2.4rem, 4.8vw, 4.4rem)' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            One team,{' '}
            <em className="italic font-serif text-sky-200">
              end to end
            </em>
          </motion.h2>

          <motion.p
            className="font-sans text-[#94A3B8] text-sm sm:text-base font-light leading-relaxed lg:pt-4 text-pretty"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            Development, architectural engineering, and landmark property delivery united under a single disciplined studio, ensuring uncompromised execution from conception through handover.
          </motion.p>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            DESKTOP LAYOUT (>= 768px): 3-Card Architectural Grid
           ════════════════════════════════════════════════════════════════ */}
        <div className="hidden md:grid grid-cols-3 gap-6 lg:gap-8">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={service.route}
                className="group relative block h-full rounded-2xl p-8 bg-[#070E1C] border border-white/10 hover:border-sky-400/50 transition-all duration-500 overflow-hidden shadow-lg hover:shadow-[0_20px_45px_rgba(0,0,0,0.85),0_0_20px_rgba(56,189,248,0.15)] hover:-translate-y-1"
                aria-label={`Explore ${service.title}`}
              >
                {/* Background Architectural Photo on Hover Reveal */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 ease-out pointer-events-none">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070E1C] via-[#070E1C]/60 to-transparent" />
                </div>

                {/* Top Bar: Service Number & Custom Emblem + Circular Arrow */}
                <div className="relative z-10 flex items-start justify-between mb-8 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-[#7DD3FC] tracking-widest">
                      {service.number}
                    </span>
                    <span className="w-4 h-px bg-white/20" />
                    <ServiceCardIcon type={service.iconType} />
                  </div>

                  <div className="w-10 h-10 rounded-full border border-sky-400/40 group-hover:border-sky-400 flex items-center justify-center text-sky-400 group-hover:bg-sky-400 group-hover:text-[#040810] transition-all duration-300">
                    <ArrowUpRight
                      size={17}
                      strokeWidth={1.8}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                </div>

                {/* Service Heading & Subtitle */}
                <div className="relative z-10 mb-4">
                  <span className="font-sans text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-sky-400/80 block mb-1.5 font-medium">
                    {service.subtitle}
                  </span>
                  <h3 className="font-serif text-2xl text-white font-light tracking-tight group-hover:text-sky-200 transition-colors duration-300">
                    {service.title}
                  </h3>
                </div>

                {/* Service Description */}
                <p className="relative z-10 font-sans text-xs sm:text-[13px] text-[#94A3B8] leading-relaxed font-light mb-8 line-clamp-3">
                  {service.description}
                </p>

                {/* Bottom Architectural Focus Pills */}
                <div className="relative z-10 flex flex-wrap gap-2 pt-4 border-t border-white/10">
                  {service.architecturalFocus.slice(0, 2).map((focus, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-sans uppercase tracking-[0.14em] px-2.5 py-1 rounded-full bg-sky-400/10 text-sky-300 border border-sky-400/20 truncate"
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            MOBILE CAROUSEL (< 768px)
           ════════════════════════════════════════════════════════════════ */}
        <div className="md:hidden">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={SERVICES[mobileIndex].id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
              >
                <Link
                  href={SERVICES[mobileIndex].route}
                  className="block rounded-2xl p-7 bg-[#070E1C] border border-white/10"
                >
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                    <span className="font-mono text-xs text-[#7DD3FC]">
                      {SERVICES[mobileIndex].number}
                    </span>
                    <ServiceCardIcon type={SERVICES[mobileIndex].iconType} />
                  </div>

                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#94A3B8] block mb-1">
                    {SERVICES[mobileIndex].subtitle}
                  </span>
                  <h3 className="font-serif text-2xl text-white font-light mb-3">
                    {SERVICES[mobileIndex].title}
                  </h3>
                  <p className="font-sans text-xs text-[#CBD5E1] font-light leading-relaxed mb-6">
                    {SERVICES[mobileIndex].description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono text-sky-400">
                    <span>EXPLORE PRACTICE</span>
                    <ArrowUpRight size={14} />
                  </div>
                </Link>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-1.5">
                {SERVICES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMobileIndex(idx)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      mobileIndex === idx ? 'w-6 bg-sky-400' : 'w-2 bg-white/20'
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white"
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  onClick={handleNext}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
