'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Film,
  Image as ImageIcon,
  Globe,
  DollarSign,
  Briefcase,
  Flame,
  Orbit,
  UploadCloud,
  Loader2,
  Sparkles,
  Home,
  Check,
  MapPin,
  ExternalLink,
  FolderOpen,
} from 'lucide-react'
import MediaField from './MediaField'
import MediaLibraryModal from './MediaLibraryModal'
import { SUPPORTED_CURRENCY_CODES } from '@/config/currencies'

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

interface GalleryImageItem {
  id?: string
  url: string
  alt: string
  description: string
  order?: number
}

interface PropertyFormProps {
  initialProperty?: any
  countries: CountryOption[]
  services: ServiceOption[]
}

const DEFAULT_FEATURE_PLACEHOLDERS = [
  'Private internal biophilic courtyard garden',
  'Double-height timber and bronze living gallery',
  '6 ensuite master bedrooms with private green verandas',
  'Subterranean climate-controlled wine vault',
  'Multi-vehicle secured gallery with EV fast charging',
  'Private wellness pavilion & lap pool',
]

const DEFAULT_GALLERY_SLOTS: GalleryImageItem[] = [
  { url: '', alt: 'Master Living Salon', description: 'Double-height living space with panoramic vistas', order: 0 },
  { url: '', alt: 'Bespoke Primary Sanctuary', description: 'Master suite with private veranda and marble bath', order: 1 },
  { url: '', alt: 'Culinary Atelier & Dining', description: 'Chef kitchen with bookmatched travertine and oak', order: 2 },
  { url: '', alt: 'Private Courtyard & Pool', description: 'Sun-drenched outdoor lap pool and landscaped terrace', order: 3 },
  { url: '', alt: 'Architectural Wellness Suite', description: 'Private spa, sauna, and wellness pavilion', order: 4 },
]

function hydrateGallerySlots(images?: any[]): GalleryImageItem[] {
  if (!Array.isArray(images) || images.length === 0) {
    return DEFAULT_GALLERY_SLOTS.map((slot) => ({ ...slot }))
  }

  const maxOrder = images.reduce((max, img, idx) => {
    const pos = typeof img?.order === 'number' && Number.isInteger(img.order) && img.order >= 0 ? img.order : idx
    return Math.max(max, pos)
  }, -1)

  const slotCount = Math.max(5, maxOrder + 1, images.length)
  const slots: Array<GalleryImageItem | null> = Array(slotCount).fill(null)
  const overflow: any[] = []

  // Preserve sparse order positions so cleared/missing gallery slots stay in-place
  for (const img of images) {
    const pos = img?.order
    if (typeof pos === 'number' && Number.isInteger(pos) && pos >= 0 && pos < slotCount && !slots[pos]) {
      slots[pos] = {
        id: img.id,
        url: img.url || '',
        alt: img.alt || img.description || `Space 0${pos + 1}`,
        description: img.description || '',
        order: pos,
      }
    } else {
      overflow.push(img)
    }
  }

  let cursor = 0
  for (const img of overflow) {
    while (cursor < slotCount && slots[cursor]) cursor++
    if (cursor < slotCount) {
      slots[cursor] = {
        id: img.id,
        url: img.url || '',
        alt: img.alt || img.description || `Space 0${cursor + 1}`,
        description: img.description || '',
        order: cursor,
      }
    }
  }

  return slots.map((slot, idx) => {
    if (slot) return slot
    const fallback = DEFAULT_GALLERY_SLOTS[idx]
    return {
      url: '',
      alt: fallback?.alt || `Architectural Feature 0${idx + 1}`,
      description: fallback?.description || '',
      order: idx,
    }
  })
}

