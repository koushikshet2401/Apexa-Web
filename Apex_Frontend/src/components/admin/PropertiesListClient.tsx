'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  FileEdit,
  Flame,
  Orbit,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'

interface PropertyItem {
  id: string
  name: string
  slug: string
  price: string | null
  cityName: string | null
  locationLine: string | null
  isPublished: boolean
  isDraft: boolean
  isFeaturedLaunch: boolean
  launchOrder: number | null
  isSpaceInRound: boolean
  spaceOrder: number | null
  country: {
    id: string
    name: string
    displayName: string
    slug: string
  } | null
  _count: {
    images: number
  }
}

export default function PropertiesListClient({
  initialProperties,
}: {
  initialProperties: PropertyItem[]
}) {
  const router = useRouter()
  const [properties, setProperties] = useState<PropertyItem[]>(initialProperties)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<PropertyItem | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const filtered = properties.filter((p) => {
    if (filter === 'published' && !p.isPublished) return false
    if (filter === 'draft' && !p.isDraft) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.country?.name || '').toLowerCase().includes(q) ||
        (p.cityName || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const counts = {
    all: properties.length,
    published: properties.filter((p) => p.isPublished).length,
    draft: properties.filter((p) => p.isDraft).length,
  }

  const handleTogglePublish = async (prop: PropertyItem) => {
    const nextStatus = !prop.isPublished
    setTogglingId(prop.id)
    try {
      const res = await fetch(`/api/admin/properties/${prop.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextStatus, isDraft: !nextStatus }),
      })
      if (res.ok) {
        setProperties((prev) =>
          prev.map((item) =>
            item.id === prop.id
              ? { ...item, isPublished: nextStatus, isDraft: !nextStatus }
              : item
          )
        )
      }
    } catch (err) {
      console.error('Toggle error:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    setDeletingId(itemToDelete.id)
    try {
      const res = await fetch(`/api/admin/properties/${itemToDelete.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== itemToDelete.id))
        setItemToDelete(null)
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7DD3FC]">
              Portfolio Inventory
            </span>
          </div>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Properties Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Browse, filter, edit, and publish international residences and private villas.
          </p>
        </div>

        <Link
          href="/admin/properties/new"
          className="px-4 py-2.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(203,213,225,0.15)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </Link>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#070E1C] border border-white/10 w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
              filter === 'all'
                ? 'bg-[#0B1528] text-[#7DD3FC] border border-[#7DD3FC]/30 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
              filter === 'published'
                ? 'bg-[#0B1528] text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Published ({counts.published})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
              filter === 'draft'
                ? 'bg-[#0B1528] text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Draft ({counts.draft})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug, country..."
            className="w-full bg-[#070E1C] border border-white/10 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC]"
          />
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-xs text-gray-400 font-mono">
              {properties.length === 0
                ? 'No properties found. Add your first property.'
                : 'No properties match the selected filter criteria.'}
            </p>
            {properties.length === 0 && (
              <Link
                href="/admin/properties/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#CBD5E1] text-[#040810] text-xs font-medium mt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add Property
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#040810]/70 text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3 px-5">Name & Route</th>
                  <th className="py-3 px-5">Country</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Featured Launch</th>
                  <th className="py-3 px-5">Space In Round</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((p) => {
                  const countrySlug = p.country?.slug || 'dubai'
                  const publicUrl = `/collection/${countrySlug}/${p.slug}`

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-medium text-white text-sm">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-gray-400 font-mono">{publicUrl}</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            ({p._count.images} images)
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-gray-300">
                        {p.country?.displayName || p.country?.name || 'Unassigned'}
                      </td>

                      <td className="py-4 px-5">
                        <button
                          onClick={() => handleTogglePublish(p)}
                          disabled={togglingId === p.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                            p.isPublished
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                          title="Click to toggle publish status"
                        >
                          {p.isPublished ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Published</span>
                            </>
                          ) : (
                            <>
                              <FileEdit className="w-3 h-3 text-amber-400" />
                              <span>Draft</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-5">
                        {p.isFeaturedLaunch ? (
                          <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            <Flame className="w-3 h-3" />
                            <span>Order #{p.launchOrder ?? 1}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 font-mono">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {p.isSpaceInRound ? (
                          <span className="inline-flex items-center gap-1 text-xs font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                            <Orbit className="w-3 h-3" />
                            <span>Slot #{p.spaceOrder ?? 1}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 font-mono">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right space-x-1 whitespace-nowrap">
                        <Link
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.04] inline-flex items-center"
                          title="View on Live Site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/properties/${p.id}`}
                          className="p-1.5 rounded-md text-gray-400 hover:text-[#7DD3FC] hover:bg-white/[0.04] inline-flex items-center"
                          title="Edit Property"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setItemToDelete(p)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 inline-flex items-center cursor-pointer"
                          title="Delete Property"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
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
              <h3 className="text-sm font-semibold text-white">Delete Property</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{itemToDelete.name}</strong>?
              This will remove all associated images and data.
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
                disabled={Boolean(deletingId)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-medium disabled:opacity-50"
              >
                {deletingId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
