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

const FOLDER_TABS = [
  'all',
  'properties',
  'countries',
  'services',
  'homepage',
  'one-team',
  'collection-media',
  'general',
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [failedPreviewKeys, setFailedPreviewKeys] = useState<Record<string, boolean>>({})

  const fetchMedia = useCallback(async (targetFolder = folder) => {
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
  }, [folder])

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

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return items.filter((item) => {
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
  }, [items, typeFilter, searchTerm])

  return (
    <div className={`space-y-6 ${isModal ? 'p-2' : ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7DD3FC]">
              Asset Management
            </span>
          </div>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            {isModal ? 'Select Media from Library' : 'Media Library & Cloud Storage'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Browse, upload, and organize high-resolution architectural photography and cinematic reels.
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
            onClick={() => setShowUploader(!showUploader)}
            className="px-4 py-2.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(203,213,225,0.15)] transition-all cursor-pointer"
          >
            {showUploader ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showUploader ? 'Close Upload' : 'Upload File'}</span>
          </button>
        </div>
      </div>

      {/* Upload Drawer / Box */}
      {showUploader && (
        <div className="p-6 rounded-xl bg-[#070E1C] border border-[#7DD3FC]/30 shadow-2xl animate-in fade-in space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-mono uppercase tracking-wider text-white">
              Upload New Media File
            </span>
            <button
              type="button"
              onClick={() => setShowUploader(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <MediaUploader
            folder={(folder !== 'all' ? folder : 'general') as any}
            accept="image/*,video/mp4,video/webm,video/quicktime"
            onUploadComplete={() => {
              fetchMedia(folder)
              setShowUploader(false)
            }}
          />
        </div>
      )}

      {/* Folder Tabs + Search & Type Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-[#070E1C] border border-white/10 w-fit max-w-full overflow-x-auto">
          {FOLDER_TABS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFolder(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                folder === f
                  ? 'bg-[#0B1528] text-[#7DD3FC] border border-[#7DD3FC]/30 shadow-sm font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter filename or key..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#070E1C] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC] font-mono w-48 sm:w-56"
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
                    ? 'bg-[#0B1528] text-[#7DD3FC] font-semibold'
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
          <p className="text-xs text-gray-400 font-mono">
            No media objects found in &quot;{folder}&quot;{searchTerm ? ` matching "${searchTerm}"` : ''}. Click &quot;Upload File&quot; to add an asset.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const isVid = isVideoItem(item)
            const displayName = item.filename || item.originalFilename || item.key.split('/').pop() || item.key
            const displayType = item.contentType || item.mimeType || (isVid ? 'video/mp4' : 'image/jpeg')
            const hasPreviewFailed = Boolean(failedPreviewKeys[item.key])

            return (
              <div
                key={item.key}
                className="group relative rounded-xl border border-white/10 hover:border-[#7DD3FC]/40 overflow-hidden bg-[#070E1C] flex flex-col justify-between transition-all"
              >
                {/* Media Preview Aspect Container */}
                <div
                  className="aspect-[4/3] bg-black/60 relative overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => onSelect && onSelect(item.url, item)}
                >
                  {isVid ? (
                    hasPreviewFailed ? (
                      <div className="flex flex-col items-center justify-center text-gray-400 gap-1.5 p-3 text-center">
                        <Film className="w-7 h-7 text-[#7DD3FC]" />
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
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 border border-white/15 text-[9px] font-mono text-[#7DD3FC] flex items-center gap-1">
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
                      <span className="px-3 py-1 rounded bg-[#7DD3FC] text-[#040810] text-xs font-medium">
                        Select Asset
                      </span>
                    </div>
                  )}
                </div>

                {/* Info and Actions */}
                <div className="p-2.5 bg-[#040810] border-t border-white/5 space-y-1.5">
                  <div className="text-[11px] font-mono text-white truncate" title={`${displayName}\nKey: ${item.key}`}>
                    {displayName}
                  </div>
                  <div className="text-[9px] font-mono text-gray-500 truncate" title={item.key}>
                    {item.key}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span className="truncate max-w-[100px]" title={displayType}>{displayType}</span>
                    <span className={item.tracked ? 'text-emerald-400/80' : 'text-amber-300/80'}>
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
                      className="hover:text-[#7DD3FC] p-1 flex items-center gap-1 text-[10px] font-mono cursor-pointer"
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
                className="px-4 py-2 rounded-lg bg-[#0B1528] text-xs text-gray-300 hover:text-white border border-white/10"
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
