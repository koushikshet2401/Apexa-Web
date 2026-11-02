"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { useRef } from "react"
import { ArrowUpRight } from "lucide-react"

export interface ScrollingProjectItem {
  id?: string
  title: string
  src: string
  href?: string
  type?: string
  city?: string
  price?: string
  beds?: string
}

const DEFAULT_PROJECTS: ScrollingProjectItem[] = [
  {
    title: "The Meridian",
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
    type: "Signature Sky Residence",
    city: "Dubai",
    price: "AED 8.2M",
    beds: "3–4 Bedrooms",
    href: "/collection/dubai/the-meridian",
  },
  {
    title: "Aurelia Villa",
    src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop",
    type: "Contemporary Estate",
    city: "Dubai",
    price: "₹ 12.5 Cr",
    beds: "5 Bedrooms",
    href: "/collection/dubai/aurelia-villa",
  },
  {
    title: "The Peninsula Reserve",
    src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop",
    type: "Waterfront Sanctuary",
    city: "Thailand",
    price: "THB 68M",
    beds: "4–6 Bedrooms",
    href: "/collection/thailand/the-peninsula-reserve",
  },
  {
    title: "Verdant House",
    src: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1600&auto=format&fit=crop",
    type: "Biophilic Villa",
    city: "Dubai",
    price: "₹ 28.0 Cr",
    beds: "6 Bedrooms",
    href: "/collection/dubai/verdant-house",
  },
]

const StickyCard_001 = ({
  i,
  title,
  src,
  href,
  type,
  city,
  price,
  beds,
  progress,
  range,
  targetScale,
}: {
  i: number
  title: string
  src: string
  href?: string
  type?: string
  city?: string
  price?: string
  beds?: string
  progress: any
  range: [number, number]
  targetScale: number
}) => {
  const container = useRef<HTMLDivElement>(null)
  const scale = useTransform(progress, range, [1, targetScale])

  const CardWrapper = href ? Link : "div"
  const wrapperProps = href ? { href, className: "block w-full h-full" } : { className: "w-full h-full" }

  return (
    <div
      ref={container}
      className="h-[100dvh] h-screen sticky top-0 flex items-center justify-center px-4 sm:px-6 lg:px-8 pointer-events-none"
    >
      <motion.div
        style={{
          scale,
          top: `calc(10vh + ${i * 16}px)`,
        }}
        className="rounded-2xl sm:rounded-3xl relative flex origin-top flex-col overflow-hidden
                   w-[90vw] max-w-[360px] h-[330px]
                   sm:max-w-[480px] sm:h-[360px] 
                   md:max-w-[620px] md:h-[400px] 
                   lg:max-w-[740px] lg:h-[430px]
                   border border-white/20 bg-[#070E1C] shadow-[0_30px_70px_rgba(0,0,0,0.95)] 
                   group pointer-events-auto transition-shadow duration-500 hover:shadow-[0_30px_80px_rgba(56,189,248,0.25)]"
      >
        <CardWrapper {...(wrapperProps as any)}>
          {/* Main Visual Image */}
          <img
            src={src || "/placeholder.svg"}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {/* Luxury Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/20 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 z-10 flex items-center gap-2">
            {type && (
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 font-mono text-[9px] uppercase tracking-[0.2em] text-[#7DD3FC]">
                {type}
              </span>
            )}
            {city && (
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 font-mono text-[9px] uppercase tracking-[0.2em] text-white/80">
                {city}
              </span>
            )}
          </div>

          {/* Bottom Editorial Content Bar */}
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 z-10 flex items-end justify-between gap-3">
            <div>
              <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.28em] text-[#7DD3FC] block mb-1">
                RESIDENCE 0{i + 1}
              </span>
              <h3 className="heading-display font-light text-xl sm:text-2xl md:text-3xl text-white tracking-tight leading-tight">
                {title}
              </h3>
              {(beds || price) && (
                <p className="font-mono text-[10px] sm:text-xs text-white/70 mt-1">
                  {beds && <span>{beds}</span>}
                  {beds && price && <span> · </span>}
                  {price && <span className="text-[#7DD3FC] font-medium">{price}</span>}
                </p>
              )}
            </div>

            {href && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black border border-white/25 group-hover:border-white font-mono text-[10px] uppercase tracking-[0.18em] transition-all duration-300 backdrop-blur-md shrink-0 shadow-lg">
                <span>View</span>
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            )}
          </div>
        </CardWrapper>
      </motion.div>
    </div>
  )
}

export function ImagesScrollingAnimation({
  items,
  className,
}: {
  items?: ScrollingProjectItem[]
  className?: string
}) {
  const container = useRef<HTMLDivElement>(null)
  const projectsList = items && items.length > 0 ? items : DEFAULT_PROJECTS

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  })

  return (
    <div
      ref={container}
      className={`relative w-full ${className || ""}`}
    >
      {projectsList.map((project, i) => {
        const targetScale = Math.max(0.72, 1 - (projectsList.length - i - 1) * 0.06)
        const range: [number, number] = [i * (0.85 / Math.max(1, projectsList.length)), 1]
        return (
          <StickyCard_001
            key={`p_${i}_${project.title}`}
            i={i}
            {...project}
            progress={scrollYProgress}
            range={range}
            targetScale={targetScale}
          />
        )
      })}
    </div>
  )
}

export { StickyCard_001 }
export default ImagesScrollingAnimation
