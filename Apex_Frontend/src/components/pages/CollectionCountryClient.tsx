'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowDown, ArrowUpRight, Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'

export interface CountryData {
  id: string
  slug: string
  name: string
  displayName?: string
  region?: string
  cities?: string
  tagline?: string
  description?: string
  heroVideoUrl?: string
  heroVideoThumb?: string
  cardImage?: string
}

export interface CountryProjectData {
  id: string
  slug: string
  title: string
  type: string
  city: string
  beds: string
  price?: string
  image: string
}

interface CollectionCountryClientProps {
  country: CountryData
  projects: CountryProjectData[]
}

export function CollectionCountryClient({ country, projects }: CollectionCountryClientProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setIsMuted(videoRef.current.muted)
  }

  // Fallback video if country video is missing
  const videoSrc = country.heroVideoUrl || '/videos/luxury-palm-beach.mp4'

  return (
    <div className="relative bg-[#040810] text-[#F8FAFC] selection:bg-[#7DD3FC]/20 selection:text-white">
      {/* Top Fixed Navigation */}
      <Navigation />

      {/* =========================================================================
          SECTION 1: PINNED COUNTRY PRESENTATION SECTION
          - Occupies entire viewport & remains pinned in place (sticky top-0)
          - Contains:
              1. Back to collection pill
              2. Region indicator
              3. Country name & cities
              4. Curated editorial paragraph
              5. High-definition country collection video
          - Smoothly overlaid by Section 2 as the user scrolls
      ========================================================================= */}
      <section
        id="country-hero-section"
        className="sticky top-0 h-screen w-full z-10 overflow-hidden bg-[#040810] flex flex-col justify-between"
      >
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#38BDF8]/10 blur-[140px] pointer-events-none" />

        <div className="relative max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-16 pt-24 sm:pt-28 pb-6 flex-1 flex flex-col justify-between">
          {/* Back Pill Button */}
          <div className="mb-3 sm:mb-4">
            <Link
              href="/collection"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/15 text-[11px] font-mono uppercase tracking-[0.2em] text-[#7DD3FC] hover:text-white transition-all shadow-lg cursor-pointer"
            >
              <ArrowLeft size={12} />
              <span>Back to Collection</span>
            </Link>
          </div>

          {/* Main Content Layout: Responsive Stack on mobile, Balanced 2-Column on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-12 items-center flex-1 my-auto">
            {/* Country Editorial Text: Country Name -> Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex flex-col justify-center"
            >
              {/* Region indicator */}
              {country.region && (
                <div className="flex items-center gap-2.5 mb-2 sm:mb-3">
                  <span className="w-6 h-px bg-[#7DD3FC]" />
                  <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[#7DD3FC]">
                    {country.region}
                  </span>
                </div>
              )}

              {/* Country Name */}
              <h1 className="heading-display font-light text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05] mb-2 sm:mb-3">
                {country.displayName || country.name}
              </h1>

              {/* Cities */}
              {country.cities && (
                <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.24em] text-white/50 mb-3 sm:mb-4">
                  {country.cities}
                </p>
              )}

              {/* Description Paragraph */}
              {country.description && (
                <p className="font-sans text-xs sm:text-sm lg:text-base text-white/80 font-light leading-relaxed max-w-xl">
                  {country.description}
                </p>
              )}
            </motion.div>

            {/* Country Cinematic Video */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="lg:col-span-7 w-full"
            >
              <div
                onClick={togglePlay}
                className="group relative w-full aspect-[16/9] sm:aspect-[16/10] lg:aspect-[16/9] max-h-[46vh] sm:max-h-[50vh] lg:max-h-[54vh] rounded-xl sm:rounded-2xl overflow-hidden border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.85)] bg-black cursor-pointer"
              >
                <video
                  ref={videoRef}
                  src={videoSrc}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover object-center"
                />

                {/* Subtle Cinematic Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                {/* Video Play/Pause & Sound Controls */}
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-2 z-20">
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                    className="p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white/90 hover:text-white transition-all shadow-md cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePlay()
                    }}
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                    className="p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white/90 hover:text-white transition-all shadow-md cursor-pointer"
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll to Explore Signature Projects Indicator */}
          <div className="pt-2 pb-1 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.3em] text-white/60 mb-1 font-light">
              Scroll to explore signature projects
            </span>
            <ArrowDown size={13} className="text-[#7DD3FC] animate-bounce" />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: SIGNATURE PROJECTS OVERLAY (SLIDES UP OVER PINNED HERO)
          - Higher z-index (z-20)
          - Deep dark backdrop with top shadow & border to create physical layer depth
          - Displays the country's curated residences portfolio
      ========================================================================= */}
      <section
        id="signature-projects"
        className="relative z-20 min-h-screen w-full bg-[#040810] shadow-[0_-30px_70px_rgba(0,0,0,0.95)] border-t border-white/10 pt-16 sm:pt-24 pb-28 sm:pb-36"
      >
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-16">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-10 sm:pb-14 border-b border-white/10 mb-10 sm:mb-14">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-5 h-px bg-[#7DD3FC]" />
                <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#7DD3FC]">
                  PORTFOLIO
                </span>
              </div>
              <h2 className="heading-display font-light text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight">
                Signature Projects in {country.displayName || country.name}
              </h2>
            </div>
            <span className="font-mono text-[11px] tracking-[0.22em] text-white/50 uppercase">
              {projects.length} {projects.length === 1 ? 'RESIDENCE' : 'RESIDENCES'} RECORDED
            </span>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group bg-[#070E1C] rounded-xl overflow-hidden border border-white/10 hover:border-[#7DD3FC]/50 transition-all duration-300 flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
              >
                {/* Project Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-black">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070E1C] via-transparent to-transparent opacity-80" />
                </div>

                {/* Project Details */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#7DD3FC] block mb-1.5">
                      {project.type} · {project.city}
                    </span>
                    <h3 className="heading-display font-light text-xl sm:text-2xl text-white mb-2 group-hover:text-[#7DD3FC] transition-colors">
                      {project.title}
                    </h3>
                    <p className="font-sans text-xs text-white/60 mb-5">
                      {project.beds}
                    </p>
                  </div>

                  <Link
                    href={`/collection/${country.slug}/${project.slug}`}
                    className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-[#7DD3FC] hover:text-white transition-colors pt-2 border-t border-white/5"
                  >
                    <span>View Residence</span>
                    <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
