'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown, ArrowUp } from 'lucide-react'

export function ScrollCornerNavigator() {
  const [isAtTop, setIsAtTop] = useState(true)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0

      setScrollProgress(progress)
      setIsAtTop(scrollY < 260)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Also sync with Lenis if available
    const lenis = (window as unknown as { __lenis?: { on: (event: string, cb: () => void) => void } }).__lenis
    if (lenis) {
      lenis.on('scroll', handleScroll)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleClick = () => {
    const lenis = (window as unknown as { __lenis?: { scrollTo: (target: number | string, opts?: { duration?: number }) => void } }).__lenis

    if (isAtTop) {
      // From top: smoothly scroll down into New Launches
      const target = window.innerHeight * 1.5
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.2 })
      } else {
        window.scrollTo({ top: target, behavior: 'smooth' })
      }
    } else {
      // From bottom: directly scroll back to homepage top
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.4 })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  // Circular progress calculations for the ring around the button (radius 20)
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - scrollProgress * circumference

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] sm:bottom-8 right-4 sm:right-8 z-40 pointer-events-auto">
      <motion.button
        type="button"
        onClick={handleClick}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label={isAtTop ? 'Scroll down into launches' : 'Back to homepage top'}
        className="relative group w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#071426]/85 hover:bg-[#0A1B32] border border-white/20 hover:border-sky-400 text-white hover:text-sky-300 backdrop-blur-xl flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.65)] hover:shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-colors duration-300 cursor-pointer select-none"
      >
        {/* Subtle SVG Scroll Progress Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"
          viewBox="0 0 48 48"
        >
          {/* Base track */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="2"
          />
          {/* Active progress fill */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-150"
          />
        </svg>

        {/* Dynamic Center Icon: Down Arrow (when at top) / Up Arrow (when scrolled) */}
        <AnimatePresence mode="wait">
          {isAtTop ? (
            <motion.div
              key="scroll-down"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex items-center justify-center animate-bounce"
              style={{ animationDuration: '2s' }}
            >
              <ArrowDown size={17} strokeWidth={2.2} />
            </motion.div>
          ) : (
            <motion.div
              key="scroll-top"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex items-center justify-center"
            >
              <ArrowUp size={17} strokeWidth={2.2} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Tooltip Pill on Desktop Hover */}
        <span className="hidden sm:inline-block absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-[#071426]/90 border border-white/15 text-[10px] font-mono tracking-widest uppercase text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
          {isAtTop ? 'EXPLORE' : 'TOP'}
        </span>
      </motion.button>
    </div>
  )
}
