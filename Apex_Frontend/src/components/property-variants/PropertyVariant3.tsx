// VARIANT 3 — Minimal dark editorial: text-first, fullscreen gallery below
'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { EnquiryForm } from '@/components/ui/EnquiryForm'

export function PropertyVariant3({ property }: { property: any }) {
  const [galleryIdx, setGalleryIdx] = useState(0)
  const allImages = [property.image, ...(property.gallery || [])].filter(Boolean)

  return (
    <>
      <Navigation />
      <main className="bg-[var(--bg-primary)]">
        {/* Text-first header */}
        <section className="container-narrow section-padding pt-32">
          <Link href="/properties" className="inline-flex items-center gap-2 label text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-12">
            <ArrowLeft size={12} /> Back to residences
          </Link>
          <span className="label text-[var(--accent)] block mb-4">{property.city}, {property.country}</span>
          <h1 className="heading-display text-display-xl text-[var(--text-primary)] mb-6">{property.name}</h1>
          <p className="text-[var(--text-secondary)] text-xl font-light leading-relaxed mb-12 text-pretty">{property.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-8 border-y border-[var(--border-light)] mb-12">
            {[['Price', property.price], ['Bedrooms', property.beds], ['Area', property.area], ['Location', property.city]].map(([k, v]) => (
              <div key={String(k)}>
                <p className="label text-[var(--text-muted)] mb-1">{k}</p>
                <p className="text-[var(--text-primary)] font-medium">{v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Full-width gallery */}
        <section className="relative">
          <div className="relative overflow-hidden max-h-[80vh]" style={{ aspectRatio: '16/9' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={galleryIdx}
                className="relative w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Image
                  src={allImages[galleryIdx]}
                  alt={`${property.name} ${galleryIdx + 1}`}
                  fill
                  priority={galleryIdx === 0}
                  className="object-cover"
                  sizes="100vw"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          {allImages.length > 1 && (
            <div className="absolute bottom-6 right-6 flex items-center gap-3 z-10">
              <button
                id="gallery-prev-btn"
                aria-label="Previous image"
                onClick={() => setGalleryIdx((prev) => (prev - 1 + allImages.length) % allImages.length)}
                className="w-10 h-10 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
              <span className="font-mono text-xs text-white/80 bg-black/40 px-2 py-1 backdrop-blur-sm">
                {String(galleryIdx + 1).padStart(2, '0')} / {String(allImages.length).padStart(2, '0')}
              </span>
              <button
                id="gallery-next-btn"
                aria-label="Next image"
                onClick={() => setGalleryIdx((prev) => (prev + 1) % allImages.length)}
                className="w-10 h-10 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <ArrowRight size={16} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </section>

        {/* Highlights + form */}
        <div className="container-narrow section-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="heading-display text-display-sm text-[var(--text-primary)] mb-6">Highlights</h2>
              <ul className="space-y-3">
                {property.highlights?.map((h: string) => (
                  <li key={h} className="flex items-start gap-3 text-[var(--text-muted)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 flex-none" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
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
