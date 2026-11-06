import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * APEX PACIFIC HOLDINGS — SAFE IDEMPOTENT SEED SCRIPT (PHASE 3)
 * Non-destructive: Uses upsert matching on unique keys.
 * NEVER deletes existing enquiries, deals, or customized properties.
 */
async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PRODUCTION SAFETY GUARD TRIGGERED: Seed scripts are strictly prohibited in production environments.')
  }

  console.log('--- APEX PACIFIC HOLDINGS: SAFE NON-DESTRUCTIVE SEED SCRIPT ---')

  // 1. Seed / Upsert Admin User
  console.log('1. Ensuring default Administrator exists...')
  const passwordHash = await bcrypt.hash('Admin@Apex2025!', 10)
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@apexpacificholdings.com' },
    update: {},
    create: {
      email: 'admin@apexpacificholdings.com',
      name: 'Apex Administrator',
      passwordHash,
      isActive: true,
    },
  })
  console.log(`Admin account verified: ${admin.email}`)

  // 2. Seed / Upsert Countries
  console.log('2. Ensuring Destination Countries exist...')
  const countriesData = [
    {
      slug: 'dubai',
      name: 'United Arab Emirates',
      displayName: 'Dubai / UAE',
      region: 'Middle East',
      cities: 'DUBAI · PALM JUMEIRAH · ABU DHABI',
      tagline: 'Waterfront villas and sky residences in the Gulf.',
      description: 'Architectural masterworks rising along the Arabian Gulf with private moorings, cantilevered terraces, and panoramic desert-to-ocean vistas.',
      cardImage: '/images/DuabiCoolection.png',
      heroVideoUrl: '/videos/luxury-palm-beach.mp4',
      heroVideoThumb: '/images/skyResidenceImage.png',
      displayOrder: 1,
      isPublished: true,
    },
    {
      slug: 'thailand',
      name: 'Thailand',
      displayName: 'Thailand',
      region: 'Southeast Asia',
      cities: 'PHUKET · BANGKOK · KOH SAMUI',
      tagline: 'Tropical pool villas and beachfront sanctuaries.',
      description: 'Secluded hillside retreats and beachfront estates shaped by Thai craftsmanship, infinity pools that blur into the Andaman horizon, and lush tropical gardens.',
      cardImage: '/images/Thailand.png',
      heroVideoUrl: '/videos/VID01.mp4',
      heroVideoThumb: '/images/laxuryVillaImage.png',
      displayOrder: 2,
      isPublished: true,
    },
    {
      slug: 'malaysia',
      name: 'Malaysia',
      displayName: 'Malaysia',
      region: 'Southeast Asia',
      cities: 'KUALA LUMPUR · PENANG · LANGKAWI',
      tagline: 'Green, resort-style homes close to the vibrant city.',
      description: 'Tropical sanctuaries nestled between lush rainforest canopies and cosmopolitan coastlines, offering private infinity terraces and botanical courtyards.',
      cardImage: '/images/MalaysiaCollection.png',
      heroVideoUrl: '/videos/VID02.mp4',
      heroVideoThumb: '/images/commercialimage.png',
      displayOrder: 3,
      isPublished: true,
    },
    {
      slug: 'australia',
      name: 'Australia',
      displayName: 'Australia',
      region: 'Australasia & Pacific Coast',
      cities: 'SYDNEY · MELBOURNE · GOLD COAST',
      tagline: 'Coastal architectural villas and harbourfront penthouses.',
      description: 'Contemporary residences shaped by Australian design, natural light and exceptional coastal living.',
      cardImage: '/images/AusCollection.png',
      heroVideoUrl: '/videos/luxury-palm-beach.mp4',
      heroVideoThumb: '/images/waterFrontResidenceImage.png',
      displayOrder: 4,
      isPublished: true,
    },
    {
      slug: 'georgia',
      name: 'Georgia',
      displayName: 'Georgia',
      region: 'Caucasus & Black Sea',
      cities: 'TBILISI · BATUMI · BORJOMI',
      tagline: 'Mountain chalets and Black Sea coastal estates.',
      description: 'Where ancient Caucasian heritage meets contemporary architecture — stone-clad chalets in the mountains and elegant seaside residences along the Black Sea coast.',
      cardImage: '/images/GeorgiaCollection.png',
      heroVideoUrl: '/videos/coverr-a-glass-building-on-lisbon-street-645-1080p.mp4',
      heroVideoThumb: '/images/Georgia.png',
      displayOrder: 5,
      isPublished: true,
    },
  ]

  for (const c of countriesData) {
    await prisma.country.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    })
    console.log(`Verified Country: ${c.displayName}`)
  }

  // 3. Seed / Upsert Service Categories
  console.log('3. Ensuring Service Categories exist...')
  const serviceCategoriesData = [
    {
      slug: 'luxury-villas',
      name: 'Luxury Villas',
      subtitle: 'Private Residences & Estates',
      tagline: 'Private architecture, landscape, space, and bespoke exclusivity.',
      description: 'Private compounds, coastal sanctuaries, and bespoke architectural residences designed for complete privacy and uncompromising luxury.',
      heroDescription: 'From private beachfront compounds to cliffside sanctuaries, our villa portfolio represents the pinnacle of residential architecture.',
      image: '/images/laxuryVillaImage.png',
      videoUrl: '/videos/VID01.mp4',
      displayOrder: 1,
      isPublished: true,
    },
    {
      slug: 'sky-residences',
      name: 'Sky Residences',
      subtitle: 'Penthouses & High-Rise Living',
      tagline: 'Elevated urban living above the world’s most dynamic skylines.',
      description: 'Ultra-luxury penthouses and full-floor residences featuring private plunge pools, helicopter access, and panoramic horizon views.',
      heroDescription: 'Soaring above iconic metropolitan centers, these sky residences redefine vertical luxury with double-height glass facades.',
      image: '/images/skyResidenceImage.png',
      videoUrl: '/videos/VID02.mp4',
      displayOrder: 2,
      isPublished: true,
    },
    {
      slug: 'commercial-properties',
      name: 'Commercial Properties',
      subtitle: 'Headquarters & High-Yield Assets',
      tagline: 'Grade-A commercial spaces, hospitality assets, and private offices.',
      description: 'Institutional-grade commercial real estate, boutique luxury hotels, and bespoke corporate headquarters in primary financial hubs.',
      heroDescription: 'Strategic commercial assets positioned in prime economic corridors, designed for sustained capital appreciation.',
      image: '/images/commercialimage.png',
      videoUrl: '/videos/luxury-palm-beach.mp4',
      displayOrder: 3,
      isPublished: true,
    },
    {
      slug: 'waterfront-residences',
      name: 'Waterfront Residences',
      subtitle: 'Private Moorings & Coastal Living',
      tagline: 'Direct maritime access, private berths, and ocean horizons.',
      description: 'Oceanfront estates with private moorings, yacht facilities, and uninterrupted panoramic water vistas across the world’s finest coastlines.',
      heroDescription: 'Direct coastal access meets world-class architectural engineering with private berths accommodating superyachts.',
      image: '/images/waterFrontResidenceImage.png',
      videoUrl: '/videos/VID01.mp4',
      displayOrder: 4,
      isPublished: true,
    },
  ]

  for (const sc of serviceCategoriesData) {
    await prisma.serviceCategory.upsert({
      where: { slug: sc.slug },
      update: sc,
      create: sc,
    })
    console.log(`Verified Service: ${sc.name}`)
  }

  console.log('--- SAFE SEED COMPLETED WITHOUT DATA LOSS ---')
}

main()
  .catch((e) => {
    console.error('Safe seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
