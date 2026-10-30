'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === '/#contact') {
      e.preventDefault()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-contact'))
      }
    }
  }

  return (
    <footer
      className="relative w-full border-t border-white/10 bg-[#040810] text-[#F8FAFC] overflow-hidden select-none"
      aria-label="Apex Pacific Holdings Footer"
    >
      {/* Subtle ambient deep glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[180px] pointer-events-none opacity-20 blur-[100px]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.18) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-7 sm:py-9 flex flex-col justify-between">
        {/* Top Row: Brand, Tagline & Explore Link */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-white/20 shrink-0">
              <Image
                src="/apex_pacific_holdings_logo.svg"
                alt="Apex Pacific Holdings"
                fill
                className="object-cover scale-[1.08]"
              />
            </div>
            <div>
              <span className="font-serif text-xs sm:text-sm font-light tracking-[0.24em] text-white uppercase block leading-none">
                APEX PACIFIC HOLDINGS
              </span>
              <span className="font-sans text-[10px] sm:text-[11px] text-[#94A3B8] font-light tracking-wide mt-1 block">
                Exceptional properties. Considered living. A global perspective.
              </span>
            </div>
          </div>

          <Link
            href="/properties"
            className="group inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs uppercase tracking-[0.22em] text-[#7DD3FC] hover:text-white transition-colors duration-200"
          >
            <span>EXPLORE ALL LAUNCHES</span>
            <ArrowUpRight
              size={12}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        {/* Middle Navigation: Minimal 4-Column Compact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3.5 py-5 text-xs border-b border-white/[0.08]">
          <div>
            <h4 className="font-mono text-[9px] sm:text-[10px] font-semibold tracking-[0.24em] text-[#7DD3FC] uppercase mb-1.5">
              PORTFOLIO
            </h4>
            <ul className="space-y-1 font-sans text-[11px] text-[#94A3B8]">
              <li>
                <Link href="/#launches" className="hover:text-white transition-colors">
                  New Launches
                </Link>
              </li>
              <li>
                <Link href="/properties" className="hover:text-white transition-colors">
                  All Residences
                </Link>
              </li>
              <li>
                <Link href="/#communities" className="hover:text-white transition-colors">
                  The Collection
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[9px] sm:text-[10px] font-semibold tracking-[0.24em] text-[#7DD3FC] uppercase mb-1.5">
              SERVICES
            </h4>
            <ul className="space-y-1 font-sans text-[11px] text-[#94A3B8]">
              <li>
                <Link href="/services/luxury-villas" className="hover:text-white transition-colors">
                  Luxury Villas
                </Link>
              </li>
              <li>
                <Link href="/services/sky-residences" className="hover:text-white transition-colors">
                  Sky Residences
                </Link>
              </li>
              <li>
                <Link href="/services/commercial-properties" className="hover:text-white transition-colors">
                  Commercial Properties
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[9px] sm:text-[10px] font-semibold tracking-[0.24em] text-[#7DD3FC] uppercase mb-1.5">
              DESTINATIONS
            </h4>
            <ul className="space-y-1 font-sans text-[11px] text-[#94A3B8]">
              <li>
                <Link href="/destinations/uae" className="hover:text-white transition-colors">
                  Dubai &amp; Abu Dhabi
                </Link>
              </li>
              <li>
                <Link href="/destinations/thailand" className="hover:text-white transition-colors">
                  Phuket, Thailand
                </Link>
              </li>
              <li>
                <Link href="/destinations/australia" className="hover:text-white transition-colors">
                  Sydney &amp; Melbourne
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[9px] sm:text-[10px] font-semibold tracking-[0.24em] text-[#7DD3FC] uppercase mb-1.5">
              PRIVATE ADVISORY
            </h4>
            <ul className="space-y-1 font-sans text-[11px] text-[#94A3B8]">
              <li>
                <Link
                  href="/#contact"
                  onClick={(e) => handleLinkClick(e, '/#contact')}
                  className="hover:text-white transition-colors"
                >
                  Register Interest
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  onClick={(e) => handleLinkClick(e, '/#contact')}
                  className="hover:text-white transition-colors"
                >
                  Private Portfolio Dossier
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  onClick={(e) => handleLinkClick(e, '/#contact')}
                  className="hover:text-white transition-colors"
                >
                  Direct Advisory Enquiries
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 text-[9px] sm:text-[10px] font-mono tracking-[0.18em] uppercase text-[#64748B]">
          <span>© {currentYear} APEX PACIFIC HOLDINGS. ALL RIGHTS RESERVED.</span>

          <div className="flex items-center gap-3.5 text-[#94A3B8]">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-white/20">·</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>

          <div className="text-[8.5px] sm:text-[9px] text-[#64748B]">
            UAE · THAILAND · MALAYSIA · AUSTRALIA · GEORGIA
          </div>
        </div>
      </div>
    </footer>
  )
}
