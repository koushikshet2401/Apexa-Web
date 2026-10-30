'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface LoadingScreenProps {
  onStartReveal?: () => void
  onComplete: () => void
}

export function LoadingScreen({ onStartReveal, onComplete }: LoadingScreenProps) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1200)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth)
      const handleResize = () => setWindowWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    // 1. Display big Apex Pacific Holdings text in center for 2 seconds
    const timer = setTimeout(() => {
      // 2. Begin transition: text glides up to top-left, background begins fading to reveal video
      setIsAnimatingOut(true)
      onStartReveal?.()

      // 3. Complete transition after animation settles into header position
      const finishTimer = setTimeout(() => {
        setIsDone(true)
        onComplete()
      }, 1100)

      return () => clearTimeout(finishTimer)
    }, 2000)

    return () => clearTimeout(timer)
  }, [onStartReveal, onComplete])

  if (isDone) return null

  const isDesktop = windowWidth >= 1024
  // Target position matches the top-left navigation brand placement
  const targetTop = isDesktop ? 40 : 32
  const targetLeft = isDesktop ? 48 : 24
  const targetScale = isDesktop ? 0.34 : 0.40

  return (
    <div
      className="fixed inset-0 z-[99999] pointer-events-none select-none overflow-hidden"
      style={{
        backgroundColor: isAnimatingOut ? 'transparent' : '#171411',
        transition: 'background-color 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-label="Apex Pacific Holdings Introduction"
    >
      {/* Background dark veil that smoothly clears away */}
      <motion.div
        className="absolute inset-0 bg-[#171411]"
        initial={{ opacity: 1 }}
        animate={{ opacity: isAnimatingOut ? 0 : 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* The Brand Title that glides from center of screen to top-left as header title */}
      <motion.div
        className="absolute flex flex-col leading-none"
        style={{
          transformOrigin: 'top left',
        }}
        initial={{
          top: '50%',
          left: '50%',
          x: '-50%',
          y: '-50%',
          scale: 1,
        }}
        animate={
          isAnimatingOut
            ? {
                top: `${targetTop}px`,
                left: `${targetLeft}px`,
                x: '0%',
                y: '-50%',
                scale: targetScale,
              }
            : {
                top: '50%',
                left: '50%',
                x: '-50%',
                y: '-50%',
                scale: 1,
              }
        }
        transition={{
          duration: 1.05,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <span
          className="font-serif font-light text-[var(--diamond-off)] tracking-[0.24em] text-4xl sm:text-6xl lg:text-7xl mb-2 sm:mb-3"
          style={{ letterSpacing: '0.24em' }}
        >
          APEX
        </span>
        <span
          className="font-sans font-light tracking-[0.38em] text-[var(--steelblue)] text-xs sm:text-sm lg:text-base uppercase opacity-90"
          style={{ letterSpacing: '0.38em' }}
        >
          GLOBAL ESTATES
        </span>
      </motion.div>
    </div>
  )
}
