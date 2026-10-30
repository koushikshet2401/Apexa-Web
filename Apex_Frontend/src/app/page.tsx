'use client'

import { useEffect } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { LaunchesCinematicStack } from '@/components/sections/LaunchesCinematicStack'
import { ContactSection } from '@/components/sections/ContactSection'
import { ScrollCornerNavigator } from '@/components/ui/ScrollCornerNavigator'
import { Footer } from '@/components/layout/Footer'

export default function Home() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        const timer = setTimeout(() => {
          ScrollTrigger.refresh()
        }, 300)
        return () => clearTimeout(timer)
      })
    }
  }, [])

  return (
    <>
      <Navigation />
      <main className="bg-[#040810] text-[#F8FAFC]">
        {/* Master Pinned Cinematic Stack:
               • Layer 0: Homepage Video (RealEstate Copyrightfree.mp4, SVG Emblem, Bottom Search Bar)
               • Layer 1: "Unveil the Latest in Exceptional Living" (Opaque Overlay rising from bottom)
               • Layer 2: Launch 1 (The Meridian - Video Overlay)
               • Layer 3: Launch 2 (Aurelia Villa - Video Overlay)
               • Layer 4: Launch 3 (The Peninsula Reserve - Video Overlay)
               • Layer 5: "The collection" (3D Coverflow Carousel Pinned Overlay)
               • Layer 6: "What We Do - One team, end to end" (Dedicated Full-Screen Text Page)
               • Layer 7: "One team, end to end" (Pinned Video + 4 Image Panels Composition)
               • Layer 8: "Spaces in the round" (3D Rotating Property Carousel Pinned Overlay)
               • Layer 9: "Private Advisory" (Pinned Full-Screen Video Background + Speak With Us) */}
        <LaunchesCinematicStack />

        {/* Click-to-Open Fullscreen Video Enquiry Modal */}
        <ContactSection />

        {/* Dynamic Right Corner Scroll Navigator: Down Arrow at top / Up Arrow when scrolled */}
        <ScrollCornerNavigator />
      </main>
      <Footer />
    </>
  )
}
