// VARIANT 1 — Full-bleed hero + editorial two-column body
'use client'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { EnquiryForm } from '@/components/ui/EnquiryForm'

export function PropertyVariant1({ property }: { property: any }) {
  return (
    <>
      <Navigation />
      <main className="bg-[var(--bg-primary)]">
        {/* Full-bleed hero */}
        <div className="relative h-[90vh] overflow-hidden">
          <Image
            src={property.image}
            alt={property.name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 container-content pb-16">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}>
              <span className="label text-white/70 block mb-3">{property.country} · {property.city}</span>
              <h1 className="heading-display text-display-xl text-white mb-4">{property.name}</h1>
              <p className="label text-white/70">{property.type} · {property.beds} BR · {property.area}</p>
            </motion.div>
          </div>
        </div>

        {/* Body */}
        <div className="container-content section-padding">
          <Link href="/properties" className="inline-flex items-center gap-2 label text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-16">
            <ArrowLeft size={12} /> Back to residences
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Main */}
            <div className="lg:col-span-2">
              <h2 className="heading-display text-display-md text-[var(--text-primary)] mb-6">Overview</h2>
              <p className="text-[var(--text-secondary)] font-light leading-relaxed mb-12 text-pretty">{property.description}</p>

              {/* Gallery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.gallery?.map((img: string, i: number) => (
                  <div key={i} className={`relative overflow-hidden ${i === 0 ? 'sm:col-span-2' : ''}`} style={{ aspectRatio: i === 0 ? '16/9' : '4/3' }}>
                    <Image
                      src={img}
                      alt={`${property.name} ${i + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="border border-[var(--border-default)] p-8 mb-8 bg-[var(--bg-card)]">
                <p className="label text-[var(--text-muted)] mb-2">Price guide</p>
                <p className="heading-display text-display-sm text-[var(--text-primary)] mb-6">{property.price}</p>
                <div className="space-y-3 border-t border-[var(--border-light)] pt-6">
                  {[['Bedrooms', property.beds], ['Bathrooms', property.baths], ['Area', property.area], ['Location', `${property.city}, ${property.country}`]].map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between">
                      <span className="label text-[var(--text-muted)]">{k}</span>
                      <span className="text-[var(--text-secondary)] text-sm">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ul className="space-y-2 mb-10">
                {property.highlights?.map((h: string) => (
                  <li key={h} className="flex items-start gap-3 text-[var(--text-muted)] text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 flex-none" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <EnquiryForm propertyName={property.name} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
