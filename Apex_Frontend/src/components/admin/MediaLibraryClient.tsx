'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Image as ImageIcon,
  Film,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  X,
  RefreshCw,
  Folder,
  Search,
  Orbit,
  CheckCircle2,
} from 'lucide-react'
import MediaUploader from './MediaUploader'

export interface MediaItem {
  key: string
  r2Key?: string
  url: string
  filename?: string
  originalFilename?: string
  folder?: string
  size: number
  lastModified: string | null
  contentType?: string | null
  mimeType?: string | null
  mediaType?: 'IMAGE' | 'VIDEO' | string
  mediaCategory?: 'image' | 'video' | string
  mediaRole?: string | null
  tracked?: boolean
  storage?: string
}

interface MediaLibraryClientProps {
  onSelect?: (url: string, item?: MediaItem) => void
  isModal?: boolean
  onClose?: () => void
  initialFolder?: string
  acceptFilter?: 'all' | 'image' | 'video'
}

export const FOLDER_TABS = [
  'all',
  'properties',
  'space-in-round',
  'countries',
  'services',
  'homepage',
  'one-team',
  'collection-media',
  'general',
] as const

export const FOLDER_LABELS: Record<string, string> = {
  all: 'ALL',
  properties: 'PROPERTIES',
  'space-in-round': 'SPACE IN ROUND',
  countries: 'COUNTRIES',
  services: 'SERVICES',
  homepage: 'HOMEPAGE',
  'one-team': 'ONE-TEAM',
  'collection-media': 'COLLECTION-MEDIA',
  general: 'GENERAL',
}

export const CATEGORY_DESTINATIONS = [
  {
    id: 'space-in-round',
    label: 'Spaces in the Round',
    badge: '3D Carousel',
    icon: '🪐',
    folder: 'space-in-round',
    role: 'SPACE_IN_ROUND',
    description: 'Circular interactive cards & panoramic 3D models',
  },
  {
    id: 'properties',
    label: 'Properties & Projects',
    badge: 'Portfolio',
    icon: '🏢',
    folder: 'properties',
    role: 'GALLERY_IMAGE',
    description: 'Architectural galleries, hero banners & blueprints',
  },
  {
    id: 'countries',
    label: 'Countries & Destinations',
    badge: 'Destinations',
    icon: '🌍',
    folder: 'countries',
    role: 'COUNTRY_MEDIA',
    description: 'Country hero video reels, scenic posters & guides',
  },
  {
    id: 'services',
    label: 'Services & Sectors',
    badge: 'Services',
    icon: '⚜️',
    folder: 'services',
    role: 'SERVICE_MEDIA',
    description: 'Luxury Villas, Sky Residences, Commercial & Waterfront',
  },
  {
    id: 'homepage',
    label: 'Homepage Hero Video',
    badge: 'Landing',
    icon: '🎬',
    folder: 'homepage',
    role: 'HOMEPAGE_VIDEO',
    description: 'Cinematic landing video reel & fallback poster frames',
  },
  {
    id: 'one-team',
    label: 'One Team, End to End',
    badge: 'One Team',
    icon: '👥',
    folder: 'one-team',
    role: 'ONE_TEAM_VIDEO',
    description: 'Middle showcase video reel & 4 architecture cards',
  },
  {
    id: 'collection-media',
    label: 'Collection Portals',
    badge: 'Portals',
    icon: '📁',
    folder: 'collection-media',
    role: 'COLLECTION_COVER',
    description: 'Country portfolio collection reels & card covers',
  },
  {
    id: 'general',
    label: 'General Media Library',
    badge: 'Storage',
    icon: '📦',
    folder: 'general',
    role: 'GENERAL',
    description: 'Shared assets, brand identity & general cloud storage',
  },
] as const

