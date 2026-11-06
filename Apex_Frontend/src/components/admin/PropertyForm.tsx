'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Archive,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  DollarSign,
  MapPin,
  Sparkles,
} from 'lucide-react'
import MediaField from './MediaField'
import {
  SUPPORTED_CURRENCY_REGISTRY,
  SUPPORTED_CURRENCY_CODES,
  validateCurrencyMinorUnits,
  formatCurrencyAmount,
} from '@/config/currencies'

interface CountryOption {
  id: string
  name: string
  displayName: string
  slug?: string
}

interface ServiceOption {
  id: string
  name: string
  slug: string
}

interface PropertyImage {
  id: string
  url: string
  alt: string | null
  order: number
}

interface PropertyFormProps {
  initialProperty?: any
  countries: CountryOption[]
  services: ServiceOption[]
}

type PricingState = 'PRICED' | 'POA' | 'UNPRICED'

export default function PropertyForm({
  initialProperty,
  countries,
  services,
}: PropertyFormProps) {
  const router = useRouter()
  const isEditing = Boolean(initialProperty?.id)

  // 1. Core Identity & Location
  const [name, setName] = useState(initialProperty?.name || '')
  const [slug, setSlug] = useState(initialProperty?.slug || '')
  const [autoSlug, setAutoSlug] = useState(!isEditing)
  const [countryId, setCountryId] = useState(initialProperty?.countryId || '')
  const [type, setType] = useState(initialProperty?.type || 'residential')
  const [cityName, setCityName] = useState(initialProperty?.cityName || '')
  const [locationLine, setLocationLine] = useState(initialProperty?.locationLine || '')
  const [latitude, setLatitude] = useState<string | number>(initialProperty?.latitude ?? '')
  const [longitude, setLongitude] = useState<string | number>(initialProperty?.longitude ?? '')

  // 2. Pricing Engine State
  const initialPricingState: PricingState = initialProperty?.isPOA
    ? 'POA'
    : initialProperty?.askingPriceNumeric !== null && initialProperty?.askingPriceNumeric !== undefined
    ? 'PRICED'
    : initialProperty?.price && initialProperty.price.toLowerCase().includes('poa')
    ? 'POA'
    : initialProperty?.price
    ? 'PRICED'
    : 'UNPRICED'

  const [pricingState, setPricingState] = useState<PricingState>(initialPricingState)
  const [askingCurrency, setAskingCurrency] = useState(
    initialProperty?.askingCurrency || 'USD'
  )
  const [askingPriceNumeric, setAskingPriceNumeric] = useState<string | number>(
    initialProperty?.askingPriceNumeric ?? ''
  )
  const [displayPriceText, setDisplayPriceText] = useState(initialProperty?.price || '')
  const [priceChangeReason, setPriceChangeReason] = useState('')

  // 3. Quantitative & Descriptive Specs
  const [beds, setBeds] = useState(initialProperty?.beds || '')
  const [baths, setBaths] = useState(initialProperty?.baths || '')
  const [area, setArea] = useState(initialProperty?.area || '')
  const [bedroomsCount, setBedroomsCount] = useState<string | number>(
    initialProperty?.bedroomsCount ?? ''
  )
  const [bathroomsCount, setBathroomsCount] = useState<string | number>(
    initialProperty?.bathroomsCount ?? ''
  )
  const [areaNumeric, setAreaNumeric] = useState<string | number>(
    initialProperty?.areaNumeric ?? ''
  )
  const [areaUnit, setAreaUnit] = useState(initialProperty?.areaUnit || 'sqft')
  const [cardLabel, setCardLabel] = useState(initialProperty?.cardLabel || '')
  const [layoutVariant, setLayoutVariant] = useState(initialProperty?.layoutVariant || 1)

  // 4. Editorial Narrative
  const [tagline, setTagline] = useState(initialProperty?.tagline || '')
  const [shortDescription, setShortDescription] = useState(initialProperty?.shortDescription || '')
  const [description, setDescription] = useState(initialProperty?.description || '')
  const [highlights, setHighlights] = useState<string[]>(
    Array.isArray(initialProperty?.highlights) ? initialProperty.highlights : []
  )
  const [newHighlight, setNewHighlight] = useState('')

  // 5. Media Assets
  const [mainImage, setMainImage] = useState(initialProperty?.mainImage || '')
  const [mainVideoUrl, setMainVideoUrl] = useState(initialProperty?.mainVideoUrl || '')
  const [mainVideoThumb, setMainVideoThumb] = useState(initialProperty?.mainVideoThumb || '')
  const [spaceRoundImage, setSpaceRoundImage] = useState(initialProperty?.spaceRoundImage || '')

  // 6. Curation Flags
  const [isFeaturedLaunch, setIsFeaturedLaunch] = useState(Boolean(initialProperty?.isFeaturedLaunch))
  const [launchOrder, setLaunchOrder] = useState<string | number>(initialProperty?.launchOrder ?? '')
  const [launchDate, setLaunchDate] = useState(
    initialProperty?.launchDate ? new Date(initialProperty.launchDate).toISOString().split('T')[0] : ''
  )
  const [isSpaceInRound, setIsSpaceInRound] = useState(Boolean(initialProperty?.isSpaceInRound))
  const [spaceOrder, setSpaceOrder] = useState<string | number>(initialProperty?.spaceOrder ?? '')

  // 7. Services
  const initialServiceIds =
    initialProperty?.services?.map((s: any) => s.serviceId || s.service?.id) || []
  const [selectedServices, setSelectedServices] = useState<string[]>(initialServiceIds)

  // 8. Gallery Images
  const [images, setImages] = useState<PropertyImage[]>(initialProperty?.images || [])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageAlt, setNewImageAlt] = useState('')
  const [addingImage, setAddingImage] = useState(false)

  // 9. Status & Controls
  const [isPublished, setIsPublished] = useState(Boolean(initialProperty?.isPublished))
  const [isDraft, setIsDraft] = useState(
    initialProperty?.isDraft !== undefined ? Boolean(initialProperty.isDraft) : !initialProperty?.isPublished
  )
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archiveReason, setArchiveReason] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleNameChange = (val: string) => {
    setName(val)
    if (autoSlug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      )
    }
  }

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights([...highlights, newHighlight.trim()])
      setNewHighlight('')
    }
  }

  const removeHighlight = (idx: number) => {
    setHighlights(highlights.filter((_, i) => i !== idx))
  }

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter((s) => s !== id))
    } else {
      setSelectedServices([...selectedServices, id])
    }
  }

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return
    if (!isEditing) {
      setToast({ type: 'error', message: 'Please save the property before adding gallery images.' })
      return
    }

    setAddingImage(true)
    try {
      const res = await fetch(`/api/admin/properties/${initialProperty.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newImageUrl.trim(), alt: newImageAlt.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setImages([...images, data])
        setNewImageUrl('')
        setNewImageAlt('')
        setToast({ type: 'success', message: 'Image added successfully' })
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to add image' })
      }
    } catch {
      setToast({ type: 'error', message: 'Network error adding image' })
    } finally {
      setAddingImage(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      const res = await fetch(
        `/api/admin/properties/${initialProperty.id}/images?imageId=${imageId}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        setImages(images.filter((img) => img.id !== imageId))
        setToast({ type: 'success', message: 'Image removed' })
      } else {
        const data = await res.json()
        setToast({ type: 'error', message: data.error || 'Failed to delete image' })
      }
    } catch {
      setToast({ type: 'error', message: 'Network error deleting image' })
    }
  }

  const handleArchive = async () => {
    if (!isEditing) return
    setArchiving(true)

    try {
      const res = await fetch(`/api/admin/properties/${initialProperty.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: archiveReason.trim() || 'Archived via project edit form' }),
      })

      if (res.ok) {
        setToast({ type: 'success', message: 'Project moved to Deleted / Archived Projects.' })
        setShowArchiveConfirm(false)
        setTimeout(() => {
          router.push('/admin/properties')
          router.refresh()
        }, 800)
      } else {
        const data = await res.json()
        setToast({ type: 'error', message: data.error || 'Failed to archive project' })
      }
    } catch {
      setToast({ type: 'error', message: 'Network error archiving project' })
    } finally {
      setArchiving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setToast(null)

    // Validate Pricing State
    let askingNum: number | null = null
    let askingCur: string | null = null
    let isPOAVal = false

    if (pricingState === 'PRICED') {
      if (askingPriceNumeric === '' || askingPriceNumeric === null || isNaN(Number(askingPriceNumeric))) {
        setToast({ type: 'error', message: 'Please enter a valid asking price amount.' })
        setSaving(false)
        return
      }
      askingNum = Number(askingPriceNumeric)
      if (askingNum <= 0) {
        setToast({ type: 'error', message: 'Asking price must be greater than zero.' })
        setSaving(false)
        return
      }
      if (!askingCurrency) {
        setToast({ type: 'error', message: 'Please select an asking currency.' })
        setSaving(false)
        return
      }
      askingCur = askingCurrency.toUpperCase()

      // Validate ISO 4217 minor units
      if (!validateCurrencyMinorUnits(askingNum, askingCur)) {
        const def = askingCur ? SUPPORTED_CURRENCY_REGISTRY[askingCur] : undefined
        setToast({
          type: 'error',
          message: `${askingCur} does not permit decimal fractions (${def?.minorUnits ?? 2} minor units allowed).`,
        })
        setSaving(false)
        return
      }
    } else if (pricingState === 'POA') {
      isPOAVal = true
      askingNum = null
      askingCur = null
    } else {
      // UNPRICED
      isPOAVal = false
      askingNum = null
      askingCur = null
    }

    try {
      if (!isEditing) {
        // CREATION FLOW: POST /api/admin/properties
        const createPayload = {
          name: name.trim(),
          slug: slug.trim(),
          countryId: countryId || null,
          cardLabel: cardLabel || null,
          tagline: tagline || null,
          shortDescription: shortDescription || null,
          description: description || null,
          type,
          beds: beds || null,
          baths: baths || null,
          area: area || null,
          bedroomsCount: bedroomsCount !== '' ? parseInt(bedroomsCount.toString(), 10) : null,
          bathroomsCount: bathroomsCount !== '' ? bathroomsCount.toString() : null,
          areaNumeric: areaNumeric !== '' ? areaNumeric.toString() : null,
          areaUnit: areaUnit || 'sqft',
          latitude: latitude !== '' ? parseFloat(latitude.toString()) : null,
          longitude: longitude !== '' ? parseFloat(longitude.toString()) : null,
          cityName: cityName || null,
          locationLine: locationLine || null,
          mainVideoUrl: mainVideoUrl || null,
          mainVideoThumb: mainVideoThumb || null,
          mainImage: mainImage || null,
          spaceRoundImage: isSpaceInRound ? spaceRoundImage || null : null,
          highlights,
          layoutVariant: Number(layoutVariant),
          isFeaturedLaunch,
          launchOrder: isFeaturedLaunch && launchOrder !== '' ? Number(launchOrder) : null,
          launchDate: isFeaturedLaunch && launchDate ? launchDate : null,
          isSpaceInRound,
          spaceOrder: isSpaceInRound && spaceOrder !== '' ? Number(spaceOrder) : null,
          serviceIds: selectedServices,
          // Pricing
          isPOA: isPOAVal,
          askingPriceNumeric: askingNum,
          askingCurrency: askingCur,
        }

        const res = await fetch('/api/admin/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload),
        })

        const data = await res.json()
        if (!res.ok) {
          setToast({ type: 'error', message: data.error || 'Failed to create project' })
          setSaving(false)
          return
        }

        setToast({ type: 'success', message: 'Project created successfully in DRAFT state!' })
        setTimeout(() => {
          router.push(`/admin/properties/${data.id}`)
          router.refresh()
        }, 800)
      } else {
        // EDIT FLOW:
        // 1. Descriptive update via PATCH /api/admin/properties/[id] (NEVER sends financial fields)
        const descriptivePayload = {
          name: name.trim(),
          slug: slug.trim(),
          countryId: countryId || null,
          cardLabel: cardLabel || null,
          tagline: tagline || null,
          shortDescription: shortDescription || null,
          description: description || null,
          type,
          beds: beds || null,
          baths: baths || null,
          area: area || null,
          bedroomsCount: bedroomsCount !== '' ? parseInt(bedroomsCount.toString(), 10) : null,
          bathroomsCount: bathroomsCount !== '' ? bathroomsCount.toString() : null,
          areaNumeric: areaNumeric !== '' ? areaNumeric.toString() : null,
          areaUnit: areaUnit || 'sqft',
          latitude: latitude !== '' ? parseFloat(latitude.toString()) : null,
          longitude: longitude !== '' ? parseFloat(longitude.toString()) : null,
          cityName: cityName || null,
          locationLine: locationLine || null,
          mainVideoUrl: mainVideoUrl || null,
          mainVideoThumb: mainVideoThumb || null,
          mainImage: mainImage || null,
          spaceRoundImage: isSpaceInRound ? spaceRoundImage || null : null,
          highlights,
          layoutVariant: Number(layoutVariant),
          isFeaturedLaunch,
          launchOrder: isFeaturedLaunch && launchOrder !== '' ? Number(launchOrder) : null,
          launchDate: isFeaturedLaunch && launchDate ? launchDate : null,
          isSpaceInRound,
          spaceOrder: isSpaceInRound && spaceOrder !== '' ? Number(spaceOrder) : null,
          serviceIds: selectedServices,
        }

        const descRes = await fetch(`/api/admin/properties/${initialProperty.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(descriptivePayload),
        })

        if (!descRes.ok) {
          const data = await descRes.json()
          setToast({ type: 'error', message: data.error || 'Failed to update descriptive project details' })
          setSaving(false)
          return
        }

        // 2. Check if pricing changed
        const currentInitialNum =
          initialProperty.askingPriceNumeric !== null && initialProperty.askingPriceNumeric !== undefined
            ? Number(initialProperty.askingPriceNumeric)
            : null
        const currentInitialCur = initialProperty.askingCurrency || null
        const currentInitialPOA = Boolean(initialProperty.isPOA)

        const pricingChanged =
          currentInitialPOA !== isPOAVal ||
          currentInitialCur !== askingCur ||
          currentInitialNum !== askingNum

        if (pricingChanged) {
          const reason = priceChangeReason.trim() || 'Administrative price update via project edit form'
          const priceRes = await fetch(`/api/admin/properties/${initialProperty.id}/price`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason,
              isPOA: isPOAVal,
              askingPriceNumeric: askingNum,
              askingCurrency: askingCur,
            }),
          })

          if (!priceRes.ok) {
            const priceData = await priceRes.json()
            setToast({
              type: 'error',
              message: `Descriptive details saved, but price update failed: ${priceData.error || 'Unknown error'}`,
            })
            setSaving(false)
            return
          }
        }

        setToast({ type: 'success', message: 'Project details and pricing updated successfully!' })
        setPriceChangeReason('')
        router.refresh()
      }
    } catch {
      setToast({ type: 'error', message: 'An unexpected network error occurred' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-xs font-mono transition-all animate-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-[#0B1528] border-emerald-500/40 text-emerald-300'
              : 'bg-[#0B1528] border-rose-500/40 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <Link
            href="/admin/properties"
            className="text-gray-400 hover:text-white flex items-center gap-1.5 text-xs font-mono mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-medium text-white tracking-wide">
              {isEditing ? `Edit: ${initialProperty.name}` : 'New Project Listing'}
            </h1>
            {isEditing && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                  initialProperty.isArchived
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : initialProperty.isPublished
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {initialProperty.isArchived ? 'Archived' : initialProperty.isPublished ? 'Published' : 'Draft'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Configure residence specifications, multi-currency pricing, curation showcases, and publication status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEditing && (
            <>
              {initialProperty.isPublished && (
                <Link
                  href={`/collection/${initialProperty.country?.slug || 'dubai'}/${initialProperty.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-[#070E1C] border border-white/10 hover:border-white/20 text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition-all"
                >
                  <span>Live Preview</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
              {!initialProperty.isArchived && (
                <button
                  type="button"
                  onClick={() => setShowArchiveConfirm(true)}
                  className="px-3.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 text-xs text-rose-300 hover:text-rose-200 flex items-center gap-1.5 transition-all"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(203,213,225,0.15)] disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Core Identity & Location */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC] flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>1. Core Identity & Location</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. The Meridian Penthouse"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5 flex items-center justify-between">
                <span>Slug URL *</span>
                <span className="text-[10px] text-gray-500">
                  {autoSlug ? '(Auto-sync enabled)' : '(Custom)'}
                </span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setAutoSlug(false)
                }}
                placeholder="e.g. the-meridian-penthouse"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-[#7DD3FC] font-mono placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
              <p className="mt-1 text-[11px] font-mono text-gray-500">
                URL: /collection/{countries.find((c) => c.id === countryId)?.slug || countries.find((c) => c.id === countryId)?.name?.toLowerCase().replace(/\s+/g, '-') || initialProperty?.country?.slug || 'dubai'}/{slug || 'project-slug'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Destination Country
              </label>
              <select
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              >
                <option value="">Select Destination...</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Project Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              >
                <option value="residential">Residential Residence</option>
                <option value="mixed_use">Mixed-Use Landmark</option>
                <option value="commercial">Commercial Estate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                City Name
              </label>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="e.g. Dubai"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Location Line (Subtitle)
              </label>
              <input
                type="text"
                value={locationLine}
                onChange={(e) => setLocationLine(e.target.value)}
                placeholder="e.g. DUBAI MARITIME CITY, UAE"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Latitude Coordinates
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 25.276987"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Longitude Coordinates
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 55.296249"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
          </div>
        </div>

        {/* 2. Deterministic Three-State Pricing Engine */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC] flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5" />
              <span>2. Multi-Currency Pricing State</span>
            </h2>
            <span className="text-[11px] font-mono text-gray-400">
              State: <strong className="text-white">{pricingState}</strong>
            </span>
          </div>

          {/* Pricing State Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPricingState('PRICED')}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                pricingState === 'PRICED'
                  ? 'bg-[#0B1528] border-[#7DD3FC] text-white shadow-[0_0_15px_rgba(125,211,252,0.1)]'
                  : 'bg-[#040810] border-white/5 text-gray-400 hover:border-white/20'
              }`}
            >
              <div className="text-xs font-medium text-white">1. Priced Listing</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Fixed monetary amount with coupled ISO 4217 currency.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPricingState('POA')}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                pricingState === 'POA'
                  ? 'bg-[#0B1528] border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                  : 'bg-[#040810] border-white/5 text-gray-400 hover:border-white/20'
              }`}
            >
              <div className="text-xs font-medium text-white">2. Price on Application (POA)</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Premium bespoke pricing available exclusively upon enquiry.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPricingState('UNPRICED')}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                pricingState === 'UNPRICED'
                  ? 'bg-[#0B1528] border-slate-400 text-white shadow-[0_0_15px_rgba(148,163,184,0.1)]'
                  : 'bg-[#040810] border-white/5 text-gray-400 hover:border-white/20'
              }`}
            >
              <div className="text-xs font-medium text-white">3. Unpriced / In Development</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Pricing pending release or architectural valuation.
              </div>
            </button>
          </div>

          {/* Conditional Pricing Fields */}
          {pricingState === 'PRICED' && (
            <div className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1.5">
                    Currency (13 Supported ISO 4217) *
                  </label>
                  <select
                    value={askingCurrency}
                    onChange={(e) => setAskingCurrency(e.target.value)}
                    className="w-full bg-[#070E1C] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                  >
                    {SUPPORTED_CURRENCY_CODES.map((code) => {
                      const def = SUPPORTED_CURRENCY_REGISTRY[code]
                      return (
                        <option key={code} value={code}>
                          {code} - {def.name} ({def.symbol})
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1.5">
                    Asking Price Numeric *
                  </label>
                  <input
                    type="number"
                    step={askingCurrency === 'JPY' ? '1' : '0.01'}
                    required
                    value={askingPriceNumeric}
                    onChange={(e) => setAskingPriceNumeric(e.target.value)}
                    placeholder={askingCurrency === 'JPY' ? 'e.g. 500000000' : 'e.g. 3850000.00'}
                    className="w-full bg-[#070E1C] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
                  />
                  {askingCurrency === 'JPY' && (
                    <p className="text-[10px] text-amber-400 mt-1 font-mono">
                      Notice: JPY has 0 minor units (integers only).
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1.5">
                    Formatted Preview
                  </label>
                  <div className="w-full bg-[#070E1C]/50 border border-white/5 rounded-lg px-3.5 py-2.5 text-xs text-emerald-400 font-mono">
                    {askingPriceNumeric && !isNaN(Number(askingPriceNumeric))
                      ? formatCurrencyAmount(Number(askingPriceNumeric), askingCurrency)
                      : '—'}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="pt-3 border-t border-white/5">
                  <label className="block text-xs font-mono text-gray-300 mb-1.5">
                    Repricing Audit Reason (Required if updating price)
                  </label>
                  <input
                    type="text"
                    value={priceChangeReason}
                    onChange={(e) => setPriceChangeReason(e.target.value)}
                    placeholder="e.g. Q4 Market valuation repricing adjustment"
                    className="w-full bg-[#070E1C] border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>
              )}
            </div>
          )}

          {pricingState === 'POA' && (
            <div className="p-4 rounded-lg bg-[#040810] border border-amber-500/20 text-xs text-amber-300 font-mono">
              ✓ Property will display "Price on Application" on the public website and portfolio listings.
            </div>
          )}

          {pricingState === 'UNPRICED' && (
            <div className="p-4 rounded-lg bg-[#040810] border border-white/5 text-xs text-gray-400 font-mono">
              ✓ Property will display "Price on Request" without monetary amounts.
            </div>
          )}
        </div>

        {/* 3. Specs & Layout */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            3. Quantitative Specifications & Layout
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Bedrooms Display</label>
              <input
                type="text"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                placeholder="e.g. 3–4 Bedrooms"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Bedrooms Count (Numeric)</label>
              <input
                type="number"
                value={bedroomsCount}
                onChange={(e) => setBedroomsCount(e.target.value)}
                placeholder="e.g. 4"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Bathrooms Display</label>
              <input
                type="text"
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                placeholder="e.g. 4 Baths"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Bathrooms Count (Numeric)</label>
              <input
                type="number"
                step="0.5"
                value={bathroomsCount}
                onChange={(e) => setBathroomsCount(e.target.value)}
                placeholder="e.g. 4.5"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Area Display</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. 4,200 sq ft"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Area (Numeric)</label>
              <input
                type="number"
                value={areaNumeric}
                onChange={(e) => setAreaNumeric(e.target.value)}
                placeholder="e.g. 4200"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Area Unit</label>
              <select
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value)}
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              >
                <option value="sqft">Square Feet (sq ft)</option>
                <option value="sqm">Square Meters (sq m)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Card Badge Label</label>
              <input
                type="text"
                value={cardLabel}
                onChange={(e) => setCardLabel(e.target.value)}
                placeholder="e.g. SKY RESIDENCE"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-mono text-gray-300 mb-1.5">Layout Variant</label>
            <select
              value={layoutVariant}
              onChange={(e) => setLayoutVariant(Number(e.target.value))}
              className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
            >
              <option value={1}>Variant 1 — Cinematic Ultra-Wide Hero</option>
              <option value={2}>Variant 2 — Split Dual-Column Architectural</option>
              <option value={3}>Variant 3 — Minimal Luxury Editorial</option>
            </select>
          </div>
        </div>

        {/* 4. Narrative & Highlights */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            4. Editorial Narrative & Highlights
          </h2>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Where Skyline Meets Waterfront Sanctuary"
              className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5">Short Description</label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief summary displayed on cards..."
              className="w-full bg-[#040810] border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5">Full Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed architectural description..."
              className="w-full bg-[#040810] border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-2">
              Property Highlights List
            </label>
            <div className="space-y-2 mb-3">
              {highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-[#040810] border border-white/5 text-xs text-gray-300"
                >
                  <span>• {h}</span>
                  <button
                    type="button"
                    onClick={() => removeHighlight(idx)}
                    className="text-gray-500 hover:text-rose-400 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addHighlight()
                  }
                }}
                placeholder="Type a highlight (e.g. Private Marina Slip) and press Add"
                className="flex-1 bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
              <button
                type="button"
                onClick={addHighlight}
                className="px-3.5 py-2 rounded-lg bg-[#0B1528] border border-white/10 text-xs text-gray-300 hover:text-white"
              >
                Add Highlight
              </button>
            </div>
          </div>
        </div>

        {/* 5. Primary Media Assets */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            5. Primary Media Assets
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <MediaField
              label="Main Cover Image"
              value={mainImage}
              onChange={setMainImage}
              folder="properties"
              accept="image/*"
              placeholder="/images/properties/damac-riverside.jpg"
            />
            <MediaField
              label="Main Video URL"
              value={mainVideoUrl}
              onChange={setMainVideoUrl}
              folder="properties"
              accept="video/mp4"
              placeholder="/videos/properties/meridian.mp4"
            />
            <MediaField
              label="Video Thumbnail"
              value={mainVideoThumb}
              onChange={setMainVideoThumb}
              folder="properties"
              accept="image/*"
              placeholder="/images/properties/thumb-1.jpg"
            />
          </div>
        </div>

        {/* 6. Associated Services */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            6. Associated Services & Sectors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {services.map((svc) => (
              <label
                key={svc.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#040810] border border-white/5 hover:border-white/10 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedServices.includes(svc.id)}
                  onChange={() => toggleService(svc.id)}
                  className="rounded border-white/20 bg-transparent text-[#7DD3FC] focus:ring-0"
                />
                <span className="text-xs text-gray-300">{svc.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 7. Curation & Homepage Showcases */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-6">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>7. Homepage Curation & Showcases</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Featured Launch */}
            <div className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeaturedLaunch}
                  onChange={(e) => setIsFeaturedLaunch(e.target.checked)}
                  className="rounded border-white/20 text-amber-400 focus:ring-0"
                />
                <span className="text-xs font-medium text-white">Featured New Launch</span>
              </label>
              <p className="text-[11px] text-gray-500">
                Display in the Featured Launches section on the public homepage.
              </p>
              {isFeaturedLaunch && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">
                      Launch Order Sequence (1, 2, 3...)
                    </label>
                    <input
                      type="number"
                      value={launchOrder}
                      onChange={(e) => setLaunchOrder(e.target.value)}
                      placeholder="1"
                      className="w-full bg-[#070E1C] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">
                      Launch Date
                    </label>
                    <input
                      type="date"
                      value={launchDate}
                      onChange={(e) => setLaunchDate(e.target.value)}
                      className="w-full bg-[#070E1C] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Space in Round */}
            <div className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSpaceInRound}
                  onChange={(e) => setIsSpaceInRound(e.target.checked)}
                  className="rounded border-white/20 text-indigo-400 focus:ring-0"
                />
                <span className="text-xs font-medium text-white">Spaces in the Round Showcase</span>
              </label>
              <p className="text-[11px] text-gray-500">
                Feature inside the 360 Spaces in the Round carousel.
              </p>
              {isSpaceInRound && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">
                      Carousel Sequence Order (1, 2, 3...)
                    </label>
                    <input
                      type="number"
                      value={spaceOrder}
                      onChange={(e) => setSpaceOrder(e.target.value)}
                      placeholder="1"
                      className="w-full bg-[#070E1C] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <MediaField
                      label="Conditional Spaces in the Round Image"
                      value={spaceRoundImage}
                      onChange={setSpaceRoundImage}
                      folder="properties"
                      accept="image/*"
                      placeholder="Panoramic showcase image URL"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 8. Gallery Images */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
                8. Gallery Images ({images.length})
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Interior, exterior, and architectural detail gallery photographs.
              </p>
            </div>
          </div>

          {/* Add Image Bar */}
          <div className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-3">
            <MediaField
              label="Add Image to Gallery"
              value={newImageUrl}
              onChange={setNewImageUrl}
              folder="properties"
              accept="image/*"
              placeholder="Paste URL, click 'Upload File', or 'From Library'"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <input
                type="text"
                value={newImageAlt}
                onChange={(e) => setNewImageAlt(e.target.value)}
                placeholder="Caption / Alt text"
                className="md:col-span-2 bg-[#070E1C] border border-white/10 rounded-lg px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
              <button
                type="button"
                onClick={handleAddImage}
                disabled={addingImage || !newImageUrl.trim()}
                className="px-4 py-2 rounded-lg bg-[#0B1528] border border-[#7DD3FC]/30 text-xs text-[#7DD3FC] hover:bg-[#7DD3FC]/10 flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addingImage ? 'Adding...' : 'Confirm & Add to Gallery'}</span>
              </button>
            </div>
          </div>

          {/* Gallery Grid */}
          {images.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-lg text-xs text-gray-500 font-mono">
              No gallery images added yet. Add an image above.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-lg border border-white/10 overflow-hidden bg-[#040810]"
                >
                  <div className="aspect-[4/3] bg-black/40 overflow-hidden">
                    <img
                      src={img.url}
                      alt={img.alt || 'Gallery photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="p-2 flex items-center justify-between text-[11px] font-mono text-gray-400 bg-[#070E1C]">
                    <span className="truncate max-w-[120px]">{img.alt || 'Asset'}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="text-gray-500 hover:text-rose-400 p-1"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Save Button Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Link
            href="/admin/properties"
            className="text-xs font-mono text-gray-400 hover:text-white"
          >
            ← Cancel and return
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(203,213,225,0.2)] disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}</span>
          </button>
        </div>
      </form>

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#070E1C] border border-rose-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Archive className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-white">Archive Project</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Moving <strong className="text-white font-mono">{name}</strong> to Deleted Projects preserves all historical records, media assets, and transactions while removing it from active listings and public visibility.
            </p>
            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1">
                Reason for Archiving (Optional)
              </label>
              <input
                type="text"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="e.g. Delisted by owner request"
                className="w-full bg-[#040810] border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-rose-400"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="px-4 py-2 rounded-lg bg-[#0B1528] text-xs text-gray-300 hover:text-white border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchive}
                disabled={archiving}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-medium disabled:opacity-50"
              >
                {archiving ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
