'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Globe2,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'

interface CountryItem {
  id: string
  name: string
  displayName: string
  slug: string
  region: string
  cities: string
  displayOrder: number
  isPublished: boolean
  _count: {
    properties: number
  }
}

export default function CountriesListClient({
  initialCountries,
}: {
  initialCountries: CountryItem[]
}) {
  const [countries, setCountries] = useState<CountryItem[]>(initialCountries)
  const [itemToDelete, setItemToDelete] = useState<CountryItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    setErrorMsg(null)

    try {
      const res = await fetch(`/api/admin/countries/${itemToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        setCountries(countries.filter((c) => c.id !== itemToDelete.id))
        setItemToDelete(null)
      } else {
        setErrorMsg(data.error || 'Failed to delete country')
      }
    } catch {
      setErrorMsg('Network error deleting country')
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
              Geographic Destinations
            </span>
          </div>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Countries & Destinations
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage global collection portals, background cinematic reels, and assigned properties.
          </p>
        </div>

        <Link
          href="/admin/countries/new"
          className="px-4 py-2.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(203,213,225,0.15)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Country</span>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden">
        {countries.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 font-mono">
            No countries found. Add your first country.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#040810]/70 text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3 px-5">Name & Display</th>
                  <th className="py-3 px-5">Slug</th>
                  <th className="py-3 px-5">Region</th>
                  <th className="py-3 px-5">Order</th>
                  <th className="py-3 px-5">Properties</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {countries.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-medium text-white text-sm">{c.displayName || c.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{c.cities}</div>
                    </td>
                    <td className="py-4 px-5 font-mono text-[#7DD3FC]">
                      /collection/{c.slug}
                    </td>
                    <td className="py-4 px-5 text-gray-300">
                      {c.region}
                    </td>
                    <td className="py-4 px-5 font-mono text-gray-400">
                      {c.displayOrder}
                    </td>
                    <td className="py-4 px-5 font-mono text-gray-300">
                      <span className="px-2 py-0.5 rounded bg-[#040810] border border-white/10">
                        {c._count.properties} items
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase border ${
                          c.isPublished
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {c.isPublished ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-1 whitespace-nowrap">
                      <Link
                        href={`/collection/${c.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.04] inline-flex items-center"
                        title="View Public Collection"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/countries/${c.id}`}
                        className="p-1.5 rounded-md text-gray-400 hover:text-[#7DD3FC] hover:bg-white/[0.04] inline-flex items-center"
                        title="Edit Country"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setErrorMsg(null)
                          setItemToDelete(c)
                        }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 inline-flex items-center cursor-pointer"
                        title="Delete Country"
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

      {/* Delete Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#070E1C] border border-rose-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-white">Delete Country</h3>
            </div>
            {errorMsg ? (
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {errorMsg}
              </div>
            ) : (
              <p className="text-xs text-gray-300 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">{itemToDelete.name}</strong>?
              </p>
            )}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-lg bg-[#0B1528] text-xs text-gray-300 hover:text-white border border-white/10"
              >
                Close
              </button>
              {!errorMsg && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-medium disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
