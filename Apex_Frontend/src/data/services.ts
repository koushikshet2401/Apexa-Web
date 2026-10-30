export interface ServiceItem {
  id: string
  number: string
  slug: string
  title: string
  subtitle: string
  tagline: string
  description: string
  heroDescription: string
  route: string
  image: string
  architecturalFocus: string[]
  deliverables: {
    title: string
    detail: string
  }[]
  iconType: 'villa' | 'sky' | 'commercial'
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'luxury-villas',
    number: '01',
    slug: 'luxury-villas',
    title: 'Luxury Villas',
    subtitle: 'Private Residences & Estates',
    tagline: 'Private architecture, landscape, space, and bespoke exclusivity.',
    description:
      'Private residences sculpted to their terrain. Orientation, gardens, and generative natural light designed around the cadence of multi-generational family life.',
    heroDescription:
      'From coastal promontories to secluded hillside estates, our Luxury Villas portfolio conceives standalone residences that harmonize architecture, light, and living landscape into timeless heirlooms.',
    route: '/services/luxury-villas',
    image: 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1600&q=85&auto=format&fit=crop',
    iconType: 'villa',
    architecturalFocus: [
      'Microclimate & Sun Orientation',
      'Artisanal Stone & Timber Joinery',
      'Integrated Native Landscapes',
      'Multi-Generational Spatial Flow',
    ],
    deliverables: [
      {
        title: 'Topographic & Solar Orientation',
        detail: 'Deep site-specific study maximizing prevailing breezes, privacy sightlines, and morning light angles.',
      },
      {
        title: 'Bespoke Architectural Engineering',
        detail: 'Comprehensive structural, MEP, and building envelope design with zero compromise on structural purity.',
      },
      {
        title: 'Courtyard & Water Architecture',
        detail: 'Seamless integration of reflecting pools, cascading water features, and climate-moderating internal atriums.',
      },
      {
        title: 'Turnkey Construction & Handover',
        detail: 'Direct execution by our dedicated master craftsmen, ensuring uninterrupted continuity from blueprint to keys.',
      },
    ],
  },
  {
    id: 'sky-residences',
    number: '02',
    slug: 'sky-residences',
    title: 'Sky Residences',
    subtitle: 'High-Rise Architectural Living',
    tagline: 'Vertical architecture, skyline views, and refined contemporary living.',
    description:
      'Boutique residential towers offering single-floor residences, private cantilevered terraces, horizon views, and seamless concierge-managed privacy.',
    heroDescription:
      'Reinventing high-rise living through low-density vertical boutique developments that combine penthouse privacy, expansive open-air sky gardens, and uninhibited panoramic views.',
    route: '/services/sky-residences',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85&auto=format&fit=crop',
    iconType: 'sky',
    architecturalFocus: [
      'Low-Density Floorplans',
      'Cantilevered Sky Terraces',
      'Acoustic & Wind Isolation',
      'Private Elevator Landings',
    ],
    deliverables: [
      {
        title: 'Full-Floor Spatial Zoning',
        detail: 'Individual floorplates configured with distinct formal entertaining, family living, and private bedroom suites.',
      },
      {
        title: 'Terrace Structural Engineering',
        detail: 'Deep sheltered outdoor loggias designed with integrated irrigation, plunge pools, and wind-dampening glass balustrades.',
      },
      {
        title: 'Private Vertical Transit',
        detail: 'Biometric, high-speed elevator access opening directly into private, secured residential vestibules.',
      },
      {
        title: 'Curated Building Amenities',
        detail: 'Dedicated wellness suites, private screening rooms, wine storage vaults, and 24/7 dedicated concierge facilities.',
      },
    ],
  },
  {
    id: 'commercial-properties',
    number: '03',
    slug: 'commercial-properties',
    title: 'Commercial Properties',
    subtitle: 'Architectural Landmarks & Mixed-Use',
    tagline: 'Monolithic mixed-use developments, curated commercial pavilions, and cultural landmark spaces.',
    description:
      'Prime mixed-use architectural developments integrating luxury sky residences with curated commercial, cultural, and retail gallerias in high-growth metropolitan centers.',
    heroDescription:
      'Our Commercial Properties practice focuses on iconic mixed-use architectural landmarks, combining prime urban flagships with cultural hubs and bespoke sky residences.',
    route: '/services/commercial-properties',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85&auto=format&fit=crop',
    iconType: 'commercial',
    architecturalFocus: [
      'Mixed-Use Urban Integration',
      'Curated Commercial & Cultural Atriums',
      'High-Performance Sustainable Facades',
      'Civic Flow & Transit Connectivity',
    ],
    deliverables: [
      {
        title: 'Civic Masterplanning & Zoning',
        detail: 'Harmonious integration of high-end commercial gallerias, private office suites, and exclusive residential access.',
      },
      {
        title: 'Sculptural Double-Glazed Facades',
        detail: 'Architectural envelopes engineered for acoustic silence, thermal efficiency, and striking urban landmark identity.',
      },
      {
        title: 'Cultural & Culinary Spaces',
        detail: 'Dedicated collector lounges, private exhibition spaces, and world-class gastronomic pavilion infrastructure.',
      },
      {
        title: 'Institutional-Grade Asset Delivery',
        detail: 'Complete lifecycle delivery adhering to international sustainability standards and long-term capital preservation.',
      },
    ],
  },
]
