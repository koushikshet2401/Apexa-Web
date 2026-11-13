import { Navigation } from '@/components/layout/Navigation'
import { LaunchesCinematicStackServer } from '@/components/sections/LaunchesCinematicStackServer'
import { ContactSection } from '@/components/sections/ContactSection'
import { ScrollCornerNavigator } from '@/components/ui/ScrollCornerNavigator'
import { Footer } from '@/components/layout/Footer'
import { db } from '@/lib/db'

export const revalidate = 60

export default async function Home() {
  const [homepage, services, countries] = await Promise.all([
    db.homepageContent.findFirst().catch(() => null),
    db.serviceCategory.findMany({
      where: { isPublished: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, slug: true, name: true },
    }).catch(() => []),
    db.country.findMany({
      where: { isPublished: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, slug: true, name: true, displayName: true },
    }).catch(() => []),
  ])

  const initialServices = services.map((s) => ({ id: s.id, slug: s.slug, name: s.name }))
  const initialCountries = countries.map((c) => ({ id: c.id, slug: c.slug, name: c.name, displayName: c.displayName }))

  return (
    <>
      <Navigation
        initialServices={initialServices}
        initialCountries={initialCountries}
        whatsappNumber={homepage?.contactWhatsappNumber || null}
      />
      <main className="bg-[#FBF9F6] text-[#0B1325] dark:bg-[#040810] dark:text-[#F8FAFC] transition-colors">
        {/* Master Pinned Cinematic Stack (Server Component fetching dynamic DB data) */}
        <LaunchesCinematicStackServer />

        {/* Click-to-Open Fullscreen Video Enquiry Modal */}
        <ContactSection />

        {/* Dynamic Right Corner Scroll Navigator */}
        <ScrollCornerNavigator />
      </main>
      <Footer
        initialServices={initialServices}
        initialCountries={initialCountries}
      />
    </>
  )
}
