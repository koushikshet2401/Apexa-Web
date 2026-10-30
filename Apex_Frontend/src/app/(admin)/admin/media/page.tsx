import React from 'react'
import Link from 'next/link'
import { Image as ImageIcon, ArrowLeft } from 'lucide-react'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminMediaPage() {
  const images = await db.propertyImage.findMany({
    take: 20,
    include: { property: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <Link href="/admin" className="text-gray-400 hover:text-white flex items-center gap-1 text-xs font-mono mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Media & Asset Gallery
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Digital asset management for property architectural galleries and video reels.
          </p>
        </div>
      </div>

      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-gray-300 mb-4">
          <ImageIcon className="w-4 h-4 text-[#7DD3FC]" />
          <span>Active Asset Library ({images.length} property images indexed)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group relative rounded-lg border border-white/10 overflow-hidden bg-[#040810]">
              <div className="aspect-[4/3] bg-black/40 flex items-center justify-center overflow-hidden">
                <img
                  src={img.url}
                  alt={img.alt || 'Property gallery asset'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2.5 text-[11px] font-mono text-gray-400 truncate">
                {img.property.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
