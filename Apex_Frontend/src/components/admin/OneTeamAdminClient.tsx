'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import {
  Save,
  UploadCloud,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Film,
  Layers,
  Loader2,
  Edit,
  FolderOpen,
} from 'lucide-react'
import MediaLibraryModal from './MediaLibraryModal'

interface ServiceSummary {
  id: string
  slug: string
  name: string
  subtitle?: string | null
  image?: string | null
  isPublished: boolean
}

export interface OneTeamInitialData {
  id?: string | null
  sectionEyebrow?: string | null
  sectionHeading?: string | null
  sectionDescription?: string | null
  bannerLabel?: string | null
  bannerHeading?: string | null
  luxuryVillasImageUrl: string | null
  commercialImageUrl: string | null
  skyResidencesImageUrl?: string | null
  waterfrontImageUrl?: string | null
  centerVideoUrl: string | null
  updatedBy?: string | null
  updatedAt?: string | Date | null
  migrationPending?: boolean
  services?: ServiceSummary[]
}

type UploadSlot = 'villas' | 'commercial' | 'sky' | 'waterfront' | 'video'
type OneTeamImageRole =
  | 'ONE_TEAM_VILLA'
  | 'ONE_TEAM_COMMERCIAL'
  | 'ONE_TEAM_SKY'
  | 'ONE_TEAM_WATERFRONT'
  | 'ONE_TEAM_VIDEO'

interface ImageSlotCardProps {
  title: string
  subtitle: string
  badge: string
  url: string
  slot: Exclude<UploadSlot, 'video'>
  mediaRole: Exclude<OneTeamImageRole, 'ONE_TEAM_VIDEO'>
  uploadingSlot: UploadSlot | null
  onUpload: (file: File, slot: UploadSlot, role: OneTeamImageRole) => void
  onPickFromLibrary: () => void
  onRemove: () => void
  emptyLabel: string
}

