import type { Metadata } from 'next'
import { Navigation } from '@/components/layout/Navigation'
import { ServicesSection } from '@/components/sections/ServicesSection'
import { Footer } from '@/components/layout/Footer'
import { fetchPublishedServicesFromDb } from '@/lib/services-cms'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Our Practice — Apex Pacific Holdings',
  description: 'Explore our integrated real-estate practice spanning Luxury Villas, Sky Residences, and Commercial Properties.',
}

export default async function ServicesIndexPage() {
  const services = await fetchPublishedServicesFromDb()

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#040810] pt-20">
        <ServicesSection services={services} />
      </main>
      <Footer />
    </>
  )
}
