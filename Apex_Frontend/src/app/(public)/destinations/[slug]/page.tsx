import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Navigation } from '@/components/layout/Navigation'
import { Footer } from '@/components/layout/Footer'
import { DESTINATIONS } from '@/data/destinations'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'

export async function generateStaticParams() {
  return DESTINATIONS.map((d) => ({
    slug: d.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const destination = DESTINATIONS.find((d) => d.slug === slug)

  if (!destination) {
    return { title: 'Destination Not Found — Apex Pacific Holdings' }
  }

  return {
    title: `${destination.country} Residences — Apex Pacific Holdings`,
    description: destination.description,
  }
}

export default async function DestinationLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const destination = DESTINATIONS.find((d) => d.slug === slug)

  if (!destination) {
    notFound()
  }

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
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors mb-12 font-sans"
          >
            <ArrowLeft size={14} />
            <span>Back to Collection</span>
          </Link>

          {/* Destination Header */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start pb-16 border-b border-[var(--accent)]/15">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-px bg-[var(--accent)]" />
                <span className="font-sans text-xs uppercase tracking-[0.25em] text-[var(--accent)]">
                  {destination.region}
                </span>
              </div>
              <h1 className="font-serif text-4xl sm:text-6xl text-[var(--text-primary)] font-light mb-4">
                {destination.country}
              </h1>
              <p className="font-sans text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)] mb-6">
                {destination.cities}
              </p>
              <p className="font-sans text-[var(--text-secondary)] text-sm sm:text-base leading-relaxed font-light max-w-xl">
                {destination.description}
              </p>
            </div>

            {/* Destination Image Showcase */}
            <div className="relative w-full aspect-[16/10] rounded-[4px] overflow-hidden border border-[var(--accent)]/20 shadow-2xl">
              <Image
                src={destination.image}
                alt={destination.country}
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
                  Signature Projects in {destination.country}
                </h2>
              </div>
              <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)] uppercase hidden sm:inline-block">
                {destination.projects.length} PROPERTIES RECORDED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {destination.projects.map((project) => (
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
                      href={`/properties/${project.slug}`}
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
