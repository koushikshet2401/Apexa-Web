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
    href: '/collection/malaysia/horizon-pavilion',
  },

  'marble-sanctuary': {
    id: 'prop-2',
    slug: 'marble-sanctuary',
    name: 'The Marble Sanctuary',
    cardLabel: 'THE MARBLE SANCTUARY',
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
    href: '/collection/dubai/marble-sanctuary',
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
    href: '/collection/dubai/verdant-house',
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
    href: '/collection/dubai/the-meridian',
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
    href: '/collection/dubai/aurelia-villa',
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
    href: '/collection/australia/ivory-residences',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // THAILAND COLLECTION
  // ══════════════════════════════════════════════════════════════════════════
  'samui-estate': {
    id: 'prop-th-1',
    slug: 'samui-estate',
    name: 'Samui Estate',
    cardLabel: 'SAMUI ESTATE',
    category: 'Beachfront Sanctuary',
    country: 'Thailand',
    city: 'Koh Samui',
    type: 'residential',
    beds: 5,
    baths: 6,
    area: '7,800 sq ft',
    price: 'THB 180M',
    tagline: 'Secluded beachfront sanctuary shaped by Thai craftsmanship overlooking the turquoise Gulf.',
    shortDescription: 'Ultra-luxurious beachfront estate with private coconut grove and direct shoreline access.',
    description:
      'Set along a pristine crescent bay in Koh Samui, Samui Estate harmoniously fuses indigenous teak carpentry with minimalist cantilevered pavilions. Cascading tiered infinity pools spill toward private shoreline sands, while open-plan living pavilions capture ocean breezes.',
    highlights: [
      'Direct private access to secluded white sand beach',
      '45-meter dual-tier saltwater infinity pool',
      'Handcrafted sustainable teak and local volcanic stone',
      'Dedicated private chef atelier and open-air beachfront dining pavilion',
      'In-residence spa pavilion with holistic treatment suites',
      '24/7 bespoke island concierge & security team',
    ],
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 1,
    lat: 9.512,
    lng: 100.013,
    href: '/collection/thailand/samui-estate',
  },

  'andaman-villa': {
    id: 'prop-th-2',
    slug: 'andaman-villa',
    name: 'Andaman Villa',
    cardLabel: 'ANDAMAN VILLA',
    category: 'Cliffside Pool Villa',
    country: 'Thailand',
    city: 'Phuket',
    type: 'residential',
    beds: 4,
    baths: 5,
    area: '6,400 sq ft',
    price: 'THB 145M',
    tagline: 'Sculpted hillside retreat suspended high above the Andaman Sea horizon.',
    shortDescription: 'Cliffside architectural masterwork with dramatic sunset panoramas and cantilevered decks.',
    description:
      'Perched on Phuket’s Millionaires’ Mile, Andaman Villa frames dramatic 180-degree sunsets over the Andaman Sea. Granite-clad retaining walls give way to ethereal glass volumes, an oceanfront plunge deck, and sunken fire lounges.',
    highlights: [
      'Unobstructed sunset panoramas over the Andaman Sea',
      'Cantilevered 28m infinity pool suspended over coastline',
      'Private hillside funicular and helipad access',
      'Custom Boffi kitchen and wine cellar',
      'Wellness pavilion featuring cold plunge and infrared sauna',
    ],
    image: 'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 2,
    lat: 7.9519,
    lng: 98.2798,
    href: '/collection/thailand/andaman-villa',
  },

  'lotus-pavilion': {
    id: 'prop-th-3',
    slug: 'lotus-pavilion',
    name: 'Lotus Pavilion',
    cardLabel: 'LOTUS PAVILION',
    category: 'Botanical Garden Villa',
    country: 'Thailand',
    city: 'Bangkok',
    type: 'residential',
    beds: 3,
    baths: 4,
    area: '4,800 sq ft',
    price: 'THB 95M',
    tagline: 'An urban sanctuary enclosed in tropical botanical courtyards along the Chao Phraya.',
    shortDescription: 'Modernist garden villa balancing urban connectivity with serene private ponds.',
    description:
      'Tucked in Bangkok’s heritage riverside district, Lotus Pavilion is an oasis of calm. Water courtyards with blooming lotus flowers, fluted glass screens, and double-height ceilings create an ethereal transition between indoor living and lush tropical nature.',
    highlights: [
      'Private landscaped lotus pond and reflection pools',
      'Double-height formal living salon with fluted bronze accents',
      'Direct private canal access with private boat mooring',
      'Floor-to-ceiling acoustic double glazing throughout',
    ],
    image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 3,
    lat: 13.7563,
    lng: 100.5018,
    href: '/collection/thailand/lotus-pavilion',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // UAE COLLECTION
  // ══════════════════════════════════════════════════════════════════════════
  'mirage-villa': {
    id: 'prop-uae-2',
    slug: 'mirage-villa',
    name: 'Mirage Villa',
    cardLabel: 'MIRAGE VILLA',
    category: 'Palm Waterfront Villa',
    country: 'United Arab Emirates',
    city: 'Palm Jumeirah',
    type: 'residential',
    beds: 6,
    baths: 7,
    area: '10,500 sq ft',
    price: 'AED 38.0M',
    tagline: 'Palatial beachfront villa fronting the calm waters of Palm Jumeirah.',
    shortDescription: 'Signature Palm Jumeirah villa with private beach and skyline views.',
    description:
      'Rising on one of Palm Jumeirah’s most exclusive fronds, Mirage Villa is an ode to contemporary Arabian luxury. Featuring triple-height atrium glazing, private beach frontage, an infinity pool blending into the Gulf, and subterranean showroom parking.',
    highlights: [
      'Private beach frontage on Palm Jumeirah',
      'Dual infinity-edge heated pools and swim-up lounge',
      'Subterranean 6-car automated gallery',
      'Private cinema room and wellness spa',
    ],
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 1,
    lat: 25.1124,
    lng: 55.139,
    href: '/collection/dubai/mirage-villa',
  },

  'azure-haven': {
    id: 'prop-uae-3',
    slug: 'azure-haven',
    name: 'Azure Haven',
    cardLabel: 'AZURE HAVEN',
    category: 'Island Penthouse',
    country: 'United Arab Emirates',
    city: 'Abu Dhabi',
    type: 'residential',
    beds: 4,
    baths: 5,
    area: '5,900 sq ft',
    price: 'AED 24.5M',
    tagline: 'Elevated island penthouse with sweeping vistas of the Saadiyat cultural district.',
    shortDescription: 'Ultra-prime island penthouse overlooking turquoise Arabian waters.',
    description:
      'Positioned high above Saadiyat Island, Azure Haven captures sweeping vistas across natural mangroves and the Arabian Gulf. Finished with honed Calacatta marble, custom Italian millwork, and wrap-around viewing decks.',
    highlights: [
      'Saadiyat Island cultural district panoramas',
      'Wraparound terrace with private cantilevered jacuzzi',
      'Private elevator foyer directly into primary salon',
    ],
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 2,
    lat: 24.5367,
    lng: 54.4326,
    href: '/collection/dubai/azure-haven',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AUSTRALIA COLLECTION
  // ══════════════════════════════════════════════════════════════════════════
  'point-piper-villa': {
    id: 'prop-au-2',
    slug: 'point-piper-villa',
    name: 'Point Piper Villa',
    cardLabel: 'POINT PIPER VILLA',
    category: 'Harbourfront Villa',
    country: 'Australia',
    city: 'Sydney',
    type: 'residential',
    beds: 5,
    baths: 6,
    area: '8,200 sq ft',
    price: 'AUD 22.5M',
    tagline: 'Iconic Sydney Harbourfront estate commanding front-row Harbour Bridge views.',
    shortDescription: 'World-class harbourfront residence with private deepwater jetty and slipway.',
    description:
      'Occupying Sydney’s most celebrated harbour peninsula, Point Piper Villa offers an irreplaceable vantage across Sydney Harbour. Sculpted sandstone terraces, floor-to-ceiling glass pavilions, and direct deepwater boat mooring.',
    highlights: [
      'Unrivalled Sydney Harbour and Bridge panoramas',
      'Private deepwater jetty and boat slipway',
      'Sandstone cliffside wine cellar and tasting cave',
      'Championship heated ozone pool at water’s edge',
    ],
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 1,
    lat: -33.8651,
    lng: 151.2503,
    href: '/collection/australia/point-piper-villa',
  },

  'travertine-pavilion': {
    id: 'prop-au-3',
    slug: 'travertine-pavilion',
    name: 'The Travertine Pavilion',
    cardLabel: 'THE TRAVERTINE PAVILION',
    category: 'Ocean Promenade Estate',
    country: 'Australia',
    city: 'Gold Coast',
    type: 'residential',
    beds: 4,
    baths: 5,
    area: '5,800 sq ft',
    price: 'AUD 14.8M',
    tagline: 'Brutalist travertine minimalism meeting warm Pacific Ocean light.',
    shortDescription: 'Sculptural stone estate along the Gold Coast ocean promenade.',
    description:
      'A masterpiece of textured Roman travertine and raw off-form concrete along the Gold Coast shoreline. Designed with deep overhangs that filter sub-tropical daylight while offering total privacy and ocean immersion.',
    highlights: [
      'Direct ocean promenade access with 180° Pacific views',
      'Solid Roman travertine block facade and interior walls',
      'Zero-edge horizon pool reflecting ocean swell',
    ],
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 2,
    lat: -28.0167,
    lng: 153.4,
    href: '/collection/australia/travertine-pavilion',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MALAYSIA COLLECTION
  // ══════════════════════════════════════════════════════════════════════════
  'the-lantern-house': {
    id: 'prop-my-2',
    slug: 'the-lantern-house',
    name: 'The Lantern House',
    cardLabel: 'THE LANTERN HOUSE',
    category: 'Rainforest Pavilion',
    country: 'Malaysia',
    city: 'Penang',
    type: 'residential',
    beds: 4,
    baths: 4,
    area: '5,200 sq ft',
    price: 'MYR 5.2M',
    tagline: 'A glass-and-timber pavilion aglow amidst protected ancient rainforest canopies.',
    shortDescription: 'Striking modern pavilion home nestled into Penang’s lush hillside.',
    description:
      'Suspended gently on steel stilts above the rainforest floor in Penang, The Lantern House glows like a beacon at dusk. Natural cross-ventilation, reclaimed tropical hardwood louvers, and private canopy terraces define this sustainable sanctuary.',
    highlights: [
      'Suspended hillside structure over lush tropical canopy',
      'Natural passive cooling with reclaimed hardwood louvers',
      'Infinity lap pool facing the Andaman sunset horizon',
    ],
    image: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 1,
    lat: 5.4164,
    lng: 100.3327,
    href: '/collection/malaysia/the-lantern-house',
  },

  'banyan-residence': {
    id: 'prop-my-3',
    slug: 'banyan-residence',
    name: 'Banyan Residence',
    cardLabel: 'BANYAN RESIDENCE',
    category: 'Coastal Villa',
    country: 'Malaysia',
    city: 'Langkawi',
    type: 'residential',
    beds: 5,
    baths: 5,
    area: '6,600 sq ft',
    price: 'MYR 8.9M',
    tagline: 'Understated tropical luxury bordering ancient limestone karst cliffs.',
    shortDescription: 'Private coastal estate in Langkawi with private cove access.',
    description:
      'Resting beside a private bay in Langkawi, Banyan Residence weaves around century-old banyan trees and limestone karst cliffs. Hand-hewn stone terraces meet sea-facing open pavilions for true barefoot luxury.',
    highlights: [
      'Private bay and protected coral cove mooring',
      'Integrated natural karst rock pool and waterfall',
      'Open-air dining sala elevated over Andaman coastline',
    ],
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 2,
    lat: 6.35,
    lng: 99.8,
    href: '/collection/malaysia/banyan-residence',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GEORGIA COLLECTION
  // ══════════════════════════════════════════════════════════════════════════
  'colchis-manor': {
    id: 'prop-ge-1',
    slug: 'colchis-manor',
    name: 'Colchis Manor',
    cardLabel: 'COLCHIS MANOR',
    category: 'Historic Townhouse',
    country: 'Georgia',
    city: 'Tbilisi',
    type: 'residential',
    beds: 4,
    baths: 4,
    area: '4,200 sq ft',
    price: '$2.8M USD',
    tagline: 'Restored 19th-century Caucasian estate with ornate wooden balconies and mountain views.',
    shortDescription: 'Historic architectural residence in the heart of Old Tbilisi.',
    description:
      'Perched on the historic hills of Old Tbilisi, Colchis Manor balances restored Caucasian architectural heritage with sleek contemporary glass additions. Featuring traditional fretwork balconies, exposed volcanic brick, and an ancient subterranean wine cellar.',
    highlights: [
      'Commanding panoramic views of Old Tbilisi and Narikala Fortress',
      'Century-old traditional carved wooden balconies restored by artisans',
      'Subterranean 3,000-bottle Georgian qvevri wine cellar',
      'Modern glass atrium with heated plunge pool',
    ],
    image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 1,
    lat: 41.6938,
    lng: 44.8015,
    href: '/collection/georgia/colchis-manor',
  },

  'batumi-heights': {
    id: 'prop-ge-2',
    slug: 'batumi-heights',
    name: 'Batumi Heights',
    cardLabel: 'BATUMI HEIGHTS',
    category: 'Black Sea Penthouse',
    country: 'Georgia',
    city: 'Batumi',
    type: 'residential',
    beds: 3,
    baths: 3,
    area: '3,800 sq ft',
    price: '$1.9M USD',
    tagline: 'Ultra-modern coastal penthouse overlooking the Black Sea boulevard.',
    shortDescription: 'Contemporary glass penthouse with panoramic Black Sea panoramas.',
    description:
      'Commanding the entire top floor along Batumi’s prestigious seaside boulevard, Batumi Heights frames infinite views of the Black Sea meeting snow-capped Adjara mountains. Custom Italian furnishings and a wrap-around sunset terrace.',
    highlights: [
      '360-degree Black Sea and mountain panoramas',
      'Wrap-around glass terrace with private jacuzzi',
      'Direct seaside promenade and yacht club access',
    ],
    image: 'https://images.unsplash.com/photo-1504615755583-2916b52192a3?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1504615755583-2916b52192a3?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 2,
    lat: 41.6168,
    lng: 41.6367,
    href: '/collection/georgia/batumi-heights',
  },

  'borjomi-chalet': {
    id: 'prop-ge-3',
    slug: 'borjomi-chalet',
    name: 'Borjomi Chalet',
    cardLabel: 'BORJOMI CHALET',
    category: 'Mountain Retreat',
    country: 'Georgia',
    city: 'Borjomi',
    type: 'residential',
    beds: 5,
    baths: 5,
    area: '5,500 sq ft',
    price: '$2.4M USD',
    tagline: 'High-alpine stone and timber chalet nestled in Borjomi mineral spring forests.',
    shortDescription: 'Secluded alpine chalet surrounded by pristine coniferous pine forests.',
    description:
      'Constructed with local river stone and seasoned pine beams, Borjomi Chalet is an alpine sanctuary. Natural thermal mineral springs feed private outdoor cedar hot tubs, while roaring central fireplaces anchor double-height cathedral lounges.',
    highlights: [
      'Natural mineral spring hydrotherapy pools and cedar tubs',
      'Double-height great room with monumental stone fireplace',
      'Helicopter landing pad on private alpine grounds',
      'Exclusive access to private hunting and hiking reserves',
    ],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1200&q=80&auto=format&fit=crop',
    ],
    layoutVariant: 3,
    lat: 41.8389,
    lng: 43.385,
    href: '/collection/georgia/borjomi-chalet',
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
