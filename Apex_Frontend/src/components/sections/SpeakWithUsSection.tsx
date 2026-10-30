'use client'

import React from 'react'
import { ArrowUpRight } from 'lucide-react'

export function SpeakWithUsSection() {
  const handleOpenContact = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-contact'))
    }
  }

  return (
    <section
      id="speak-with-us"
      className="relative w-full py-24 sm:py-32 bg-[#040810] text-[#F8FAFC] border-t border-white/10 overflow-hidden select-none"
      aria-label="Speak With Us"
    >
      {/* Ambient radial illumination */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[500px] pointer-events-none opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.22) 0%, transparent 68%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-12 text-center flex flex-col items-center">
        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
          <span className="w-8 h-px bg-sky-400/60" />
          <span className="font-mono text-xs sm:text-sm tracking-[0.32em] uppercase text-[#7DD3FC] font-medium">
            PRIVATE ADVISORY
          </span>
          <span className="w-8 h-px bg-sky-400/60" />
        </div>

        {/* Main Title */}
        <h2
          className="heading-display font-light text-white tracking-tight leading-[1.08] mb-4 sm:mb-6 text-balance"
          style={{ fontSize: 'clamp(2.3rem, 5.2vw, 4.4rem)' }}
        >
          Begin your <em className="italic text-sky-200">conversation</em>
        </h2>

        {/* Description */}
        <p className="font-sans text-xs sm:text-base md:text-lg text-[#94A3B8] font-light max-w-xl mx-auto leading-relaxed text-pretty mb-8 sm:mb-10">
          Our senior partners advise private clients and family offices on prime residential acquisitions across the Gulf, Southeast Asia, and Australasia.
        </p>

        {/* Click-to-open “Speak With Us” Button */}
        <button
          type="button"
          onClick={handleOpenContact}
          className="inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-4.5 rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-[#040810] font-sans font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_4px_30px_rgba(56,189,248,0.3)] hover:shadow-[0_4px_40px_rgba(56,189,248,0.5)] active:scale-98 cursor-pointer"
        >
          <span>Speak With Us</span>
          <ArrowUpRight size={16} />
        </button>

        <span className="font-mono text-[10px] tracking-[0.22em] text-[#64748B] uppercase mt-4">
          CONFIDENTIAL · INVITATION ONLY
        </span>
      </div>
    </section>
  )
}