function OneTeamImageCard({
  title,
  subtitle,
  badge,
  url,
  slot,
  mediaRole,
  uploadingSlot,
  onUpload,
  onPickFromLibrary,
  onRemove,
  emptyLabel,
}: ImageSlotCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isUploading = uploadingSlot === slot

  return (
    <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-4 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#7DD3FC]" />
            <span>{title}</span>
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
          {badge}
        </span>
      </div>

      <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-[#040810] border border-white/10 flex items-center justify-center">
        {url ? (
          <img src={url} alt={`${title} Preview`} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-4">
            <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-mono">{emptyLabel}</p>
          </div>
        )}
      </div>

      {url && (
        <p className="text-[10px] font-mono text-[#7DD3FC] truncate bg-[#040810] px-3 py-1.5 rounded border border-white/5">
          {url}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file, slot, mediaRole)
          e.target.value = ''
        }}
      />

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <UploadCloud className="w-3.5 h-3.5" />
          )}
          <span>{isUploading ? 'Uploading to R2...' : url ? 'Replace Image' : 'Upload Image'}</span>
        </button>

        <button
          type="button"
          onClick={onPickFromLibrary}
          disabled={isUploading}
          className="px-3.5 py-2 rounded-lg bg-[#0B1528] hover:bg-[#11203B] border border-white/15 text-gray-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#7DD3FC]" />
          <span>From Library</span>
        </button>

        {url && (
          <button
            type="button"
            onClick={onRemove}
            className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default function OneTeamAdminClient({
  initialData,
}: {
  initialData: OneTeamInitialData
}) {
  const [savedState, setSavedState] = useState({
    sectionEyebrow: initialData.sectionEyebrow || '',
    sectionHeading: initialData.sectionHeading || '',
    sectionDescription: initialData.sectionDescription || '',
    bannerLabel: initialData.bannerLabel || '',
    bannerHeading: initialData.bannerHeading || '',
    luxuryVillasImageUrl: initialData.luxuryVillasImageUrl || '',
    commercialImageUrl: initialData.commercialImageUrl || '',
    skyResidencesImageUrl: initialData.skyResidencesImageUrl || '',
    waterfrontImageUrl: initialData.waterfrontImageUrl || '',
    centerVideoUrl: initialData.centerVideoUrl || '',
  })

  const [sectionEyebrow, setSectionEyebrow] = useState(savedState.sectionEyebrow)
  const [sectionHeading, setSectionHeading] = useState(savedState.sectionHeading)
  const [sectionDescription, setSectionDescription] = useState(savedState.sectionDescription)
  const [bannerLabel, setBannerLabel] = useState(savedState.bannerLabel)
  const [bannerHeading, setBannerHeading] = useState(savedState.bannerHeading)

  const [luxuryVillasImageUrl, setLuxuryVillasImageUrl] = useState(savedState.luxuryVillasImageUrl)
  const [commercialImageUrl, setCommercialImageUrl] = useState(savedState.commercialImageUrl)
  const [skyResidencesImageUrl, setSkyResidencesImageUrl] = useState(savedState.skyResidencesImageUrl)
  const [waterfrontImageUrl, setWaterfrontImageUrl] = useState(savedState.waterfrontImageUrl)
  const [centerVideoUrl, setCenterVideoUrl] = useState(savedState.centerVideoUrl)

  const [uploadingSlot, setUploadingSlot] = useState<UploadSlot | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [librarySlot, setLibrarySlot] = useState<UploadSlot | null>(null)

  const videoInputRef = useRef<HTMLInputElement>(null)

  const hasChanges =
    sectionEyebrow !== savedState.sectionEyebrow ||
    sectionHeading !== savedState.sectionHeading ||
    sectionDescription !== savedState.sectionDescription ||
    bannerLabel !== savedState.bannerLabel ||
    bannerHeading !== savedState.bannerHeading ||
    luxuryVillasImageUrl !== savedState.luxuryVillasImageUrl ||
    commercialImageUrl !== savedState.commercialImageUrl ||
    skyResidencesImageUrl !== savedState.skyResidencesImageUrl ||
    waterfrontImageUrl !== savedState.waterfrontImageUrl ||
    centerVideoUrl !== savedState.centerVideoUrl

  const handleDiscard = () => {
    setSectionEyebrow(savedState.sectionEyebrow)
    setSectionHeading(savedState.sectionHeading)
    setSectionDescription(savedState.sectionDescription)
    setBannerLabel(savedState.bannerLabel)
    setBannerHeading(savedState.bannerHeading)
    setLuxuryVillasImageUrl(savedState.luxuryVillasImageUrl)
    setCommercialImageUrl(savedState.commercialImageUrl)
    setSkyResidencesImageUrl(savedState.skyResidencesImageUrl)
    setWaterfrontImageUrl(savedState.waterfrontImageUrl)
    setCenterVideoUrl(savedState.centerVideoUrl)
    setToast(null)
  }

  const uploadToR2 = async (
    file: File,
    slot: UploadSlot,
    mediaRole: OneTeamImageRole
  ) => {
    setUploadingSlot(slot)
    setToast(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'one-team')
      formData.append('mediaRole', mediaRole)

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      const uploadedUrl = data.publicUrl || data.url
      if (!res.ok || !uploadedUrl) {
        setToast({ type: 'error', message: data.error || 'Failed to upload asset to Cloudflare R2.' })
        return
      }

      if (slot === 'villas') setLuxuryVillasImageUrl(uploadedUrl)
      if (slot === 'commercial') setCommercialImageUrl(uploadedUrl)
      if (slot === 'sky') setSkyResidencesImageUrl(uploadedUrl)
      if (slot === 'waterfront') setWaterfrontImageUrl(uploadedUrl)
      if (slot === 'video') setCenterVideoUrl(uploadedUrl)

      setToast({
        type: 'success',
        message: 'Uploaded to Cloudflare R2. Click "Save Changes" to publish.',
      })
    } catch {
      setToast({ type: 'error', message: 'Network error uploading file to R2.' })
    } finally {
      setUploadingSlot(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setToast(null)

    try {
      const res = await fetch('/api/admin/one-team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionEyebrow: sectionEyebrow.trim() || null,
          sectionHeading: sectionHeading.trim() || null,
          sectionDescription: sectionDescription.trim() || null,
          bannerLabel: bannerLabel.trim() || null,
          bannerHeading: bannerHeading.trim() || null,
          luxuryVillasImageUrl: (luxuryVillasImageUrl || '').trim() || null,
          commercialImageUrl: (commercialImageUrl || '').trim() || null,
          skyResidencesImageUrl: (skyResidencesImageUrl || '').trim() || null,
          waterfrontImageUrl: (waterfrontImageUrl || '').trim() || null,
          centerVideoUrl: (centerVideoUrl || '').trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setToast({ type: 'error', message: data.error || 'Failed to save One Team content.' })
        return
      }

      const nextState = {
        sectionEyebrow: data.sectionEyebrow || '',
        sectionHeading: data.sectionHeading || '',
        sectionDescription: data.sectionDescription || '',
        bannerLabel: data.bannerLabel || '',
        bannerHeading: data.bannerHeading || '',
        luxuryVillasImageUrl: data.luxuryVillasImageUrl || '',
        commercialImageUrl: data.commercialImageUrl || '',
        skyResidencesImageUrl: data.skyResidencesImageUrl || '',
        waterfrontImageUrl: data.waterfrontImageUrl || '',
        centerVideoUrl: data.centerVideoUrl || '',
      }
      setSavedState(nextState)
      setSectionEyebrow(nextState.sectionEyebrow)
      setSectionHeading(nextState.sectionHeading)
      setSectionDescription(nextState.sectionDescription)
      setBannerLabel(nextState.bannerLabel)
      setBannerHeading(nextState.bannerHeading)
      setLuxuryVillasImageUrl(nextState.luxuryVillasImageUrl)
      setCommercialImageUrl(nextState.commercialImageUrl)
      setSkyResidencesImageUrl(nextState.skyResidencesImageUrl)
      setWaterfrontImageUrl(nextState.waterfrontImageUrl)
      setCenterVideoUrl(nextState.centerVideoUrl)
      setToast({ type: 'success', message: 'One Team, End to End editorial copy & media saved and published!' })
    } catch {
      setToast({ type: 'error', message: 'Network error while saving One Team changes.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/15 pb-5">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#0B1320]/70">
            Homepage Architectural Showcase
          </span>
          <h1 className="text-2xl font-display font-medium text-[#0B1320] tracking-wide mt-1">
            One Team, End to End
          </h1>
          <p className="text-xs text-[#0B1320]/75 mt-1">
            Manage section copy, the 4 architectural service showcase cards, and the center video stored in Cloudflare R2.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/#services"
            target="_blank"
            className="px-4 py-2 rounded-lg bg-[#8FA0B2] border border-black/15 hover:bg-[#7f91a4] text-xs font-medium text-[#0B1320] flex items-center gap-2 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Section</span>
          </Link>

          {hasChanges && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-black/10 hover:bg-black/20 text-[#0B1320] text-xs font-medium transition-all cursor-pointer"
            >
              Discard Changes
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !!uploadingSlot}
            className="px-5 py-2 rounded-lg bg-[#7DD3FC] hover:bg-[#BAE6FD] text-[#040810] text-xs font-semibold tracking-wide flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : hasChanges ? 'Save Changes *' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {initialData.migrationPending && (
        <div className="bg-amber-950/85 border border-amber-400/40 rounded-xl px-4 py-3 text-xs text-amber-200 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-300" />
          <span>
            Database extension migration for OneTeamContent is pending; reading and saving via Service Category &amp; Homepage media records until applied.
          </span>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border text-xs font-mono ${
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
        </div>
      )}

      {/* Section Editorial Content */}
      <div className="bg-[#0B1528] border border-white/10 rounded-2xl p-6 text-white space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Edit className="w-4 h-4 text-[#7DD3FC]" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              Section Editorial Content &amp; Headlines
            </h2>
          </div>
          <span className="text-[11px] font-mono text-gray-400">PostgreSQL CMS Backed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
              Section Eyebrow Label
            </label>
            <input
              type="text"
              value={sectionEyebrow}
              onChange={(e) => setSectionEyebrow(e.target.value)}
              placeholder="e.g. WHAT WE DO"
              className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
            />
            <p className="text-[11px] text-gray-400 mt-1">Appears above the main headline with dual accent lines.</p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
              Section Main Heading
            </label>
            <input
              type="text"
              value={sectionHeading}
              onChange={(e) => setSectionHeading(e.target.value)}
              placeholder="e.g. One team, end to end"
              className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
            />
            <p className="text-[11px] text-gray-400 mt-1">Main section heading rendered with approved accent styling.</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
              Section Description
            </label>
            <textarea
              rows={2}
              value={sectionDescription}
              onChange={(e) => setSectionDescription(e.target.value)}
              placeholder="e.g. Architectural discipline descriptions..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
              Sticky Banner Label
            </label>
            <input
              type="text"
              value={bannerLabel}
              onChange={(e) => setBannerLabel(e.target.value)}
              placeholder="e.g. APEX PACIFIC HOLDINGS"
              className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
            />
            <p className="text-[11px] text-gray-400 mt-1">Top badge inside the center floating card banner.</p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-2">
              Sticky Banner Heading
            </label>
            <input
              type="text"
              value={bannerHeading}
              onChange={(e) => setBannerHeading(e.target.value)}
              placeholder="e.g. One team, end to end"
              className="w-full px-3.5 py-2.5 rounded-lg bg-black/30 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] transition-colors"
            />
            <p className="text-[11px] text-gray-400 mt-1">Primary title inside the center floating card banner.</p>
          </div>
        </div>
      </div>

      {/* Top Row Cards (Sections A & B) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OneTeamImageCard
          title="Luxury Villas Card Image"
          subtitle="Top-left architectural showcase frame in One Team, End to End."
          badge="Section A · Top Left"
          url={luxuryVillasImageUrl}
          slot="villas"
          mediaRole="ONE_TEAM_VILLA"
          uploadingSlot={uploadingSlot}
          onUpload={uploadToR2}
          onPickFromLibrary={() => setLibrarySlot('villas')}
          onRemove={() => setLuxuryVillasImageUrl('')}
          emptyLabel="No Luxury Villas image set"
        />

        <OneTeamImageCard
          title="Commercial Properties Card Image"
          subtitle="Top-right architectural showcase frame in One Team, End to End."
          badge="Section B · Top Right"
          url={commercialImageUrl}
          slot="commercial"
          mediaRole="ONE_TEAM_COMMERCIAL"
          uploadingSlot={uploadingSlot}
          onUpload={uploadToR2}
          onPickFromLibrary={() => setLibrarySlot('commercial')}
          onRemove={() => setCommercialImageUrl('')}
          emptyLabel="No Commercial Properties image set"
        />
      </div>

      {/* Center Video Reel (Section C) */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-[#7DD3FC]" />
              <span>Middle Full-Width Video Reel (MP4 / WebM)</span>
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Displayed between the top and bottom service cards in One Team, End to End.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
            Section C · Center Video
          </span>
        </div>

        <div className="aspect-[21/9] w-full rounded-lg overflow-hidden bg-[#040810] border border-white/10 flex items-center justify-center">
          {centerVideoUrl ? (
            <video
              key={centerVideoUrl}
              src={centerVideoUrl}
              controls
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center px-4">
              <Film className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-mono">No middle video assigned</p>
            </div>
          )}
        </div>

        {centerVideoUrl && (
          <p className="text-[10px] font-mono text-[#7DD3FC] truncate bg-[#040810] px-3 py-1.5 rounded border border-white/5">
            {centerVideoUrl}
          </p>
        )}

        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadToR2(file, 'video', 'ONE_TEAM_VIDEO')
            e.target.value = ''
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingSlot === 'video'}
              className="px-4 py-2 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {uploadingSlot === 'video' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              <span>
                {uploadingSlot === 'video'
                  ? 'Uploading Video...'
                  : centerVideoUrl
                    ? 'Replace Video'
                    : 'Upload MP4 / WebM'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLibrarySlot('video')}
              disabled={uploadingSlot === 'video'}
              className="px-3.5 py-2 rounded-lg bg-[#0B1528] hover:bg-[#11203B] border border-white/15 text-gray-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#7DD3FC]" />
              <span>From Library</span>
            </button>

            {centerVideoUrl && (
              <button
                type="button"
                onClick={() => setCenterVideoUrl('')}
                className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row Cards (Sections D & E: Sky Residences & Waterfront Residences) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OneTeamImageCard
          title="Sky Residences Card Image"
          subtitle="Bottom-left architectural showcase frame in One Team, End to End."
          badge="Section D · Bottom Left"
          url={skyResidencesImageUrl}
          slot="sky"
          mediaRole="ONE_TEAM_SKY"
          uploadingSlot={uploadingSlot}
          onUpload={uploadToR2}
          onPickFromLibrary={() => setLibrarySlot('sky')}
          onRemove={() => setSkyResidencesImageUrl('')}
          emptyLabel="No Sky Residences image set"
        />

        <OneTeamImageCard
          title="Waterfront Residences Card Image"
          subtitle="Bottom-right architectural showcase frame in One Team, End to End."
          badge="Section E · Bottom Right"
          url={waterfrontImageUrl}
          slot="waterfront"
          mediaRole="ONE_TEAM_WATERFRONT"
          uploadingSlot={uploadingSlot}
          onUpload={uploadToR2}
          onPickFromLibrary={() => setLibrarySlot('waterfront')}
          onRemove={() => setWaterfrontImageUrl('')}
          emptyLabel="No Waterfront Residences image set"
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !!uploadingSlot}
          className="px-6 py-2.5 rounded-lg bg-[#7DD3FC] hover:bg-[#BAE6FD] text-[#040810] text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saving ? 'Saving...' : hasChanges ? 'Save Changes *' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Service Categories Presentation Editor Links */}
      {Array.isArray(initialData.services) && initialData.services.length > 0 && (
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7DD3FC]" />
                <span>Service Category Presentations &amp; Editorial Copy</span>
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Edit category titles, descriptions, architectural focus tenets, and deliverables.
              </p>
            </div>
            <Link
              href="/admin/services"
              className="text-xs font-mono text-[#7DD3FC] hover:text-white transition-colors"
            >
              Open Services Manager →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {initialData.services.map((service) => (
              <Link
                key={service.id}
                href={`/admin/services/${service.id}`}
                className="p-3.5 rounded-lg bg-[#040810] border border-white/10 hover:border-[#7DD3FC]/50 transition-all flex flex-col justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-medium text-white">{service.name}</p>
                  <p className="text-[10px] font-mono text-gray-500 mt-0.5">/services/{service.slug}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#7DD3FC]">
                  <Edit className="w-3 h-3" /> Edit Pillar
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <MediaLibraryModal
        open={librarySlot !== null}
        title={
          librarySlot === 'video'
            ? 'Choose Center Video from Library'
            : 'Choose One Team Card Image from Library'
        }
        initialFolder="one-team"
        acceptFilter={librarySlot === 'video' ? 'video' : 'image'}
        onSelect={(url) => {
          if (librarySlot === 'villas') setLuxuryVillasImageUrl(url)
          if (librarySlot === 'commercial') setCommercialImageUrl(url)
          if (librarySlot === 'sky') setSkyResidencesImageUrl(url)
          if (librarySlot === 'waterfront') setWaterfrontImageUrl(url)
          if (librarySlot === 'video') setCenterVideoUrl(url)
          setLibrarySlot(null)
        }}
        onClose={() => setLibrarySlot(null)}
      />
    </div>
  )
}
