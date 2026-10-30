'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

interface GoldLetterA3DProps {
  modelPath?: string
  className?: string
}

export function GoldLetterA3D({
  modelPath = '/models/apex-gold-a.glb',
  className = '',
}: GoldLetterA3DProps) {
  const shouldReduceMotion = useReducedMotion()
  const [modelAvailable, setModelAvailable] = useState<boolean | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    fetch(modelPath, { method: 'HEAD' })
      .then((res) => {
        if (active) setModelAvailable(res.ok && res.status !== 404)
      })
      .catch(() => {
        if (active) setModelAvailable(false)
      })
    return () => {
      active = false
    }
  }, [modelPath])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const rotateY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [-18, 22])
  const rotateX = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [8, -6])
  const translateY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [-20, 20])

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
      style={{ perspective: '1200px' }}
    >
      <motion.div
        className="w-full h-full flex items-center justify-center will-change-transform"
        style={{
          rotateY,
          rotateX,
          y: translateY,
          transformStyle: 'preserve-3d',
        }}
      >
        <svg
          viewBox="0 0 600 750"
          className="w-full h-full max-w-[520px] max-h-[640px] opacity-[0.09] lg:opacity-[0.14]"
          fill="none"
        >
          <defs>
            <linearGradient id="steelGold3D" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="25%" stopColor="#A5C8E4" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#89CFF0" stopOpacity="0.55" />
              <stop offset="75%" stopColor="#4A607A" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="steelDepth" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4A607A" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#1A1F27" stopOpacity="0.2" />
            </linearGradient>

            <filter id="steelAura" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M 292,82 L 322,82 L 532,582 L 442,582 L 388,432 L 222,432 L 168,582 L 78,582 Z"
            fill="none"
            stroke="url(#steelDepth)"
            strokeWidth="1.2"
            transform="translate(18, 14)"
            opacity="0.6"
          />

          <g filter="url(#steelAura)">
            <path
              d="M 292,72 L 322,72 L 532,572 L 442,572 L 388,422 L 222,422 L 168,572 L 78,572 Z"
              fill="none"
              stroke="url(#steelGold3D)"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M 307,192 L 368,362 L 246,362 Z"
              fill="none"
              stroke="url(#steelGold3D)"
              strokeWidth="1.6"
              strokeLinejoin="round"
              opacity="0.8"
            />
          </g>

          <line
            x1="40"
            y1="422"
            x2="560"
            y2="422"
            stroke="url(#steelGold3D)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
            opacity="0.3"
          />
        </svg>
      </motion.div>
    </div>
  )
}
