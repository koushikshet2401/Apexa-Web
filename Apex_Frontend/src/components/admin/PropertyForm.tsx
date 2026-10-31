'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  UploadCloud,
} from 'lucide-react'
import MediaField from './MediaField'

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

export default function PropertyForm({
  initialProperty,
  countries,
  services,
}: PropertyFormProps) {
  const router = useRouter()
  const isEditing = Boolean(initialProperty?.id)

  const [name, setName] = useState(initialProperty?.name || '')
  const [slug, setSlug] = useState(initialProperty?.slug || '')
  const [autoSlug, setAutoSlug] = useState(!isEditing)
  const [countryId, setCountryId] = useState(initialProperty?.countryId || '')
  const [isPublished, setIsPublished] = useState(Boolean(initialProperty?.isPublished))
  const [isDraft, setIsDraft] = useState(initialProperty?.isDraft !== undefined ? Boolean(initialProperty.isDraft) : !initialProperty?.isPublished)
  const [type, setType] = useState(initialProperty?.type || 'residential')
  const [price, setPrice] = useState(initialProperty?.price || '')
  const [beds, setBeds] = useState(initialProperty?.beds || '')
  const [baths, setBaths] = useState(initialProperty?.baths || '')
  const [area, setArea] = useState(initialProperty?.area || '')
  const [cityName, setCityName] = useState(initialProperty?.cityName || '')
  const [locationLine, setLocationLine] = useState(initialProperty?.locationLine || '')
  const [tagline, setTagline] = useState(initialProperty?.tagline || '')
  const [shortDescription, setShortDescription] = useState(initialProperty?.shortDescription || '')
  const [description, setDescription] = useState(initialProperty?.description || '')
  const [layoutVariant, setLayoutVariant] = useState(initialProperty?.layoutVariant || 1)
  const [mainVideoUrl, setMainVideoUrl] = useState(initialProperty?.mainVideoUrl || '')
  const [mainVideoThumb, setMainVideoThumb] = useState(initialProperty?.mainVideoThumb || '')
  const [mainImage, setMainImage] = useState(initialProperty?.mainImage || '')

  // Highlights array
  const [highlights, setHighlights] = useState<string[]>(
    Array.isArray(initialProperty?.highlights) ? initialProperty.highlights : []
  )
  const [newHighlight, setNewHighlight] = useState('')

  // Service IDs
  const initialServiceIds = initialProperty?.services?.map((s: any) => s.serviceId || s.service?.id) || []
  const [selectedServices, setSelectedServices] = useState<string[]>(initialServiceIds)

  // Featured Launch
  const [isFeaturedLaunch, setIsFeaturedLaunch] = useState(Boolean(initialProperty?.isFeaturedLaunch))
  const [launchOrder, setLaunchOrder] = useState<string | number>(initialProperty?.launchOrder ?? '')
  const [launchDate, setLaunchDate] = useState(
    initialProperty?.launchDate ? new Date(initialProperty.launchDate).toISOString().split('T')[0] : ''
  )

  // Space in Round
  const [isSpaceInRound, setIsSpaceInRound] = useState(Boolean(initialProperty?.isSpaceInRound))
  const [spaceOrder, setSpaceOrder] = useState<string | number>(initialProperty?.spaceOrder ?? '')

  // Images Gallery
  const [images, setImages] = useState<PropertyImage[]>(initialProperty?.images || [])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageAlt, setNewImageAlt] = useState('')
  const [addingImage, setAddingImage] = useState(false)

  // Form states
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
      const res = await fetch(`/api/admin/properties/${initialProperty.id}/images?imageId=${imageId}`, {
        method: 'DELETE',
      })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setToast(null)

    const payload = {
      name,
      slug,
      countryId: countryId || null,
      type,
      price,
      beds,
      baths,
      area,
      cityName,
      locationLine,
      tagline,
      shortDescription,
      description,
      layoutVariant: Number(layoutVariant),
      mainVideoUrl,
      mainVideoThumb,
      mainImage,
      highlights,
      serviceIds: selectedServices,
      isPublished,
      isDraft: !isPublished,
      isFeaturedLaunch,
      launchOrder: isFeaturedLaunch && launchOrder !== '' ? Number(launchOrder) : null,
      launchDate: isFeaturedLaunch && launchDate ? launchDate : null,
      isSpaceInRound,
      spaceOrder: isSpaceInRound && spaceOrder !== '' ? Number(spaceOrder) : null,
    }

    try {
      const endpoint = isEditing
        ? `/api/admin/properties/${initialProperty.id}`
        : `/api/admin/properties`
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setToast({ type: 'error', message: data.error || 'Failed to save property' })
        setSaving(false)
        return
      }

      setToast({ type: 'success', message: `Property ${isEditing ? 'updated' : 'created'} successfully!` })

      if (!isEditing) {
        setTimeout(() => {
          router.push(`/admin/properties/${data.id}`)
          router.refresh()
        }, 800)
      } else {
        router.refresh()
      }
    } catch {
      setToast({ type: 'error', message: 'An unexpected network error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditing) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/admin/properties/${initialProperty.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/admin/properties')
        router.refresh()
      } else {
        const data = await res.json()
        setToast({ type: 'error', message: data.error || 'Failed to delete property' })
        setShowDeleteConfirm(false)
        setDeleting(false)
      }
    } catch {
      setToast({ type: 'error', message: 'Network error deleting property' })
      setDeleting(false)
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
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Properties
          </Link>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            {isEditing ? `Edit: ${initialProperty.name}` : 'New Property Listing'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure residence specifications, visual media, showcase placement, and publication status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEditing && (
            <>
              <Link
                href={`/collection/${initialProperty.country?.slug || 'dubai'}/${initialProperty.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-[#070E1C] border border-white/10 hover:border-white/20 text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition-all"
              >
                <span>Preview</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 text-xs text-rose-300 hover:text-rose-200 flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(203,213,225,0.15)] disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Property'}</span>
          </button>
        </div>
      </div>

      {/* Main Form Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Identity Card */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            1. Core Identity & Location
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Property Name *
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
              <div className="relative">
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
              </div>
              <p className="mt-1 text-[11px] font-mono text-gray-500">
                URL: /collection/{countries.find((c) => c.id === countryId)?.slug || countries.find((c) => c.id === countryId)?.name?.toLowerCase().replace(/\s+/g, '-') || initialProperty?.country?.slug || 'dubai'}/{slug || 'property-slug'}
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
                Property Type
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
          </div>
        </div>

        {/* Specifications & Pricing */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            2. Specs, Pricing & Layout
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Price</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. From $3,850,000"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Bedrooms</label>
              <input
                type="text"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                placeholder="e.g. 3–4 Bedrooms"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Bathrooms</label>
              <input
                type="text"
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                placeholder="e.g. 4 Baths"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Area</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. 4,200 sq ft"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Layout Variant
              </label>
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

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Card Badge Label
              </label>
              <input
                type="text"
                value={initialProperty?.cardLabel || ''}
                placeholder="e.g. SKY RESIDENCE"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
          </div>
        </div>

        {/* Narrative & Descriptions */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            3. Editorial Narrative & Highlights
          </h2>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Where Skyline Meets Waterfront Sanctuary"
              className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5">
              Short Description
            </label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief summary displayed on cards..."
              className="w-full bg-[#040810] border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1.5">
              Full Description
            </label>
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

        {/* Media URLs */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            4. Primary Media Assets
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <MediaField
              label="Main Image"
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

        {/* Service Category Association */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            5. Associated Services & Sectors
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

        {/* Visibility, Launches & Space in Round */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-6">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            6. Publishing & Homepage Showcases
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Publication Status */}
            <div className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => {
                    setIsPublished(e.target.checked)
                    setIsDraft(!e.target.checked)
                  }}
                  className="rounded border-white/20 text-emerald-400 focus:ring-0"
                />
                <span className="text-xs font-medium text-white">Publish on Website</span>
              </label>
              <p className="text-[11px] text-gray-500">
                When published, this property will be visible in public collection pages and dynamic searches.
              </p>
            </div>

            {/* Featured Launch */}
            <div className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeaturedLaunch}
                  onChange={(e) => setIsFeaturedLaunch(e.target.checked)}
                  className="rounded border-white/20 text-amber-400 focus:ring-0"
                />
                <span className="text-xs font-medium text-white">Featured Launch</span>
              </label>
              {isFeaturedLaunch && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1">
                      Launch Order (1-3 shown on Hero)
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
                <span className="text-xs font-medium text-white">Space in Round Showcase</span>
              </label>
              {isSpaceInRound && (
                <div className="pt-2 border-t border-white/5">
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
              )}
            </div>
          </div>
        </div>

        {/* Task 4: Image Management Section in Property Form */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
                7. Gallery Images ({images.length})
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Interior, exterior, and architectural detail gallery photographs.
              </p>
            </div>
          </div>

          {/* Add Image URL bar */}
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
              No gallery images added yet. Add an image URL above.
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
                      <Trash2 className="w-3.5 h-3.5" />
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
            <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Property'}</span>
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#070E1C] border border-rose-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-white">Confirm Property Deletion</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white font-mono">{initialProperty?.name}</strong>? This action
              cannot be undone and will delete all associated gallery images.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg bg-[#0B1528] text-xs text-gray-300 hover:text-white border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-medium disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
