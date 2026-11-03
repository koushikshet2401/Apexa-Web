'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Register GSAP ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    // Initialize global Lenis with balanced, responsive cinematic momentum
    const lenis = new Lenis({
      autoRaf: false, // Frame-locked to GSAP ticker below
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      syncTouch: false, // Prevents intercepting native touch gestures and browser scrollbar dragging
      wheelMultiplier: 1.0,
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
