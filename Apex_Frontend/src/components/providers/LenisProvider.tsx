'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Register GSAP ScrollTrigger plugin & configure mobile stability
    gsap.registerPlugin(ScrollTrigger)
    ScrollTrigger.config({ ignoreMobileResize: true })

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    // Initialize global Lenis with balanced, responsive cinematic momentum across mobile touch & desktop wheel
    const lenis = new Lenis({
      autoRaf: false, // Frame-locked to GSAP ticker below
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      syncTouch: true, // Smooth, controlled touch momentum on mobile screens
      syncTouchLerp: 0.08, // Soft, cushioned deceleration on finger release
      touchInertiaExponent: 1.25, // Natural touch inertia preventing explosive over-scroll
      touchMultiplier: 0.9, // Balanced finger tracking distance
      wheelMultiplier: 0.85, // Softens notch-wheel steps on desktop mice
      infinite: false,
    })

    lenisRef.current = lenis
      ; (window as unknown as { __lenis: Lenis }).__lenis = lenis

    // Synchronize Lenis scroll position with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    const onRefresh = () => {
      lenis.resize()
    }
    ScrollTrigger.addEventListener('refresh', onRefresh)

    // Drive Lenis through GSAP ticker for frame-locked synchronization
    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(tickerUpdate)
    gsap.ticker.lagSmoothing(0)

    // Allow layout and webfonts to settle then refresh trigger positions
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 500)

    return () => {
      clearTimeout(refreshTimer)
      gsap.ticker.remove(tickerUpdate)
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      lenis.destroy()
      delete (window as unknown as { __lenis?: Lenis }).__lenis
    }
  }, [])

  // Handle route changes: reset scroll when navigating to standalone pages
  useEffect(() => {
    if (pathname !== '/') {
      const lenis = lenisRef.current
      if (lenis) {
        lenis.scrollTo(0, { immediate: true, duration: 0 })
      }
      window.scrollTo(0, 0)
      ScrollTrigger.refresh()
    }
  }, [pathname])

  return <>{children}</>
}
