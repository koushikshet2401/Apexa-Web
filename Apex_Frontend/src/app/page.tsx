import { Navigation } from '@/components/layout/Navigation'
import { LaunchesCinematicStackServer } from '@/components/sections/LaunchesCinematicStackServer'
import { ContactSection } from '@/components/sections/ContactSection'
import { ScrollCornerNavigator } from '@/components/ui/ScrollCornerNavigator'
import { Footer } from '@/components/layout/Footer'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="bg-[#040810] text-[#F8FAFC]">
        {/* Master Pinned Cinematic Stack (Server Component fetching dynamic DB data) */}
        <LaunchesCinematicStackServer />

        {/* Click-to-Open Fullscreen Video Enquiry Modal */}
        <ContactSection />

        {/* Dynamic Right Corner Scroll Navigator */}
        <ScrollCornerNavigator />
      </main>
      <Footer />
    </>
  )
}
