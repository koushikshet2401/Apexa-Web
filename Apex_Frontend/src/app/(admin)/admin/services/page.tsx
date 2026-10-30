import React from 'react'
import Link from 'next/link'
import { Briefcase, ArrowLeft } from 'lucide-react'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const services = await db.serviceCategory.findMany({
    orderBy: { displayOrder: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <Link href="/admin" className="text-gray-400 hover:text-white flex items-center gap-1 text-xs font-mono mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Services & Sectors
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure the 4 core pillars of the One Team architectural advisory.
          </p>
        </div>
      </div>

      <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-2 text-xs font-mono uppercase text-gray-300">
          <Briefcase className="w-4 h-4 text-[#7DD3FC]" />
          <span>Service Categories ({services.length})</span>
        </div>
        <div className="divide-y divide-white/5">
          {services.map((s) => (
            <div key={s.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div>
                <div className="font-medium text-white text-sm">{s.name}</div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">/services/{s.slug}</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
