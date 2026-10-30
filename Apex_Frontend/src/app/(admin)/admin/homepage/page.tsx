import React from 'react'
import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminHomepageContentPage() {
  const content = await db.homepageContent.findFirst()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <Link href="/admin" className="text-gray-400 hover:text-white flex items-center gap-1 text-xs font-mono mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Homepage Content & Media
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure hero videos, brand narrative headlines, and film streams.
          </p>
        </div>
      </div>

      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-gray-300 mb-2">
          <Home className="w-4 h-4 text-[#7DD3FC]" />
          <span>Active Configuration</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded bg-[#040810] border border-white/5 space-y-1">
            <span className="text-gray-500 block">Unveil Heading:</span>
            <span className="text-white block font-sans">{content?.unveilHeading || 'Elevating Global Horizons'}</span>
          </div>
          <div className="p-4 rounded bg-[#040810] border border-white/5 space-y-1">
            <span className="text-gray-500 block">Hero Video URL:</span>
            <span className="text-[#7DD3FC] block truncate">{content?.heroVideoUrl || '/videos/hero-unveil.mp4'}</span>
          </div>
          <div className="p-4 rounded bg-[#040810] border border-white/5 space-y-1">
            <span className="text-gray-500 block">One Team Video:</span>
            <span className="text-[#7DD3FC] block truncate">{content?.oneTeamVideoUrl || '/videos/one-team.mp4'}</span>
          </div>
          <div className="p-4 rounded bg-[#040810] border border-white/5 space-y-1">
            <span className="text-gray-500 block">Advisory Video:</span>
            <span className="text-[#7DD3FC] block truncate">{content?.advisoryVideoUrl || '/videos/advisory.mp4'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
