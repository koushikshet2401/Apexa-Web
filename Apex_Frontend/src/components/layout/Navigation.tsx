'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Sparkles,
  MapPin,
  MessageSquare,
  Grid2X2,
  ChevronRight,
  X,
  ArrowRight,
} from 'lucide-react'

// Primary links matching Emaar layout (Screenshot 1)
const primaryNavLinks = [
  { label: 'Home', href: '/#home' },
  { label: 'New Launches', href: '/#launches' },
  { label: 'Communities', href: '/#communities' },
  { label: 'Delivered', href: '/properties' },
  { label: 'About Apex', href: '/#about' },
]

export function Navigation({ hasHero }: { hasHero?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showBottomNav, setShowBottomNav] = useState(false)
  const [activeBottomNav, setActiveBottomNav] = useState('home')
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const isHome = window.location.pathname === '/'

    const handleHeroInView = (e: Event) => {
      const customEvent = e as CustomEvent<{ isHero?: boolean }>
      if (isHome) {
        if (customEvent.detail?.isHero) {
          setShowBottomNav(false)
        } else {
          setShowBottomNav(true)
        }
      }
    }

    const onScroll = () => {
      setScrolled(window.scrollY > 40)

      // Hide mobile bottom nav strictly on the hero section.
      // Show ONLY once the user scrolls into the "New Launches" section.
      if (isHome) {
        if (window.scrollY < window.innerHeight * 1.2) {
          setShowBottomNav(false)
        } else {
          setShowBottomNav(true)
        }
      } else {
        setShowBottomNav(true)
      }

      // Auto-detect active section for bottom navigation highlight
      const scrollPos = window.scrollY + 300
      const contactEl = document.getElementById('contact')
      const communitiesEl = document.getElementById('communities')
      const launchesEl = document.getElementById('launches')

      if (contactEl && scrollPos >= contactEl.offsetTop) {
        setActiveBottomNav('enquiry')
      } else if (communitiesEl && scrollPos >= communitiesEl.offsetTop) {
        setActiveBottomNav('communities')
      } else if (launchesEl && scrollPos >= launchesEl.offsetTop) {
        setActiveBottomNav('launches')
      } else {
        setActiveBottomNav('home')
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('hero-in-view', handleHeroInView)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('hero-in-view', handleHeroInView)
    }
  }, [])

  // Focus trap: when menu opens, focus close button
  useEffect(() => {
    if (menuOpen) closeRef.current?.focus()
  }, [menuOpen])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const openContactModal = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    setMenuOpen(false)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-contact'))
    }
  }

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (id === 'contact') {
      e.preventDefault()
      openContactModal()
      return
    }
    if (window.location.pathname === '/') {
      e.preventDefault()
      const lenis = (window as unknown as { __lenis?: { scrollTo: (target: string | number, options?: { duration?: number }) => void } }).__lenis
      if (id === 'home') {
        if (lenis) {
          lenis.scrollTo(0, { duration: 1.4 })
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } else if (id === 'launches') {
        if (lenis) {
          lenis.scrollTo(window.innerHeight * 1.6, { duration: 1.4 })
        } else {
          window.scrollTo({ top: window.innerHeight * 1.6, behavior: 'smooth' })
        }
      } else {
        const el = document.getElementById(id)
        if (el) {
          if (lenis) {
            lenis.scrollTo(`#${id}`, { duration: 1.4 })
          } else {
            el.scrollIntoView({ behavior: 'smooth' })
          }
        }
      }
    }
  }

  return (
    <>
      {/* ─── DESKTOP & TOP HEADER ────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          background: scrolled
            ? 'rgba(4, 8, 16, 0.92)'
            : 'linear-gradient(to bottom, rgba(4,8,16,0.80) 0%, transparent 100%)',
          backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(203,213,225,0.10)' : 'none',
          transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease',
        }}
      >
        <div
          className="flex items-center justify-between px-5 sm:px-8 lg:px-12"
          style={{ height: 'clamp(64px, 6vw, 80px)' }}
        >
          {/* LEFT: Hamburger Menu Button */}
          <div className="flex items-center gap-3">
            <button
              id="nav-hamburger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              className="group flex items-center gap-3 py-2 px-1 text-white hover:text-sky-300 transition-colors focus:outline-none cursor-pointer"
            >
              <div className="flex flex-col gap-1.5 items-start">
                <span className="block w-6 h-[1.5px] bg-[#F8FAFC] group-hover:bg-sky-300 transition-all group-hover:w-7" />
                <span className="block w-4 h-[1.5px] bg-[#F8FAFC] group-hover:bg-sky-300 transition-all group-hover:w-7" />
                <span className="block w-5 h-[1.5px] bg-[#F8FAFC] group-hover:bg-sky-300 transition-all group-hover:w-7" />
              </div>
              <span className="hidden sm:inline-block font-mono text-[10px] tracking-[0.22em] uppercase text-[#CBD5E1]">
                MENU
              </span>
            </button>
          </div>

          {/* CENTER: Brand Logo Wordmark */}
          <Link
            href="/"
            id="navbar-brand"
            aria-label="Apex Pacific Holdings — Home"
            className="text-center transition-opacity hover:opacity-90 flex items-center"
          >
            <span
              className="block font-serif font-light text-white tracking-[0.30em] uppercase select-none"
              style={{ fontSize: 'clamp(0.75rem, 1.4vw, 0.95rem)' }}
            >
              APEX PACIFIC HOLDINGS
            </span>
          </Link>

          {/* RIGHT: Register Interest / Contact CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/#contact"
              onClick={(e) => scrollToSection(e, 'contact')}
              id="nav-contact-cta"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full border border-sky-400/30 hover:border-sky-400 text-white hover:text-sky-200 text-[11px] font-mono tracking-[0.18em] uppercase bg-sky-400/[0.06] hover:bg-sky-400/15 transition-all duration-300"
            >
              <span>ENQUIRE</span>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ─── MOBILE FIXED BOTTOM NAVIGATION BAR ──────────────────────────── */}
      {/* Hidden strictly on Hero, slides up gracefully once entered into New Launches */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#040810]/95 backdrop-blur-xl border-t border-white/10 px-2 py-2 transition-all duration-500 ease-out ${showBottomNav
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0 pointer-events-none'
          }`}
        style={{ boxShadow: '0 -10px 30px rgba(0,0,0,0.7)' }}
      >
        <div className="grid grid-cols-5 items-center">
          {/* 1. HOME */}
          <Link
            href="/#home"
            onClick={(e) => {
              setActiveBottomNav('home')
              scrollToSection(e, 'home')
            }}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${activeBottomNav === 'home' ? 'text-sky-400 font-medium' : 'text-[#94A3B8] hover:text-white'
              }`}
          >
            <Home size={18} strokeWidth={activeBottomNav === 'home' ? 2 : 1.5} />
            <span className="text-[9px] font-mono tracking-wider uppercase mt-1">HOME</span>
          </Link>

          {/* 2. LAUNCHES */}
          <Link
            href="/#launches"
            onClick={(e) => {
              setActiveBottomNav('launches')
              scrollToSection(e, 'launches')
            }}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${activeBottomNav === 'launches' ? 'text-sky-400 font-medium' : 'text-[#94A3B8] hover:text-white'
              }`}
          >
            <Sparkles size={18} strokeWidth={activeBottomNav === 'launches' ? 2 : 1.5} />
            <span className="text-[9px] font-mono tracking-wider uppercase mt-1">LAUNCHES</span>
          </Link>

          {/* 3. COMMUNITIES */}
          <Link
            href="/#communities"
            onClick={(e) => {
              setActiveBottomNav('communities')
              scrollToSection(e, 'communities')
            }}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${activeBottomNav === 'communities' ? 'text-sky-400 font-medium' : 'text-[#94A3B8] hover:text-white'
              }`}
          >
            <MapPin size={18} strokeWidth={activeBottomNav === 'communities' ? 2 : 1.5} />
            <span className="text-[9px] font-mono tracking-wider uppercase mt-1">COMMUNITIES</span>
          </Link>

          {/* 4. ENQUIRY */}
          <Link
            href="/#contact"
            onClick={(e) => {
              setActiveBottomNav('enquiry')
              scrollToSection(e, 'contact')
            }}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${activeBottomNav === 'enquiry' ? 'text-sky-400 font-medium' : 'text-[#94A3B8] hover:text-white'
              }`}
          >
            <MessageSquare size={18} strokeWidth={activeBottomNav === 'enquiry' ? 2 : 1.5} />
            <span className="text-[9px] font-mono tracking-wider uppercase mt-1">ENQUIRE</span>
          </Link>

          {/* 5. MORE (Opens Full-Screen Menu) */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open full-screen menu"
            className="flex flex-col items-center justify-center py-1 text-[#94A3B8] hover:text-white transition-colors focus:outline-none cursor-pointer"
          >
            <Grid2X2 size={18} strokeWidth={1.5} />
            <span className="text-[9px] font-mono tracking-wider uppercase mt-1">MORE</span>
          </button>
        </div>
      </nav>

      {/* ─── FULL-SCREEN NAVIGATION OVERLAY (Screenshot 1 Reference) ────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-50 bg-[#040810] text-[#F8FAFC] flex flex-col overflow-y-auto"
          >
            {/* Top Bar matching Emaar Screenshot 1 */}
            <div className="flex items-center justify-between px-6 sm:px-12 py-6 border-b border-white/10 shrink-0">
              <span className="font-serif font-light text-white tracking-[0.28em] text-sm uppercase">
                APEX PACIFIC HOLDINGS
              </span>

              <button
                ref={closeRef}
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
                className="w-10 h-10 rounded-full border border-white/20 hover:border-white flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu Body */}
            <div className="flex-1 max-w-5xl w-full mx-auto px-6 sm:px-12 py-8 sm:py-10 flex flex-col justify-between">
              {/* Primary Nav List (Home, New Launches, Communities, Delivered, About Apex) */}
              <nav aria-label="Main Navigation Menu" className="divide-y divide-white/[0.08] mb-10">
                {primaryNavLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-center justify-between py-4 sm:py-5 text-white hover:text-sky-300 transition-colors"
                  >
                    <span className="font-serif text-2xl sm:text-4xl font-light tracking-tight">
                      {item.label}
                    </span>
                    <ChevronRight
                      size={20}
                      className="text-[#64748B] group-hover:text-sky-300 group-hover:translate-x-1.5 transition-all"
                    />
                  </Link>
                ))}
              </nav>

              {/* 3 Secondary Columns: EXPLORE, ABOUT, CONNECT (Screenshot 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 border-t border-white/10">
                {/* EXPLORE */}
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[11px] tracking-[0.25em] text-[#64748B] uppercase font-semibold">
                    EXPLORE
                  </span>
                  <div className="flex flex-col gap-2 text-xs sm:text-sm text-[#CBD5E1] font-light">
                    <Link href="/#launches" onClick={() => setMenuOpen(false)} className="hover:text-sky-300 transition-colors">
                      New launches
                    </Link>
                    <Link href="/#communities" onClick={() => setMenuOpen(false)} className="hover:text-sky-300 transition-colors">
                      Communities
                    </Link>
                    <Link href="/properties" onClick={() => setMenuOpen(false)} className="hover:text-sky-300 transition-colors">
                      Delivered Projects
                    </Link>
                    <Link href="/services/luxury-villas" onClick={() => setMenuOpen(false)} className="hover:text-sky-300 transition-colors">
                      Luxury Villas
                    </Link>
                    <Link href="/services/sky-residences" onClick={() => setMenuOpen(false)} className="hover:text-sky-300 transition-colors">
                      Sky Residences
                    </Link>
                    <Link href="/services/commercial-properties" onClick={() => setMenuOpen(false)} className="hover:text-sky-300 transition-colors">
                      Commercial Properties
                    </Link>
                  </div>
                </div>

                {/* ABOUT */}
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[11px] tracking-[0.25em] text-[#64748B] uppercase font-semibold">
                    ABOUT
                  </span>
                  <div className="flex flex-col gap-2 text-xs sm:text-sm text-[#CBD5E1] font-light">
                    <Link href="/#about" onClick={() => setMenuOpen(false)} className="hover:text-sky-300 transition-colors">
                      Who we are
                    </Link>
                    <Link href="/#about" onClick={() => setMenuOpen(false)} className="hover:text-sky-300 transition-colors">
                      Heritage &amp; Craft
                    </Link>
                    <Link href="/#portfolio" onClick={() => setMenuOpen(false)} className="hover:text-sky-300 transition-colors">
                      Disciplined Practice
                    </Link>
                    <Link href="/#communities" onClick={() => setMenuOpen(false)} className="hover:text-sky-300 transition-colors">
                      Global Footprint
                    </Link>
                    <Link href="/#contact" onClick={(e) => openContactModal(e)} className="hover:text-sky-300 transition-colors">
                      Confidential Advisory
                    </Link>
                  </div>
                </div>

                {/* CONNECT */}
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[11px] tracking-[0.25em] text-[#64748B] uppercase font-semibold">
                    CONNECT
                  </span>
                  <div className="flex flex-col gap-2 text-xs sm:text-sm text-[#CBD5E1] font-light">
                    <Link href="/#contact" onClick={(e) => openContactModal(e)} className="hover:text-sky-300 transition-colors">
                      Get in touch
                    </Link>
                    <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="hover:text-sky-300 transition-colors">
                      WhatsApp Advisory
                    </a>
                    <Link href="/#contact" onClick={(e) => openContactModal(e)} className="hover:text-sky-300 transition-colors">
                      Client Advisory
                    </Link>
                    <Link href="/#contact" onClick={(e) => openContactModal(e)} className="hover:text-sky-300 transition-colors">
                      Concierge Support
                    </Link>
                    <Link href="/#contact" onClick={(e) => openContactModal(e)} className="hover:text-sky-300 transition-colors">
                      Contact Us
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom Box: EXPLORE ALL OF APEX PACIFIC HOLDINGS -> (Screenshot 1) */}
              <div className="pt-6 border-t border-white/10">
                <Link
                  href="/properties"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 rounded-lg border border-sky-400/30 hover:border-sky-400 bg-sky-400/[0.04] hover:bg-sky-400/10 transition-colors group"
                >
                  <span className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase text-white group-hover:text-sky-200">
                    EXPLORE ALL OF APEX PACIFIC HOLDINGS
                  </span>
                  <ArrowRight size={16} className="text-sky-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Sub-footer details */}
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono tracking-widest uppercase text-[#64748B]">
                <span>UAE · THAILAND · MALAYSIA · AUSTRALIA · GEORGIA</span>
                <span>CONFIDENTIAL ADVISORY</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
