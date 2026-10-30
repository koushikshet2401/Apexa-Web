import React from 'react'
import Link from 'next/link'
import { Flame, ArrowLeft } from 'lucide-react'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminLaunchesPage() {
  const featured = await db.property.findMany({
    where: { isFeaturedLaunch: true },
    include: { country: true },
    orderBy: { launchOrder: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <Link href="/admin" className="text-gray-400 hover:text-white flex items-center gap-1 text-xs font-mono mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Latest Launches (Homepage Stack)
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Top 3 flagship properties featured in the hero launches stack.
          </p>
        </div>
      </div>

      <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-2 text-xs font-mono uppercase text-gray-300">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Active Flagships ({featured.length})</span>
        </div>
        <div className="divide-y divide-white/5">
          {featured.map((p, idx) => (
            <div key={p.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <span className="w-7 h-7 rounded bg-[#040810] border border-white/10 flex items-center justify-center font-mono text-xs text-[#7DD3FC]">
                  #{idx + 1}
                </span>
                <div>
                  <div className="font-medium text-white text-sm">{p.name}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{p.locationLine} • {p.price}</div>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Order {p.launchOrder ?? idx + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
