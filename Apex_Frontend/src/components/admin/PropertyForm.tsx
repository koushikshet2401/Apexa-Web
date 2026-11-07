'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Film,
  Image as ImageIcon,
  Globe,
  MapPin,
  Sparkles,
  Orbit,
  Flame,
  DollarSign,
  Briefcase,
  Layers,
} from 'lucide-react'
import MediaField from './MediaField'
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
  alt?: string
  description?: string
  order?: number
}

interface PropertyFormProps {
  initialProperty?: any
  countries: CountryOption[]
  services: ServiceOption[]
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
  const [description, setDescription] = useState(initialProperty?.description || '')
  const [tagline, setTagline] = useState(initialProperty?.tagline || '')
  const [countryId, setCountryId] = useState(initialProperty?.countryId || (countries[0]?.id || ''))
  
  // Selected Service Categories
  const initialServiceIds =
    initialProperty?.services?.map((s: any) => s.serviceId || s.service?.id) || []
  const [selectedServices, setSelectedServices] = useState<string[]>(initialServiceIds)

  // 2. Pricing & Address
  const [isPOA, setIsPOA] = useState<boolean>(Boolean(initialProperty?.isPOA))
  const [askingPriceNumeric, setAskingPriceNumeric] = useState<string>(
    initialProperty?.askingPriceNumeric ? String(initialProperty.askingPriceNumeric) : ''
  )
  const [askingCurrency, setAskingCurrency] = useState<string>(
    initialProperty?.askingCurrency || 'AED'
  )
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

  // 3. Media Assets
  const [mainVideoUrl, setMainVideoUrl] = useState(initialProperty?.mainVideoUrl || '')
  const [mainImage, setMainImage] = useState(initialProperty?.mainImage || '')
  
