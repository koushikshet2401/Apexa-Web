import React from 'react'
import Link from 'next/link'
import { Building2, ArrowLeft } from 'lucide-react'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminPropertiesPage() {
  const properties = await db.property.findMany({
    include: { country: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-gray-400 hover:text-white flex items-center gap-1 text-xs font-mono">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Properties Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage luxury residences, villa collections, and development listings.
          </p>
        </div>
      </div>

      <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-gray-300">
            <Building2 className="w-4 h-4 text-[#7DD3FC]" />
            <span>Listing Catalog ({properties.length} items)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#040810]/70 text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5">
              <tr>
                <th className="py-3 px-5">Property Name</th>
                <th className="py-3 px-5">Destination</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Featured</th>
                <th className="py-3 px-5">Space In Round</th>
                <th className="py-3 px-5">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="font-medium text-white">{p.name}</div>
                    <div className="text-[11px] text-gray-400 font-mono">/properties/{p.country?.slug || 'dubai'}/{p.slug}</div>
                  </td>
                  <td className="py-3.5 px-5 text-gray-300">
                    {p.country?.displayName || p.country?.name || 'N/A'}
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                        p.isPublished
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {p.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-gray-400 text-[11px]">
                    {p.isFeaturedLaunch ? '★ Order ' + p.launchOrder : '—'}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-gray-400 text-[11px]">
                    {p.isSpaceInRound ? '● Order ' + p.spaceOrder : '—'}
                  </td>
                  <td className="py-3.5 px-5 text-gray-300 font-mono">
                    {p.price || 'Price on Application'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