export default function MediaLibraryClient({
  onSelect,
  isModal = false,
  initialFolder = 'all',
  acceptFilter = 'all',
}: MediaLibraryClientProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [folder, setFolder] = useState<string>(initialFolder || 'all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>(acceptFilter)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showUploader, setShowUploader] = useState<boolean>(false)
  const [uploadCategory, setUploadCategory] = useState<string>(
    initialFolder && initialFolder !== 'all' ? initialFolder : 'space-in-round'
  )
  const [uploadNotice, setUploadNotice] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [failedPreviewKeys, setFailedPreviewKeys] = useState<Record<string, boolean>>({})

  // Keep upload category in sync when user switches folder tabs
  useEffect(() => {
    if (folder !== 'all') {
      const match = CATEGORY_DESTINATIONS.find((c) => c.id === folder || c.folder === folder)
      if (match) setUploadCategory(match.id)
    }
  }, [folder])

  const fetchMedia = useCallback(
    async (targetFolder = folder) => {
      setLoading(true)
      setFetchError(null)
      try {
        const params = new URLSearchParams()
        if (targetFolder && targetFolder !== 'all') {
          params.set('folder', targetFolder)
          params.set('prefix', `${targetFolder}/`)
        }
        const query = params.toString()
        const res = await fetch(`/api/admin/media${query ? `?${query}` : ''}`, {
          credentials: 'include',
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          setItems([])
          setFetchError(data?.error || `Failed to load media library (HTTP ${res.status}).`)
          return
        }
        const parsedItems: MediaItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : []
        setItems(parsedItems)
      } catch (err) {
        console.error('Error fetching media:', err)
        setItems([])
        setFetchError('Network error while connecting to Cloudflare R2 media library.')
      } finally {
        setLoading(false)
      }
    },
    [folder]
  )

  useEffect(() => {
    fetchMedia(folder)
  }, [folder, fetchMedia])

  const handleCopyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const encodedKeyPath = itemToDelete.key
        .split('/')
        .map((seg) => encodeURIComponent(seg))
        .join('/')
      const res = await fetch(`/api/admin/media/${encodedKeyPath}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.key !== itemToDelete.key))
        setItemToDelete(null)
      } else {
        setDeleteError(data?.error || `Failed to delete media object (HTTP ${res.status}).`)
      }
    } catch (err) {
      console.error('Error deleting media:', err)
      setDeleteError('Network error deleting media object.')
    } finally {
      setDeleting(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
  }

  const isVideoItem = (item: MediaItem) => {
    const mime = String(item.contentType || item.mimeType || '').toLowerCase()
    const keyLower = item.key.toLowerCase()
    return (
      item.mediaCategory === 'video' ||
      item.mediaType === 'VIDEO' ||
      mime.startsWith('video/') ||
      /\.(mp4|webm|mov|m4v)$/.test(keyLower)
    )
  }

  const isSpaceInRoundItem = (item: MediaItem) => {
    const roleUpper = String(item.mediaRole || '').toUpperCase()
    const keyLower = item.key.toLowerCase()
    return (
      item.folder === 'space-in-round' ||
      roleUpper === 'SPACE_IN_ROUND' ||
      roleUpper === 'SPACE_ROUND' ||
      keyLower.includes('space-round') ||
      keyLower.includes('space-in-round')
    )
  }

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return items.filter((item) => {
      // Space in Round filter
      if (folder === 'space-in-round' && !isSpaceInRoundItem(item)) {
        return false
      }

      const isVid = isVideoItem(item)
      if (typeFilter === 'image' && isVid) return false
      if (typeFilter === 'video' && !isVid) return false
      if (q) {
        const displayName = item.filename || item.originalFilename || item.key.split('/').pop() || ''
        const mime = item.contentType || item.mimeType || ''
        const role = item.mediaRole || ''
        const haystack = `${displayName} ${item.key} ${mime} ${role}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [items, folder, typeFilter, searchTerm])

  const activeCategoryConfig =
    CATEGORY_DESTINATIONS.find((c) => c.id === uploadCategory) || CATEGORY_DESTINATIONS[0]

  return (
    <div className={`space-y-6 ${isModal ? 'p-2' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#38BDF8]">
              Asset Management
            </span>
          </div>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            {isModal ? 'Select Media from Library' : 'Media Library & Cloud Storage'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Browse, upload, and organize high-resolution photography and cinematic reels across all website sections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchMedia(folder)}
            className="p-2 rounded-lg bg-[#070E1C] border border-white/10 text-gray-400 hover:text-white cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setShowUploader(!showUploader)
              setUploadNotice(null)
            }}
            className="px-4 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#040810] text-xs font-semibold tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(56,189,248,0.25)] transition-all cursor-pointer"
          >
            {showUploader ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showUploader ? 'Close Upload' : 'Upload File'}</span>
          </button>
        </div>
      </div>

      {/* Upload Notification Banner */}
      {uploadNotice && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-300 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadNotice(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Drawer / Box with Categorization Question */}
      {showUploader && (
        <div className="p-6 rounded-xl bg-[#070E1C] border border-[#38BDF8]/40 shadow-2xl animate-in fade-in space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-white">
                Upload New Media File (Image or Video)
              </span>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Upload photography (.jpg, .png, .webp) or cinematic reels (.mp4, .mov, .webm) directly to Cloudflare R2.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUploader(false)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* QUESTION: Where should this media go? */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <label className="text-xs font-medium text-white flex items-center gap-1.5">
                <span>Where should this media be categorized?</span>
                <span className="text-[#38BDF8] font-mono text-[11px]">(Required)</span>
              </label>
              <span className="text-[11px] font-mono text-[#38BDF8] flex items-center gap-1">
                <span>Selected Destination:</span>
                <span className="font-semibold underline">
                  {activeCategoryConfig.folder}/ ({activeCategoryConfig.label})
                </span>
              </span>
            </div>

            {/* 8 Category Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATEGORY_DESTINATIONS.map((cat) => {
                const isSelected = uploadCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setUploadCategory(cat.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#0B1528] border-[#38BDF8] text-white shadow-[0_0_15px_rgba(56,189,248,0.3)] ring-1 ring-[#38BDF8]'
                        : 'bg-[#040810]/70 border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-[#070E1C]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{cat.icon}</span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold ${
                          isSelected
                            ? 'bg-[#38BDF8] text-[#040810]'
                            : 'bg-white/10 text-gray-400'
                        }`}
                      >
                        {cat.badge}
                      </span>
                    </div>
                    <div className="mt-2 font-medium text-xs text-white leading-tight">
                      {cat.label}
                    </div>
                    <div className="text-[10px] text-gray-400 line-clamp-1 mt-1 font-sans">
                      {cat.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Media Uploader configured with chosen category */}
          <div className="pt-2">
            <MediaUploader
              folder={activeCategoryConfig.folder as any}
              mediaRole={activeCategoryConfig.role as any}
              accept="image/*,video/mp4,video/webm,video/quicktime"
              label={`Upload Image or Video for ${activeCategoryConfig.label}`}
              onUploadComplete={(url, key) => {
                const targetFolder = activeCategoryConfig.folder
                fetchMedia(targetFolder)
                setFolder(targetFolder)
                setShowUploader(false)
                setUploadNotice(
                  `Successfully uploaded asset to "${activeCategoryConfig.label}" (${key || url}). Switched to ${activeCategoryConfig.label} tab.`
                )
              }}
            />
          </div>
        </div>
      )}

      {/* Folder Tabs + Search & Type Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Dynamic Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-[#070E1C] border border-white/10 w-fit max-w-full overflow-x-auto">
          {FOLDER_TABS.map((f) => {
            const isTabActive = folder === f
            const label = FOLDER_LABELS[f] || f.toUpperCase()
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFolder(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isTabActive
                    ? 'bg-[#38BDF8] text-[#040810] font-bold shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {f === 'space-in-round' && <Orbit className="w-3 h-3 shrink-0" />}
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        {/* Search & Media Type (Image/Video) Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter filename or key..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#070E1C] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#38BDF8] font-mono w-48 sm:w-56"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#070E1C] border border-white/10">
            {(['all', 'image', 'video'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase cursor-pointer transition-colors ${
                  typeFilter === t
                    ? 'bg-[#38BDF8] text-[#040810] font-bold shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* API Error Alert */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-mono text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchMedia(folder)}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-mono text-rose-200 border border-rose-500/30 cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Grid of Media */}
      {loading ? (
        <div className="p-16 text-center text-xs font-mono text-gray-500">
          Loading library assets...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-white/10 rounded-xl space-y-3">
          <Folder className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-xs text-gray-300 font-mono">
            No media objects found in &quot;{FOLDER_LABELS[folder] || folder}&quot;
            {searchTerm ? ` matching "${searchTerm}"` : ''}.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowUploader(true)
              setUploadCategory(folder !== 'all' ? folder : 'space-in-round')
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 text-[#38BDF8] text-xs font-mono border border-[#38BDF8]/40 transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload file to {FOLDER_LABELS[folder] || folder}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const isVid = isVideoItem(item)
            const displayName =
              item.filename || item.originalFilename || item.key.split('/').pop() || item.key
            const displayType = item.contentType || item.mimeType || (isVid ? 'video/mp4' : 'image/jpeg')
            const hasPreviewFailed = Boolean(failedPreviewKeys[item.key])

            return (
              <div
                key={item.key}
                className="group relative rounded-xl border border-white/10 hover:border-[#38BDF8]/50 overflow-hidden bg-[#070E1C] flex flex-col justify-between transition-all hover:shadow-[0_0_15px_rgba(56,189,248,0.15)]"
              >
                {/* Media Preview Aspect Container */}
                <div
                  className="aspect-[4/3] bg-black/60 relative overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => onSelect && onSelect(item.url, item)}
                >
                  {isVid ? (
                    hasPreviewFailed ? (
                      <div className="flex flex-col items-center justify-center text-gray-400 gap-1.5 p-3 text-center">
                        <Film className="w-7 h-7 text-[#38BDF8]" />
                        <span className="text-[10px] font-mono text-gray-400 truncate max-w-[120px]">
                          {displayName}
                        </span>
                      </div>
                    ) : (
                      <>
                        <video
                          src={item.url}
                          muted
                          playsInline
                          preload="metadata"
                          onError={() =>
                            setFailedPreviewKeys((prev) => ({ ...prev, [item.key]: true }))
                          }
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 border border-white/20 text-[9px] font-mono text-[#38BDF8] flex items-center gap-1">
                          <Film className="w-2.5 h-2.5" />
                          <span>VIDEO</span>
                        </span>
                      </>
                    )
                  ) : hasPreviewFailed ? (
                    <div className="flex flex-col items-center justify-center text-gray-500 gap-1.5 p-3 text-center">
                      <ImageIcon className="w-7 h-7 text-gray-500" />
                      <span className="text-[10px] font-mono truncate max-w-[120px]">
                        Preview unavailable
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={displayName}
                      onError={() =>
                        setFailedPreviewKeys((prev) => ({ ...prev, [item.key]: true }))
                      }
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Overlay button in select mode */}
                  {onSelect && (
                    <div className="absolute inset-0 bg-[#070E1C]/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="px-3 py-1 rounded bg-[#38BDF8] text-[#040810] text-xs font-semibold">
                        Select Asset
                      </span>
                    </div>
                  )}
                </div>

                {/* Info and Actions */}
                <div className="p-2.5 bg-[#040810] border-t border-white/5 space-y-1.5">
                  <div
                    className="text-[11px] font-mono text-white truncate"
                    title={`${displayName}\nKey: ${item.key}`}
                  >
                    {displayName}
                  </div>
                  <div className="text-[9px] font-mono text-gray-500 truncate" title={item.key}>
                    {item.key}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span className="truncate max-w-[100px]" title={displayType}>
                      {displayType}
                    </span>
                    <span className={item.tracked ? 'text-emerald-400 font-semibold' : 'text-amber-300'}>
                      {item.tracked ? 'R2 · DB' : 'R2'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                    <span>{formatSize(item.size)}</span>
                    <span>{formatDate(item.lastModified)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-gray-400">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item.url, item.key)}
                      className="hover:text-[#38BDF8] p-1 flex items-center gap-1 text-[10px] font-mono cursor-pointer"
                      title="Copy Public URL"
                    >
                      {copiedKey === item.key ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white p-1"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null)
                          setItemToDelete(item)
                        }}
                        className="hover:text-rose-400 p-1 cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#070E1C] border border-rose-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-white">Delete Media Asset</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed font-mono">
              Are you sure you want to permanently delete:
              <br />
              <strong className="text-white block mt-1 break-all">{itemToDelete.key}</strong>
            </p>
            {deleteError && (
              <p className="text-xs font-mono text-rose-300 bg-rose-950/50 border border-rose-500/30 rounded-lg p-2.5">
                {deleteError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null)
                  setItemToDelete(null)
                }}
                className="px-4 py-2 rounded-lg bg-[#0B1528] text-xs text-gray-300 hover:text-white border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-medium disabled:opacity-50 cursor-pointer"
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
