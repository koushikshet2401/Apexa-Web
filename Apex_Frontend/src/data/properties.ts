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

// Active properties are managed in PostgreSQL (apex_disposable_test) and Cloudflare R2
export const PROPERTIES_DATA: Record<string, PropertyItem> = {}

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

export const PERSPECTIVE_GALLERY_PROPERTIES: PropertyItem[] = []
