import type { Metadata } from 'next'
import { Navigation } from '@/components/layout/Navigation'
import { ServicesSection } from '@/components/sections/ServicesSection'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Our Practice — Apex Pacific Holdings',
  description: 'Explore our integrated real-estate practice spanning Luxury Villas, Sky Residences, and Commercial Properties.',
}

export default function ServicesIndexPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#040810] pt-20">
        <ServicesSection />
      </main>
      <Footer />
    </>
  )
}
