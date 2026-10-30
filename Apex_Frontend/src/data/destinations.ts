export interface DestinationProject {
  id: string
  title: string
  type: string
  city: string
  beds: string
  slug: string
  image: string
}

export interface Destination {
  id: string
  slug: string
  country: string
  region: string
  cities: string
  tagline: string
  description: string
  image: string
  route: string
  projects: DestinationProject[]
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'uae',
    slug: 'uae',
    country: 'United Arab Emirates',
    region: 'Middle East',
    cities: 'DUBAI · PALM JUMEIRAH · ABU DHABI',
    tagline: 'Waterfront villas and sky residences in the Gulf.',
    description: 'Architectural masterworks rising along the Arabian Gulf with private moorings, cantilevered terraces, and panoramic desert-to-ocean vistas.',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85&auto=format&fit=crop',
    route: '/destinations/uae',
    projects: [
      {
        id: 'the-meridian',
        title: 'The Meridian',
        type: 'Sky Residence',
        city: 'Dubai',
        beds: '3–5 Bedrooms',
        slug: 'the-meridian',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80&auto=format&fit=crop',
      },
      {
        id: 'mirage-villa',
        title: 'Mirage Villa',
        type: 'Palm Waterfront Villa',
        city: 'Palm Jumeirah',
        beds: '6 Bedrooms',
        slug: 'mirage-villa',
        image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format&fit=crop',
      },
      {
        id: 'azure-haven',
        title: 'Azure Haven',
        type: 'Island Penthouse',
        city: 'Abu Dhabi',
        beds: '4 Bedrooms',
        slug: 'azure-haven',
        image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80&auto=format&fit=crop',
      },
    ],
  },
  {
    id: 'thailand',
    slug: 'thailand',
    country: 'Thailand',
    region: 'Southeast Asia',
    cities: 'PHUKET · BANGKOK · KOH SAMUI',
    tagline: 'Tropical pool villas and beachfront sanctuaries.',
    description: 'Secluded hillside retreats and beachfront estates shaped by Thai craftsmanship, infinity pools that blur into the Andaman horizon, and lush tropical gardens.',
    image: 'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=1600&q=85&auto=format&fit=crop',
    route: '/destinations/thailand',
    projects: [
      {
        id: 'andaman-villa',
        title: 'Andaman Villa',
        type: 'Cliffside Pool Villa',
        city: 'Phuket',
        beds: '4 Bedrooms',
        slug: 'andaman-villa',
        image: 'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=1200&q=80&auto=format&fit=crop',
      },
      {
        id: 'samui-estate',
        title: 'Samui Estate',
        type: 'Beachfront Residence',
        city: 'Koh Samui',
        beds: '5 Bedrooms',
        slug: 'samui-estate',
        image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80&auto=format&fit=crop',
      },
      {
        id: 'lotus-pavilion',
        title: 'Lotus Pavilion',
        type: 'Garden Villa',
        city: 'Bangkok',
        beds: '3 Bedrooms',
        slug: 'lotus-pavilion',
        image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=1200&q=80&auto=format&fit=crop',
      },
    ],
  },
  {
    id: 'malaysia',
    slug: 'malaysia',
    country: 'Malaysia',
    region: 'Southeast Asia',
    cities: 'KUALA LUMPUR AND COAST',
    tagline: 'Green, resort-style homes close to the vibrant city.',
    description: 'Tropical sanctuaries nestled between lush rainforest canopies and cosmopolitan coastlines, offering private infinity terraces and botanical courtyards.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85&auto=format&fit=crop',
    route: '/destinations/malaysia',
    projects: [
      {
        id: 'horizon-pavilion',
        title: 'Horizon Pavilion',
        type: 'Mixed-Use Residence',
        city: 'Kuala Lumpur',
        beds: '2–4 Bedrooms',
        slug: 'horizon-pavilion',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
      },
      {
        id: 'the-lantern-house',
        title: 'The Lantern House',
        type: 'Rainforest Pavilion',
        city: 'Penang',
        beds: '4 Bedrooms',
        slug: 'the-lantern-house',
        image: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1200&q=80&auto=format&fit=crop',
      },
      {
        id: 'banyan-residence',
        title: 'Banyan Residence',
        type: 'Coastal Villa',
        city: 'Langkawi',
        beds: '5 Bedrooms',
        slug: 'banyan-residence',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
      },
    ],
  },
  {
    id: 'australia',
    slug: 'australia',
    country: 'Australia',
    region: 'Australasia & Pacific Coast',
    cities: 'SYDNEY · MELBOURNE · GOLD COAST',
    tagline: 'Coastal architectural villas and harbourfront penthouses.',
    description: 'Contemporary residences shaped by Australian design, natural light and exceptional coastal living.',
    image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1600&q=85&auto=format&fit=crop',
    route: '/destinations/australia',
    projects: [
      {
        id: 'ivory-residences',
        title: 'Ivory Residences',
        type: 'Harbour Penthouse',
        city: 'Melbourne',
        beds: '2–4 Bedrooms',
        slug: 'ivory-residences',
        image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80&auto=format&fit=crop',
      },
      {
        id: 'point-piper-villa',
        title: 'Point Piper Villa',
        type: 'Harbourfront Villa',
        city: 'Sydney',
        beds: '5 Bedrooms',
        slug: 'point-piper-villa',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
      },
      {
        id: 'travertine-pavilion',
        title: 'The Travertine Pavilion',
        type: 'Ocean Promenade Estate',
        city: 'Gold Coast',
        beds: '4 Bedrooms',
        slug: 'travertine-pavilion',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
      },
    ],
  },
  {
    id: 'georgia',
    slug: 'georgia',
    country: 'Georgia',
    region: 'Caucasus',
    cities: 'TBILISI · BATUMI · BORJOMI',
    tagline: 'Mountain chalets and Black Sea coastal estates.',
    description: 'Where ancient Caucasian heritage meets contemporary architecture — stone-clad chalets in the mountains and elegant seaside residences along the Black Sea coast.',
    image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1600&q=85&auto=format&fit=crop',
    route: '/destinations/georgia',
    projects: [
      {
        id: 'colchis-manor',
        title: 'Colchis Manor',
        type: 'Historic Townhouse',
        city: 'Tbilisi',
        beds: '4 Bedrooms',
        slug: 'colchis-manor',
        image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1200&q=80&auto=format&fit=crop',
      },
      {
        id: 'batumi-heights',
        title: 'Batumi Heights',
        type: 'Black Sea Penthouse',
        city: 'Batumi',
        beds: '3–5 Bedrooms',
        slug: 'batumi-heights',
        image: 'https://images.unsplash.com/photo-1504615755583-2916b52192a3?w=1200&q=80&auto=format&fit=crop',
      },
      {
        id: 'borjomi-chalet',
        title: 'Borjomi Chalet',
        type: 'Mountain Retreat',
        city: 'Borjomi',
        beds: '5 Bedrooms',
        slug: 'borjomi-chalet',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&auto=format&fit=crop',
      },
    ],
  },
]

export const TOTAL_DESTINATIONS = DESTINATIONS.length
export const TOTAL_PROJECTS = DESTINATIONS.reduce((sum, d) => sum + d.projects.length, 0)
