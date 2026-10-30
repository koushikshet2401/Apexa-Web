'use client'

import React, { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight } from 'lucide-react'

export interface VideoLaunch {
  id: string
  number: string
  tag: string
  title: string
  location: string
  type: string
  beds: string
  price: string
  videoSrc: string
  fallbackSrc?: string
  href: string
}

const LAUNCHES: VideoLaunch[] = [
  {
    id: 'launch-1',
    number: '01',
    tag: 'FEATURED LAUNCH · 01 OF 03',
    title: 'The Meridian',
    location: 'DUBAI MARITIME CITY, UAE',
    type: 'Signature Sky Residence',
    beds: '3–4 Bedrooms',
    price: 'AED 8.2M',
    videoSrc: '/videos/luxury-palm-beach.mp4',
    href: '/properties/the-meridian',
  },
  {
    id: 'launch-2',
    number: '02',
    tag: 'FEATURED LAUNCH · 02 OF 03',
    title: 'Aurelia Villa',
    location: 'JUBILEE HILLS, HYDERABAD',
    type: 'Contemporary Private Estate',
    beds: '5 Bedrooms',
    price: '₹ 12.5 Cr',
    videoSrc: '/videos/VID02.mp4',
    href: '/properties/aurelia-villa',
  },
  {
    id: 'launch-3',
    number: '03',
    tag: 'FEATURED LAUNCH · 03 OF 03',
    title: 'The Peninsula Reserve',
    location: 'PHUKET, THAILAND',
    type: 'Luxury Waterfront Villa',
    beds: '4–6 Bedrooms',
    price: 'THB 68M',
    videoSrc: '/videos/VID01.mp4',
    href: '/properties/the-peninsula-reserve',
  },
]

