// VARIANT 2 — Side-by-side split: sticky image left, scrolling content right
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { EnquiryForm } from '@/components/ui/EnquiryForm'

export function PropertyVariant2({ property }: { property: any }) {
  return (
    <>
      <Navigation />
      <main className="bg-[var(--bg-primary)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen pt-20">
          {/* Left — sticky image */}
          <div className="relative min-h-[50vh] lg:sticky lg:top-20 lg:self-start lg:h-[calc(100vh-5rem)] overflow-hidden">
            <Image
              src={property.image}
              alt={property.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 z-10">
              <span className="label text-white/70 block mb-2">{property.city}, {property.country}</span>
              <h1 className="heading-display text-[clamp(2rem,4vw,3rem)] text-white">{property.name}</h1>
            </div>
          </div>

          {/* Right — scrolling content */}
          <div className="p-8 lg:p-16 pt-8 lg:pt-16">
            <Link href="/properties" className="inline-flex items-center gap-2 label text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-12">
              <ArrowLeft size={12} /> Back to residences
            </Link>
            <p className="text-[var(--text-muted)] text-sm font-mono mb-2">{property.beds} BR · {property.baths} BA · {property.area}</p>
            <p className="heading-display text-display-md text-[var(--text-primary)] mb-3">{property.price}</p>
            <div className="w-12 h-px bg-[var(--border-strong)] mb-8" />
            <p className="text-[var(--text-secondary)] font-light leading-relaxed mb-12 text-pretty">{property.description}</p>
            <ul className="space-y-3 mb-12">
              {property.highlights?.map((h: string) => (
                <li key={h} className="flex items-start gap-3 text-[var(--text-muted)] text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 flex-none" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-3 mb-12">
              {property.gallery?.slice(0, 4).map((img: string, i: number) => (
                <div key={i} className="relative overflow-hidden bg-[var(--bg-card)]" style={{ aspectRatio: '3/2' }}>
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>
            <div className="border border-[var(--border-default)] p-8 bg-[var(--bg-card)]">
              <EnquiryForm propertyName={property.name} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
