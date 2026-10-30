'use client'

import { motion } from 'framer-motion'

export function EditorialQuoteSection() {
  return (
    <section
      className="relative w-full py-24 sm:py-32 bg-[#070E1C] text-white border-y border-white/[0.06] overflow-hidden select-none"
      aria-label="Apex Pacific Holdings Editorial Philosophy"
    >
      {/* Subtle deep steel-blue radial background illumination */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-12 text-center">
        {/* Subtle decorative emblem */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="w-10 h-px bg-sky-400/50" />
          <span className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#7DD3FC]">
            ARCHITECTURAL PHILOSOPHY
          </span>
          <span className="w-10 h-px bg-sky-400/50" />
        </div>

        {/* Refined editorial quote */}
        <blockquote className="font-serif italic text-2xl sm:text-4xl lg:text-5xl font-light text-[#F8FAFC] leading-[1.25] text-balance mb-8">
          &ldquo;Architecture is not merely the enclosure of space, but the thoughtful orchestration of light, materiality, and enduring legacy.&rdquo;
        </blockquote>

        <div className="flex flex-col items-center">
          <cite className="not-italic font-mono text-xs tracking-[0.22em] uppercase text-[#94A3B8]">
            APEX PACIFIC HOLDINGS · EDITORIAL DOSSIER
          </cite>
          <span className="text-[10px] font-mono tracking-widest text-[#64748B] mt-1 uppercase">
            Curated Living Across Global Horizons
          </span>
        </div>
      </div>
    </section>
  )
}

