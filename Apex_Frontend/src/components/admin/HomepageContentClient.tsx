'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Home, Save, CheckCircle2, AlertCircle, ExternalLink, X, Film } from 'lucide-react'

interface HomepageContentData {
  id?: string
  heroVideoUrl: string | null
  heroVideoThumb: string | null
  unveilHeading: string | null
  unveilSubtext: string | null
  oneTeamVideoUrl: string | null
  advisoryVideoUrl: string | null
}

export default function HomepageContentClient({
  initialContent,
}: {
  initialContent: HomepageContentData
}) {
  const [heroVideoUrl, setHeroVideoUrl] = useState(initialContent?.heroVideoUrl || '')
  const [heroVideoThumb, setHeroVideoThumb] = useState(initialContent?.heroVideoThumb || '')
  const [unveilHeading, setUnveilHeading] = useState(initialContent?.unveilHeading || '')
  const [unveilSubtext, setUnveilSubtext] = useState(initialContent?.unveilSubtext || '')
  const [oneTeamVideoUrl, setOneTeamVideoUrl] = useState(initialContent?.oneTeamVideoUrl || '')
  const [advisoryVideoUrl, setAdvisoryVideoUrl] = useState(initialContent?.advisoryVideoUrl || '')

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setToast(null)

    const payload = {
      heroVideoUrl,
      heroVideoThumb,
      unveilHeading,
      unveilSubtext,
      oneTeamVideoUrl,
      advisoryVideoUrl,
    }

    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setToast({ type: 'success', message: 'Homepage content updated successfully!' })
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to update homepage content' })
      }
    } catch {
      setToast({ type: 'error', message: 'Network error saving homepage content' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7DD3FC]">
              Flagship Experience
            </span>
          </div>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Homepage Content & Media
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Curate hero cinematic video reels, headlines, and advisory film assets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-lg bg-[#070E1C] border border-white/10 hover:border-white/20 text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <span>View Homepage</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(203,213,225,0.15)] disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hero Video & Unveil Narrative */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#7DD3FC]">
            <Film className="w-4 h-4" />
            <span>1. Hero Unveil Section</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Hero Video Stream URL
              </label>
              <input
                type="text"
                value={heroVideoUrl}
                onChange={(e) => setHeroVideoUrl(e.target.value)}
                placeholder="/videos/hero-unveil.mp4"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Hero Poster / Thumbnail URL
              </label>
              <input
                type="text"
                value={heroVideoThumb}
                onChange={(e) => setHeroVideoThumb(e.target.value)}
                placeholder="/images/hero-thumb.jpg"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Unveil Narrative Headline
              </label>
              <input
                type="text"
                value={unveilHeading}
                onChange={(e) => setUnveilHeading(e.target.value)}
                placeholder="Elevating Global Horizons"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Unveil Subtext Paragraph
              </label>
              <textarea
                rows={2}
                value={unveilSubtext}
                onChange={(e) => setUnveilSubtext(e.target.value)}
                placeholder="A curated portfolio of ultra-prime residences across the world's most dynamic markets."
                className="w-full bg-[#040810] border border-white/10 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
          </div>
        </div>

        {/* Section Media Reels */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#7DD3FC]">
            <Film className="w-4 h-4" />
            <span>2. Advisory & One Team Film Reels</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                One Team Video URL
              </label>
              <input
                type="text"
                value={oneTeamVideoUrl}
                onChange={(e) => setOneTeamVideoUrl(e.target.value)}
                placeholder="/videos/one-team.mp4"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1.5">
                Private Advisory Video URL
              </label>
              <input
                type="text"
                value={advisoryVideoUrl}
                onChange={(e) => setAdvisoryVideoUrl(e.target.value)}
                placeholder="/videos/advisory.mp4"
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgba(203,213,225,0.2)] disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
