'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { themeTokens } from '@/lib/theme'
import { cn } from '@/lib/utils'

export interface FooterItemSummary {
  id: string
  slug: string
  name: string
  displayName?: string | null
}

export interface FooterProps {
  initialServices?: FooterItemSummary[]
  initialCountries?: FooterItemSummary[]
}

export function Footer({ initialServices, initialCountries }: FooterProps = {}) {
  const currentYear = new Date().getFullYear()
  const pathname = usePathname()
  const router = useRouter()
  const { isLight } = useTheme()
  const [services, setServices] = React.useState<FooterItemSummary[]>(initialServices || [])
  const [countries, setCountries] = React.useState<FooterItemSummary[]>(initialCountries || [])

  React.useEffect(() => {
    if (initialServices && initialServices.length > 0) setServices(initialServices)
    if (initialCountries && initialCountries.length > 0) setCountries(initialCountries)
  }, [initialServices, initialCountries])

  React.useEffect(() => {
    if ((!initialServices || initialServices.length === 0) || (!initialCountries || initialCountries.length === 0)) {
      fetch('/api/public/homepage')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return
          if (data.services && (!initialServices || initialServices.length === 0)) {
            setServices(data.services.map((s: any) => ({ id: s.id, slug: s.slug, name: s.name })))
          }
          if (data.countries && (!initialCountries || initialCountries.length === 0)) {
            setCountries(data.countries.map((c: any) => ({ id: c.id, slug: c.slug, name: c.name, displayName: c.displayName })))
          }
        })
        .catch(() => {})
    }
  }, [initialServices, initialCountries])

  const displayServices = services.length > 0 ? services : [
    { id: '1', slug: 'luxury-villas', name: 'Luxury Villas' },
    { id: '2', slug: 'sky-residences', name: 'Sky Residences' },
    { id: '3', slug: 'commercial-properties', name: 'Commercial Properties' },
  ]

  const displayDestinations = countries.length > 0 ? countries : [
    { id: '1', slug: 'dubai', name: 'Dubai & Abu Dhabi' },
    { id: '2', slug: 'thailand', name: 'Phuket, Thailand' },
    { id: '3', slug: 'australia', name: 'Sydney & Melbourne' },
  ]

  const countryStripText = countries.length > 0
    ? countries.map((c) => (c.displayName || c.name).toUpperCase()).join(' · ')
    : 'UAE · THAILAND · MALAYSIA · AUSTRALIA · GEORGIA'

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === '/#contact') {
      e.preventDefault()
      if (pathname === '/') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('open-contact'))
          try {
            history.pushState(null, '', '/#contact')
          } catch {}
        }
      } else {
        router.push('/contact')
      }
    }
  }

  return (
    <footer
      className={cn(
        "relative z-30 w-full overflow-hidden select-none pb-[calc(env(safe-area-inset-bottom)+75px)] sm:pb-0 border-t transition-colors duration-300",
        themeTokens.footer.container(isLight)
      )}
      aria-label="Apex Pacific Holdings Footer"
    >
      {/* Subtle ambient deep glow */}
      <div
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[180px] pointer-events-none transition-opacity duration-500",
          themeTokens.footer.glow(isLight)
        )}
        style={{
          background: isLight
            ? 'radial-gradient(ellipse at center, rgba(11, 19, 37, 0.04) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.18) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-7 sm:py-9 flex flex-col justify-between">
        {/* Top Row: Brand, Tagline & Explore Link */}
        <div className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b transition-colors duration-300",
          themeTokens.footer.divider(isLight)
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 border transition-colors duration-300",
              themeTokens.footer.logoBorder(isLight)
            )}>
              <Image
                src="/apex_pacific_holdings_logo.svg"
                alt="Apex Pacific Holdings"
                fill
                className="object-cover scale-[1.08]"
              />
            </div>
            <div>
              <span className={cn(
                "font-serif text-xs sm:text-sm font-light tracking-[0.24em] uppercase block leading-none transition-colors duration-300",
                themeTokens.footer.brandTitle(isLight)
              )}>
                APEX PACIFIC HOLDINGS
              </span>
              <span className={cn(
                "font-sans text-[10px] sm:text-[11px] font-light tracking-wide mt-1 block transition-colors duration-300",
                themeTokens.footer.brandTagline(isLight)
              )}>
                Exceptional properties. Considered living. A global perspective.
              </span>
            </div>
          </div>

          <Link
            href="/collection"
            className={cn(
              "group inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs uppercase tracking-[0.22em] transition-colors duration-200",
              themeTokens.footer.exploreLink(isLight)
            )}
          >
            <span>EXPLORE ALL LAUNCHES</span>
            <ArrowUpRight
              size={12}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        {/* Middle Navigation: Minimal 4-Column Compact Grid */}
        <div className={cn(
          "grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3.5 py-5 text-xs border-b transition-colors duration-300",
          themeTokens.footer.divider(isLight)
        )}>
          <div>
            <h4 className={cn(
              "font-mono text-[9px] sm:text-[10px] tracking-[0.24em] uppercase mb-1.5 transition-colors duration-300",
              themeTokens.footer.colHeading(isLight)
            )}>
              PORTFOLIO
            </h4>
            <ul className={cn("space-y-1 font-sans text-[11px] transition-colors duration-300", themeTokens.footer.colList(isLight))}>
              <li>
                <Link href="/#launches" className={cn("transition-colors", themeTokens.footer.colLink(isLight))}>
                  New Launches
                </Link>
              </li>
              <li>
                <Link href="/collection" className={cn("transition-colors", themeTokens.footer.colLink(isLight))}>
                  All Residences
                </Link>
              </li>
              <li>
                <Link href="/#communities" className={cn("transition-colors", themeTokens.footer.colLink(isLight))}>
                  The Collection
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={cn(
              "font-mono text-[9px] sm:text-[10px] tracking-[0.24em] uppercase mb-1.5 transition-colors duration-300",
              themeTokens.footer.colHeading(isLight)
            )}>
              SERVICES
            </h4>
            <ul className={cn("space-y-1 font-sans text-[11px] transition-colors duration-300", themeTokens.footer.colList(isLight))}>
              {displayServices.map((svc) => (
                <li key={svc.id || svc.slug}>
                  <Link href={`/services/${svc.slug}`} className={cn("transition-colors", themeTokens.footer.colLink(isLight))}>
                    {svc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={cn(
              "font-mono text-[9px] sm:text-[10px] tracking-[0.24em] uppercase mb-1.5 transition-colors duration-300",
              themeTokens.footer.colHeading(isLight)
            )}>
              DESTINATIONS
            </h4>
            <ul className={cn("space-y-1 font-sans text-[11px] transition-colors duration-300", themeTokens.footer.colList(isLight))}>
              {displayDestinations.map((c) => (
                <li key={c.id || c.slug}>
                  <Link href={`/collection/${c.slug}`} className={cn("transition-colors", themeTokens.footer.colLink(isLight))}>
                    {c.displayName || c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={cn(
              "font-mono text-[9px] sm:text-[10px] tracking-[0.24em] uppercase mb-1.5 transition-colors duration-300",
              themeTokens.footer.colHeading(isLight)
            )}>
              PRIVATE ADVISORY
            </h4>
            <ul className={cn("space-y-1 font-sans text-[11px] transition-colors duration-300", themeTokens.footer.colList(isLight))}>
              <li>
                <Link
                  href="/#contact"
                  onClick={(e) => handleLinkClick(e, '/#contact')}
                  className={cn("transition-colors", themeTokens.footer.colLink(isLight))}
                >
                  Register Interest
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  onClick={(e) => handleLinkClick(e, '/#contact')}
                  className={cn("transition-colors", themeTokens.footer.colLink(isLight))}
                >
                  Private Portfolio Dossier
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  onClick={(e) => handleLinkClick(e, '/#contact')}
                  className={cn("transition-colors", themeTokens.footer.colLink(isLight))}
                >
                  Direct Advisory Enquiries
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 text-[9px] sm:text-[10px] font-mono tracking-[0.18em] uppercase transition-colors duration-300",
          themeTokens.footer.bottomText(isLight)
        )}>
          <span>© {currentYear} APEX PACIFIC HOLDINGS. ALL RIGHTS RESERVED.</span>

          <div className={cn("flex items-center gap-3.5 transition-colors duration-300", themeTokens.footer.legalLinks(isLight))}>
            <Link href="/privacy" className={cn("transition-colors", themeTokens.footer.colLink(isLight))}>
              Privacy Policy
            </Link>
            <span className={themeTokens.footer.legalDot(isLight)}>·</span>
            <Link href="/terms" className={cn("transition-colors", themeTokens.footer.colLink(isLight))}>
              Terms &amp; Conditions
            </Link>
          </div>

          <div className={cn("text-[8.5px] sm:text-[9px] transition-colors duration-300", themeTokens.footer.bottomText(isLight))}>
            {countryStripText}
          </div>
        </div>
      </div>
    </footer>
  )
}
