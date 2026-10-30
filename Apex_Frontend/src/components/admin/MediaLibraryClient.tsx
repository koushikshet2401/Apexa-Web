'use client'

import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import MediaUploader from './MediaUploader'

interface MediaItem {
  key: string
  url: string
  size: number
  lastModified: string
  contentType: string
}

interface MediaLibraryClientProps {
  onSelect?: (url: string) => void
  isModal?: boolean
  onClose?: () => void
}

export default function MediaLibraryClient({
  onSelect,
  isModal = false,
  onClose,
}: MediaLibraryClientProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [folder, setFolder] = useState<string>('all')
  const [loading, setLoading] = useState<boolean>(true)
  const [showUploader, setShowUploader] = useState<boolean>(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)

  const fetchMedia = async (targetFolder = folder) => {
    setLoading(true)
    try {
      const q = targetFolder !== 'all' ? `?folder=${targetFolder}` : ''
      const res = await fetch(`/api/admin/media${q}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (err) {
      console.error('Error fetching media:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedia(folder)
  }, [folder])

  const handleCopyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/media/${encodeURIComponent(itemToDelete.key)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setItems(items.filter((i) => i.key !== itemToDelete.key))
        setItemToDelete(null)
      }
    } catch (err) {
      console.error('Error deleting media:', err)
    } finally {
      setDeleting(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

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
            onClick={() => fetchMedia(folder)}
            className="p-2 rounded-lg bg-[#070E1C] border border-white/10 text-gray-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
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
              onClick={() => setShowUploader(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <MediaUploader
            folder={(folder !== 'all' ? folder : 'general') as any}
            accept="image/*,video/mp4"
            onUploadComplete={() => {
              fetchMedia(folder)
              setShowUploader(false)
            }}
          />
        </div>
      )}

      {/* Folder Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#070E1C] border border-white/10 w-fit overflow-x-auto">
        {['all', 'properties', 'countries', 'services', 'homepage', 'general'].map((f) => (
          <button
            key={f}
            onClick={() => setFolder(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
              folder === f
                ? 'bg-[#0B1528] text-[#7DD3FC] border border-[#7DD3FC]/30 shadow-sm font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid of Media */}
      {loading ? (
        <div className="p-16 text-center text-xs font-mono text-gray-500">
          Loading library assets...
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-white/10 rounded-xl space-y-3">
          <Folder className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-xs text-gray-400 font-mono">
            No media objects found in &quot;{folder}&quot;. Click &quot;Upload File&quot; to add your first asset.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => {
            const isVid = item.contentType.includes('video') || item.key.endsWith('.mp4')

            return (
              <div
                key={item.key}
                className="group relative rounded-xl border border-white/10 hover:border-[#7DD3FC]/40 overflow-hidden bg-[#070E1C] flex flex-col justify-between transition-all"
              >
                {/* Media Preview Aspect Container */}
                <div
                  className="aspect-[4/3] bg-black/60 relative overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => onSelect && onSelect(item.url)}
                >
                  {isVid ? (
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-1.5 p-3 text-center">
                      <Film className="w-7 h-7 text-[#7DD3FC]" />
                      <span className="text-[10px] font-mono text-gray-400 truncate max-w-[120px]">
                        {item.key.split('/').pop()}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.key}
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
                  <div className="text-[11px] font-mono text-white truncate" title={item.key}>
                    {item.key.split('/').pop()}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                    <span>{formatSize(item.size)}</span>
                    <span>{new Date(item.lastModified).toLocaleDateString()}</span>
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
                        onClick={() => setItemToDelete(item)}
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
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
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
