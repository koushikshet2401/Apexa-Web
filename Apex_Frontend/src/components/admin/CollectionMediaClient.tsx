'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import {
  Globe,
  UploadCloud,
  Trash2,
  Save,
  ExternalLink,
  Image as ImageIcon,
  Film,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit,
} from 'lucide-react'

export interface CollectionCountryMediaItem {
  countryId: string
  slug: string
  name: string
  displayName: string
  region: string
  isPublished: boolean
  displayOrder: number
  propertyCount: number
  coverImageUrl: string | null
  heroVideoUrl: string | null
  updatedBy?: string | null
  updatedAt?: string | Date | null
}

interface CountryDraft {
  coverImageUrl: string
  heroVideoUrl: string
  savedCoverImageUrl: string
  savedHeroVideoUrl: string
}

export default function CollectionMediaClient({
  initialCountries,
  initialAdvisoryVideoUrl = null,
  migrationPending = false,
}: {
  initialCountries: CollectionCountryMediaItem[]
  initialAdvisoryVideoUrl?: string | null
  migrationPending?: boolean
}) {
  const [drafts, setDrafts] = useState<Record<string, CountryDraft>>(() => {
    const map: Record<string, CountryDraft> = {}
    for (const c of initialCountries) {
      const cover = c.coverImageUrl || ''
      const video = c.heroVideoUrl || ''
      map[c.countryId] = {
        coverImageUrl: cover,
        heroVideoUrl: video,
        savedCoverImageUrl: cover,
        savedHeroVideoUrl: video,
      }
    }
    return map
  })

  const [advisoryVideoUrl, setAdvisoryVideoUrl] = useState<string>(initialAdvisoryVideoUrl || '')
  const [savedAdvisoryVideoUrl, setSavedAdvisoryVideoUrl] = useState<string>(initialAdvisoryVideoUrl || '')
  const [uploadingAdvisoryVideo, setUploadingAdvisoryVideo] = useState(false)
  const [savingAdvisoryVideo, setSavingAdvisoryVideo] = useState(false)
  const advisoryVideoInputRef = useRef<HTMLInputElement | null>(null)

  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [savingCountryId, setSavingCountryId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const coverInputs = useRef<Record<string, HTMLInputElement | null>>({})
  const videoInputs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleUploadAdvisoryVideo = async (file: File) => {
    setUploadingAdvisoryVideo(true)
    setToast(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'homepage')
      formData.append('mediaRole', 'HOMEPAGE_VIDEO')

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      const uploadedUrl = data.publicUrl || data.url
      if (!res.ok || !uploadedUrl) {
        setToast({
          type: 'error',
          message: data.error || 'Failed to upload Speak With Us / Contact video.',
        })
        return
      }

      setAdvisoryVideoUrl(uploadedUrl)
      setToast({
        type: 'success',
        message: 'Speak With Us / Contact video uploaded to R2. Click Save to publish.',
      })
    } catch {
      setToast({ type: 'error', message: 'Network error uploading Speak With Us / Contact video.' })
    } finally {
      setUploadingAdvisoryVideo(false)
    }
  }

  const handleSaveAdvisoryVideo = async () => {
    setSavingAdvisoryVideo(true)
    setToast(null)

    try {
      const res = await fetch('/api/admin/collection-media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisoryVideoUrl: (advisoryVideoUrl || '').trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setToast({
          type: 'error',
          message: data.error || 'Failed to save Speak With Us / Contact video.',
        })
        return
      }

      const nextUrl = data.advisoryVideoUrl || ''
      setAdvisoryVideoUrl(nextUrl)
      setSavedAdvisoryVideoUrl(nextUrl)
      setToast({
        type: 'success',
        message: 'Speak With Us / Contact video saved and published!',
      })
    } catch {
      setToast({ type: 'error', message: 'Network error saving Speak With Us / Contact video.' })
    } finally {
      setSavingAdvisoryVideo(false)
    }
  }

  const handleUpload = async (
    country: CollectionCountryMediaItem,
    field: 'cover' | 'video',
    file: File
  ) => {
    const opKey = `${country.countryId}:${field}`
    setUploadingKey(opKey)
    setToast(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'collection-media')
      formData.append('countrySlug', country.slug)
      formData.append(
        'mediaRole',
        field === 'cover' ? 'COLLECTION_COVER' : 'COLLECTION_HERO_VIDEO'
      )

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      const uploadedUrl = data.publicUrl || data.url
      if (!res.ok || !uploadedUrl) {
        setToast({ type: 'error', message: data.error || `Failed to upload ${field} for ${country.displayName}.` })
        return
      }

      setDrafts((prev) => ({
        ...prev,
        [country.countryId]: {
          ...prev[country.countryId],
          ...(field === 'cover' ? { coverImageUrl: uploadedUrl } : { heroVideoUrl: uploadedUrl }),
        },
      }))

      setToast({
        type: 'success',
        message: `${country.displayName} ${field === 'cover' ? 'cover image' : 'hero video'} uploaded to R2. Click Save to publish.`,
      })
    } catch {
      setToast({ type: 'error', message: `Network error uploading for ${country.displayName}.` })
    } finally {
      setUploadingKey(null)
    }
  }

  const handleRemove = (countryId: string, field: 'cover' | 'video') => {
    setDrafts((prev) => ({
      ...prev,
      [countryId]: {
        ...prev[countryId],
        ...(field === 'cover' ? { coverImageUrl: '' } : { heroVideoUrl: '' }),
      },
    }))
  }

  const handleSaveCountry = async (country: CollectionCountryMediaItem) => {
    const current = drafts[country.countryId]
    if (!current) return

    setSavingCountryId(country.countryId)
    setToast(null)

    try {
      const res = await fetch(`/api/admin/collection-media/${country.countryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverImageUrl: (current.coverImageUrl || '').trim() || null,
          heroVideoUrl: (current.heroVideoUrl || '').trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setToast({ type: 'error', message: data.error || `Failed to save ${country.displayName}.` })
        return
      }

      const nextCover = data.coverImageUrl || ''
      const nextVideo = data.heroVideoUrl || ''
      setDrafts((prev) => ({
        ...prev,
        [country.countryId]: {
          coverImageUrl: nextCover,
          heroVideoUrl: nextVideo,
          savedCoverImageUrl: nextCover,
          savedHeroVideoUrl: nextVideo,
        },
      }))

      setToast({
        type: 'success',
        message: `${country.displayName} Collection Media saved and published!`,
      })
    } catch {
      setToast({ type: 'error', message: `Network error saving ${country.displayName}.` })
    } finally {
      setSavingCountryId(null)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/15 pb-5">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#0B1320]/70">
            Destinations & Private Advisory
          </span>
          <h1 className="text-2xl font-display font-medium text-[#0B1320] tracking-wide mt-1">
            Collection &amp; Contact Video
          </h1>
          <p className="text-xs text-[#0B1320]/75 mt-1">
            Upload, preview, replace, or remove the Speak With Us / Contact video and country-specific covers &amp; hero videos stored in Cloudflare R2.
          </p>
        </div>

        <Link
          href="/admin/countries"
          className="px-4 py-2 rounded-lg bg-[#8FA0B2] border border-black/15 hover:bg-[#7f91a4] text-xs font-medium text-[#0B1320] flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Manage Countries Metadata</span>
        </Link>
      </div>

      {migrationPending && (
        <div className="bg-amber-950/85 border border-amber-400/40 rounded-xl px-4 py-3 text-xs text-amber-200 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-300" />
          <span>
            Database extension migration for CollectionMedia is pending; displaying existing Country media fields until applied.
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

      <div className="space-y-6">
        {/* Speak With Us / Contact & Private Advisory Background Video */}
        <section className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-display font-medium text-white">
                  Speak With Us / Contact Video
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#7DD3FC] border border-white/10">
                  Homepage Private Advisory · /contact &amp; Enquiry Modal
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Background video played in the homepage &ldquo;Speak With Us&rdquo; section, the Private Enquiries modal, and the /contact page.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/contact"
                target="_blank"
                className="px-3 py-1.5 rounded-lg bg-[#040810] border border-white/10 hover:border-white/25 text-[11px] text-gray-300 hover:text-white flex items-center gap-1.5"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Preview Contact</span>
              </Link>

              <button
                type="button"
                onClick={handleSaveAdvisoryVideo}
                disabled={savingAdvisoryVideo || uploadingAdvisoryVideo}
                className="px-4 py-1.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
              >
                {savingAdvisoryVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>
                  {savingAdvisoryVideo
                    ? 'Saving...'
                    : advisoryVideoUrl !== savedAdvisoryVideoUrl
                      ? 'Save *'
                      : 'Save'}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-mono text-gray-300 flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-[#7DD3FC]" />
              <span>Private Advisory &amp; Contact Background Video (MP4 / WebM)</span>
            </label>

            <div className="aspect-[21/9] w-full rounded-lg overflow-hidden bg-[#040810] border border-white/10 flex items-center justify-center">
              {advisoryVideoUrl ? (
                <video
                  key={advisoryVideoUrl}
                  src={advisoryVideoUrl}
                  controls
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center px-4">
                  <Film className="w-8 h-8 text-gray-600 mx-auto mb-1.5" />
                  <p className="text-[11px] font-mono text-gray-400">
                    No Speak With Us / Contact video configured
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Upload an MP4 or WebM video to Cloudflare R2 to activate the background video.
                  </p>
                </div>
              )}
            </div>

            {advisoryVideoUrl && (
              <p className="text-[10px] font-mono text-[#7DD3FC] truncate bg-[#040810] px-2.5 py-1.5 rounded border border-white/5">
                {advisoryVideoUrl}
              </p>
            )}

            <input
              ref={advisoryVideoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUploadAdvisoryVideo(file)
                e.target.value = ''
              }}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => advisoryVideoInputRef.current?.click()}
                disabled={uploadingAdvisoryVideo}
                className="px-3.5 py-2 rounded-lg bg-[#0B1528] hover:bg-[#11203B] border border-white/15 text-xs text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploadingAdvisoryVideo ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5 text-[#7DD3FC]" />
                )}
                <span>
                  {uploadingAdvisoryVideo
                    ? 'Uploading Video...'
                    : advisoryVideoUrl
                      ? 'Replace Video'
                      : 'Upload Video'}
                </span>
              </button>

              {advisoryVideoUrl && (
                <button
                  type="button"
                  onClick={() => setAdvisoryVideoUrl('')}
                  className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {initialCountries.map((country) => {
          const state = drafts[country.countryId] || {
            coverImageUrl: '',
            heroVideoUrl: '',
            savedCoverImageUrl: '',
            savedHeroVideoUrl: '',
          }
          const isDirty =
            state.coverImageUrl !== state.savedCoverImageUrl ||
            state.heroVideoUrl !== state.savedHeroVideoUrl
          const isSaving = savingCountryId === country.countryId
          const isUploadingCover = uploadingKey === `${country.countryId}:cover`
          const isUploadingVideo = uploadingKey === `${country.countryId}:video`

          return (
            <section
              key={country.countryId}
              className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5 shadow-md"
            >
              {/* Country Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg font-display font-medium text-white">
                      {country.displayName}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#7DD3FC] border border-white/10">
                      /collection/{country.slug}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        country.isPublished
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-gray-500/10 text-gray-300 border-gray-500/30'
                      }`}
                    >
                      {country.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {country.region} · {country.propertyCount} assigned project{country.propertyCount === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/admin/countries/${country.countryId}`}
                    className="px-3 py-1.5 rounded-lg bg-[#040810] border border-white/10 hover:border-white/25 text-[11px] text-gray-300 hover:text-white flex items-center gap-1.5"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Details</span>
                  </Link>

                  <Link
                    href={`/collection/${country.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-lg bg-[#040810] border border-white/10 hover:border-white/25 text-[11px] text-gray-300 hover:text-white flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Preview Page</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleSaveCountry(country)}
                    disabled={isSaving || isUploadingCover || isUploadingVideo}
                    className="px-4 py-1.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaving ? 'Saving...' : isDirty ? 'Save *' : 'Save'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Country Cover Image */}
                <div className="space-y-3">
                  <label className="text-xs font-mono text-gray-300 flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-[#7DD3FC]" />
                    <span>Country Cover / Fallback Image</span>
                  </label>

                  <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-[#040810] border border-white/10 flex items-center justify-center">
                    {state.coverImageUrl ? (
                      <img
                        src={state.coverImageUrl}
                        alt={`${country.displayName} cover`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center px-4">
                        <ImageIcon className="w-8 h-8 text-gray-600 mx-auto mb-1.5" />
                        <p className="text-[11px] font-mono text-gray-500">No cover image configured</p>
                      </div>
                    )}
                  </div>

                  {state.coverImageUrl && (
                    <p className="text-[10px] font-mono text-[#7DD3FC] truncate bg-[#040810] px-2.5 py-1.5 rounded border border-white/5">
                      {state.coverImageUrl}
                    </p>
                  )}

                  <input
                    ref={(el) => {
                      coverInputs.current[country.countryId] = el
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(country, 'cover', file)
                      e.target.value = ''
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => coverInputs.current[country.countryId]?.click()}
                      disabled={isUploadingCover}
                      className="px-3.5 py-2 rounded-lg bg-[#0B1528] hover:bg-[#11203B] border border-white/15 text-xs text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingCover ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-3.5 h-3.5 text-[#7DD3FC]" />
                      )}
                      <span>
                        {isUploadingCover
                          ? 'Uploading...'
                          : state.coverImageUrl
                            ? 'Replace Cover'
                            : 'Upload Cover'}
                      </span>
                    </button>

                    {state.coverImageUrl && (
                      <button
                        type="button"
                        onClick={() => handleRemove(country.countryId, 'cover')}
                        className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Country Cinematic Hero Video */}
                <div className="space-y-3">
                  <label className="text-xs font-mono text-gray-300 flex items-center gap-2">
                    <Film className="w-3.5 h-3.5 text-[#7DD3FC]" />
                    <span>Country Cinematic Hero Video (MP4 / WebM)</span>
                  </label>

                  <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-[#040810] border border-white/10 flex items-center justify-center">
                    {state.heroVideoUrl ? (
                      <video
                        key={state.heroVideoUrl}
                        src={state.heroVideoUrl}
                        controls
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center px-4">
                        <Film className="w-8 h-8 text-gray-600 mx-auto mb-1.5" />
                        <p className="text-[11px] font-mono text-gray-400">
                          No country hero video configured
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Public page will gracefully display this country&apos;s cover image instead.
                        </p>
                      </div>
                    )}
                  </div>

                  {state.heroVideoUrl && (
                    <p className="text-[10px] font-mono text-[#7DD3FC] truncate bg-[#040810] px-2.5 py-1.5 rounded border border-white/5">
                      {state.heroVideoUrl}
                    </p>
                  )}

                  <input
                    ref={(el) => {
                      videoInputs.current[country.countryId] = el
                    }}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(country, 'video', file)
                      e.target.value = ''
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => videoInputs.current[country.countryId]?.click()}
                      disabled={isUploadingVideo}
                      className="px-3.5 py-2 rounded-lg bg-[#0B1528] hover:bg-[#11203B] border border-white/15 text-xs text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingVideo ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-3.5 h-3.5 text-[#7DD3FC]" />
                      )}
                      <span>
                        {isUploadingVideo
                          ? 'Uploading Video...'
                          : state.heroVideoUrl
                            ? 'Replace Video'
                            : 'Upload Video'}
                      </span>
                    </button>

                    {state.heroVideoUrl && (
                      <button
                        type="button"
                        onClick={() => handleRemove(country.countryId, 'video')}
                        className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