  // Multiple Gallery Images with Individual Descriptions
  const initialGalleryImages: GalleryImageItem[] = (initialProperty?.images || []).map((img: any) => ({
    id: img.id,
    url: img.url,
    alt: img.alt || '',
    description: img.description || img.alt || '',
    order: img.order || 0,
  }))
  const [images, setImages] = useState<GalleryImageItem[]>(initialGalleryImages)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageDescription, setNewImageDescription] = useState('')

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
  const [isPublished, setIsPublished] = useState<boolean>(
    Boolean(initialProperty?.isPublished)
  )
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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

  const handleAddGalleryImage = () => {
    if (!newImageUrl.trim()) return
    const newImg: GalleryImageItem = {
      url: newImageUrl.trim(),
      alt: newImageDescription.trim() || name,
      description: newImageDescription.trim(),
      order: images.length,
    }
    setImages([...images, newImg])
    setNewImageUrl('')
    setNewImageDescription('')
  }

  const handleRemoveGalleryImage = async (index: number) => {
    const imgToRemove = images[index]
    if (isEditing && imgToRemove?.id && initialProperty?.id) {
      try {
        await fetch(
          `/api/admin/properties/${initialProperty.id}/images?imageId=${imgToRemove.id}`,
          { method: 'DELETE' }
        )
      } catch (err) {
        console.error('Error deleting image from server:', err)
      }
    }
    setImages(images.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (publishImmediately: boolean) => {
    if (!name.trim()) {
      setToast({ type: 'error', message: 'Project Name is required.' })
      return
    }

    if (!countryId) {
      setToast({ type: 'error', message: 'Please select a Country.' })
      return
    }

    if (!isPOA && (!askingPriceNumeric || parseFloat(askingPriceNumeric) <= 0)) {
      setToast({ type: 'error', message: 'Please provide an Asking Price or enable Price on Application (POA).' })
      return
    }

    try {
      setSaving(true)
      setToast(null)

      const payload = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        countryId,
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        locationLine: locationLine.trim() || null,
        cityName: cityName.trim() || null,
        latitude: latitude !== '' ? parseFloat(latitude) : null,
        longitude: longitude !== '' ? parseFloat(longitude) : null,
        mainVideoUrl: mainVideoUrl.trim() || null,
        mainImage: mainImage.trim() || null,
        images: images.map((img, idx) => ({
          url: img.url,
          alt: img.description || img.alt || name,
          description: img.description || img.alt || '',
          order: idx,
        })),
        serviceIds: selectedServices,
        isFeaturedLaunch,
        launchOrder: isFeaturedLaunch && launchOrder !== '' ? parseInt(launchOrder, 10) : null,
        isSpaceInRound,
        spaceRoundImage: isSpaceInRound ? spaceRoundImage.trim() || null : null,
        isPOA,
        askingPriceNumeric: !isPOA && askingPriceNumeric ? parseFloat(askingPriceNumeric) : null,
        askingCurrency: !isPOA ? askingCurrency : null,
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
        // 1. Update descriptive fields
        const descPayload = {
          name: payload.name,
          slug: payload.slug,
          countryId: payload.countryId,
          tagline: payload.tagline,
          description: payload.description,
          locationLine: payload.locationLine,
          cityName: payload.cityName,
          latitude: payload.latitude,
          longitude: payload.longitude,
          mainVideoUrl: payload.mainVideoUrl,
          mainImage: payload.mainImage,
          spaceRoundImage: payload.spaceRoundImage,
          serviceIds: payload.serviceIds,
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

        // 2. Update price if changed
        const currentInitialNum =
          initialProperty.askingPriceNumeric !== null && initialProperty.askingPriceNumeric !== undefined
            ? Number(initialProperty.askingPriceNumeric)
            : null
        const currentInitialCur = initialProperty.askingCurrency || null
        const currentInitialPOA = Boolean(initialProperty.isPOA)

        const pricingChanged =
          currentInitialPOA !== isPOA ||
          currentInitialCur !== (isPOA ? null : askingCurrency) ||
          currentInitialNum !== (isPOA ? null : parseFloat(askingPriceNumeric))

        if (pricingChanged) {
          await fetch(`/api/admin/properties/${initialProperty.id}/price`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason: 'Administrative price update via project edit form',
              isPOA,
              askingPriceNumeric: !isPOA && askingPriceNumeric ? parseFloat(askingPriceNumeric) : null,
              askingCurrency: !isPOA ? askingCurrency : null,
            }),
          })
        }

        // 3. Save new gallery images if any were added
        const existingImageUrls = new Set((initialProperty.images || []).map((img: any) => img.url))
        for (const img of images) {
          if (!existingImageUrls.has(img.url)) {
            await fetch(`/api/admin/properties/${initialProperty.id}/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: img.url,
                alt: img.description || img.alt || name,
                description: img.description || '',
              }),
            })
          }
        }

        // 4. Update publish status if toggled
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
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
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
            Complete and straightforward project creation and publication form.
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
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* SECTION 1: PROJECT IDENTITY & DESTINATION */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <Globe className="w-4 h-4 text-[#7DD3FC]" />
          <h2 className="text-sm font-semibold text-white tracking-wide">Project Identity & Destination</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-300 block mb-1.5 font-medium">
              Project Name <span className="text-[#7DD3FC]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              placeholder="e.g. The Royal Atlantis Penthouse"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-300 block mb-1.5 font-medium">
              Country Destination <span className="text-[#7DD3FC]">*</span>
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
        </div>

        <div>
          <label className="text-xs text-gray-300 block mb-1.5 font-medium">Tagline / Short Summary</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
            placeholder="e.g. Ultra-luxury waterfront masterpiece on Palm Jumeirah"
          />
        </div>

        <div>
          <label className="text-xs text-gray-300 block mb-1.5 font-medium">Project Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#040810] border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#7DD3FC] resize-y"
            placeholder="Detailed architectural narrative, materials, lifestyle attributes..."
          />
        </div>

        {/* Service Category Selection */}
        <div>
          <label className="text-xs text-gray-300 block mb-2 font-medium">
            Service Category <span className="text-gray-500">(Luxury Villa, Commercial, Waterfront Residence, Sky Residence)</span>
          </label>
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
                  <span className="block truncate">{s.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: PRICING & LOCATION */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">Pricing & Map Location</h2>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-300 block mb-1.5 font-medium">Asking Price Amount</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                disabled={isPOA}
                value={askingPriceNumeric}
                onChange={(e) => setAskingPriceNumeric(e.target.value)}
                placeholder={isPOA ? 'Price on Application' : 'e.g. 15000000'}
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC] disabled:opacity-50"
              />
            </div>
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

        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPOA}
            onChange={(e) => setIsPOA(e.target.checked)}
            className="rounded border-white/20 text-[#7DD3FC] focus:ring-0 bg-transparent w-4 h-4"
          />
          <span className="text-xs text-gray-300 font-medium">Price on Application (POA)</span>
        </label>

        {/* Address and Map Location */}
        <div className="pt-2 border-t border-white/5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1.5 font-medium">Project Address / Location Line</label>
              <input
                type="text"
                value={locationLine}
                onChange={(e) => setLocationLine(e.target.value)}
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                placeholder="e.g. Crescent Road, Palm Jumeirah"
              />
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1.5 font-medium">City</label>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                placeholder="e.g. Dubai"
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
                placeholder="e.g. 25.1325"
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
                placeholder="e.g. 55.1189"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: PROJECT MEDIA & GALLERY */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <ImageIcon className="w-4 h-4 text-[#7DD3FC]" />
          <h2 className="text-sm font-semibold text-white tracking-wide">Project Media Assets</h2>
        </div>

        {/* Project Thumbnail Image */}
        <div>
          <MediaField
            label="Project Thumbnail Image (Main Showcase Image)"
            value={mainImage}
            onChange={(url) => setMainImage(url)}
            accept="image/*"
            folder="properties"
            placeholder="/images/... or https://..."
          />
        </div>

        {/* Project Video */}
        <div>
          <MediaField
            label="Project Video (MP4 / WebM)"
            value={mainVideoUrl}
            onChange={(url) => setMainVideoUrl(url)}
            accept="video/mp4"
            folder="properties"
            placeholder="/videos/... or https://..."
          />
        </div>

        {/* Multiple Project Images with Individual Image Descriptions */}
        <div className="pt-3 border-t border-white/10 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Multiple Project Images & Descriptions
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Add individual gallery images with bespoke descriptions for each image.
            </p>
          </div>

          {/* Add Image Inputs */}
          <div className="p-4 rounded-xl bg-[#040810] border border-white/10 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-gray-300 block mb-1">Image URL</label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="/images/... or https://..."
                  className="w-full bg-[#070E1C] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-gray-300 block mb-1">Individual Image Description</label>
                <input
                  type="text"
                  value={newImageDescription}
                  onChange={(e) => setNewImageDescription(e.target.value)}
                  placeholder="e.g. Master suite with panoramic Gulf views and private terrace"
                  className="w-full bg-[#070E1C] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddGalleryImage}
                disabled={!newImageUrl.trim()}
                className="px-4 py-1.5 rounded-lg bg-[#7DD3FC]/15 hover:bg-[#7DD3FC]/25 text-[#7DD3FC] border border-[#7DD3FC]/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Image</span>
              </button>
            </div>
          </div>

          {/* Gallery Images List */}
          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#040810] border border-white/10 flex items-start gap-3 relative group"
                >
                  <div className="w-20 h-16 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.description || 'Project image'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.currentTarget as any).src = '/images/placeholder.jpg'
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Image #{idx + 1}</span>
                    <p className="text-xs text-white font-medium line-clamp-2 mt-0.5">
                      {img.description || 'No description provided'}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono truncate mt-1">{img.url}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(idx)}
                    className="absolute top-2.5 right-2.5 text-gray-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic py-2">
              No gallery images added yet. Add images above with individual descriptions.
            </p>
          )}
        </div>
      </div>

      {/* SECTION 4: CURATION FLAGS (NEW LAUNCH & SPACES IN THE ROUND) */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">Showcase & Curations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Launch: Yes/No */}
          <div className="p-4 rounded-xl bg-[#040810] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-white">New Launch Showcase</span>
              </div>
              <div className="flex items-center bg-[#070E1C] border border-white/10 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setIsFeaturedLaunch(true)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
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
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
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
                <label className="text-[11px] font-mono text-gray-300 block mb-1">Launch Display Order</label>
                <input
                  type="number"
                  value={launchOrder}
                  onChange={(e) => setLaunchOrder(e.target.value)}
                  className="w-full bg-[#070E1C] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
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
                <span className="text-xs font-semibold text-white">Spaces in the Round</span>
              </div>
              <div className="flex items-center bg-[#070E1C] border border-white/10 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setIsSpaceInRound(true)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
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
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
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
                  placeholder="/images/... or https://..."
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
    </div>
  )
}
