import type { Metadata } from 'next'
import { PropertiesClient } from '@/components/pages/PropertiesClient'

const SEED_PROPERTIES = [
  {
    id: '1',
    slug: 'the-meridian',
    name: 'The Meridian',
    type: 'residential',
    country: 'UAE',
    city: 'Dubai',
    beds: 3,
    status: 'published',
    layoutVariant: 2,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&auto=format&fit=crop',
    shortDescription: 'Signature sky residences with cantilevered terraces over the Arabian Gulf.',
  },
  {
    id: '2',
    slug: 'horizon-pavilion',
    name: 'Horizon Pavilion',
    type: 'commercial',
    country: 'Malaysia',
    city: 'Kuala Lumpur',
    beds: 2,
    status: 'published',
    layoutVariant: 3,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&auto=format&fit=crop',
    shortDescription: 'Curving monolithic architectural landmark combining sky suites with cultural and commercial spaces.',
  },
  {
    id: '3',
    slug: 'andaman-villa',
    name: 'Andaman Villa',
    type: 'residential',
    country: 'Thailand',
    city: 'Phuket',
    beds: 4,
    status: 'published',
    layoutVariant: 1,
    image: 'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800&q=80&auto=format&fit=crop',
    shortDescription: 'Cliffside pool villa with sweeping panoramic Andaman Sea horizons.',
  },
  {
    id: '4',
    slug: 'aurelia-villa',
    name: 'Aurelia Villa',
    type: 'residential',
    country: 'India',
    city: 'Hyderabad',
    beds: 5,
    status: 'published',
    layoutVariant: 1,
    image: 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800&q=80&auto=format&fit=crop',
    shortDescription: 'Contemporary luxury villa set within sculpted stone and reflecting water courtyards.',
  },
  {
    id: '5',
    slug: 'ivory-residences',
    name: 'Ivory Residences',
    type: 'residential',
    country: 'Australia',
    city: 'Melbourne',
    beds: 2,
    status: 'published',
    layoutVariant: 2,
    image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80&auto=format&fit=crop',
    shortDescription: 'Refined harbourfront apartments crafted in imported Italian travertine and floor-to-ceiling glass.',
  },
  {
    id: '6',
    slug: 'colchis-manor',
    name: 'Colchis Manor',
    type: 'residential',
    country: 'Georgia',
    city: 'Tbilisi',
    beds: 4,
    status: 'published',
    layoutVariant: 1,
    image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80&auto=format&fit=crop',
    shortDescription: 'Historic townhouse restored to sovereign luxury standards with mountain and city views.',
  },
]

export const metadata: Metadata = {
  title: 'All Launches & Residences — Apex Pacific Holdings',
  description: 'Explore our curated portfolio of signature villas, sky residences, and commercial architectural landmarks across UAE, Thailand, Malaysia, Australia, and Georgia.',
}

export default function PropertiesPage() {
  return <PropertiesClient properties={SEED_PROPERTIES} />
}
