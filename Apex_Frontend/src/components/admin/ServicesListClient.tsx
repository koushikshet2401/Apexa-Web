'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface ServiceItem {
  id: string
  name: string
  slug: string
  subtitle: string | null
  displayOrder: number
  isPublished: boolean
  _count: {
    properties: number
  }
}

export default function ServicesListClient({
  initialServices,
}: {
  initialServices: ServiceItem[]
}) {
  const [services, setServices] = useState<ServiceItem[]>(initialServices)
  const [itemToDelete, setItemToDelete] = useState<ServiceItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/services/${itemToDelete.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setServices(services.filter((s) => s.id !== itemToDelete.id))
        setItemToDelete(null)
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7DD3FC]">
              Architectural Advisory
            </span>
          </div>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Services & Sectors
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure the 4 core pillars of the One Team architectural advisory and landing pages.
          </p>
        </div>

        <Link
          href="/admin/services/new"
          className="px-4 py-2.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(203,213,225,0.15)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden">
        {services.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 font-mono">
            No services configured. Add your first service pillar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#040810]/70 text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3 px-5">Name & Subtitle</th>
                  <th className="py-3 px-5">Slug</th>
                  <th className="py-3 px-5">Order</th>
                  <th className="py-3 px-5">Linked Properties</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-medium text-white text-sm">{s.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{s.subtitle || '—'}</div>
                    </td>
                    <td className="py-4 px-5 font-mono text-[#7DD3FC]">
                      /services/{s.slug}
                    </td>
                    <td className="py-4 px-5 font-mono text-gray-400">
                      {s.displayOrder}
                    </td>
                    <td className="py-4 px-5 font-mono text-gray-300">
                      <span className="px-2 py-0.5 rounded bg-[#040810] border border-white/10">
                        {s._count.properties} linked
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase border ${
                          s.isPublished
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {s.isPublished ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1 whitespace-nowrap">
                      <Link
                        href={`/services/${s.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.04] inline-flex items-center"
                        title="View Live Service Page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/services/${s.id}`}
                        className="p-1.5 rounded-md text-gray-400 hover:text-[#7DD3FC] hover:bg-white/[0.04] inline-flex items-center"
                        title="Edit Service"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setItemToDelete(s)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 inline-flex items-center cursor-pointer"
                        title="Delete Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#070E1C] border border-rose-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-white">Delete Service</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{itemToDelete.name}</strong>?
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
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-medium disabled:opacity-50"
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
