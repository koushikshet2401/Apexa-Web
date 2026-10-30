'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, AlertCircle, CheckCircle2, X } from 'lucide-react'

interface ServiceFormProps {
  initialService?: any
}

export default function ServiceForm({ initialService }: ServiceFormProps) {
  const router = useRouter()
  const isEditing = Boolean(initialService?.id)

  const [name, setName] = useState(initialService?.name || '')
  const [slug, setSlug] = useState(initialService?.slug || '')
  const [autoSlug, setAutoSlug] = useState(!isEditing)
  const [subtitle, setSubtitle] = useState(initialService?.subtitle || '')
  const [tagline, setTagline] = useState(initialService?.tagline || '')
  const [description, setDescription] = useState(initialService?.description || '')
  const [heroDescription, setHeroDescription] = useState(initialService?.heroDescription || '')
  const [image, setImage] = useState(initialService?.image || '')
  const [videoUrl, setVideoUrl] = useState(initialService?.videoUrl || '')
  const [displayOrder, setDisplayOrder] = useState<number | string>(initialService?.displayOrder ?? 0)
  const [isPublished, setIsPublished] = useState(
    initialService?.isPublished !== undefined ? Boolean(initialService.isPublished) : true
  )

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setToast(null)

    const payload = {
      name,
      slug,
      subtitle,
      tagline,
      description,
      heroDescription,
      image,
      videoUrl,
      displayOrder: Number(displayOrder),
      isPublished,
    }

    try {
      const endpoint = isEditing
        ? `/api/admin/services/${initialService.id}`
        : `/api/admin/services`
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setToast({ type: 'error', message: data.error || 'Failed to save service' })
        setSaving(false)
        return
      }

      setToast({ type: 'success', message: `Service ${isEditing ? 'updated' : 'created'} successfully!` })

      setTimeout(() => {
        router.push('/admin/services')
        router.refresh()
      }, 700)
    } catch {
      setToast({ type: 'error', message: 'Network error saving service' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditing) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/admin/services/${initialService.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/admin/services')
        router.refresh()
      } else {
        const data = await res.json()
        setToast({ type: 'error', message: data.error || 'Failed to delete service' })
        setShowDeleteConfirm(false)
        setDeleting(false)
      }
    } catch {
      setToast({ type: 'error', message: 'Network error deleting service' })
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
            href="/admin/services"
            className="text-gray-400 hover:text-white flex items-center gap-1.5 text-xs font-mono mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Services
          </Link>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            {isEditing ? `Edit: ${initialService.name}` : 'New Service Pillar'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure architectural sectors, editorial narratives, and associated video reels.
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
            <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Service'}</span>
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            Service Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Service Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Luxury Villas"
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
                placeholder="e.g. luxury-villas"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-[#7DD3FC] font-mono placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Architectural Masterpieces"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Bespoke sanctuary residences"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of service pillar..."
                className="w-full bg-[#040810] border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Hero Editorial Description</label>
              <textarea
                rows={3}
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                placeholder="Full hero editorial displayed on /services/[slug]..."
                className="w-full bg-[#040810] border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
          </div>
        </div>

        {/* Media & Ordering */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC]">
            Media & Presentation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Image URL</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/images/services/luxury-villas.jpg"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">Video URL</label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="/videos/services/villas.mp4"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

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

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-white/20 text-emerald-400 focus:ring-0"
                />
                <span className="text-xs font-medium text-white">Active in Services Pillar</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Link href="/admin/services" className="text-xs font-mono text-gray-400 hover:text-white">
            ← Cancel and return
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(203,213,225,0.2)] disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Service'}</span>
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#070E1C] border border-rose-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-white">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{initialService?.name}</strong>?
              This will remove this category and disassociate it from properties.
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
