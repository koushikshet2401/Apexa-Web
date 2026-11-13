'use client'

import React from 'react'
import { X } from 'lucide-react'
import MediaLibraryClient, { MediaItem } from './MediaLibraryClient'

interface MediaLibraryModalProps {
  open: boolean
  title: string
  initialFolder?: string
  acceptFilter?: 'all' | 'image' | 'video'
  onSelect: (url: string, item?: MediaItem) => void
  onClose: () => void
}

export default function MediaLibraryModal({
  open,
  title,
  initialFolder = 'all',
  acceptFilter = 'all',
  onSelect,
  onClose,
}: MediaLibraryModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 max-w-5xl w-full max-h-[85vh] flex flex-col justify-between shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <span className="text-xs font-mono uppercase tracking-wider text-white">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <MediaLibraryClient
            isModal={true}
            initialFolder={initialFolder}
            acceptFilter={acceptFilter}
            onSelect={(url, item) => {
              onSelect(url, item)
              onClose()
            }}
          />
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0B1528] text-xs text-gray-300 hover:text-white border border-white/10 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
