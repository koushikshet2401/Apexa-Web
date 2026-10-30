export interface PropertyItem {
  id: string
  slug: string
  name: string
  cardLabel: string // As displayed on the 3D card (e.g. "HORIZON PAVILION", "BATH", "VERDANT HOUSE")
  category: string // e.g. "Architectural Landmark", "Interior Suite", "Private Estate"
  country: string
  city: string
  type: string
  beds: number
  baths: number
  area: string
  price: string
  tagline: string
  shortDescription: string
  description: string
  highlights: string[]
  image: string
  gallery: string[]
  layoutVariant: number
  lat: number
  lng: number
  href: string
}

export const PROPERTIES_DATA: Record<string, PropertyItem> = {
  'horizon-pavilion': {
    id: 'prop-1',
    slug: 'horizon-pavilion',
    name: 'Horizon Pavilion',
    cardLabel: 'HORIZON PAVILION',
    category: 'Architectural Landmark',
    country: 'Malaysia',
    city: 'Kuala Lumpur',
    type: 'mixed_use',
    beds: 2,
    baths: 3,
    area: '2,950 sq ft',
    price: 'MYR 4.6M',
    tagline: 'Curving monolithic architecture embracing panoramic skyline vistas.',
    shortDescription: 'Sculptural architectural pavilion combining luxury residences with cultural spaces.',
    description:
      'A striking architectural landmark in Kuala Lumpur centre. Seamlessly combining private luxury sky residences with curated cultural and culinary spaces below. The sweeping, organic white facade captures natural airflow and provides shaded private terraces.',
    highlights: [
      'Panoramic city skyline views',
      'Curved sculptural double-glazed facade',
      'Bespoke Italian joinery throughout',
      'Wellness suite & hydrotherapy',
      '24/7 dedicated butler & concierge service',
      'Private art gallery & collectors lounge',
    ],
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 3,
    lat: 3.139,
    lng: 101.6869,
    href: '/residences/architectural-landmark',
  },

  'marble-sanctuary': {
    id: 'prop-2',
    slug: 'marble-sanctuary',
    name: 'The Marble Sanctuary',
    cardLabel: 'BATH',
    category: 'Contemporary Interior',
    country: 'Italy',
    city: 'Milan',
    type: 'residential',
    beds: 3,
    baths: 4,
    area: '3,400 sq ft',
    price: '€ 4.2M',
    tagline: 'Hand-honed fluted stone, brushed brass accents, and serene illuminated volumes.',
    shortDescription: 'Master suite interior crafted in book-matched travertine and vertical ceramic tile.',
    description:
      'Designed by Apex Design Studio in Brera, Milan, The Marble Sanctuary celebrates acoustic silence and tactile materiality. Hand-glazed vertical ceramic tile meets honed stone countertops, complemented by concealed warm LED light channels and bespoke fluted oak vanity joinery.',
    highlights: [
      'Hand-carved solid travertine vessel basin',
      'Brushed brass concealed thermostatic fittings',
      'Fluted smoked oak floating vanity',
      'Recessed ambient lighting with Lutron scene control',
      'Walk-in rainfall shower with heated slab flooring',
      'Private steam retreat with aromatherapy integration',
    ],
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb3?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 1,
    lat: 45.4642,
    lng: 9.19,
    href: '/residences/contemporary-interior',
  },

  'verdant-house': {
    id: 'prop-3',
    slug: 'verdant-house',
    name: 'Verdant House',
    cardLabel: 'VERDANT HOUSE',
    category: 'Luxury Private Estate',
    country: 'India',
    city: 'Mumbai',
    type: 'residential',
    beds: 6,
    baths: 7,
    area: '10,500 sq ft',
    price: '₹ 28.0 Cr',
    tagline: 'Lush tropical courtyards flowing seamlessly into double-height living volumes.',
    shortDescription: 'Estate home set within a secluded private botanical garden in South Mumbai.',
    description:
      'An architectural oasis in South Mumbai. Verdant House combines biophilic architecture with uncompromising contemporary luxury. Lush internal hanging courtyards filter daylight through timber pergolas, creating an intimate sanctuary within the bustling metropolis.',
    highlights: [
      'Private internal biophilic courtyard garden',
      'Double-height timber and bronze living gallery',
      '6 ensuite master bedrooms with private green verandas',
      'Subterranean climate-controlled wine vault',
      'Multi-vehicle secured gallery with EV fast charging',
      'Private wellness pavilion & lap pool',
    ],
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb3?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 1,
    lat: 18.922,
    lng: 72.8347,
    href: '/residences/verdant-house',
  },

  'the-meridian': {
    id: 'prop-4',
    slug: 'the-meridian',
    name: 'The Meridian',
    cardLabel: 'THE MERIDIAN',
    category: 'Signature Sky Residence',
    country: 'UAE',
    city: 'Dubai',
    type: 'residential',
    beds: 3,
    baths: 4,
    area: '3,800 sq ft',
    price: 'AED 8.2M',
    tagline: 'Seven elevated tiers. Sky garden terraces on every level overlooking the Arabian Gulf.',
    shortDescription: 'Boutique tower of twenty-four exclusive residences in Dubai Maritime City.',
    description:
      'Seven cantilevered floors with private landscaped sky gardens on every level. With only twenty-four residences, each occupies an entire quadrant with 270-degree horizons over Dubai skyline and water.',
    highlights: [
      'Expansive cantilevered sky garden terraces',
      'Private high-speed biometric elevator access',
      'Horizon infinity pool suspended over marina',
      'Smart home climate and acoustic automation',
      'Full valet, concierge, and private yacht berth options',
    ],
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 2,
    lat: 25.1972,
    lng: 55.2744,
    href: '/residences/sky-residence',
  },

  'aurelia-villa': {
    id: 'prop-5',
    slug: 'aurelia-villa',
    name: 'Aurelia Villa',
    cardLabel: 'AURELIA VILLA',
    category: 'Modern Luxury Villa',
    country: 'India',
    city: 'Hyderabad',
    type: 'residential',
    beds: 5,
    baths: 5,
    area: '8,200 sq ft',
    price: '₹ 12.5 Cr',
    tagline: 'Contemporary five-bedroom villa set within sculpted stone and water courtyards.',
    shortDescription: 'Sculpted hillside villa in Jubilee Hills balancing privacy and openness.',
    description:
      'A contemporary five-bedroom villa set within a sculpted garden in Jubilee Hills. Designed around natural light, cross-ventilation, and stone courtyards, the residence balances architectural precision with the organic warmth of Indian teak and slate.',
    highlights: [
      'Private rooftop deck with cantilevered infinity pool',
      '5 ensuite master suites with garden views',
      'Double-height formal salon with fluted stone feature wall',
      'Acoustically isolated private cinema',
      'Dedicated staff quarters and catering kitchen',
    ],
    image: 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb3?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 1,
    lat: 17.4318,
    lng: 78.3821,
    href: '/residences/luxury-villa',
  },

  'ivory-residences': {
    id: 'prop-6',
    slug: 'ivory-residences',
    name: 'Ivory Residences',
    cardLabel: 'IVORY RESIDENCES',
    category: 'Waterfront Penthouse',
    country: 'Australia',
    city: 'Melbourne',
    type: 'residential',
    beds: 2,
    baths: 2,
    area: '2,100 sq ft',
    price: 'AUD 2.85M',
    tagline: 'Refined harbourfront apartments with imported travertine and floor-to-ceiling glass.',
    shortDescription: 'Sculptural stone apartments with expansive harbour-facing terraces.',
    description:
      'Refined apartments with expansive harbour-facing terraces overlooking Melbourne. Sculptural stone details, floor-to-ceiling double glazing, and uncompromised craftsmanship define this waterfront address.',
    highlights: [
      'Harbourfront panoramic wrap-around terraces',
      'Imported Italian travertine finishes throughout',
      'Private residents salon and sommelier tasting room',
      'Direct private marina berth access',
      'Integrated Gaggenau 400 series appliance suite',
    ],
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 2,
    lat: -37.8136,
    lng: 144.9631,
    href: '/residences/ivory-residences',
  },
}

// Aliases for friendly example URLs requested in prompt
export const SLUG_ALIASES: Record<string, string> = {
  'luxury-villa': 'aurelia-villa',
  'sky-residence': 'the-meridian',
  'contemporary-interior': 'marble-sanctuary',
  'architectural-landmark': 'horizon-pavilion',
  'bath': 'marble-sanctuary',
}

export function getPropertyBySlug(slug: string): PropertyItem | undefined {
  const resolvedSlug = SLUG_ALIASES[slug] || slug
  return PROPERTIES_DATA[resolvedSlug]
}

export const PERSPECTIVE_GALLERY_PROPERTIES = [
  PROPERTIES_DATA['verdant-house'],
  PROPERTIES_DATA['marble-sanctuary'],
  PROPERTIES_DATA['horizon-pavilion'],
  PROPERTIES_DATA['the-meridian'],
  PROPERTIES_DATA['aurelia-villa'],
  PROPERTIES_DATA['ivory-residences'],
]
