'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ChevronDown, Sparkles } from 'lucide-react'

export interface FeaturedProperty {
  id: string
  slug: string
  name: string
  subtitle: string
  location: string
  category: string
  type: string
  beds: string
  area: string
  price: string
  videoSrc: string
  posterSrc: string
  tagline: string
  description: string
  highlights: string[]
  href: string
}

const FEATURED_PROPERTIES: FeaturedProperty[] = [
  {
    id: 'meridian',
    slug: 'the-meridian',
    name: 'The Meridian',
    subtitle: 'Signature Sky Residence',
    location: 'Dubai Maritime City, UAE',
    category: 'Sky Residences',
    type: 'Penthouse & Sky Villa',
    beds: '3–4 Bedrooms',
    area: '3,800 sq ft',
    price: 'FROM AED 8.2M',
    videoSrc: '/videos/luxury-palm-beach.mp4',
    posterSrc: '/images/p1.jpg',
    tagline: 'Seven elevated tiers with private sky garden terraces overlooking the Arabian Gulf.',
    description: 'Boutique tower of twenty-four exclusive residences featuring 270-degree ocean horizons and private biometric elevator access.',
    highlights: ['Cantilevered sky garden terraces', 'Horizon infinity pool suspended over marina', 'Private biometric elevator'],
    href: '/properties/the-meridian',
  },
  {
    id: 'horizon',
    slug: 'horizon-pavilion',
    name: 'Horizon Pavilion',
    subtitle: 'Architectural Landmark & Mixed-Use',
    location: 'Kuala Lumpur Centre, Malaysia',
    category: 'Commercial Properties',
    type: 'Mixed-Use Landmark',
    beds: '2–4 Bedrooms',
    area: '2,950 sq ft',
    price: 'FROM MYR 4.6M',
    videoSrc: '/videos/coverr-a-glass-building-on-lisbon-street-645-1080p.mp4',
    posterSrc: '/images/p1.jpg',
    tagline: 'Curving monolithic architecture combining luxury residences with cultural and curated spaces.',
    description: 'A striking architectural landmark featuring an organic white double-glazed facade and bespoke Italian joinery.',
    highlights: ['Curved sculptural facade', 'Private art gallery & collector lounge', 'Wellness suite & hydrotherapy'],
    href: '/properties/horizon-pavilion',
  },
  {
    id: 'aurelia',
    slug: 'aurelia-villa',
    name: 'Aurelia Villa',
    subtitle: 'Modern Luxury Villa',
    location: 'Jubilee Hills, Hyderabad, India',
    category: 'Luxury Villas',
    type: 'Private Estate',
    beds: '5 Bedrooms',
    area: '8,200 sq ft',
    price: 'FROM ₹ 12.5 Cr',
    videoSrc: '/videos/VID02.mp4',
    posterSrc: '/images/p5.jpg',
    tagline: 'Contemporary five-bedroom villa set within sculpted stone and reflecting water courtyards.',
    description: 'Sculpted hillside estate balancing architectural precision with the organic warmth of Indian teak and natural slate.',
    highlights: ['Rooftop cantilevered infinity pool', 'Double-height formal salon', 'Private acoustic cinema'],
    href: '/properties/aurelia-villa',
  },
  {
    id: 'ivory',
    slug: 'ivory-residences',
    name: 'Ivory Residences',
    subtitle: 'Waterfront Penthouse',
    location: 'Melbourne Harbourfront, Australia',
    category: 'Waterfront Living',
    type: 'Harbourfront Penthouse',
    beds: '2–3 Bedrooms',
    area: '2,100 sq ft',
    price: 'FROM AUD 2.85M',
    videoSrc: '/videos/VID01.mp4',
    posterSrc: '/images/p5.jpg',
    tagline: 'Refined harbourfront apartments with imported Italian travertine and floor-to-ceiling glass.',
    description: 'Expansive wrap-around marina terraces with panoramic water vistas and integrated Gaggenau appliance suites.',
    highlights: ['Panoramic wrap-around terraces', 'Italian travertine finishes throughout', 'Direct private marina berth access'],
    href: '/properties/ivory-residences',
  },
]