export function FeaturedVideoStackingSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const slide1Ref = useRef<HTMLDivElement>(null)
  const slide2Ref = useRef<HTMLDivElement>(null)
  const slide3Ref = useRef<HTMLDivElement>(null)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const container = containerRef.current
    const pinEl = pinRef.current
    const s1 = slide1Ref.current
    const s2 = slide2Ref.current
    const s3 = slide3Ref.current

    if (!container || !pinEl || !s1 || !s2 || !s3) return

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768

      // Set initial states:
      gsap.set(s1, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, filter: 'brightness(1)' })
      gsap.set(s2, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.03 })
      gsap.set(s3, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.03 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: isMobile ? '+=130vh' : '+=230vh',
          pin: pinEl,
          pinSpacing: true,
          scrub: 0.35,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress
            if (p < 0.38) {
              setActiveSlide(0)
            } else if (p < 0.76) {
              setActiveSlide(1)
            } else {
              setActiveSlide(2)
            }
          },
        },
      })

      // STAGE 1: Slide 2 wipes up smoothly and covers Slide 1
      tl.to(
        s1,
        {
          scale: 0.95,
          filter: 'brightness(0.65)',
          duration: 1,
          ease: 'power2.inOut',
        },
        0
      )
      tl.to(
        s2,
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          scale: 1,
          duration: 1,
          ease: 'power2.inOut',
        },
        0
      )

      // STAGE 2: Slide 3 wipes up smoothly and covers Slide 2
      tl.to(
        s2,
        {
          scale: 0.95,
          filter: 'brightness(0.65)',
          duration: 1,
          ease: 'power2.inOut',
        },
        1.1
      )
      tl.to(
        s3,
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          scale: 1,
          duration: 1,
          ease: 'power2.inOut',
        },
        1.1
      )
    }, container)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} id="launches" className="relative w-full bg-[#040810]">
      {/* Pinned Viewport Container (100vh) */}
      <div
        ref={pinRef}
        className="relative w-full h-screen overflow-hidden bg-[#040810] flex items-center justify-center"
      >
        {/* SLIDE 1: The Meridian */}
        <div
          ref={slide1Ref}
          className="absolute inset-0 w-full h-full will-change-[transform,clip-path] z-10"
        >
          <video
            src={LAUNCHES[0].videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040810] via-[#040810]/40 to-black/30 pointer-events-none" />

          {/* Emaar-Inspired Overlay Content with safe pb-24 for mobile nav */}
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-10 md:p-14 lg:p-16 pb-24 sm:pb-12 md:pb-16 z-20 pointer-events-none">
            <div className="max-w-xl pointer-events-auto">
              <span className="inline-block text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[#7DD3FC] mb-1 sm:mb-2">
                {LAUNCHES[0].tag}
              </span>
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-light tracking-tight mb-1 sm:mb-2">
                {LAUNCHES[0].title}
              </h2>
              <p className="text-[10px] sm:text-xs font-sans tracking-[0.18em] uppercase text-[#94A3B8] mb-1.5 sm:mb-3">
                {LAUNCHES[0].location}
              </p>
              <p className="text-xs sm:text-sm md:text-base text-white/90 font-light mb-2 sm:mb-3">
                {LAUNCHES[0].type} &nbsp;/&nbsp; {LAUNCHES[0].beds}
              </p>
              <div className="flex items-baseline gap-2 mb-3 sm:mb-5">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#94A3B8]">
                  From
                </span>
                <span className="font-display text-xl sm:text-2xl md:text-3xl text-white tracking-wide">
                  {LAUNCHES[0].price}
                </span>
              </div>
              <Link
                href={LAUNCHES[0].href}
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 backdrop-blur-md shadow-lg"
              >
                <span>Explore Launch</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* SLIDE 2: Aurelia Villa */}
        <div
          ref={slide2Ref}
          className="absolute inset-0 w-full h-full will-change-[transform,clip-path] z-20"
        >
          <video
            src={LAUNCHES[1].videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040810] via-[#040810]/40 to-black/30 pointer-events-none" />

          {/* Emaar-Inspired Overlay Content with safe pb-24 for mobile nav */}
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-10 md:p-14 lg:p-16 pb-24 sm:pb-12 md:pb-16 z-20 pointer-events-none">
            <div className="max-w-xl pointer-events-auto">
              <span className="inline-block text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[#7DD3FC] mb-1 sm:mb-2">
                {LAUNCHES[1].tag}
              </span>
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-light tracking-tight mb-1 sm:mb-2">
                {LAUNCHES[1].title}
              </h2>
              <p className="text-[10px] sm:text-xs font-sans tracking-[0.18em] uppercase text-[#94A3B8] mb-1.5 sm:mb-3">
                {LAUNCHES[1].location}
              </p>
              <p className="text-xs sm:text-sm md:text-base text-white/90 font-light mb-2 sm:mb-3">
                {LAUNCHES[1].type} &nbsp;/&nbsp; {LAUNCHES[1].beds}
              </p>
              <div className="flex items-baseline gap-2 mb-3 sm:mb-5">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#94A3B8]">
                  From
                </span>
                <span className="font-display text-xl sm:text-2xl md:text-3xl text-white tracking-wide">
                  {LAUNCHES[1].price}
                </span>
              </div>
              <Link
                href={LAUNCHES[1].href}
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 backdrop-blur-md shadow-lg"
              >
                <span>Explore Launch</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* SLIDE 3: The Peninsula Reserve */}
        <div
          ref={slide3Ref}
          className="absolute inset-0 w-full h-full will-change-[transform,clip-path] z-30"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-center"
          >
            <source src={LAUNCHES[2].videoSrc} type="video/mp4" />
            {LAUNCHES[2].fallbackSrc && (
              <source src={LAUNCHES[2].fallbackSrc} type="video/mp4" />
            )}
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#040810] via-[#040810]/40 to-black/30 pointer-events-none" />

          {/* Emaar-Inspired Overlay Content with safe pb-24 for mobile nav */}
          <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-10 md:p-14 lg:p-16 pb-24 sm:pb-12 md:pb-16 z-20 pointer-events-none">
            <div className="max-w-xl pointer-events-auto">
              <span className="inline-block text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase text-[#7DD3FC] mb-1 sm:mb-2">
                {LAUNCHES[2].tag}
              </span>
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-light tracking-tight mb-1 sm:mb-2">
                {LAUNCHES[2].title}
              </h2>
              <p className="text-[10px] sm:text-xs font-sans tracking-[0.18em] uppercase text-[#94A3B8] mb-1.5 sm:mb-3">
                {LAUNCHES[2].location}
              </p>
              <p className="text-xs sm:text-sm md:text-base text-white/90 font-light mb-2 sm:mb-3">
                {LAUNCHES[2].type} &nbsp;/&nbsp; {LAUNCHES[2].beds}
              </p>
              <div className="flex items-baseline gap-2 mb-3 sm:mb-5">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#94A3B8]">
                  From
                </span>
                <span className="font-display text-xl sm:text-2xl md:text-3xl text-white tracking-wide">
                  {LAUNCHES[2].price}
                </span>
              </div>
              <Link
                href={LAUNCHES[2].href}
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 backdrop-blur-md shadow-lg"
              >
                <span>Explore Launch</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Emaar-Style Vertical Step Indicator (Right Edge) */}
        <div className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2.5 bg-black/40 backdrop-blur-md px-2 py-3.5 sm:px-2.5 sm:py-4 rounded-full border border-white/10">
          {LAUNCHES.map((l, i) => (
            <div
              key={l.id}
              className={`w-1.5 transition-all duration-300 rounded-full ${activeSlide === i ? 'h-6 sm:h-7 bg-[#7DD3FC]' : 'h-2 bg-white/30'
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
