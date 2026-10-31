import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Clearing existing data ---')
  await prisma.enquiry.deleteMany()
  await prisma.propertyService.deleteMany()
  await prisma.propertyImage.deleteMany()
  await prisma.property.deleteMany()
  await prisma.serviceCategory.deleteMany()
  await prisma.country.deleteMany()
  await prisma.homepageContent.deleteMany()
  await prisma.adminUser.deleteMany()

  console.log('--- Seeding Admin User ---')
  const passwordHash = await bcrypt.hash('Admin@Apex2025!', 10)
  const admin = await prisma.adminUser.create({
    data: {
      email: 'admin@apexpacificholdings.com',
      name: 'Apex Administrator',
      passwordHash,
    },
  })
  console.log(`Created admin: ${admin.email}`)

  console.log('--- Seeding Countries ---')
  const countriesData = [
    {
      slug: 'dubai',
      name: 'United Arab Emirates',
      displayName: 'Dubai / UAE',
      region: 'Middle East',
      cities: 'DUBAI · PALM JUMEIRAH · ABU DHABI',
      tagline: 'Waterfront villas and sky residences in the Gulf.',
      description:
        'Architectural masterworks rising along the Arabian Gulf with private moorings, cantilevered terraces, and panoramic desert-to-ocean vistas.',
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
      description:
        'Secluded hillside retreats and beachfront estates shaped by Thai craftsmanship, infinity pools that blur into the Andaman horizon, and lush tropical gardens.',
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
      description:
        'Tropical sanctuaries nestled between lush rainforest canopies and cosmopolitan coastlines, offering private infinity terraces and botanical courtyards.',
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
      description:
        'Contemporary residences shaped by Australian design, natural light and exceptional coastal living.',
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
      description:
        'Where ancient Caucasian heritage meets contemporary architecture — stone-clad chalets in the mountains and elegant seaside residences along the Black Sea coast.',
      cardImage: '/images/GeorgiaCollection.png',
      heroVideoUrl: '/videos/coverr-a-glass-building-on-lisbon-street-645-1080p.mp4',
      heroVideoThumb: '/images/Georgia.png',
      displayOrder: 5,
      isPublished: true,
    },
  ]

  const countryMap: Record<string, string> = {}
  for (const c of countriesData) {
    const created = await prisma.country.create({ data: c })
    countryMap[c.slug] = created.id
    console.log(`Created Country: ${c.displayName} (${created.id})`)
  }

  console.log('--- Seeding Service Categories ---')
  const serviceCategoriesData = [
    {
      slug: 'luxury-villas',
      name: 'Luxury Villas',
      subtitle: 'Private Residences & Estates',
      tagline: 'Private architecture, landscape, space, and bespoke exclusivity.',
      description:
        'Private residences sculpted to their terrain. Orientation, gardens, and generative natural light designed around the cadence of multi-generational family life.',
      heroDescription:
        'From coastal promontories to secluded hillside estates, our Luxury Villas portfolio conceives standalone residences that harmonize architecture, light, and living landscape into timeless heirlooms.',
      image: '/images/laxuryVillaImage.png',
      videoUrl: '/videos/VID02.mp4',
      displayOrder: 1,
      isPublished: true,
    },
    {
      slug: 'sky-residences',
      name: 'Sky Residences',
      subtitle: 'High-Rise Architectural Living',
      tagline: 'Vertical architecture, skyline views, and refined contemporary living.',
      description:
        'Boutique residential towers offering single-floor residences, private cantilevered terraces, horizon views, and seamless concierge-managed privacy.',
      heroDescription:
        'Reinventing high-rise living through low-density vertical boutique developments that combine penthouse privacy, expansive open-air sky gardens, and uninhibited panoramic views.',
      image: '/images/skyResidenceImage.png',
      videoUrl: '/videos/luxury-palm-beach.mp4',
      displayOrder: 2,
      isPublished: true,
    },
    {
      slug: 'commercial-properties',
      name: 'Commercial Properties',
      subtitle: 'Architectural Landmarks & Mixed-Use',
      tagline: 'Monolithic mixed-use developments, curated commercial pavilions, and cultural landmark spaces.',
      description:
        'Prime mixed-use architectural developments integrating luxury sky residences with curated commercial, cultural, and retail gallerias in high-growth metropolitan centers.',
      heroDescription:
        'Our Commercial Properties practice focuses on iconic mixed-use architectural landmarks, combining prime urban flagships with cultural hubs and bespoke sky residences.',
      image: '/images/commercialimage.png',
      videoUrl: '/videos/coverr-a-glass-building-on-lisbon-street-645-1080p.mp4',
      displayOrder: 3,
      isPublished: true,
    },
    {
      slug: 'waterfront-residences',
      name: 'Waterfront Residences',
      subtitle: 'Harbourfront & Coastal Living',
      tagline: 'Private harbourfront architecture, marina access, and waterside tranquility.',
      description:
        'Sculptural waterfront residences with private marina berths, harbourfront terraces, and panoramic ocean or bay vistas.',
      heroDescription:
        'Sculptural waterfront residences with private marina berths, harbourfront terraces, and panoramic ocean or bay vistas.',
      image: '/images/waterFrontResidenceImage.png',
      videoUrl: '/videos/VID01.mp4',
      displayOrder: 4,
      isPublished: true,
    },
  ]

  const serviceMap: Record<string, string> = {}
  for (const s of serviceCategoriesData) {
    const created = await prisma.serviceCategory.create({ data: s })
    serviceMap[s.slug] = created.id
    console.log(`Created Service Category: ${s.name} (${created.id})`)
  }

  console.log('--- Seeding Properties ---')
  const propertiesData = [
    {
      slug: 'the-meridian',
      name: 'The Meridian',
      cardLabel: 'THE MERIDIAN',
      tagline: 'Seven elevated tiers. Sky garden terraces on every level overlooking the Arabian Gulf.',
      shortDescription: 'Boutique tower of twenty-four exclusive residences in Dubai Maritime City.',
      description:
        'Seven cantilevered floors with private landscaped sky gardens on every level. With only twenty-four residences, each occupies an entire quadrant with 270-degree horizons over Dubai skyline and water.',
      type: 'residential',
      beds: '3–4 Bedrooms',
      baths: '4 Baths',
      area: '3,800 sq ft',
      price: 'AED 8.2M',
      cityName: 'Dubai',
      locationLine: 'DUBAI MARITIME CITY, UAE',
      mainVideoUrl: '/videos/luxury-palm-beach.mp4',
      mainImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85&auto=format&fit=crop',
      highlights: [
        'Expansive cantilevered sky garden terraces',
        'Private high-speed biometric elevator access',
        'Horizon infinity pool suspended over marina',
        'Smart home climate and acoustic automation',
        'Full valet, concierge, and private yacht berth options',
      ],
      layoutVariant: 2,
      isPublished: true,
      isDraft: false,
      isFeaturedLaunch: true,
      launchOrder: 1,
      countrySlug: 'dubai',
      serviceSlugs: ['sky-residences', 'waterfront-residences'],
      gallery: [
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format&fit=crop',
      ],
    },
    {
      slug: 'aurelia-villa',
      name: 'Aurelia Villa',
      cardLabel: 'AURELIA VILLA',
      tagline: 'Contemporary five-bedroom villa set within sculpted stone and water courtyards.',
      shortDescription: 'Sculpted hillside villa in Jubilee Hills balancing privacy and openness.',
      description:
        'A contemporary five-bedroom villa set within a sculpted garden in Jubilee Hills. Designed around natural light, cross-ventilation, and stone courtyards, the residence balances architectural precision with the organic warmth of Indian teak and slate.',
      type: 'residential',
      beds: '5 Bedrooms',
      baths: '5 Baths',
      area: '8,200 sq ft',
      price: '₹ 12.5 Cr',
      cityName: 'Hyderabad',
      locationLine: 'JUBILEE HILLS, HYDERABAD',
      mainVideoUrl: '/videos/VID02.mp4',
      mainImage: 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1600&q=85&auto=format&fit=crop',
      highlights: [
        'Private rooftop deck with cantilevered infinity pool',
        '5 ensuite master suites with garden views',
        'Double-height formal salon with fluted stone feature wall',
        'Acoustically isolated private cinema',
        'Dedicated staff quarters and catering kitchen',
      ],
      layoutVariant: 1,
      isPublished: true,
      isDraft: false,
      isFeaturedLaunch: true,
      launchOrder: 2,
      countrySlug: 'dubai',
      serviceSlugs: ['luxury-villas'],
      gallery: [
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb3?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200&q=80&auto=format&fit=crop',
      ],
    },
    {
      slug: 'ivory-residences',
      name: 'Ivory Residences',
      cardLabel: 'IVORY RESIDENCES',
      tagline: 'Refined harbourfront apartments with imported travertine and floor-to-ceiling glass.',
      shortDescription: 'Sculptural stone apartments with expansive harbour-facing terraces.',
      description:
        'Refined apartments with expansive harbour-facing terraces overlooking Melbourne. Sculptural stone details, floor-to-ceiling double glazing, and uncompromised craftsmanship define this waterfront address.',
      type: 'residential',
      beds: '2–4 Bedrooms',
      baths: '2 Baths',
      area: '2,100 sq ft',
      price: 'AUD 2.85M',
      cityName: 'Melbourne',
      locationLine: 'MELBOURNE HARBOURFRONT, AUSTRALIA',
      mainVideoUrl: '/videos/VID01.mp4',
      mainImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85&auto=format&fit=crop',
      highlights: [
        'Harbourfront panoramic wrap-around terraces',
        'Imported Italian travertine finishes throughout',
        'Private residents salon and sommelier tasting room',
        'Direct private marina berth access',
        'Integrated Gaggenau 400 series appliance suite',
      ],
      layoutVariant: 2,
      isPublished: true,
      isDraft: false,
      isFeaturedLaunch: true,
      launchOrder: 3,
      countrySlug: 'australia',
      serviceSlugs: ['waterfront-residences', 'sky-residences'],
      gallery: [
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
      ],
    },
    {
      slug: 'horizon-pavilion',
      name: 'Horizon Pavilion',
      cardLabel: 'HORIZON PAVILION',
      tagline: 'Curving monolithic architecture embracing panoramic skyline vistas.',
      shortDescription: 'Sculptural architectural pavilion combining luxury residences with cultural spaces.',
      description:
        'A striking architectural landmark in Kuala Lumpur centre. Seamlessly combining private luxury sky residences with curated cultural and culinary spaces below. The sweeping, organic white facade captures natural airflow and provides shaded private terraces.',
      type: 'mixed_use',
      beds: '2–4 Bedrooms',
      baths: '3 Baths',
      area: '2,950 sq ft',
      price: 'MYR 4.6M',
      cityName: 'Kuala Lumpur',
      locationLine: 'KUALA LUMPUR CENTRE, MALAYSIA',
      mainVideoUrl: '/videos/VID02.mp4',
      mainImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85&auto=format&fit=crop',
      highlights: [
        'Panoramic city skyline views',
        'Curved sculptural double-glazed facade',
        'Bespoke Italian joinery throughout',
        'Wellness suite & hydrotherapy',
        '24/7 dedicated butler & concierge service',
        'Private art gallery & collectors lounge',
      ],
      layoutVariant: 3,
      isPublished: true,
      isDraft: false,
      isFeaturedLaunch: false,
      launchOrder: null,
      countrySlug: 'malaysia',
      serviceSlugs: ['commercial-properties', 'sky-residences'],
      gallery: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80&auto=format&fit=crop',
      ],
    },
    {
      slug: 'marble-sanctuary',
      name: 'The Marble Sanctuary',
      cardLabel: 'BATH',
      tagline: 'Hand-honed fluted stone, brushed brass accents, and serene illuminated volumes.',
      shortDescription: 'Master suite interior crafted in book-matched travertine and vertical ceramic tile.',
      description:
        'Designed by Apex Design Studio in Brera, Milan, The Marble Sanctuary celebrates acoustic silence and tactile materiality. Hand-glazed vertical ceramic tile meets honed stone countertops, complemented by concealed warm LED light channels and bespoke fluted oak vanity joinery.',
      type: 'residential',
      beds: '3 Bedrooms',
      baths: '4 Baths',
      area: '3,400 sq ft',
      price: '€ 4.2M',
      cityName: 'Milan',
      locationLine: 'BRERA, MILAN, ITALY',
      mainImage: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=85&auto=format&fit=crop',
      highlights: [
        'Hand-carved solid travertine vessel basin',
        'Brushed brass concealed thermostatic fittings',
        'Fluted smoked oak floating vanity',
        'Recessed ambient lighting with Lutron scene control',
        'Walk-in rainfall shower with heated slab flooring',
        'Private steam retreat with aromatherapy integration',
      ],
      layoutVariant: 1,
      isPublished: true,
      isDraft: false,
      isFeaturedLaunch: false,
      launchOrder: null,
      countrySlug: 'dubai',
      serviceSlugs: ['luxury-villas'],
      gallery: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb3?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80&auto=format&fit=crop',
      ],
    },
    {
      slug: 'verdant-house',
      name: 'Verdant House',
      cardLabel: 'VERDANT HOUSE',
      tagline: 'Lush tropical courtyards flowing seamlessly into double-height living volumes.',
      shortDescription: 'Estate home set within a secluded private botanical garden in South Mumbai.',
      description:
        'An architectural oasis in South Mumbai. Verdant House combines biophilic architecture with uncompromising contemporary luxury. Lush internal hanging courtyards filter daylight through timber pergolas, creating an intimate sanctuary within the bustling metropolis.',
      type: 'residential',
      beds: '6 Bedrooms',
      baths: '7 Baths',
      area: '10,500 sq ft',
      price: '₹ 28.0 Cr',
      cityName: 'Mumbai',
      locationLine: 'SOUTH MUMBAI, INDIA',
      mainImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=85&auto=format&fit=crop',
      highlights: [
        'Private internal biophilic courtyard garden',
        'Double-height timber and bronze living gallery',
        '6 ensuite master bedrooms with private green verandas',
        'Subterranean climate-controlled wine vault',
        'Multi-vehicle secured gallery with EV fast charging',
        'Private wellness pavilion & lap pool',
      ],
      layoutVariant: 1,
      isPublished: true,
      isDraft: false,
      isFeaturedLaunch: false,
      launchOrder: null,
      countrySlug: 'dubai',
      serviceSlugs: ['luxury-villas'],
      gallery: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb3?w=1200&q=80&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80&auto=format&fit=crop',
      ],
    },
  ]

  for (const p of propertiesData) {
    const { gallery, countrySlug, serviceSlugs, ...propertyFields } = p
    const countryId = countrySlug ? countryMap[countrySlug] : null

    const createdProperty = await prisma.property.create({
      data: {
        ...propertyFields,
        countryId,
        images: {
          create: gallery.map((url, index) => ({
            url,
            order: index,
            alt: `${propertyFields.name} Gallery Image ${index + 1}`,
          })),
        },
        services: {
          create: serviceSlugs.map((slug) => ({
            service: {
              connect: { id: serviceMap[slug] },
            },
          })),
        },
      },
    })
    console.log(`Created Property: ${createdProperty.name} (${createdProperty.id})`)
  }

  console.log('--- Seeding Homepage Content ---')
  const homepage = await prisma.homepageContent.create({
    data: {
      heroVideoUrl: '/videos/home-page.mp4',
      heroVideoThumb: '/images/skyResidenceImage.png',
      unveilHeading: 'PRIVATE ARCHITECTURE & ESTATES',
      unveilSubtext:
        'Bespoke residences sculpted to their terrain across the world’s most coveted territories.',
      oneTeamVideoUrl: '/videos/one-team-end-to-end.mp4',
      advisoryVideoUrl: '/videos/gemini_generated_video_0e105bc8.mp4',
    },
  })
  console.log(`Created HomepageContent (${homepage.id})`)

  console.log('--- Seeding Complete Successfully ---')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