function SinglePropertySlide({
  property,
  index,
  total,
}: {
  property: FeaturedProperty
  index: number
  total: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)

  // Scroll animations for cinematic reveal and subtle zoom
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const videoScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.0, 1.08])
  const textOpacity = useTransform(scrollYProgress, [0.15, 0.35, 0.75, 0.95], [0, 1, 1, 0])
  const textY = useTransform(scrollYProgress, [0.15, 0.35, 0.75, 0.95], [30, 0, 0, -25])

  // Autoplay video safely
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.playsInline = true
    const p = video.play()
    if (p !== undefined) {
      p.then(() => setVideoLoaded(true)).catch(() => setVideoLoaded(true))
    }
  }, [])

  return (
    <section
      ref={containerRef}
      id={index === 0 ? 'launches' : undefined}
      className="relative w-full h-[95vh] sm:h-screen min-h-[620px] overflow-hidden bg-[#040810] flex items-end select-none border-b border-white/[0.06]"
      aria-label={`${property.name} - ${property.subtitle}`}
    >
      {/* ── Background Video Container with Scale Transition ── */}
      <motion.div
        style={{ scale: videoScale }}
        className="absolute inset-0 w-full h-full overflow-hidden will-change-transform"
      >
        <video
          ref={videoRef}
          src={property.videoSrc}
          autoPlay
          muted
          loop
          playsInline
          poster={property.posterSrc}
          onLoadedData={() => setVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700"
          style={{ opacity: videoLoaded ? 1 : 0.85 }}
        >
          <source src={property.videoSrc} type="video/mp4" />
        </video>

        {/* Cinematic Emaar-inspired Dark Vignettes for Maximum Readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(4,8,16,0.92) 0%, rgba(4,8,16,0.60) 35%, rgba(4,8,16,0.20) 65%, rgba(4,8,16,0.50) 100%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(4,8,16,0.75) 100%)',
          }}
        />
      </motion.div>

      {/* ── Top Bar Details on Slide (Slide counter & Launches Link) ── */}
      <div className="absolute top-20 sm:top-24 left-6 sm:left-12 right-6 sm:right-12 z-20 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[#CBD5E1]">
          <span className="text-sky-400 font-semibold">0{index + 1}</span>
          <span className="text-white/30">/</span>
          <span className="text-[#94A3B8]">0{total}</span>
          <span className="hidden sm:inline-block text-white/30">·</span>
          <span className="hidden sm:inline-block uppercase tracking-wider text-[10px] text-white/70">
            {property.category}
          </span>
        </div>

        <Link
          href="/properties"
          className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-sky-400/30 hover:border-sky-400 text-white hover:text-sky-300 text-[10px] tracking-widest uppercase transition-all duration-300"
        >
          <span>Explore All Launches</span>
          <ArrowUpRight size={12} className="text-sky-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* ── Editorial Content Overlay ── */}
      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="relative z-20 w-full max-w-[1440px] mx-auto px-6 sm:px-12 pb-16 sm:pb-20 will-change-[transform,opacity]"
      >
        <div className="max-w-3xl">
          {/* Location & Category Eyebrow */}
          <div className="flex items-center gap-3 mb-3">
            <span className="w-6 h-px bg-sky-400/80" />
            <span className="font-mono text-xs tracking-[0.24em] uppercase text-[#7DD3FC] font-medium">
              {property.location}
            </span>
          </div>

          {/* Large Editorial Property Title (Emaar Style) */}
          <h2
            className="heading-display font-light text-white tracking-tight leading-[0.95] mb-4 text-balance"
            style={{ fontSize: 'clamp(2.4rem, 6vw, 5.2rem)' }}
          >
            {property.name}
          </h2>

          {/* Subtitle & Specs */}
          <p className="font-sans text-sm sm:text-base text-[#CBD5E1] font-light max-w-2xl mb-4 leading-relaxed">
            {property.subtitle} &nbsp;·&nbsp; {property.beds} &nbsp;·&nbsp; {property.area}
          </p>

          <p className="font-sans text-xs sm:text-sm text-[#94A3B8] font-light max-w-xl mb-6 line-clamp-2 leading-relaxed hidden sm:block">
            {property.tagline}
          </p>

          {/* Price & Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#94A3B8]">
                GUIDE PRICE
              </span>
              <span className="text-lg sm:text-2xl font-serif text-white tracking-wide font-normal">
                {property.price}
              </span>
            </div>

            <div className="h-8 w-px bg-white/15 hidden sm:block" />

            <div className="flex items-center gap-3">
              <Link
                href={property.href}
                className="inline-flex items-center justify-center px-6 sm:px-7 py-3 rounded-full bg-white text-[#040810] text-xs font-mono tracking-widest uppercase font-medium hover:bg-sky-200 transition-all duration-300 shadow-lg hover:scale-[1.02]"
              >
                Explore Property
              </Link>
              <Link
                href="/#contact"
                className="inline-flex items-center justify-center px-6 sm:px-7 py-3 rounded-full border border-white/30 hover:border-sky-400 text-white hover:text-sky-300 text-xs font-mono tracking-widest uppercase bg-black/30 hover:bg-black/50 backdrop-blur-md transition-all duration-300"
              >
                Register Interest
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Slide Progress Bar Line (inspired by Emaar mobile screenshot) ── */}
      <div className="absolute bottom-6 left-6 sm:left-12 right-6 sm:right-12 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          {FEATURED_PROPERTIES.map((_, i) => (
            <div
              key={i}
              className={`h-[2px] transition-all duration-500 rounded-full ${
                i === index ? 'w-10 sm:w-16 bg-sky-400' : 'w-4 sm:w-6 bg-white/20'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-[#94A3B8]">
          <span className="hidden sm:inline">SCROLL DOWN</span>
          <ChevronDown size={14} className="text-sky-400 animate-bounce" />
        </div>
      </div>
    </section>
  )
}

export function CinematicPropertyShowcase() {
  return (
    <div id="launches" className="relative w-full bg-[#040810]">
      {FEATURED_PROPERTIES.map((prop, idx) => (
        <SinglePropertySlide
          key={prop.id}
          property={prop}
          index={idx}
          total={FEATURED_PROPERTIES.length}
        />
      ))}
    </div>
  )
}

