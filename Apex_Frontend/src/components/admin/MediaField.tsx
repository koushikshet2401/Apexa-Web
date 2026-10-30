'use client'

import React, { useState } from 'react'
import {
  UploadCloud,
  FolderOpen,
  X,
  ExternalLink,
  Film,
  Image as ImageIcon,
} from 'lucide-react'
import MediaUploader from './MediaUploader'
import MediaLibraryClient from './MediaLibraryClient'

interface MediaFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  accept?: 'image/*' | 'video/mp4' | string
  folder?: 'properties' | 'countries' | 'services' | 'homepage' | 'general'
  placeholder?: string
}

export default function MediaField({
  label,
  value,
  onChange,
  accept = 'image/*',
  folder = 'general',
  placeholder = 'https://... or /images/...',
}: MediaFieldProps) {
  const [showUploadInline, setShowUploadInline] = useState(false)
  const [showLibraryModal, setShowLibraryModal] = useState(false)

  const isVideo = accept.includes('video')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-mono text-gray-300">{label}</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowUploadInline(!showUploadInline)
              setShowLibraryModal(false)
            }}
            className="text-[11px] font-mono text-[#7DD3FC] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <UploadCloud className="w-3 h-3" />
            <span>{showUploadInline ? 'Hide Uploader' : 'Upload File'}</span>
          </button>

          <span className="text-gray-600">•</span>

          <button
            type="button"
            onClick={() => {
              setShowLibraryModal(true)
              setShowUploadInline(false)
            }}
            className="text-[11px] font-mono text-gray-300 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <FolderOpen className="w-3 h-3" />
            <span>From Library</span>
          </button>
        </div>
      </div>

      {/* Inline Uploader Box */}
      {showUploadInline && (
        <div className="p-3.5 rounded-lg bg-[#040810] border border-[#7DD3FC]/30 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>Direct Upload to Cloud Storage</span>
            <button
              type="button"
              onClick={() => setShowUploadInline(false)}
              className="text-gray-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <MediaUploader
            accept={accept}
            folder={folder}
            onUploadComplete={(url) => {
              onChange(url)
              setShowUploadInline(false)
            }}
          />
        </div>
      )}

      {/* Main Input Row with Preview */}
      <div className="flex items-center gap-2">
        {/* Preview Thumbnail */}
        {value ? (
          <div className="relative w-10 h-10 rounded-lg border border-white/10 overflow-hidden bg-black shrink-0 flex items-center justify-center group">
            {isVideo ? (
              <Film className="w-5 h-5 text-[#7DD3FC]" />
            ) : (
              <img
                src={value}
                alt="Asset preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image path is broken
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            )}
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
              title="Open asset"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg border border-white/10 bg-[#040810] shrink-0 flex items-center justify-center text-gray-600">
            {isVideo ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
          </div>
        )}

        {/* Manual URL Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC] font-mono"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modal Media Library Selector */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 max-w-5xl w-full max-h-[85vh] flex flex-col justify-between shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-white">
                Choose Media for: {label}
              </span>
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <MediaLibraryClient
                isModal={true}
                onSelect={(url) => {
                  onChange(url)
                  setShowLibraryModal(false)
                }}
              />
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLibraryModal(false)}
                className="px-4 py-2 rounded-lg bg-[#0B1528] text-xs text-gray-300 hover:text-white border border-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
