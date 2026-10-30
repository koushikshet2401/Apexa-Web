'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, AlertCircle, CheckCircle2, X } from 'lucide-react'
import MediaField from './MediaField'

interface CountryFormProps {
  initialCountry?: any
}

export default function CountryForm({ initialCountry }: CountryFormProps) {
  const router = useRouter()
  const isEditing = Boolean(initialCountry?.id)

  const [name, setName] = useState(initialCountry?.name || '')
  const [displayName, setDisplayName] = useState(initialCountry?.displayName || '')
  const [slug, setSlug] = useState(initialCountry?.slug || '')
  const [autoSlug, setAutoSlug] = useState(!isEditing)
  const [region, setRegion] = useState(initialCountry?.region || 'Middle East')
  const [cities, setCities] = useState(initialCountry?.cities || '')
  const [tagline, setTagline] = useState(initialCountry?.tagline || '')
  const [description, setDescription] = useState(initialCountry?.description || '')
  const [heroVideoUrl, setHeroVideoUrl] = useState(initialCountry?.heroVideoUrl || '')
  const [heroVideoThumb, setHeroVideoThumb] = useState(initialCountry?.heroVideoThumb || '')
  const [cardImage, setCardImage] = useState(initialCountry?.cardImage || '')
  const [displayOrder, setDisplayOrder] = useState<number | string>(initialCountry?.displayOrder ?? 0)
  const [isPublished, setIsPublished] = useState(
    initialCountry?.isPublished !== undefined ? Boolean(initialCountry.isPublished) : true
  )

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleNameChange = (val: string) => {
    setName(val)
    if (!displayName || autoSlug) {
      setDisplayName(val)
    }
    if (autoSlug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setToast(null)

    const payload = {
      name,
      displayName,
      slug,
      region,
      cities,
      tagline,
      description,
      heroVideoUrl,
      heroVideoThumb,
      cardImage,
      displayOrder: Number(displayOrder),
      isPublished,
    }

    try {
      const endpoint = isEditing
        ? `/api/admin/countries/${initialCountry.id}`
        : `/api/admin/countries`
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setToast({ type: 'error', message: data.error || 'Failed to save country' })
        setSaving(false)
        return
      }

      setToast({ type: 'success', message: `Country ${isEditing ? 'updated' : 'created'} successfully!` })

      setTimeout(() => {
        router.push('/admin/countries')
        router.refresh()
      }, 700)
    } catch {
      setToast({ type: 'error', message: 'Network error saving country' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditing) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/admin/countries/${initialCountry.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/admin/countries')
        router.refresh()
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to delete country' })
        setShowDeleteConfirm(false)
        setDeleting(false)
      }
    } catch {
      setToast({ type: 'error', message: 'Network error deleting country' })
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Toast Alert */}
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
            href="/admin/countries"
            className="text-gray-400 hover:text-white flex items-center gap-1.5 text-xs font-mono mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Countries
          </Link>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            {isEditing ? `Edit: ${initialCountry.displayName || initialCountry.name}` : 'New Destination Country'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure regional collection portals, background hero videos, and destination metadata.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 text-xs text-rose-300 hover:text-rose-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(203,213,225,0.15)] disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Country'}</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            Destination Info & Geography
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Country Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Dubai"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Display Name *</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Dubai / UAE"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Slug URL *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setAutoSlug(false)
                }}
                placeholder="e.g. dubai"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-[#7DD3FC] font-mono placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Middle East"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Cities / Key Hubs Line</label>
              <input
                type="text"
                value={cities}
                onChange={(e) => setCities(e.target.value)}
                placeholder="DUBAI · PALM JUMEIRAH · ABU DHABI"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="The epicenter of global architectural luxury..."
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive editorial overview of this destination..."
                className="w-full bg-[#040810] border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
          </div>
        </div>

        {/* Media & Ordering */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            Media Assets & Layout Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <MediaField
              label="Card Image"
              value={cardImage}
              onChange={setCardImage}
              folder="countries"
              accept="image/*"
              placeholder="/images/destinations/dubai.jpg"
            />

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="1"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <MediaField
              label="Hero Video URL"
              value={heroVideoUrl}
              onChange={setHeroVideoUrl}
              folder="countries"
              accept="video/mp4"
              placeholder="/videos/destinations/dubai-hero.mp4"
            />

            <MediaField
              label="Hero Video Thumbnail"
              value={heroVideoThumb}
              onChange={setHeroVideoThumb}
              folder="countries"
              accept="image/*"
              placeholder="/images/destinations/dubai-thumb.jpg"
            />

            <div className="md:col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-white/20 text-emerald-400 focus:ring-0"
                />
                <span className="text-xs font-medium text-white">Active in Global Collection</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Link href="/admin/countries" className="text-xs font-mono text-gray-400 hover:text-white">
            ← Cancel and return
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(203,213,225,0.2)] disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Country'}</span>
          </button>
        </div>
      </form>

      {/* Delete Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#070E1C] border border-rose-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-white">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{initialCountry?.displayName || initialCountry?.name}</strong>?
              Ensure no active properties are assigned to this destination first.
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
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
