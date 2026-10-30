import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { SERVICES, ServiceItem } from '@/data/services'
import { db } from '@/lib/db'
import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  try {
    const dbServices = await db.serviceCategory.findMany({
      where: { isPublished: true },
      select: { slug: true },
    })
    if (dbServices.length > 0) {
      return dbServices.map((s) => ({ slug: s.slug }))
    }
  } catch {}
  return SERVICES.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const dbService = await db.serviceCategory.findUnique({
    where: { slug },
  })
  const fallback = SERVICES.find((s) => s.slug === slug)

  if (!dbService && !fallback) {
    return { title: 'Service Not Found — Apex Pacific Holdings' }
  }

  const title = dbService?.name || fallback?.title || 'Service'
  const description = dbService?.heroDescription || dbService?.description || fallback?.heroDescription || ''

  return {
    title: `${title} — Apex Pacific Holdings`,
    description,
  }
}

// Custom architectural SVG emblem for each service
function ServiceEmblem({ type }: { type: ServiceItem['iconType'] }) {
  if (type === 'villa') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-[var(--accent)]">
        <path d="M4 28L18 8L32 28H4Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M12 28V19H24V28" stroke="currentColor" strokeWidth="1.2" />
        <line x1="8" y1="28" x2="28" y2="28" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18" cy="14" r="1.5" fill="currentColor" />
      </svg>
    )
  }
  if (type === 'sky') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-[var(--accent)]">
        <rect x="10" y="6" width="16" height="24" stroke="currentColor" strokeWidth="1.2" />
        <line x1="6" y1="30" x2="30" y2="30" stroke="currentColor" strokeWidth="1.5" />
        <line x1="14" y1="11" x2="22" y2="11" stroke="currentColor" strokeWidth="1" />
        <line x1="14" y1="16" x2="22" y2="16" stroke="currentColor" strokeWidth="1" />
        <line x1="14" y1="21" x2="22" y2="21" stroke="currentColor" strokeWidth="1" />
        <path d="M6 14L10 11M26 11L30 14" stroke="currentColor" strokeWidth="1" />
      </svg>
    )
  }
  if (type === 'waterfront') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-[var(--accent)]">
        <path d="M4 22C8 20 12 24 16 22C20 20 24 24 28 22C30 21 31 21.5 32 22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M4 26C8 24 12 28 16 26C20 24 24 28 28 26C30 25 31 25.5 32 26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M8 18L18 6L28 18H8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <line x1="18" y1="18" x2="18" y2="10" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    )
  }
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-[var(--accent)]">
      <path d="M6 30V10L18 4L30 10V30H6Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="4" y1="30" x2="32" y2="30" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="13" width="4" height="4" stroke="currentColor" strokeWidth="1" />
      <rect x="20" y="13" width="4" height="4" stroke="currentColor" strokeWidth="1" />
      <rect x="12" y="20" width="4" height="4" stroke="currentColor" strokeWidth="1" />
      <rect x="20" y="20" width="4" height="4" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const dbService = await db.serviceCategory.findUnique({
    where: { slug },
    include: {
      properties: {
        include: {
          property: {
            include: {
              images: { orderBy: { order: 'asc' } },
              country: true,
            },
          },
        },
      },
    },
  })

  const fallbackService = SERVICES.find((s) => s.slug === slug)

  if (!dbService && !fallbackService) {
    notFound()
  }

  // Construct normalized service object
  const service = {
    number: dbService ? `0${dbService.displayOrder || 1}` : fallbackService?.number || '01',
    title: dbService?.name || fallbackService?.title || '',
    subtitle: dbService?.subtitle || fallbackService?.subtitle || '',
    tagline: dbService?.tagline || fallbackService?.tagline || '',
    heroDescription:
      dbService?.heroDescription || dbService?.description || fallbackService?.heroDescription || '',
    image: dbService?.image || fallbackService?.image || '/images/laxuryVillaImage.png',
    iconType: (fallbackService?.iconType || 'villa') as ServiceItem['iconType'],
    architecturalFocus: fallbackService?.architecturalFocus || [
      'Microclimate & Sun Orientation',
      'Artisanal Stone & Timber Joinery',
      'Integrated Native Landscapes',
      'Multi-Generational Spatial Flow',
    ],
    deliverables: fallbackService?.deliverables || [
      {
        title: 'Topographic & Solar Orientation',
        detail: 'Deep site-specific study maximizing prevailing breezes, privacy sightlines, and morning light angles.',
      },
      {
        title: 'Bespoke Architectural Engineering',
        detail: 'Comprehensive structural, MEP, and building envelope design with zero compromise on structural purity.',
      },
    ],
  }

  const assignedProperties =
    dbService?.properties
      ?.map((ps) => ps.property)
      ?.filter((p) => p && p.isPublished) || []

  // Find next service for bottom navigation
  const currentIndex = SERVICES.findIndex((s) => s.slug === slug)
  const nextService = SERVICES[(currentIndex + 1) % SERVICES.length]

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pt-28 pb-24 selection:bg-[var(--accent)]/30">
        {/* Subtle background ambient luxury glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[var(--accent)]/10 blur-[140px] pointer-events-none" />

        <div className="relative max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16">
          {/* Breadcrumb / Back Link */}
          <div className="mb-10 sm:mb-14">
            <Link
              href="/#services"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors font-sans group"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
              <span>Back to Services</span>
            </Link>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              1. HERO SECTION (Service Identity & Philosophy)
             ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-16 items-start pb-16 sm:pb-20 border-b border-[var(--accent)]/15">
            <div>
              <div className="flex items-center gap-4 mb-5">
                <span className="font-mono text-sm tracking-[0.25em] text-[var(--accent)]">
                  {service.number}
                </span>
                <span className="w-8 h-px bg-[var(--accent)]/50" />
                <span className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.26em] text-[var(--accent)] font-medium">
                  {service.subtitle}
                </span>
              </div>

              <h1
                className="font-serif font-light text-[var(--text-primary)] tracking-tight leading-[0.98] mb-6"
                style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.8rem)' }}
              >
                {service.title}
              </h1>

              {service.tagline && (
                <p className="font-serif italic text-lg sm:text-2xl text-[var(--accent-light)] font-light mb-6 leading-relaxed max-w-2xl">
                  &ldquo;{service.tagline}&rdquo;
                </p>
              )}

              <p className="font-sans text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed font-light max-w-2xl mb-8">
                {service.heroDescription}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-7 py-3 bg-[var(--accent)] hover:bg-[var(--accent-light)] text-[var(--bg-primary)] text-[11px] uppercase tracking-[0.2em] font-sans font-medium rounded-full transition-all duration-300 hover:scale-[1.02]"
                >
                  Schedule Private Consultation
                </Link>
                <Link
                  href="/properties"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--accent)]/30 hover:border-[var(--accent)] text-[var(--text-primary)] text-[11px] uppercase tracking-[0.2em] font-sans font-medium rounded-full transition-all duration-300 hover:bg-[var(--accent)]/10"
                >
                  <span>Explore Portfolio</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* Emblem Card & Key Architectural Tenets */}
            <div className="bg-[var(--bg-card)]/80 rounded-[4px] p-8 border border-[var(--accent)]/20 backdrop-blur-md">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--accent)]/15">
                <ServiceEmblem type={service.iconType} />
                <span className="text-[10px] font-mono tracking-[0.24em] text-[var(--accent)] uppercase">
                  APEX ARCHITECTURAL FOCUS
                </span>
              </div>

              <div className="space-y-4">
                {service.architecturalFocus.map((focus, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span className="font-sans text-[13px] text-[var(--text-primary)] font-light">
                      {focus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              2. REPRESENTATIVE RESIDENCES (Dynamic from DB)
             ════════════════════════════════════════════════════════════════ */}
          {assignedProperties.length > 0 && (
            <div className="py-16 sm:py-20 border-b border-[var(--accent)]/15">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-[var(--accent)] block mb-1">
                    REPRESENTATIVE RESIDENCES
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-light text-[var(--text-primary)]">
                    Signature Properties in {service.title}
                  </h2>
                </div>
                <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--text-muted)] uppercase hidden sm:inline-block">
                  {assignedProperties.length} PROPERTIES
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {assignedProperties.map((p) => {
                  const countrySlug =
                    p.country?.slug ||
                    (p.cityName?.toLowerCase() === 'mumbai' || p.cityName?.toLowerCase() === 'hyderabad'
                      ? 'india'
                      : p.cityName?.toLowerCase() === 'milan'
                      ? 'italy'
                      : 'dubai')
                  return (
                    <div
                      key={p.id}
                      className="group bg-[var(--bg-card)]/70 rounded-[4px] overflow-hidden border border-[var(--accent)]/15 hover:border-[var(--accent)]/40 transition-all duration-300"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={p.mainImage || p.images[0]?.url || '/images/DuabiCoolection.png'}
                          alt={p.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-80" />
                      </div>

                      <div className="p-6">
                        <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] block mb-1">
                          {p.type} · {p.cityName || p.country?.name}
                        </span>
                        <h3 className="font-serif text-xl text-[var(--text-primary)] mb-2">{p.name}</h3>
                        <p className="font-sans text-xs text-[var(--text-muted)] mb-4">{p.beds}</p>
                        <Link
                          href={`/properties/${countrySlug}/${p.slug}`}
                          className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-[0.18em] text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          <span>View Residence</span>
                          <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              3. VISUAL SHOWCASE AREA (Architectural Photography)
             ════════════════════════════════════════════════════════════════ */}
          <div className="py-16 sm:py-20 border-b border-[var(--accent)]/15">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-[var(--accent)] block mb-1">
                  VISUAL PORTFOLIO
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-light text-[var(--text-primary)]">
                  Spatial Craft &amp; Environment
                </h2>
              </div>
              <span className="hidden sm:inline-block font-mono text-[10px] tracking-[0.22em] text-[var(--text-muted)] uppercase">
                REPRESENTATIVE ARCHITECTURE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main wide photographic frame */}
              <div className="md:col-span-2 relative aspect-[16/10] rounded-[4px] overflow-hidden border border-[var(--accent)]/20 shadow-2xl">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--accent)] uppercase block mb-1">
                    Apex Pacific Holdings
                  </span>
                  <p className="font-serif text-lg sm:text-xl text-[var(--text-primary)] font-light">
                    {service.subtitle} — Architectural Study
                  </p>
                </div>
              </div>

              {/* Secondary architectural detail showcase */}
              <div className="bg-[var(--bg-card)]/70 rounded-[4px] p-6 sm:p-8 border border-[var(--accent)]/15 flex flex-col justify-between">
                <div>
                  <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] block mb-3 font-medium">
                    STUDIO PRACTICE
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] font-light mb-4">
                    End-to-End Precision
                  </h3>
                  <p className="font-sans text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed font-light mb-6">
                    Our interdisciplinary team bridges land selection, spatial configuration, structural engineering, and finishing under one roof. No intermediaries, no lost intent.
                  </p>
                </div>

                <div className="pt-6 border-t border-[var(--accent)]/15">
                  <span className="font-mono text-[10px] tracking-[0.22em] text-[var(--accent)] block mb-1 uppercase">
                    EST. STANDARD
                  </span>
                  <p className="font-serif italic text-sm text-[var(--accent-light)]">
                    Designed to endure across generations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              4. CAPABILITIES & DELIVERABLES SPECIFICATION
             ════════════════════════════════════════════════════════════════ */}
          <div className="py-16 sm:py-20 border-b border-[var(--accent)]/15">
            <div className="max-w-2xl mb-12">
              <span className="font-sans text-[11px] uppercase tracking-[0.24em] text-[var(--accent)] block mb-2">
                SCOPE OF ENGAGEMENT
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-light text-[var(--text-primary)] tracking-tight mb-4">
                Structured Deliverables
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-light">
                Every project is guided by our bespoke delivery framework, balancing creative liberty with rigorous architectural accountability.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {service.deliverables.map((item, index) => (
                <div
                  key={index}
                  className="p-6 sm:p-8 rounded-[4px] bg-[var(--bg-card)]/50 border border-[var(--accent)]/15 hover:border-[var(--accent)]/40 transition-colors duration-300"
                >
                  <span className="font-mono text-xs text-[var(--accent)] tracking-widest block mb-3">
                    0{index + 1}
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl text-[var(--text-primary)] font-light mb-2.5">
                    {item.title}
                  </h3>
                  <p className="font-sans text-xs sm:text-[13px] text-[var(--text-muted)] leading-relaxed font-light">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              5. NEXT SERVICE & DIRECT NAVIGATION
             ════════════════════════════════════════════════════════════════ */}
          <div className="pt-16 sm:pt-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <Link
              href="/#services"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors font-sans"
            >
              <ArrowLeft size={14} />
              <span>All Services</span>
            </Link>

            <Link
              href={nextService.route}
              className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors font-sans group"
            >
              <span>Next: {nextService.title}</span>
              <div className="w-8 h-8 rounded-full border border-[var(--accent)]/40 group-hover:border-[var(--accent)] flex items-center justify-center text-[var(--accent)] transition-all group-hover:translate-x-1">
                <ArrowRight size={13} />
              </div>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
