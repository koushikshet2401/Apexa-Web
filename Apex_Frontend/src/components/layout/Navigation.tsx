'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Sparkles,
  Building2,
  MessageSquare,
  Grid2X2,
  ChevronRight,
  X,
  ArrowRight,
} from 'lucide-react'
import CinematicThemeSwitcher from '@/components/ui/cinematic-theme-switcher'
import { useTheme } from '@/components/providers/ThemeProvider'

// Primary links matching luxury editorial layout
const primaryNavLinks = [
  { label: 'Home', href: '/#home', id: 'home' },
  { label: 'New Launches', href: '/#launches', id: 'launches' },
  { label: 'Residences', href: '/#collection', id: 'collection' },
  { label: 'About Apex', href: '/#about', id: 'about' },
]

export interface NavItemSummary {
  id: string
  slug: string
  name: string
  displayName?: string | null
}

export interface NavigationProps {
  hasHero?: boolean
  initialServices?: NavItemSummary[]
  initialCountries?: NavItemSummary[]
  whatsappNumber?: string | null
}

export function Navigation({
  hasHero,
  initialServices,
  initialCountries,
  whatsappNumber,
}: NavigationProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showBottomNav, setShowBottomNav] = useState(false)
  const [activeBottomNav, setActiveBottomNav] = useState('home')
  const [services, setServices] = useState<NavItemSummary[]>(initialServices || [])
  const [countries, setCountries] = useState<NavItemSummary[]>(initialCountries || [])
  const [waNumber, setWaNumber] = useState<string | null>(whatsappNumber || null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (initialServices && initialServices.length > 0) setServices(initialServices)
    if (initialCountries && initialCountries.length > 0) setCountries(initialCountries)
    if (whatsappNumber !== undefined) setWaNumber(whatsappNumber)
  }, [initialServices, initialCountries, whatsappNumber])

  useEffect(() => {
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
          if (data.contactWhatsappNumber && !whatsappNumber) {
            setWaNumber(data.contactWhatsappNumber)
          }
        })
        .catch(() => {})
    }
  }, [initialServices, initialCountries, whatsappNumber])

  const displayServices = services.length > 0 ? services : [
    { id: '1', slug: 'luxury-villas', name: 'Luxury Villas' },
    { id: '2', slug: 'sky-residences', name: 'Sky Residences' },
    { id: '3', slug: 'commercial-properties', name: 'Commercial Properties' },
  ]

  const cleanWhatsAppDigits = (waNumber || '').replace(/[^0-9]/g, '')
  const whatsappHref = cleanWhatsAppDigits ? `https://wa.me/${cleanWhatsAppDigits}` : 'https://wa.me/'

  const countryStripText = countries.length > 0
    ? countries.map((c) => (c.displayName || c.name).toUpperCase()).join(' · ')
    : 'UAE · THAILAND · MALAYSIA · AUSTRALIA · GEORGIA'

  const isLight = mounted && (theme === 'light' || resolvedTheme === 'light')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const isHome = pathname === '/'

    if (!isHome) {
      if (pathname?.startsWith('/collection')) {
        setActiveBottomNav('residences')
      } else if (pathname === '/contact') {
        setActiveBottomNav('enquiry')
      } else if (pathname?.startsWith('/services')) {
        setActiveBottomNav('residences')
      }
    } else if (pathname?.startsWith('/collection')) {
      setActiveBottomNav('residences')
    }

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

    const handleStepChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ progress?: number; step?: number }>
      if (isHome && customEvent.detail?.progress !== undefined) {
        const p = customEvent.detail.progress
        if (p < 0.04) {
          setActiveBottomNav('home')
        } else if (p < 0.40) {
          setActiveBottomNav('launches')
        } else if (p < 0.90) {
          setActiveBottomNav('residences')
        } else {
          setActiveBottomNav('enquiry')
        }
      }
    }

    const onScroll = () => {
      setScrolled(window.scrollY > 40)

      // Hide mobile bottom nav strictly on the hero section.
      // Show ONLY once the user scrolls into the "New Launches" section.
      if (isHome) {
        if (window.scrollY < window.innerHeight * 0.35) {
          setShowBottomNav(false)
        } else {
          setShowBottomNav(true)
        }
      } else {
        // On non-home pages (e.g. collection country pages), keep bottom nav hidden on top hero
        setShowBottomNav(true)
        if (false && window.scrollY < window.innerHeight * 0.75) {
          setShowBottomNav(false)
        } else {
          setShowBottomNav(true)
        }
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('hero-in-view', handleHeroInView)
    const handleHashSync = () => {
      if (isHome) {
        const hash = (window.location.hash || '').replace('#', '').toLowerCase()
        if (hash === 'home' || hash === '') {
          setActiveBottomNav('home')
        } else if (hash === 'launches') {
          setActiveBottomNav('launches')
        } else if (hash === 'collection' || hash === 'communities' || hash === 'residences') {
          setActiveBottomNav('residences')
        } else if (hash === 'contact' || hash === 'enquiry' || hash === 'enquire') {
          setActiveBottomNav('enquiry')
        }
      }
    }
    handleHashSync()
    window.addEventListener('hashchange', handleHashSync)
    window.addEventListener('popstate', handleHashSync)
    window.addEventListener('apex-step-change', handleStepChange)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('hero-in-view', handleHeroInView)
      window.removeEventListener('hashchange', handleHashSync)
      window.removeEventListener('popstate', handleHashSync)
      window.removeEventListener('apex-step-change', handleStepChange)
    }
  }, [pathname])

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

  const closeMenu = () => {
    setMenuOpen(false)
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
    const lenis = (window as unknown as { __lenis?: { start: () => void } }).__lenis
    lenis?.start()
  }

  // Lock body scroll when menu is open and guarantee cleanup
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
      lenis?.stop()
      closeRef.current?.focus()
    } else {
      document.body.style.overflow = ''
      lenis?.start()
    }
    return () => {
      document.body.style.overflow = ''
      lenis?.start()
    }
  }, [menuOpen])

  const openContactModal = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    closeMenu()
    if (typeof window !== 'undefined') {
      if (pathname === '/') {
        window.dispatchEvent(new CustomEvent('open-contact'))
        try {
          history.pushState(null, '', '/#contact')
        } catch {}
      } else {
        router.push('/contact')
      }
    }
  }

  const navigateToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    closeMenu()

    if (id === 'contact' || id === 'enquiry') {
      if (pathname === '/') {
        window.dispatchEvent(new CustomEvent('close-contact'))
        window.dispatchEvent(new CustomEvent('apex-navigate', { detail: { target: 'contact', immediate: false } }))
        try {
          history.pushState(null, '', '/#contact')
        } catch {}
      } else {
        router.push('/contact')
      }
      return
    }

    if (id === 'home') {
      if (pathname === '/') {
        const lenis = (window as unknown as { __lenis?: { scrollTo: (target: number, opts?: { duration?: number; immediate?: boolean }) => void } }).__lenis
        if (lenis) {
          lenis.scrollTo(0, { duration: 0.8, immediate: false })
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        window.dispatchEvent(new CustomEvent('close-contact'))
        window.dispatchEvent(new CustomEvent('apex-navigate', { detail: { target: 'home', immediate: false } }))
        try {
          history.pushState(null, '', '/#home')
        } catch {}
      } else {
        router.push('/#home')
      }
      return
    }

    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('close-contact'))
      window.dispatchEvent(new CustomEvent('apex-navigate', { detail: { target: id, immediate: false } }))
      try {
        history.pushState(null, '', `/#${id}`)
      } catch {}
    } else {
      router.push(`/#${id}`)
    }
  }

  // Backwards compatibility alias
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    navigateToSection(e, id)
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
          background: isLight
            ? (scrolled ? 'rgba(251, 249, 246, 0.94)' : 'linear-gradient(to bottom, rgba(251,249,246,0.92) 0%, transparent 100%)')
            : (scrolled ? 'rgba(4, 8, 16, 0.92)' : 'linear-gradient(to bottom, rgba(4,8,16,0.80) 0%, transparent 100%)'),
          backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
          borderBottom: scrolled
            ? (isLight ? '1px solid rgba(11, 19, 37, 0.08)' : '1px solid rgba(203,213,225,0.10)')
            : 'none',
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
              suppressHydrationWarning
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              className={`group flex items-center gap-3 py-2 px-1 transition-colors focus:outline-none cursor-pointer ${
                isLight ? 'text-[#0B1325] hover:text-[#1D263B]' : 'text-white hover:text-sky-300'
              }`}
            >
              <div className="flex flex-col gap-1.5 items-start">
                <span className={`block w-6 h-[1.5px] transition-all group-hover:w-7 ${
                  isLight ? 'bg-[#0B1325] group-hover:bg-[#1D263B]' : 'bg-[#F8FAFC] group-hover:bg-sky-300'
                }`} />
                <span className={`block w-4 h-[1.5px] transition-all group-hover:w-7 ${
                  isLight ? 'bg-[#0B1325] group-hover:bg-[#1D263B]' : 'bg-[#F8FAFC] group-hover:bg-sky-300'
                }`} />
                <span className={`block w-5 h-[1.5px] transition-all group-hover:w-7 ${
                  isLight ? 'bg-[#0B1325] group-hover:bg-[#1D263B]' : 'bg-[#F8FAFC] group-hover:bg-sky-300'
                }`} />
              </div>
              <span className={`hidden sm:inline-block font-mono text-[10px] tracking-[0.22em] uppercase ${
                isLight ? 'text-[#6B6661]' : 'text-[#CBD5E1]'
              }`}>
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
              className={`block font-serif font-light tracking-[0.30em] uppercase select-none ${
                isLight ? 'text-[#0B1325]' : 'text-white'
              }`}
              style={{ fontSize: 'clamp(0.75rem, 1.4vw, 0.95rem)' }}
            >
              APEX PACIFIC HOLDINGS
            </span>
          </Link>

          {/* RIGHT: Register Interest / Contact CTA + Theme Switcher */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/#contact"
              onClick={(e) => scrollToSection(e, 'contact')}
              id="nav-contact-cta"
              className={`hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-mono tracking-[0.18em] uppercase transition-all duration-300 ${
                isLight
                  ? 'border border-[#0B1325]/15 bg-white text-[#0B1325] hover:border-[#0B1325]/40 hover:bg-[#F5F2EC] shadow-sm'
                  : 'border border-sky-400/30 hover:border-sky-400 text-white hover:text-sky-200 bg-sky-400/[0.06] hover:bg-sky-400/15'
              }`}
            >
              <span>ENQUIRE</span>
            </Link>
            <CinematicThemeSwitcher />
          </div>
        </div>
      </motion.header>

      {/* ─── MOBILE FIXED BOTTOM NAVIGATION BAR ──────────────────────────── */}
      {/* Hidden strictly on Hero, slides up gracefully once entered into New Launches */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl px-2 py-2 transition-all duration-500 ease-out ${
          isLight
            ? 'bg-[#FBF9F6]/95 border-t border-[#0B1325]/10 text-[#0B1325]'
            : 'bg-[#040810]/95 border-t border-white/10 text-white'
        } ${
          showBottomNav
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{
          boxShadow: isLight ? '0 -10px 30px rgba(0,0,0,0.06)' : '0 -10px 30px rgba(0,0,0,0.7)',
        }}
      >
        <div className="grid grid-cols-5 items-center">
          {/* 1. HOME */}
          <Link
            href="/#home"
            onClick={(e) => {
              setActiveBottomNav('home')
              navigateToSection(e, 'home')
            }}
            className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
              activeBottomNav === 'home'
                ? (isLight ? 'text-[#0B1325] font-semibold' : 'text-sky-400 font-medium')
                : (isLight ? 'text-[#6B6661] hover:text-[#0B1325]' : 'text-[#94A3B8] hover:text-white')
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
              navigateToSection(e, 'launches')
            }}
            className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
              activeBottomNav === 'launches'
                ? (isLight ? 'text-[#0B1325] font-semibold' : 'text-sky-400 font-medium')
                : (isLight ? 'text-[#6B6661] hover:text-[#0B1325]' : 'text-[#94A3B8] hover:text-white')
            }`}
          >
            <Sparkles size={18} strokeWidth={activeBottomNav === 'launches' ? 2 : 1.5} />
            <span className="text-[9px] font-mono tracking-wider uppercase mt-1">LAUNCHES</span>
          </Link>

          {/* 3. RESIDENCES (Takes user directly to /#collection) */}
          <Link
            href="/#collection"
            onClick={(e) => {
              setActiveBottomNav('residences')
              navigateToSection(e, 'collection')
            }}
            className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
              activeBottomNav === 'residences'
                ? (isLight ? 'text-[#0B1325] font-semibold' : 'text-sky-400 font-medium')
                : (isLight ? 'text-[#6B6661] hover:text-[#0B1325]' : 'text-[#94A3B8] hover:text-white')
            }`}
          >
            <Building2 size={18} strokeWidth={activeBottomNav === 'residences' ? 2 : 1.5} />
            <span className="text-[9px] font-mono tracking-wider uppercase mt-1">RESIDENCES</span>
          </Link>

          {/* 4. ENQUIRY */}
          <button
            type="button"
            onClick={(e) => {
              setActiveBottomNav('enquiry')
              navigateToSection(e, 'contact')
            }}
            className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
              activeBottomNav === 'enquiry'
                ? (isLight ? 'text-[#0B1325] font-semibold' : 'text-sky-400 font-medium')
                : (isLight ? 'text-[#6B6661] hover:text-[#0B1325]' : 'text-[#94A3B8] hover:text-white')
            }`}
          >
            <MessageSquare size={18} strokeWidth={activeBottomNav === 'enquiry' ? 2 : 1.5} />
            <span className="text-[9px] font-mono tracking-wider uppercase mt-1">ENQUIRE</span>
          </button>

          {/* 5. MORE (Opens Full-Screen Menu) */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open full-screen menu"
            className={`flex flex-col items-center justify-center py-1 transition-colors focus:outline-none cursor-pointer ${
              isLight ? 'text-[#6B6661] hover:text-[#0B1325]' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Grid2X2 size={18} strokeWidth={1.5} />
            <span className="text-[9px] font-mono tracking-wider uppercase mt-1">MORE</span>
          </button>
        </div>
      </nav>

      {/* ─── FULL-SCREEN NAVIGATION OVERLAY ───────────────────────────────── */}
      {menuOpen && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          data-lenis-prevent
          className={`fixed inset-0 z-[200] flex flex-col overflow-y-auto overscroll-contain animate-in fade-in duration-150 transition-colors ${
            isLight
              ? 'bg-[#FBF9F6] text-[#0B1325]'
              : 'bg-[#040810] text-[#F8FAFC]'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {/* Top Bar */}
          <div className={`flex items-center justify-between px-6 sm:px-12 py-6 border-b shrink-0 transition-colors ${
            isLight ? 'border-[#0B1325]/10' : 'border-white/10'
          }`}>
            <span className={`font-serif font-light tracking-[0.28em] text-sm uppercase ${
              isLight ? 'text-[#0B1325]' : 'text-white'
            }`}>
              APEX PACIFIC HOLDINGS
            </span>

            <div className="flex items-center gap-3">
              <CinematicThemeSwitcher />
              <button
                ref={closeRef}
                onClick={closeMenu}
                aria-label="Close navigation menu"
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  isLight
                    ? 'border-[#0B1325]/20 hover:border-[#0B1325] text-[#0B1325] hover:bg-[#0B1325]/5'
                    : 'border-white/20 hover:border-white text-white hover:bg-white/5'
                }`}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Menu Body */}
          <div className="flex-1 max-w-5xl w-full mx-auto px-6 sm:px-12 py-8 sm:py-10 flex flex-col justify-between">
            {/* Primary Nav List (Home, New Launches, Residences, About Apex) */}
            <nav
              aria-label="Main Navigation Menu"
              className={`divide-y mb-10 transition-colors ${
                isLight ? 'divide-[#0B1325]/[0.08]' : 'divide-white/[0.08]'
              }`}
            >
              {primaryNavLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    if (item.id) {
                      navigateToSection(e, item.id)
                    } else {
                      closeMenu()
                    }
                  }}
                  className={`group flex items-center justify-between py-4 sm:py-5 transition-colors cursor-pointer ${
                    isLight
                      ? 'text-[#0B1325] hover:text-[#1D263B]'
                      : 'text-white hover:text-sky-300'
                  }`}
                >
                  <span className="font-serif text-2xl sm:text-4xl font-light tracking-tight">
                    {item.label}
                  </span>
                  <ChevronRight
                    size={20}
                    className={`transition-all group-hover:translate-x-1.5 ${
                      isLight
                        ? 'text-[#6B6661] group-hover:text-[#0B1325]'
                        : 'text-[#64748B] group-hover:text-sky-300'
                    }`}
                  />
                </Link>
              ))}
            </nav>

            {/* 3 Secondary Columns: EXPLORE, ABOUT, CONNECT */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 border-t transition-colors ${
              isLight ? 'border-[#0B1325]/10' : 'border-white/10'
            }`}>
              {/* EXPLORE */}
              <div className="flex flex-col gap-3">
                <span className={`font-mono text-[11px] tracking-[0.25em] uppercase font-semibold ${
                  isLight ? 'text-[#6B6661]' : 'text-[#64748B]'
                }`}>
                  EXPLORE
                </span>
                <div className={`flex flex-col gap-2 text-xs sm:text-sm font-light ${
                  isLight ? 'text-[#1D263B]' : 'text-[#CBD5E1]'
                }`}>
                  <Link href="/#launches" onClick={(e) => navigateToSection(e, 'launches')} className={`transition-colors cursor-pointer ${
                    isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                  }`}>
                    New launches
                  </Link>
                  <Link href="/#collection" onClick={(e) => navigateToSection(e, 'collection')} className={`transition-colors cursor-pointer ${
                    isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                  }`}>
                    Residences
                  </Link>
                  {displayServices.map((svc) => (
                    <Link
                      key={svc.id || svc.slug}
                      href={`/services/${svc.slug}`}
                      onClick={closeMenu}
                      className={`transition-colors cursor-pointer ${
                        isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                      }`}
                    >
                      {svc.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* ABOUT */}
              <div className="flex flex-col gap-3">
                <span className={`font-mono text-[11px] tracking-[0.25em] uppercase font-semibold ${
                  isLight ? 'text-[#6B6661]' : 'text-[#64748B]'
                }`}>
                  ABOUT
                </span>
                <div className={`flex flex-col gap-2 text-xs sm:text-sm font-light ${
                  isLight ? 'text-[#1D263B]' : 'text-[#CBD5E1]'
                }`}>
                  <Link href="/#about" onClick={(e) => navigateToSection(e, 'about')} className={`transition-colors cursor-pointer ${
                    isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                  }`}>
                    Who we are
                  </Link>
                  <Link href="/#about" onClick={(e) => navigateToSection(e, 'about')} className={`transition-colors cursor-pointer ${
                    isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                  }`}>
                    Heritage &amp; Craft
                  </Link>
                  <Link href="/#portfolio" onClick={(e) => navigateToSection(e, 'portfolio')} className={`transition-colors cursor-pointer ${
                    isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                  }`}>
                    Disciplined Practice
                  </Link>
                  <Link href="/#collection" onClick={(e) => navigateToSection(e, 'collection')} className={`transition-colors cursor-pointer ${
                    isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                  }`}>
                    Global Footprint
                  </Link>
                  <button type="button" onClick={(e) => openContactModal(e)} className={`text-left transition-colors cursor-pointer ${
                    isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                  }`}>
                    Confidential Advisory
                  </button>
                </div>
              </div>

              {/* CONNECT */}
              <div className="flex flex-col gap-3">
                <span className={`font-mono text-[11px] tracking-[0.25em] uppercase font-semibold ${
                  isLight ? 'text-[#6B6661]' : 'text-[#64748B]'
                }`}>
                  CONNECT
                </span>
                <div className={`flex flex-col gap-2 text-xs sm:text-sm font-light ${
                  isLight ? 'text-[#1D263B]' : 'text-[#CBD5E1]'
                }`}>
                  <button type="button" onClick={(e) => openContactModal(e)} className={`text-left transition-colors cursor-pointer ${
                    isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                  }`}>
                    Get in touch
                  </button>
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={closeMenu} className={`transition-colors cursor-pointer ${
                    isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                  }`}>
                    WhatsApp Advisory
                  </a>
                  <button type="button" onClick={(e) => openContactModal(e)} className={`text-left transition-colors cursor-pointer ${
                    isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                  }`}>
                    Client Advisory
                  </button>
                  <button type="button" onClick={(e) => openContactModal(e)} className={`text-left transition-colors cursor-pointer ${
                    isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                  }`}>
                    Concierge Support
                  </button>
                  <button type="button" onClick={(e) => openContactModal(e)} className={`text-left transition-colors cursor-pointer ${
                    isLight ? 'hover:text-[#0B1325]' : 'hover:text-sky-300'
                  }`}>
                    Contact Us
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Box: EXPLORE ALL OF APEX PACIFIC HOLDINGS */}
            <div className={`pt-6 border-t transition-colors ${
              isLight ? 'border-[#0B1325]/10' : 'border-white/10'
            }`}>
              <Link
                href="/#collection"
                onClick={(e) => navigateToSection(e, 'collection')}
                className={`w-full flex items-center justify-between p-4 sm:p-5 rounded-lg transition-all group cursor-pointer ${
                  isLight
                    ? 'border border-[#0B1325]/15 bg-white text-[#0B1325] hover:border-[#0B1325]/40 hover:bg-[#FDFCFB] shadow-sm'
                    : 'border border-sky-400/30 hover:border-sky-400 bg-sky-400/[0.04] hover:bg-sky-400/10 text-white'
                }`}
              >
                <span className={`font-mono text-xs sm:text-sm tracking-[0.2em] uppercase ${
                  isLight ? 'text-[#0B1325]' : 'text-white group-hover:text-sky-200'
                }`}>
                  EXPLORE ALL OF APEX PACIFIC HOLDINGS
                </span>
                <ArrowRight
                  size={16}
                  className={`transition-transform group-hover:translate-x-1 ${
                    isLight ? 'text-[#0B1325]' : 'text-sky-400'
                  }`}
                />
              </Link>
            </div>

            {/* Sub-footer details */}
            <div className={`mt-6 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono tracking-widest uppercase transition-colors ${
              isLight
                ? 'border-[#0B1325]/10 text-[#6B6661]'
                : 'border-white/[0.06] text-[#64748B]'
            }`}>
              <span>{countryStripText}</span>
              <span>CONFIDENTIAL ADVISORY</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
