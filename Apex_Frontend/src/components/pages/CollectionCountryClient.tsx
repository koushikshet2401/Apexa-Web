'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Plus,
  Check,
} from 'lucide-react'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import {
  Dialog,
  DialogTrigger,
  DialogContainer,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
  DialogImage,
} from '@/components/ui/linear-card'

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
  baths?: string
  area?: string
  price?: string
  tagline?: string
  shortDescription?: string
  description?: string
  highlights?: string[]
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

  const videoSrc = country.heroVideoUrl || '/videos/luxury-palm-beach.mp4'

  return (
    <div className="relative bg-[#040810] text-[#F8FAFC] selection:bg-[#7DD3FC]/20 selection:text-white">
      {/* Top Fixed Navigation */}
      <Navigation />

      {/* =========================================================================
          SECTION 1: PINNED COUNTRY PRESENTATION SECTION (STICKY TOP-0)
          - Occupies entire viewport
          - Vertical distribution:
              ~30% Height: Country Title, Region, Cities & Curated Description
              ~70% Height: Dominant, cinematic country video
          - Overlaid smoothly by Section 2 upon scrolling
      ========================================================================= */}
      <section
        id="country-hero-section"
        className="sticky top-0 h-screen min-h-screen w-full z-10 overflow-hidden bg-[#040810] flex flex-col justify-between"
      >
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#38BDF8]/10 blur-[150px] pointer-events-none" />

        <div className="relative max-w-[1440px] w-full mx-auto px-4 sm:px-8 lg:px-16 h-full flex flex-col justify-between pt-20 sm:pt-24 pb-4">
          {/* ─────────────────────────────────────────────────────────────
              TOP ~30% VERTICAL AREA: Navigation & Country Editorial
             ───────────────────────────────────────────────────────────── */}
          <div className="flex-none flex flex-col justify-center py-2 sm:py-3">
            {/* Back Pill Button */}
            <div className="mb-2 sm:mb-3">
              <Link
                href="/collection"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/15 text-[11px] font-mono uppercase tracking-[0.2em] text-[#7DD3FC] hover:text-white transition-all shadow-md cursor-pointer"
              >
                <ArrowLeft size={12} />
                <span>Back to Collection</span>
              </Link>
            </div>

            {/* Country Header Details */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4">
              <div>
                {/* Region */}
                {country.region && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-px bg-[#7DD3FC]" />
                    <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[#7DD3FC]">
                      {country.region}
                    </span>
                  </div>
                )}

                {/* Country Name */}
                <h1 className="heading-display font-light text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-none mb-1">
                  {country.displayName || country.name}
                </h1>

                {/* Cities */}
                {country.cities && (
                  <p className="font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.22em] text-white/50">
                    {country.cities}
                  </p>
                )}
              </div>

              {/* Description Paragraph (Takes max 2-3 lines on wide screens) */}
              {country.description && (
                <p className="font-sans text-xs sm:text-sm text-white/80 font-light leading-relaxed max-w-xl line-clamp-2 md:line-clamp-3 md:text-right">
                  {country.description}
                </p>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              BOTTOM ~70% VERTICAL AREA: Grand Cinematic Country Video
             ───────────────────────────────────────────────────────────── */}
          <div className="flex-1 min-h-0 w-full flex flex-col justify-center pb-2">
            <div
              onClick={togglePlay}
              className="relative w-full h-[62vh] sm:h-[66vh] lg:h-[68vh] rounded-2xl overflow-hidden border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.9)] bg-black cursor-pointer group"
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

              {/* Cinematic Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25 pointer-events-none" />

              {/* Audio & Playback Controls */}
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

              {/* Scroll down prompt overlay at bottom edge */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-15 pointer-events-none flex flex-col items-center">
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-white/70 mb-1 font-light drop-shadow">
                  Scroll to explore signature projects
                </span>
                <ArrowDown size={12} className="text-[#7DD3FC] animate-bounce drop-shadow" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: SIGNATURE PROJECTS OVERLAY (SLIDES UP OVER PINNED HERO)
          - Higher z-index (z-20)
          - Pinned curtain overlay effect
          - Integrates the 21st.dev linear-card interactive expandable dialogs
          - Exactly 3 cards horizontally across the screen
          - Modal includes full property dossier + direct "EXPLORE RESIDENCE" button
      ========================================================================= */}
      <section
        id="signature-projects"
        className="relative z-20 min-h-screen w-full bg-[#040810] shadow-[0_-35px_80px_rgba(0,0,0,0.95)] border-t border-white/10 pt-16 sm:pt-24 pb-28 sm:pb-36"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-16">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 sm:pb-12 border-b border-white/10 mb-8 sm:mb-12">
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

          {/* ─────────────────────────────────────────────────────────────
              3 HORIZONTAL CARDS LAYOUT:
              - Desktop & Tablet: Exactly 3 cards across in a grid
              - Mobile: Horizontal scroll track showing 3 cards horizontally
             ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {projects.slice(0, 3).map((project) => (
              <Dialog
                key={project.id}
                transition={{
                  type: 'spring',
                  bounce: 0.05,
                  duration: 0.5,
                }}
              >
                {/* Unexpanded Card */}
                <DialogTrigger
                  style={{ borderRadius: '16px' }}
                  className="group relative flex w-full flex-col overflow-hidden border border-white/10 hover:border-[#7DD3FC]/50 bg-[#070E1C] hover:bg-[#0A162B] transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
                >
                  <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-black">
                    <DialogImage
                      src={project.image}
                      alt={project.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070E1C] via-transparent to-transparent opacity-80" />
                  </div>

                  <div className="relative flex flex-grow items-end justify-between p-4 sm:p-5">
                    <div>
                      <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-[#7DD3FC] block mb-1">
                        {project.type} · {project.city}
                      </span>
                      <DialogTitle className="heading-display font-light text-xl sm:text-2xl text-white group-hover:text-[#7DD3FC] transition-colors leading-tight">
                        {project.title}
                      </DialogTitle>
                      {project.price && (
                        <p className="font-mono text-xs text-white/60 mt-1 font-light">
                          {project.price}
                        </p>
                      )}
                    </div>

                    {/* Plus Icon Trigger Button (matching 21st.dev style) */}
                    <div
                      aria-label={`Open details for ${project.title}`}
                      className="ml-3 p-2.5 rounded-full bg-[#0B1528] border border-white/20 group-hover:border-[#7DD3FC] group-hover:bg-[#7DD3FC]/20 text-white group-hover:text-[#7DD3FC] transition-all shadow-md flex-shrink-0"
                    >
                      <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                    </div>
                  </div>
                </DialogTrigger>

                {/* Expanded Dialog Modal */}
                <DialogContainer className="p-4 sm:p-8">
                  <DialogContent
                    style={{ borderRadius: '24px' }}
                    className="relative flex h-full max-h-[88vh] mx-auto flex-col overflow-y-auto border border-white/20 bg-[#070E1C] text-white shadow-[0_25px_80px_rgba(0,0,0,0.95)] w-full max-w-2xl"
                  >
                    {/* Modal Hero Image */}
                    <div className="relative w-full aspect-[16/10] max-h-[42vh] overflow-hidden bg-black">
                      <DialogImage
                        src={project.image}
                        alt={project.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070E1C] via-transparent to-black/30 pointer-events-none" />
                    </div>

                    {/* Modal Content Body */}
                    <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Type & City */}
                        <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#7DD3FC] block mb-2">
                          {project.type} · {project.city}
                        </span>

                        {/* Title */}
                        <DialogTitle className="heading-display font-light text-3xl sm:text-4xl text-white tracking-tight mb-2">
                          {project.title}
                        </DialogTitle>

                        {/* Specifications Line */}
                        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-white/70 mb-4 pb-3 border-b border-white/10">
                          {project.beds && <span>{project.beds}</span>}
                          {project.baths && <span>· {project.baths} Baths</span>}
                          {project.area && <span>· {project.area}</span>}
                          {project.price && <span className="text-[#7DD3FC]">· {project.price}</span>}
                        </div>

                        {/* Detailed Description */}
                        <DialogDescription
                          disableLayoutAnimation
                          variants={{
                            initial: { opacity: 0, scale: 0.95, y: -20 },
                            animate: { opacity: 1, scale: 1, y: 0 },
                            exit: { opacity: 0, scale: 0.95, y: -20 },
                          }}
                        >
                          <p className="font-sans text-xs sm:text-sm text-white/80 font-light leading-relaxed mb-6">
                            {project.description || project.shortDescription || 'An extraordinary private architectural sanctuary curated by Apex Pacific Holdings.'}
                          </p>

                          {/* Highlights (if any) */}
                          {project.highlights && project.highlights.length > 0 && (
                            <div className="mb-6 space-y-1.5">
                              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 block mb-2">
                                RESIDENCE HIGHLIGHTS
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {project.highlights.map((h, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs text-white/75 font-light">
                                    <Check size={13} className="text-[#7DD3FC] mt-0.5 flex-shrink-0" />
                                    <span>{h}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </DialogDescription>
                      </div>

                      {/* Explore Button — Direct Link to /collection/[country]/[slug] */}
                      <div className="pt-4 mt-4 border-t border-white/10">
                        <Link
                          href={`/collection/${country.slug}/${project.slug}`}
                          className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0C1F38] via-[#123157] to-[#0C1F38] hover:from-[#123157] hover:to-[#1E4D82] border border-[#7DD3FC]/40 hover:border-[#7DD3FC] text-white font-mono text-xs uppercase tracking-[0.25em] transition-all duration-300 shadow-[0_0_25px_rgba(56,189,248,0.2)] group cursor-pointer"
                        >
                          <span>Explore Residence</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>

                    {/* Dialog Close Icon */}
                    <DialogClose className="text-white bg-black/60 hover:bg-black/90 p-2.5 rounded-full border border-white/20 transition-colors" />
                  </DialogContent>
                </DialogContainer>
              </Dialog>
            ))}
          </div>

          {/* Secondary Row for additional properties */}
          {projects.length > 3 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {projects.slice(3).map((project) => (
                <Dialog
                  key={project.id}
                  transition={{
                    type: 'spring',
                    bounce: 0.05,
                    duration: 0.5,
                  }}
                >
                  <DialogTrigger
                    style={{ borderRadius: '16px' }}
                    className="group relative flex w-full flex-col overflow-hidden border border-white/10 hover:border-[#7DD3FC]/50 bg-[#070E1C] hover:bg-[#0A162B] transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
                  >
                    <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-black">
                      <DialogImage
                        src={project.image}
                        alt={project.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070E1C] via-transparent to-transparent opacity-80" />
                    </div>

                    <div className="relative flex flex-grow items-end justify-between p-4 sm:p-5">
                      <div>
                        <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-[#7DD3FC] block mb-1">
                          {project.type} · {project.city}
                        </span>
                        <DialogTitle className="heading-display font-light text-xl sm:text-2xl text-white group-hover:text-[#7DD3FC] transition-colors leading-tight">
                          {project.title}
                        </DialogTitle>
                        {project.price && (
                          <p className="font-mono text-xs text-white/60 mt-1 font-light">
                            {project.price}
                          </p>
                        )}
                      </div>

                      <div
                        aria-label={`Open details for ${project.title}`}
                        className="ml-3 p-2.5 rounded-full bg-[#0B1528] border border-white/20 group-hover:border-[#7DD3FC] group-hover:bg-[#7DD3FC]/20 text-white group-hover:text-[#7DD3FC] transition-all shadow-md flex-shrink-0"
                      >
                        <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                      </div>
                    </div>
                  </DialogTrigger>

                  <DialogContainer className="p-4 sm:p-8">
                    <DialogContent
                      style={{ borderRadius: '24px' }}
                      className="relative flex h-full max-h-[88vh] mx-auto flex-col overflow-y-auto border border-white/20 bg-[#070E1C] text-white shadow-[0_25px_80px_rgba(0,0,0,0.95)] w-full max-w-2xl"
                    >
                      <div className="relative w-full aspect-[16/10] max-h-[42vh] overflow-hidden bg-black">
                        <DialogImage
                          src={project.image}
                          alt={project.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070E1C] via-transparent to-black/30 pointer-events-none" />
                      </div>

                      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#7DD3FC] block mb-2">
                            {project.type} · {project.city}
                          </span>

                          <DialogTitle className="heading-display font-light text-3xl sm:text-4xl text-white tracking-tight mb-2">
                            {project.title}
                          </DialogTitle>

                          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-white/70 mb-4 pb-3 border-b border-white/10">
                            {project.beds && <span>{project.beds}</span>}
                            {project.baths && <span>· {project.baths} Baths</span>}
                            {project.area && <span>· {project.area}</span>}
                            {project.price && <span className="text-[#7DD3FC]">· {project.price}</span>}
                          </div>

                          <DialogDescription
                            disableLayoutAnimation
                            variants={{
                              initial: { opacity: 0, scale: 0.95, y: -20 },
                              animate: { opacity: 1, scale: 1, y: 0 },
                              exit: { opacity: 0, scale: 0.95, y: -20 },
                            }}
                          >
                            <p className="font-sans text-xs sm:text-sm text-white/80 font-light leading-relaxed mb-6">
                              {project.description || project.shortDescription || 'An extraordinary private architectural sanctuary curated by Apex Pacific Holdings.'}
                            </p>
                          </DialogDescription>
                        </div>

                        <div className="pt-4 mt-4 border-t border-white/10">
                          <Link
                            href={`/collection/${country.slug}/${project.slug}`}
                            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0C1F38] via-[#123157] to-[#0C1F38] hover:from-[#123157] hover:to-[#1E4D82] border border-[#7DD3FC]/40 hover:border-[#7DD3FC] text-white font-mono text-xs uppercase tracking-[0.25em] transition-all duration-300 shadow-[0_0_25px_rgba(56,189,248,0.2)] group cursor-pointer"
                          >
                            <span>Explore Residence</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>

                      <DialogClose className="text-white bg-black/60 hover:bg-black/90 p-2.5 rounded-full border border-white/20 transition-colors" />
                    </DialogContent>
                  </DialogContainer>
                </Dialog>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
