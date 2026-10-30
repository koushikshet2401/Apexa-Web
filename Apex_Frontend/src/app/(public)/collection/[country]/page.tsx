import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { db } from '@/lib/db'
import { DESTINATIONS } from '@/data/destinations'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  try {
    const countries = await db.country.findMany({
      where: { isPublished: true },
      select: { slug: true },
    })
    return countries.map((c) => ({
      country: c.slug,
    }))
  } catch {
    return [
      { country: 'dubai' },
      { country: 'thailand' },
      { country: 'malaysia' },
      { country: 'australia' },
      { country: 'georgia' },
    ]
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>
}): Promise<Metadata> {
  const { country: countrySlug } = await params
  const country = await db.country.findUnique({
    where: { slug: countrySlug },
  })

  if (!country) {
    return { title: 'Collection Not Found — Apex Pacific Holdings' }
  }

  return {
    title: `${country.displayName || country.name} Collection — Apex Pacific Holdings`,
    description: country.description || country.tagline || 'Private architecture and luxury residences.',
  }
}

export default async function CollectionCountryPage({
  params,
}: {
  params: Promise<{ country: string }>
}) {
  const { country: countrySlug } = await params
  const country = await db.country.findUnique({
    where: { slug: countrySlug },
    include: {
      properties: {
        where: { isPublished: true },
        include: {
          images: { orderBy: { order: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!country) {
    notFound()
  }

  // Find destination matching projects as fallback if DB has no properties for this country yet
  const legacyDest = DESTINATIONS.find(
    (d) => d.slug === countrySlug || (countrySlug === 'dubai' && d.slug === 'uae')
  )

  const displayedProjects =
    country.properties.length > 0
      ? country.properties.map((p) => ({
          id: p.id,
          title: p.name,
          type: p.type || 'Residence',
          city: p.cityName || country.name,
          beds: p.beds || 'Bespoke',
          image: p.images[0]?.url || p.mainImage || country.cardImage || '/images/DuabiCoolection.png',
          slug: p.slug,
        }))
      : (legacyDest?.projects || []).map((lp) => ({
          id: lp.id,
          title: lp.title,
          type: lp.type,
          city: lp.city,
          beds: lp.beds,
          image: lp.image,
          slug: lp.slug,
        }))

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pt-28 pb-24">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[var(--accent)]/10 blur-[130px] pointer-events-none" />

        <div className="relative max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
          {/* Back link */}
          <Link
            href="/#collection"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors mb-10 font-sans"
          >
            <ArrowLeft size={14} />
            <span>Back to Collection</span>
          </Link>

          {/* Full-width Hero Video if present */}
          {country.heroVideoUrl && (
            <div className="relative w-full aspect-[21/9] max-h-[480px] mb-14 rounded-[4px] overflow-hidden border border-[var(--accent)]/20 shadow-2xl">
              <video
                src={country.heroVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent opacity-60 pointer-events-none" />
            </div>
          )}

          {/* Collection Header */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start pb-16 border-b border-[var(--accent)]/15">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-px bg-[var(--accent)]" />
                <span className="font-sans text-xs uppercase tracking-[0.25em] text-[var(--accent)]">
                  {country.region}
                </span>
              </div>
              <h1 className="font-serif text-4xl sm:text-6xl text-[var(--text-primary)] font-light mb-4">
                {country.displayName || country.name}
              </h1>
              {country.cities && (
                <p className="font-sans text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)] mb-6">
                  {country.cities}
                </p>
              )}
              {country.description && (
                <p className="font-sans text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed font-light max-w-xl">
                  {country.description}
                </p>
              )}
            </div>

            {/* Country Image Showcase (if no hero video, or as supplemental study) */}
            <div className="relative w-full aspect-[16/10] rounded-[4px] overflow-hidden border border-[var(--accent)]/20 shadow-2xl">
              <Image
                src={country.cardImage || legacyDest?.image || '/images/DuabiCoolection.png'}
                alt={country.displayName || country.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent opacity-60" />
            </div>
          </div>

          {/* Signature Projects Section */}
          <div className="pt-16">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="font-sans text-xs uppercase tracking-[0.25em] text-[var(--accent)] block mb-2">
                  PORTFOLIO
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] font-light">
                  Signature Projects in {country.displayName || country.name}
                </h2>
              </div>
              <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase hidden sm:inline-block">
                {displayedProjects.length} PROPERTIES RECORDED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedProjects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-[var(--bg-card)]/70 rounded-[4px] overflow-hidden border border-[var(--accent)]/15 hover:border-[var(--accent)]/40 transition-all duration-300"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-80" />
                  </div>

                  <div className="p-6">
                    <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] block mb-1">
                      {project.type} · {project.city}
                    </span>
                    <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">{project.title}</h3>
                    <p className="font-sans text-xs text-[var(--text-muted)] mb-4">{project.beds}</p>
                    <Link
                      href={`/properties/${country.slug}/${project.slug}`}
                      className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-[0.18em] text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <span>View Residence</span>
                      <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
