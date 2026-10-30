'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ArrowRight, ChevronDown, Sparkles, Filter } from 'lucide-react'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { FeaturedVideoStackingSection } from '@/components/sections/FeaturedVideoStackingSection'
import { cn } from '@/lib/utils'

type Property = {
  id: string
  slug: string
  name: string
  type: string
  country: string
  city: string
  beds: number
  status: string
  layoutVariant: number
  image: string
  shortDescription: string
}

const COUNTRIES = ['All', 'UAE', 'Thailand', 'Malaysia', 'Australia', 'Georgia']
const TYPES = ['All', 'residential', 'commercial', 'mixed_use']
const TYPE_LABELS: Record<string, string> = {
  All: 'All Categories',
  residential: 'Residential',
  commercial: 'Commercial Properties',
  mixed_use: 'Mixed Use Landmarks',
}

export function PropertiesClient({ properties }: { properties: Property[] }) {
  const [country, setCountry] = useState('All')
  const [type, setType] = useState('All')

  // Filtered complete inventory
  const filtered = useMemo(
    () =>
      properties.filter((p) => {
        if (country !== 'All' && p.country !== country) return false
        if (type !== 'All') {
          if (type === 'commercial' && (p.type === 'commercial' || p.type === 'mixed_use')) {
            return true
          }
          if (p.type !== type) return false
        }
        return true
      }),
    [properties, country, type]
  )

  const scrollToInventory = () => {
    const el = document.getElementById('all-launches-inventory')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#040810] text-[#F8FAFC]">
        {/* ════════════════════════════════════════════════════════════════
            1. CINEMATIC LAUNCHES INTRODUCTION
            Inspired directly by Emaar's reference
           ════════════════════════════════════════════════════════════════ */}
        <section className="relative w-full min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center pt-28 pb-16 px-6 sm:px-12 text-center border-b border-white/[0.06] overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.20) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto">
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="w-8 h-px bg-sky-400" />
              <span className="font-mono text-xs tracking-[0.32em] uppercase text-[#7DD3FC] font-medium">
                NEW LAUNCHES
              </span>
              <span className="w-8 h-px bg-sky-400" />
            </div>

            {/* Exact Required Heading */}
            <h1 className="heading-display text-4xl sm:text-6xl lg:text-7xl text-white font-light tracking-tight leading-[1.05] mb-6 text-balance">
              Unveil the Latest in <em className="italic text-sky-200">Exceptional Living</em>
            </h1>

            {/* Supporting Text */}
            <p className="font-sans text-sm sm:text-lg text-[#94A3B8] font-light max-w-2xl mx-auto leading-relaxed text-pretty mb-12">
              Discover exceptional properties across our international portfolio, each selected for its location, design and long-term potential.
            </p>

            {/* Scroll Indicator button */}
            <button
              onClick={scrollToInventory}
              className="inline-flex flex-col items-center gap-3 text-white/70 hover:text-white transition-colors group cursor-pointer"
            >
              <span className="font-mono text-[11px] tracking-[0.28em] uppercase text-[#7DD3FC]">
                SCROLL TO EXPLORE
              </span>
              <div className="w-px h-8 bg-gradient-to-b from-sky-400 to-transparent group-hover:h-12 transition-all duration-300" />
            </button>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            2. PINNED, SCROLL-SCRUBBED VIDEO STACKING TRANSITION (3 LAUNCHES)
           ════════════════════════════════════════════════════════════════ */}
        <FeaturedVideoStackingSection />

        {/* ════════════════════════════════════════════════════════════════
            3. "EXPLORE ALL LAUNCHES" FULL INVENTORY & REFINED FILTERING
           ════════════════════════════════════════════════════════════════ */}
        <section
          id="all-launches-inventory"
          className="relative py-24 sm:py-32 px-6 sm:px-12 md:px-16 border-t border-white/[0.08]"
        >
          <div className="max-w-[1500px] mx-auto">
            {/* Header with Title and verified count */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
              <div>
                <span className="font-mono text-xs tracking-[0.28em] uppercase text-[#7DD3FC] block mb-2">
                  EXPLORE ALL LAUNCHES
                </span>
                <h2 className="heading-display text-3xl sm:text-5xl font-light text-white">
                  The Complete Collection
                </h2>
              </div>
              <p className="font-mono text-xs text-[#94A3B8] tracking-widest uppercase">
                SHOWING {filtered.length} OF {properties.length} VERIFIED PROPERTIES
              </p>
            </div>

            {/* Filters Bar: Category chips & Country tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 rounded-2xl bg-[#070E1C] border border-white/10 mb-12 shadow-xl">
              {/* Category Chips */}
              <div className="flex flex-wrap items-center gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer',
                      type === t
                        ? 'bg-sky-400 text-[#040810] font-semibold shadow-md'
                        : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                    )}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              {/* Territory Filter Dropdown / Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-widest pl-2">
                  TERRITORY:
                </span>
                {COUNTRIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCountry(c)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 whitespace-nowrap cursor-pointer',
                      country === c
                        ? 'bg-white/15 text-[#7DD3FC] border border-sky-400/40'
                        : 'text-[#94A3B8] hover:text-white'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Grid of Properties */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.slug}`}
                  className="group flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[#070E1C] hover:border-sky-400/50 transition-all duration-500 shadow-lg hover:shadow-[0_15px_35px_rgba(56,189,248,0.12)] hover:-translate-y-1"
                >
                  {/* Card Image */}
                  <div className="relative h-[280px] w-full overflow-hidden bg-black/40">
                    <Image
                      src={property.image}
                      alt={property.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070E1C] via-transparent to-transparent pointer-events-none" />

                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase bg-black/60 backdrop-blur-md text-white border border-white/15">
                        {property.country}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase bg-sky-950/80 text-sky-300 border border-sky-400/30">
                        {property.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                      <span className="font-mono text-[10px] tracking-widest uppercase text-sky-400/80 block mb-1">
                        {TYPE_LABELS[property.type] || property.type}
                      </span>
                      <h3 className="font-display text-2xl font-light text-white mb-2 group-hover:text-sky-200 transition-colors">
                        {property.name}
                      </h3>
                      <p className="font-sans text-xs text-[#94A3B8] font-light line-clamp-2 mb-6 leading-relaxed">
                        {property.shortDescription}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs text-[#64748B]">
                      <span>{property.beds} Bedrooms · {property.city}</span>
                      <span className="text-sky-300 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        View <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                <p className="text-[#94A3B8] font-mono text-sm">No properties match the selected criteria.</p>
                <button
                  onClick={() => {
                    setCountry('All')
                    setType('All')
                  }}
                  className="mt-4 px-6 py-2 rounded-full bg-white/10 text-xs font-mono text-white hover:bg-white/20 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
