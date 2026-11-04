'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/components/providers/ThemeProvider'
import { cn } from '@/lib/utils'

export function NewLaunchesIntroSection() {
  const { isLight } = useTheme()

  return (
    <section
      id="new-launches-intro"
      className={cn(
        "relative w-full flex items-center justify-center py-14 sm:py-24 px-6 sm:px-12 overflow-hidden border-b transition-colors duration-300",
        isLight
          ? "bg-[#FBF9F6] text-[#0B1325] border-[#0B1325]/10"
          : "bg-[#040810] text-[#F8FAFC] border-white/[0.06]"
      )}
      aria-label="New Launches Introduction"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background: isLight
            ? 'radial-gradient(ellipse at 50% 50%, rgba(11, 19, 37, 0.04) 0%, transparent 65%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.18) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Eyebrow badge inspired by Emaar */}
        <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
          <span className={cn("w-8 h-px transition-colors", isLight ? "bg-[#0B1325]/30" : "bg-sky-400/60")} />
          <span className={cn(
            "font-mono text-xs sm:text-sm tracking-[0.32em] uppercase font-medium transition-colors",
            isLight ? "text-[#6B6661]" : "text-[#7DD3FC]"
          )}>
            NEW LAUNCHES
          </span>
          <span className={cn("w-8 h-px transition-colors", isLight ? "bg-[#0B1325]/30" : "bg-sky-400/60")} />
        </div>

        {/* Cinematic Heading */}
        <h2
          className={cn(
            "heading-display font-light tracking-tight leading-[1.08] mb-4 sm:mb-6 text-balance transition-colors",
            isLight ? "text-[#0B1325]" : "text-white"
          )}
          style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4.4rem)' }}
        >
          Unveil the Latest in <span className={isLight ? "text-[#1D263B] font-normal" : "text-sky-200"}>Exceptional Living</span>
        </h2>

        {/* Supporting Text */}
        <p className={cn(
          "font-sans text-xs sm:text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed text-pretty mb-8 sm:mb-12 transition-colors",
          isLight ? "text-[#6B6661]" : "text-[#94A3B8]"
        )}>
          Discover exceptional properties across our international portfolio, each selected for its location, design and long-term potential.
        </p>

        {/* Subtle Scroll to explore indicator with vertical line */}
        <div className={cn(
          "flex flex-col items-center justify-center gap-2.5 text-[10px] font-mono tracking-[0.25em] uppercase transition-colors",
          isLight ? "text-[#6B6661]" : "text-[#64748B]"
        )}>
          <span>SCROLL TO EXPLORE</span>
          <div className={cn(
            "w-px h-8 sm:h-10 animate-pulse transition-colors",
            isLight ? "bg-gradient-to-b from-[#0B1325]/40 to-transparent" : "bg-gradient-to-b from-sky-400 to-transparent"
          )} />
        </div>
      </div>
    </section>
  )
}
