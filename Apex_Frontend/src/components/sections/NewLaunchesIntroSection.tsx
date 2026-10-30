'use client'

import { motion } from 'framer-motion'

export function NewLaunchesIntroSection() {
  return (
    <section
      id="new-launches-intro"
      className="relative w-full bg-[#040810] text-[#F8FAFC] flex items-center justify-center py-14 sm:py-24 px-6 sm:px-12 overflow-hidden border-b border-white/[0.06]"
      aria-label="New Launches Introduction"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.18) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Eyebrow badge inspired by Emaar */}
        <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
          <span className="w-8 h-px bg-sky-400/60" />
          <span className="font-mono text-xs sm:text-sm tracking-[0.32em] uppercase text-[#7DD3FC] font-medium">
            NEW LAUNCHES
          </span>
          <span className="w-8 h-px bg-sky-400/60" />
        </div>

        {/* Cinematic Heading */}
        <h2
          className="heading-display font-light text-white tracking-tight leading-[1.08] mb-4 sm:mb-6 text-balance"
          style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4.4rem)' }}
        >
          Unveil the Latest in <em className="italic text-sky-200">Exceptional Living</em>
        </h2>

        {/* Supporting Text */}
        <p className="font-sans text-xs sm:text-base md:text-lg text-[#94A3B8] font-light max-w-2xl mx-auto leading-relaxed text-pretty mb-8 sm:mb-12">
          Discover exceptional properties across our international portfolio, each selected for its location, design and long-term potential.
        </p>

        {/* Subtle Scroll to explore indicator with vertical line */}
        <div className="flex flex-col items-center justify-center gap-2.5 text-[10px] font-mono tracking-[0.25em] text-[#64748B] uppercase">
          <span>SCROLL TO EXPLORE</span>
          <div className="w-px h-8 sm:h-10 bg-gradient-to-b from-sky-400 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  )
}