export default function PropertyForm({
  initialProperty,
  countries,
  services,
}: PropertyFormProps) {
  const router = useRouter()
  const isEditing = Boolean(initialProperty?.id)

  // 1. Basic Information
  const [name, setName] = useState(initialProperty?.name || '')
  const [slug, setSlug] = useState(initialProperty?.slug || '')
  const [type, setType] = useState(initialProperty?.type || 'Luxury Villa')
  const [tagline, setTagline] = useState(initialProperty?.tagline || '')
  const [description, setDescription] = useState(initialProperty?.description || '')
  const [countryId, setCountryId] = useState(initialProperty?.countryId || (countries[0]?.id || ''))
  const selectedCountryObj = countries.find((c) => c.id === countryId)
  const selectedCountrySlug = selectedCountryObj?.slug || selectedCountryObj?.name || 'general'
  const effectiveProjectSlug = (slug || name || 'new-project').trim()

  // 6 Key Features / Highlights
  const [highlights, setHighlights] = useState<string[]>(() => {
    const existing: string[] = initialProperty?.highlights || []
    const padded = [...existing]
    while (padded.length < 6) {
      padded.push('')
    }
    return padded.slice(0, 6)
  })

  // Selected Service Categories
  const initialServiceIds =
    initialProperty?.services?.map((s: any) => s.serviceId || s.service?.id) || []
  const [selectedServices, setSelectedServices] = useState<string[]>(initialServiceIds)

  // 2. Pricing & Specifications
  const [isPOA, setIsPOA] = useState<boolean>(Boolean(initialProperty?.isPOA))
  const [askingPriceNumeric, setAskingPriceNumeric] = useState<string>(
    initialProperty?.askingPriceNumeric ? String(initialProperty.askingPriceNumeric) : ''
  )
  const [askingCurrency, setAskingCurrency] = useState<string>(
    initialProperty?.askingCurrency || 'AED'
  )
  const [customPrice, setCustomPrice] = useState<string>(initialProperty?.price || '')
  const [beds, setBeds] = useState(initialProperty?.beds || '')
  const [baths, setBaths] = useState(initialProperty?.baths || '')
  const [area, setArea] = useState(initialProperty?.area || '')

  // Location & Map
  const [locationLine, setLocationLine] = useState(initialProperty?.locationLine || '')
  const [cityName, setCityName] = useState(initialProperty?.cityName || '')
  const [latitude, setLatitude] = useState<string>(
    initialProperty?.latitude !== null && initialProperty?.latitude !== undefined
      ? String(initialProperty.latitude)
      : ''
  )
  const [longitude, setLongitude] = useState<string>(
    initialProperty?.longitude !== null && initialProperty?.longitude !== undefined
      ? String(initialProperty.longitude)
      : ''
  )
  const [mapUrl, setMapUrl] = useState<string>(initialProperty?.mapUrl || '')
  const [verifyingMap, setVerifyingMap] = useState<boolean>(false)
  const [mapVerified, setMapVerified] = useState<boolean | null>(initialProperty?.mapUrl ? true : null)
  const [mapDetails, setMapDetails] = useState<{ placeName?: string | null; lat?: number | null; lng?: number | null } | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  const handleVerifyMap = async (urlToVerify: string) => {
    const trimmed = urlToVerify.trim()
    if (!trimmed) {
      setMapVerified(null)
      setMapDetails(null)
      setMapError(null)
      return
    }

    try {
      setVerifyingMap(true)
      setMapError(null)
      const res = await fetch('/api/admin/maps/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: trimmed }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setMapVerified(true)
        setMapDetails({
          placeName: data.placeName,
          lat: data.latitude,
          lng: data.longitude,
        })
        if (data.latitude !== null && data.latitude !== undefined) {
          setLatitude(data.latitude.toString())
        }
        if (data.longitude !== null && data.longitude !== undefined) {
          setLongitude(data.longitude.toString())
        }
        if (data.url && data.url !== trimmed) {
          setMapUrl(data.url)
        }
      } else {
        setMapVerified(false)
        setMapDetails(null)
        setMapError(data.error || 'Invalid Google Maps location link. Please paste a valid link.')
      }
    } catch (err: any) {
      setMapVerified(false)
      setMapDetails(null)
      setMapError(err?.message || 'Could not verify map URL.')
    } finally {
      setVerifyingMap(false)
    }
  }

  // 3. Media Assets
  const [mainImage, setMainImage] = useState(initialProperty?.mainImage || '')
  const [mainVideoUrl, setMainVideoUrl] = useState(initialProperty?.mainVideoUrl || '')

  // Multiple Gallery Images with Individual Descriptions (At least 5 slots)
  const [galleryImages, setGalleryImages] = useState<GalleryImageItem[]>(() =>
    hydrateGallerySlots(initialProperty?.images)
  )

  // 4. Curation Flags
  const [isFeaturedLaunch, setIsFeaturedLaunch] = useState<boolean>(
    Boolean(initialProperty?.isFeaturedLaunch)
  )
  const [launchOrder, setLaunchOrder] = useState<string>(
    initialProperty?.launchOrder ? String(initialProperty.launchOrder) : '1'
  )
  const [isSpaceInRound, setIsSpaceInRound] = useState<boolean>(
    Boolean(initialProperty?.isSpaceInRound)
  )
  const [spaceRoundImage, setSpaceRoundImage] = useState(
    initialProperty?.spaceRoundImage || ''
  )

  // Status & Submission
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)
  const [librarySlotIdx, setLibrarySlotIdx] = useState<number | null>(null)

  // Auto-generate slug from name if creating
  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      )
    }
  }

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter((s) => s !== id))
    } else {
      setSelectedServices([...selectedServices, id])
    }
  }

  // Gallery slot handlers
  const handleSlotChange = (index: number, field: keyof GalleryImageItem, val: string) => {
    const updated = [...galleryImages]
    updated[index] = { ...updated[index], [field]: val }
    setGalleryImages(updated)
  }

  const handleAddMoreSlots = () => {
    setGalleryImages([
      ...galleryImages,
      {
        url: '',
        alt: `Architectural Space 0${galleryImages.length + 1}`,
        description: '',
        order: galleryImages.length,
      },
    ])
  }

  const handleRemoveSlot = async (index: number) => {
    const item = galleryImages[index]
    if (isEditing && item?.id && initialProperty?.id) {
      try {
        await fetch(`/api/admin/properties/${initialProperty.id}/images?imageId=${item.id}`, {
          method: 'DELETE',
        })
      } catch (err) {
        console.error('Error deleting image from server:', err)
      }
    }
    const updated = galleryImages.filter((_, idx) => idx !== index)
    // If fewer than 5 left, pad with blank slot so at least 5 slots stay visible
    while (updated.length < 5) {
      updated.push({
        url: '',
        alt: `Architectural Space 0${updated.length + 1}`,
        description: '',
        order: updated.length,
      })
    }
    setGalleryImages(updated)
  }

  // Direct Explorer Upload for Gallery Slot (Immune to CORS)
  const handleGalleryFileUpload = async (index: number, file: File) => {
    try {
      setUploadingSlot(index)
      setToast(null)

      if (file.size === 0) {
        throw new Error('Selected image cannot be empty (0 bytes).')
      }
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('Gallery image exceeds 20MB limit.')
      }

      const presignRes = await fetch('/api/admin/media/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'image/jpeg',
          fileSize: file.size,
          folder: 'properties',
          countrySlug: selectedCountrySlug,
          projectSlug: effectiveProjectSlug,
          mediaRole: 'GALLERY',
        }),
      })

      const presignData = await presignRes.json()
      if (!presignRes.ok || !presignData.uploadUrl) {
        throw new Error(presignData.error || 'Failed to authorize media upload.')
      }

      const { uploadUrl, publicUrl } = presignData

      const xhr = new XMLHttpRequest()
      await new Promise<void>((resolve, reject) => {
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg')
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            let errMsg = `Upload failed with status ${xhr.status}`
            try {
              const errJson = JSON.parse(xhr.responseText)
              if (errJson?.error) errMsg = errJson.error
            } catch {}
            reject(new Error(errMsg))
          }
        }
        xhr.onerror = () => reject(new Error('Network error during file upload.'))
        xhr.send(file)
      })

      let finalUrl = publicUrl
      try {
        const res = JSON.parse(xhr.responseText)
        if (res && res.publicUrl) finalUrl = res.publicUrl
      } catch {}

      setGalleryImages((prev) => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          url: finalUrl,
          alt: updated[index].alt || file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' '),
        }
        return updated
      })
    } catch (err: any) {
      console.error('Gallery image upload failed:', err)
      setToast({ type: 'error', message: err.message || 'Image upload failed. Please try again.' })
    } finally {
      setUploadingSlot(null)
    }
  }

  const handleSubmit = async (publishImmediately: boolean) => {
    if (!name.trim()) {
      setToast({ type: 'error', message: 'Project Name is required.' })
      return
    }

    if (!countryId) {
      setToast({ type: 'error', message: 'Please select a Country Destination.' })
      return
    }

    const parsedNumericInput = askingPriceNumeric.trim() ? parseFloat(askingPriceNumeric) : null
    const hasValidPrice =
      isPOA ||
      (parsedNumericInput !== null && parsedNumericInput > 0) ||
      (isEditing && Boolean(customPrice.trim()))

    if (!hasValidPrice) {
      setToast({
        type: 'error',
        message: 'Please provide an Asking Price or enable Price on Application (POA).',
      })
      return
    }

    try {
      setSaving(true)
      setToast(null)

      // Filter gallery images that have actual URLs while preserving each slot's sparse order
      const validGalleryImages = galleryImages
        .map((img, slotIdx) => ({ img, slotIdx }))
        .filter(({ img }) => Boolean(img.url && img.url.trim()))
        .map(({ img, slotIdx }) => ({
          url: img.url.trim(),
          alt: img.alt?.trim() || img.description?.trim() || `Space 0${slotIdx + 1}`,
          description: img.description?.trim() || '',
          order: slotIdx,
        }))

      // Cleaned 6 highlights
      const cleanedHighlights = highlights.map((h) => h.trim()).filter(Boolean)

      const payload = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        countryId,
        type: type.trim() || 'Luxury Villa',
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        highlights: cleanedHighlights,
        beds: beds.trim() || null,
        baths: baths.trim() || null,
        area: area.trim() || null,
        locationLine: locationLine.trim() || null,
        cityName: cityName.trim() || null,
        latitude: latitude !== '' ? parseFloat(latitude) : null,
        longitude: longitude !== '' ? parseFloat(longitude) : null,
        mapUrl: mapUrl.trim() || null,
        mainImage: mainImage.trim() || null,
        mainVideoUrl: mainVideoUrl.trim() || null,
        images: validGalleryImages,
        serviceIds: selectedServices,
        isFeaturedLaunch,
        launchOrder: isFeaturedLaunch && launchOrder !== '' ? parseInt(launchOrder, 10) : null,
        isSpaceInRound,
        spaceRoundImage: isSpaceInRound ? spaceRoundImage.trim() || null : null,
        isPOA,
        askingPriceNumeric: !isPOA && askingPriceNumeric ? parseFloat(askingPriceNumeric) : null,
        askingCurrency: !isPOA ? askingCurrency : null,
        price: customPrice.trim() || null,
        isPublished: publishImmediately,
      }

      if (!isEditing) {
        // CREATE NEW PROJECT
        const res = await fetch('/api/admin/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create project')
        }

        setToast({
          type: 'success',
          message: publishImmediately
            ? 'Project created and published successfully!'
            : 'Project created as Draft successfully!',
        })

        setTimeout(() => {
          router.push('/admin/properties?tab=current')
          router.refresh()
        }, 800)
      } else {
        // EDIT EXISTING PROJECT
        // 1. Update descriptive and structural fields
        const descPayload = {
          name: payload.name,
          slug: payload.slug,
          countryId: payload.countryId,
          type: payload.type,
          tagline: payload.tagline,
          description: payload.description,
          highlights: payload.highlights,
          beds: payload.beds,
          baths: payload.baths,
          area: payload.area,
          locationLine: payload.locationLine,
          cityName: payload.cityName,
          latitude: payload.latitude,
          longitude: payload.longitude,
          mapUrl: payload.mapUrl,
          mainImage: payload.mainImage,
          mainVideoUrl: payload.mainVideoUrl,
          spaceRoundImage: payload.spaceRoundImage,
          serviceIds: payload.serviceIds,
          images: payload.images,
          isFeaturedLaunch: payload.isFeaturedLaunch,
          launchOrder: payload.launchOrder,
          isSpaceInRound: payload.isSpaceInRound,
        }

        const descRes = await fetch(`/api/admin/properties/${initialProperty.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(descPayload),
        })

        if (!descRes.ok) {
          const errData = await descRes.json()
          throw new Error(errData.error || 'Failed to update project details')
        }

        // 2. Update price if explicitly changed (preserve legacy formatted-only prices during media edits)
        const currentInitialNum =
          initialProperty.askingPriceNumeric !== null && initialProperty.askingPriceNumeric !== undefined
            ? Number(initialProperty.askingPriceNumeric)
            : null
        const currentInitialCur = initialProperty.askingCurrency || null
        const currentInitialPOA = Boolean(initialProperty.isPOA)
        const nextNumericVal =
          !isPOA && askingPriceNumeric.trim() ? parseFloat(askingPriceNumeric) : null
        const nextCurrencyVal = !isPOA && nextNumericVal !== null ? askingCurrency : null

        const pricingChanged =
          currentInitialPOA !== isPOA ||
          currentInitialNum !== nextNumericVal ||
          (currentInitialNum !== null && currentInitialCur !== nextCurrencyVal)

        if (pricingChanged) {
          await fetch(`/api/admin/properties/${initialProperty.id}/price`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason: 'Administrative price update via project edit form',
              isPOA,
              askingPriceNumeric: nextNumericVal,
              askingCurrency: nextCurrencyVal,
            }),
          })
        }

        // 3. Update publish status if toggled
        if (publishImmediately && !initialProperty.isPublished) {
          await fetch(`/api/admin/properties/${initialProperty.id}/publish`, { method: 'POST' })
        } else if (!publishImmediately && initialProperty.isPublished) {
          await fetch(`/api/admin/properties/${initialProperty.id}/unpublish`, { method: 'POST' })
        }

        setToast({ type: 'success', message: 'Project changes saved successfully!' })
        setTimeout(() => {
          router.push('/admin/properties?tab=current')
          router.refresh()
        }, 800)
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'An error occurred while saving project.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 font-sans">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <Link
            href="/admin/properties?tab=current"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Current Projects</span>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-white">
            {isEditing ? `Edit Project: ${initialProperty.name}` : 'Add Project'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Complete project showcase management. Everything entered here updates public country collections, property detail pages, and service portfolios immediately.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-[#040810] text-xs font-bold transition-all shadow-[0_0_15px_rgba(125,211,252,0.25)] cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Publishing...' : 'Publish Project'}
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-sm transition-all border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-500/40 text-emerald-950 font-semibold'
              : 'bg-[#FEE2E2] border-2 border-[#DC2626] text-[#7F1D1D] font-bold'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B91C1C]" />
          )}
          <span className="text-xs leading-normal">{toast.message}</span>
        </div>
      )}

      {/* SECTION 1: PROJECT IDENTITY & DESTINATION */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <Globe className="w-4 h-4 text-[#7DD3FC]" />
          <h2 className="text-sm font-semibold text-white tracking-wide">Project Identity & Destination</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-300 block mb-1.5 font-medium">
              Project Name <span className="text-[#DC2626] font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              placeholder="e.g. Verdant House"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1.5 font-medium">
              Country Destination <span className="text-[#DC2626] font-bold ml-0.5">*</span>
            </label>
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              required
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName || c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Exact Location via Map (Google Maps Link) */}
          <div className="md:col-span-2 p-4 rounded-xl bg-[#040810]/70 border border-white/10 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5 tracking-wide">
                <MapPin className="w-3.5 h-3.5 text-[#7DD3FC]" />
                <span>Select Exact Location via Map (Google Maps Link)</span>
              </label>
              <span className="text-[10px] font-mono text-[#7DD3FC] bg-[#7DD3FC]/10 border border-[#7DD3FC]/20 px-2 py-0.5 rounded self-start sm:self-auto">
                Powers "Explore via Map" on Client Side
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={mapUrl}
                  onChange={(e) => {
                    const val = e.target.value
                    setMapUrl(val)
                    if (mapVerified !== null) {
                      setMapVerified(null)
                      setMapError(null)
                    }
                  }}
                  onBlur={() => {
                    if (mapUrl.trim()) handleVerifyMap(mapUrl)
                  }}
                  placeholder="Paste Google Maps URL (e.g. https://www.google.com/maps/place/... or https://maps.app.goo.gl/...)"
                  className="w-full bg-[#070E1C] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC]"
                />
                <Globe className="w-4 h-4 text-gray-500 absolute left-3 top-3 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={() => handleVerifyMap(mapUrl)}
                disabled={verifyingMap || !mapUrl.trim()}
                className="px-4 py-2.5 rounded-lg bg-[#7DD3FC]/15 hover:bg-[#7DD3FC]/25 text-[#7DD3FC] border border-[#7DD3FC]/30 text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-[0_0_12px_rgba(125,211,252,0.12)]"
              >
                {verifyingMap ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify Location</span>
                  </>
                )}
              </button>
            </div>

            {/* Verification Status Feedback */}
            {mapVerified === true && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-200">
                <div className="flex items-start sm:items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-emerald-300 font-mono">
                      ✓ Location Verified
                    </span>
                    {mapDetails?.placeName && (
                      <span className="text-gray-300 ml-2">
                        · {mapDetails.placeName}
                      </span>
                    )}
                    {mapDetails?.lat && mapDetails?.lng && (
                      <span className="text-gray-400 font-mono text-[11px] block sm:inline sm:ml-2">
                        ({mapDetails.lat.toFixed(5)}°, {mapDetails.lng.toFixed(5)}°)
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-300 hover:text-white underline self-start sm:self-auto shrink-0"
                >
                  <span>Preview on Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {mapVerified === false && mapError && (
              <div className="p-3 rounded-lg bg-[#FEE2E2] border-2 border-[#DC2626] text-[#7F1D1D] text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                <span>{mapError}</span>
              </div>
            )}

            <p className="text-[11px] text-gray-400 leading-relaxed">
              Paste the Google Maps place link to anchor this property on the client "Explore via Map" button. Coordinates are automatically verified and extracted.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-300 block mb-1.5 font-medium">Property Type</label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              placeholder="e.g. Biophilic Villa, Luxury Villa, Sky Residence, Waterfront Estate"
            />
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1.5 font-medium">Tagline / Short Summary</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              placeholder="e.g. An architectural oasis combining biophilic architecture with uncompromising luxury"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-300 block mb-1.5 font-medium">Project Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#040810] border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#7DD3FC] resize-y leading-relaxed"
            placeholder="Detailed architectural narrative, spatial flow, and craftsmanship story..."
          />
        </div>

        {/* 6 Key Architectural Features & Highlights */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
            <div>
              <label className="text-xs font-semibold text-white uppercase tracking-wider font-mono block">
                Key Architectural Features & Highlights (6 Points)
              </label>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Top 3 appear as verification badges on Country Card; all 6 appear on the Property Detail page under the description.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#7DD3FC] bg-[#7DD3FC]/10 border border-[#7DD3FC]/20 px-2 py-0.5 rounded">
              6 Points System
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highlights.map((h, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#040810] border border-white/10 text-[10px] font-mono text-[#7DD3FC] font-semibold flex items-center justify-center shrink-0">
                  0{idx + 1}
                </span>
                <input
                  type="text"
                  value={h}
                  onChange={(e) => {
                    const updated = [...highlights]
                    updated[idx] = e.target.value
                    setHighlights(updated)
                  }}
                  placeholder={DEFAULT_FEATURE_PLACEHOLDERS[idx] || `Architectural feature 0${idx + 1}`}
                  className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Service Category Selection */}
        <div className="pt-3 border-t border-white/10">
          <label className="text-xs font-semibold text-white uppercase tracking-wider font-mono block mb-1">
            Service Category
          </label>
          <p className="text-[11px] text-gray-400 mb-3">
            Select one or more services (Luxury Villas, Sky Residences, Commercial Properties, Waterfront Residences). The property will automatically show under &quot;Signature Properties&quot; on that service page.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {services.map((s) => {
              const selected = selectedServices.includes(s.id)
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`p-3 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#7DD3FC]/15 border-[#7DD3FC] text-[#7DD3FC] font-semibold shadow-[0_0_12px_rgba(125,211,252,0.15)]'
                      : 'bg-[#040810] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Briefcase className={`w-3.5 h-3.5 mb-1.5 ${selected ? 'text-[#7DD3FC]' : 'text-gray-500'}`} />
                  <span className="block truncate font-medium">{s.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: PRICING, SPECIFICATIONS & LOCATION */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">Pricing, Specifications & Map Location</h2>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-300 block mb-1.5 font-medium">Asking Price Amount</label>
            <input
              type="number"
              step="any"
              disabled={isPOA}
              value={askingPriceNumeric}
              onChange={(e) => setAskingPriceNumeric(e.target.value)}
              placeholder={isPOA ? 'Price on Application' : 'e.g. 280000000'}
              className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1.5 font-medium">Currency</label>
            <select
              disabled={isPOA}
              value={askingCurrency}
              onChange={(e) => setAskingCurrency(e.target.value)}
              className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC] disabled:opacity-50"
            >
              {SUPPORTED_CURRENCY_CODES.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="text-xs text-gray-300 block mb-1.5 font-medium">
              Formatted Display Copy <span className="text-gray-500">(Optional override)</span>
            </label>
            <input
              type="text"
              disabled={isPOA}
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="e.g. ₹ 28.0 Cr or AED 15M"
              className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC] disabled:opacity-50"
            />
          </div>

          <div className="pt-4 sm:pt-6">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPOA}
                onChange={(e) => setIsPOA(e.target.checked)}
                className="rounded border-white/20 text-[#7DD3FC] focus:ring-0 bg-transparent w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-gray-300 font-medium">Price on Application (POA)</span>
            </label>
          </div>
        </div>

        {/* Specifications: Bedrooms, Bathrooms, Area */}
        <div className="pt-3 border-t border-white/10">
          <label className="text-xs font-semibold text-white uppercase tracking-wider font-mono block mb-3">
            Specifications (Displayed on Cards &amp; Detail Page)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1.5 font-medium">Bedrooms</label>
              <input
                type="text"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                placeholder="e.g. 6 Bedrooms"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1.5 font-medium">Bathrooms</label>
              <input
                type="text"
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                placeholder="e.g. 7 Baths"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1.5 font-medium">Total Area</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. 10,500 sq ft"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
          </div>
        </div>

        {/* Address and Map Location */}
        <div className="pt-3 border-t border-white/10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1.5 font-medium">Project Address / Location Line</label>
              <input
                type="text"
                value={locationLine}
                onChange={(e) => setLocationLine(e.target.value)}
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                placeholder="e.g. South Mumbai / Crescent Road, Palm Jumeirah"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1.5 font-medium">City</label>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                placeholder="e.g. Mumbai, Dubai"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1.5 font-medium">Map Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#7DD3FC]"
                placeholder="e.g. 18.9220"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1.5 font-medium">Map Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#7DD3FC]"
                placeholder="e.g. 72.8347"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: PROJECT MEDIA ASSETS */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <ImageIcon className="w-4 h-4 text-[#7DD3FC]" />
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">Project Media Assets</h2>
            <p className="text-[11px] text-gray-400">
              Upload files directly from your computer without CORS errors, or select from library / URL.
            </p>
          </div>
        </div>

        {/* 1. Project Thumbnail Image */}
        <div className="p-4 rounded-xl bg-[#040810] border border-white/10">
          <MediaField
            label="Project Thumbnail Image (Main Showcase Image)"
            value={mainImage}
            onChange={(url) => setMainImage(url)}
            accept="image/*"
            folder="properties"
            countrySlug={selectedCountrySlug}
            projectSlug={effectiveProjectSlug}
            mediaRole="THUMBNAIL"
            placeholder="https://... or /images/..."
          />
          <p className="text-[11px] text-gray-400 mt-2">
            This image is featured on the Country Collection page (&quot;Signature Projects in [Country]&quot;) and in Service Portfolios.
          </p>
        </div>

        {/* 2. Project Video */}
        <div className="p-4 rounded-xl bg-[#040810] border border-white/10">
          <MediaField
            label="Project Video (MP4 / MOV / WebM)"
            value={mainVideoUrl}
            onChange={(url) => setMainVideoUrl(url)}
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.m4v"
            folder="properties"
            countrySlug={selectedCountrySlug}
            projectSlug={effectiveProjectSlug}
            mediaRole="HERO_VIDEO"
            placeholder="https://... or /videos/..."
          />
          <p className="text-[11px] text-gray-400 mt-2">
            This video is featured in the full-screen cinematic hero of the property detail page, and also used for the New Launch showcase if enabled.
          </p>
        </div>

        {/* 3. Multiple Project Images & Descriptions (Gallery) */}
        <div className="pt-2 border-t border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Multiple Project Images &amp; Descriptions
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Add individual gallery images with bespoke names &amp; descriptions. These are displayed in Section 3 &quot;Architectural Spaces &amp; Finishes&quot; on the public property page.
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md shrink-0">
              {galleryImages.filter((g) => g.url.trim()).length} of {galleryImages.length} configured
            </span>
          </div>

          {/* Gallery Slots List (Default 5 Slots) */}
          <div className="space-y-4">
            {galleryImages.map((slot, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#040810] border border-white/10 flex flex-col md:flex-row gap-4 relative group"
              >
                {/* Left Column: Image Upload & Preview Box */}
                <div className="w-full md:w-56 shrink-0 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-[#7DD3FC] uppercase tracking-wider font-semibold">
                      Space 0{idx + 1}
                    </span>
                    {uploadingSlot === idx && (
                      <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                      </span>
                    )}
                  </div>

                  {/* Thumbnail / Upload Box */}
                  <div className="relative aspect-video rounded-lg border border-white/10 overflow-hidden bg-[#070E1C] flex items-center justify-center group/box">
                    {slot.url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slot.url}
                          alt={slot.alt || 'Gallery image'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLElement).style.display = 'none'
                          }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/box:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                          <label className="px-2.5 py-1 rounded bg-[#7DD3FC] text-[#040810] text-[10px] font-semibold cursor-pointer">
                            Replace
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleGalleryFileUpload(idx, e.target.files[0])
                                }
                                e.currentTarget.value = ''
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSlotChange(idx, 'url', '')}
                            className="px-2.5 py-1 rounded bg-rose-500/80 text-white text-[10px] font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-white/[0.02] w-full h-full transition-colors">
                        <UploadCloud className="w-5 h-5 text-gray-400 mb-1 group-hover/box:text-[#7DD3FC] transition-colors" />
                        <span className="text-[11px] font-medium text-white">Upload from Explorer</span>
                        <span className="text-[9px] text-gray-500 font-mono mt-0.5">Click to choose image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleGalleryFileUpload(idx, e.target.files[0])
                            }
                            e.currentTarget.value = ''
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Manual URL Input + From Library button */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={slot.url}
                      onChange={(e) => handleSlotChange(idx, 'url', e.target.value)}
                      placeholder="https://... or R2 URL"
                      className="flex-1 min-w-0 bg-[#070E1C] border border-white/10 rounded px-2.5 py-1 text-[10px] text-white font-mono focus:outline-none focus:border-[#7DD3FC]"
                    />
                    <button
                      type="button"
                      onClick={() => setLibrarySlotIdx(idx)}
                      className="px-2 py-1 rounded bg-[#0B1528] hover:bg-[#11203B] border border-white/15 text-[10px] font-mono text-[#7DD3FC] flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Choose from Media Library"
                    >
                      <FolderOpen className="w-3 h-3" />
                      <span>Library</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Name & Description */}
                <div className="flex-1 space-y-2.5 min-w-0 pr-8">
                  <div>
                    <label className="text-[11px] font-mono text-gray-300 block mb-1">
                      Image Name / Architectural Title
                    </label>
                    <input
                      type="text"
                      value={slot.alt}
                      onChange={(e) => handleSlotChange(idx, 'alt', e.target.value)}
                      placeholder="e.g. Master Living Salon, Private Primary Sanctuary"
                      className="w-full bg-[#070E1C] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-gray-300 block mb-1">
                      Individual Image Description (Architectural Spaces &amp; Finishes)
                    </label>
                    <textarea
                      rows={2}
                      value={slot.description}
                      onChange={(e) => handleSlotChange(idx, 'description', e.target.value)}
                      placeholder="e.g. Master suite with panoramic Gulf views, private terrace, and bookmatched travertine bathroom."
                      className="w-full bg-[#070E1C] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC] resize-none"
                    />
                  </div>
                </div>

                {/* Remove Slot Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveSlot(idx)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Remove this image slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add More Images Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleAddMoreSlots}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer hover:border-[#7DD3FC]/50"
            >
              <Plus className="w-4 h-4 text-[#7DD3FC]" />
              <span>Add More Images (+ Slot {galleryImages.length + 1})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: CURATION FLAGS (NEW LAUNCH & SPACES IN THE ROUND) */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">Showcase &amp; Curations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Launch: Yes/No */}
          <div className="p-4 rounded-xl bg-[#040810] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">New Launch Showcase</span>
                  <span className="text-[10px] text-gray-500">Showcase in full-screen cinematic stack</span>
                </div>
              </div>
              <div className="flex items-center bg-[#070E1C] border border-white/10 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setIsFeaturedLaunch(true)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    isFeaturedLaunch
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsFeaturedLaunch(false)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    !isFeaturedLaunch
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {isFeaturedLaunch && (
              <div className="pt-2 border-t border-white/5">
                <label className="text-[11px] font-mono text-gray-300 block mb-1">
                  Launch Display Order <span className="text-gray-500">(1, 2, 3...)</span>
                </label>
                <input
                  type="number"
                  value={launchOrder}
                  onChange={(e) => setLaunchOrder(e.target.value)}
                  className="w-full bg-[#070E1C] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#7DD3FC]"
                  placeholder="1"
                />
              </div>
            )}
          </div>

          {/* Spaces in the Round: Yes/No */}
          <div className="p-4 rounded-xl bg-[#040810] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Orbit className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">Spaces in the Round</span>
                  <span className="text-[10px] text-gray-500">Showcase in 360° circular showcase section</span>
                </div>
              </div>
              <div className="flex items-center bg-[#070E1C] border border-white/10 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setIsSpaceInRound(true)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    isSpaceInRound
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsSpaceInRound(false)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    !isSpaceInRound
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {isSpaceInRound && (
              <div className="pt-2 border-t border-white/5">
                <MediaField
                  label="Spaces in the Round Card Image"
                  value={spaceRoundImage}
                  onChange={(url) => setSpaceRoundImage(url)}
                  accept="image/*"
                  folder="properties"
                  countrySlug={selectedCountrySlug}
                  projectSlug={effectiveProjectSlug}
                  mediaRole="SPACE_ROUND"
                  placeholder="https://... or /images/..."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <Link
          href="/admin/properties?tab=current"
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-[#040810] text-xs font-bold transition-all shadow-[0_0_20px_rgba(125,211,252,0.3)] cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Publishing...' : 'Publish Project'}
          </button>
        </div>
      </div>

      <MediaLibraryModal
        open={librarySlotIdx !== null}
        title={`Choose Media for: Space 0${(librarySlotIdx ?? 0) + 1}`}
        initialFolder="properties"
        acceptFilter="image"
        onSelect={(url) => {
          if (librarySlotIdx !== null) {
            handleSlotChange(librarySlotIdx, 'url', url)
          }
          setLibrarySlotIdx(null)
        }}
        onClose={() => setLibrarySlotIdx(null)}
      />
    </div>
  )
}
