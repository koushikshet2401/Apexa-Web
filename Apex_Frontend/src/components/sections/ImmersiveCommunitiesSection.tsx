'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, MapPin, Building2, ChevronRight } from 'lucide-react'
import { DESTINATIONS, Destination } from '@/data/destinations'
import { cn } from '@/lib/utils'

export function ImmersiveCommunitiesSection() {
  const [activeSlug, setActiveSlug] = useState<string>(DESTINATIONS[0].slug)

  const activeCommunity = DESTINATIONS.find((d) => d.slug === activeSlug) || DESTINATIONS[0]

  return (
    <section
      id="communities"
      className="relative w-full py-24 sm:py-32 bg-[#040810] text-white border-b border-white/[0.06] overflow-hidden"
      aria-label="Apex Pacific Holdings Global Communities"
    >
      {/* Background ambient steel-blue glow */}
      <div className="absolute top-0 right-1/4 w-[700px] h-[500px] bg-sky-500/[0.06] blur-[160px] pointer-events-none" />

      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16 pb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-px bg-sky-400" />
              <span className="font-mono text-xs tracking-[0.26em] uppercase text-[#7DD3FC] font-medium">
                GLOBAL COMMUNITIES &amp; DESTINATIONS
              </span>
            </div>
            <h2 className="heading-display text-3xl sm:text-5xl lg:text-6xl text-white font-light tracking-tight">
              Masterplanned Horizons
            </h2>
          </div>

          <p className="max-w-md font-sans text-xs sm:text-sm text-[#94A3B8] font-light leading-relaxed">
            From Gulf waterfronts and Mediterranean promontories to lush tropical sanctuaries and mountain retreats across five sovereign territories.
          </p>
        </div>

        {/* Community Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-10">
          {DESTINATIONS.map((dest) => (
            <button
              key={dest.slug}
              type="button"
              onClick={() => setActiveSlug(dest.slug)}
              className={cn(
                'px-4 sm:px-6 py-2.5 rounded-full text-xs font-mono tracking-widest uppercase transition-all duration-300 cursor-pointer',
                activeSlug === dest.slug
                  ? 'bg-white text-[#040810] font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                  : 'bg-[#0B1528] text-[#94A3B8] hover:text-white border border-white/10 hover:border-white/20'
              )}
            >
              {dest.country}
            </button>
          ))}
        </div>

        {/* Active Community Feature Showcase */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCommunity.slug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch"
          >
            {/* Left Column: Visual Card */}
            <div className="lg:col-span-7 relative min-h-[400px] sm:min-h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
              <Image
                src={activeCommunity.image}
                alt={activeCommunity.country}
                fill
                priority
                className="object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#040810] via-[#040810]/40 to-transparent" />

              <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 z-10">
                <span className="font-mono text-xs tracking-widest uppercase text-[#7DD3FC] block mb-1">
                  {activeCommunity.region}
                </span>
                <h3 className="font-serif text-3xl sm:text-5xl font-light text-white mb-2">
                  {activeCommunity.country}
                </h3>
                <p className="font-mono text-xs tracking-wider text-[#CBD5E1] mb-4">
                  {activeCommunity.cities}
                </p>
                <p className="font-sans text-xs sm:text-sm text-[#94A3B8] font-light max-w-xl leading-relaxed mb-6">
                  {activeCommunity.description}
                </p>

                <Link
                  href={activeCommunity.route}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-sky-400 hover:bg-sky-300 text-[#040810] text-xs font-mono tracking-widest uppercase font-semibold transition-colors shadow-lg"
                >
                  <span>Explore Destination</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right Column: Verified Projects in this Community */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-white/10 bg-[#070E1C] p-6 sm:p-8 backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                  <span className="font-mono text-xs tracking-[0.2em] text-[#7DD3FC] uppercase">
                    FEATURED PROJECTS
                  </span>
                  <span className="font-mono text-xs text-[#64748B]">
                    {activeCommunity.projects.length} DEVELOPMENTS
                  </span>
                </div>

                <div className="space-y-4">
                  {activeCommunity.projects.map((proj) => (
                    <Link
                      key={proj.id}
                      href={`/properties/${proj.slug}`}
                      className="group flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-[#0B1528]/80 hover:bg-[#0F1D36] hover:border-sky-400/40 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
                          <Image
                            src={proj.image}
                            alt={proj.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="60px"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-serif text-lg text-white group-hover:text-sky-300 transition-colors truncate">
                            {proj.title}
                          </h4>
                          <p className="font-sans text-xs text-[#94A3B8] truncate">
                            {proj.type} &nbsp;·&nbsp; {proj.city}
                          </p>
                          <span className="font-mono text-[11px] text-[#64748B]">
                            {proj.beds}
                          </span>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full border border-white/10 group-hover:border-sky-400 flex items-center justify-center text-[#94A3B8] group-hover:text-sky-300 shrink-0 ml-3 transition-colors">
                        <ChevronRight size={15} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="font-mono text-xs text-[#94A3B8]">
                  All Freehold &amp; Private Titles
                </span>
                <Link
                  href="/properties"
                  className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wider uppercase text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <span>View All Listings</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

