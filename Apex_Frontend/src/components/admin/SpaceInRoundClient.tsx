'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Orbit,
  Plus,
  ArrowUp,
  ArrowDown,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react'

interface SpaceProperty {
  id: string
  name: string
  slug: string
  cardLabel: string | null
  spaceOrder: number | null
  isPublished: boolean
  isSpaceInRound: boolean
  country: {
    displayName: string
    slug: string
  } | null
}

interface AllPropertyCandidate {
  id: string
  name: string
  slug: string
  isSpaceInRound: boolean
  country: {
    displayName: string
    slug: string
  } | null
}

export default function SpaceInRoundClient({
  initialItems,
  availableCandidates,
}: {
  initialItems: SpaceProperty[]
  availableCandidates: AllPropertyCandidate[]
}) {
  const [items, setItems] = useState<SpaceProperty[]>(initialItems)
  const [showDrawer, setShowDrawer] = useState(false)
  const [candidates] = useState<AllPropertyCandidate[]>(availableCandidates)
  const [processing, setProcessing] = useState(false)

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[targetIndex]
    newItems[targetIndex] = temp

    const updatedWithOrder = newItems.map((item, idx) => ({
      ...item,
      spaceOrder: idx + 1,
    }))
    setItems(updatedWithOrder)

    try {
      await Promise.all([
        fetch(`/api/admin/properties/${newItems[index].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaceOrder: index + 1 }),
        }),
        fetch(`/api/admin/properties/${newItems[targetIndex].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaceOrder: targetIndex + 1 }),
        }),
      ])
    } catch (err) {
      console.error('Reorder error:', err)
    }
  }

  const handleToggle = async (property: SpaceProperty) => {
    const nextStatus = !property.isSpaceInRound
    try {
      await fetch(`/api/admin/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSpaceInRound: nextStatus }),
      })
      if (!nextStatus) {
        setItems(items.filter((item) => item.id !== property.id))
      }
    } catch (err) {
      console.error('Toggle error:', err)
    }
  }

  const handleAddCandidate = async (candidate: AllPropertyCandidate) => {
    setProcessing(true)
    const nextOrder = items.length + 1
    try {
      const res = await fetch(`/api/admin/properties/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSpaceInRound: true, spaceOrder: nextOrder }),
      })
      const updated = await res.json()
      if (res.ok) {
        setItems([...items, updated])
        setShowDrawer(false)
      }
    } catch (err) {
      console.error('Add space in round error:', err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7DD3FC]">
              Circular Perspective Gallery
            </span>
          </div>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Space in Round Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Curate residences displayed in the circular perspective carousel on the homepage.
          </p>
        </div>

        <button
          onClick={() => setShowDrawer(true)}
          className="px-4 py-2.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(203,213,225,0.15)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Space in Round</span>
        </button>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-200/90 leading-relaxed">
          Properties in this sequence are positioned radially in the homepage 3D/circular perspective stack. Reorder them below using the Up/Down controls to alter carousel sequence.
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Orbit className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-xs text-gray-400 font-mono">
              No properties assigned to Space in Round. Click "Add to Space in Round" to curate items.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#040810]/70 text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3 px-5">Slot Order</th>
                  <th className="py-3 px-5">Property Name</th>
                  <th className="py-3 px-5">Destination</th>
                  <th className="py-3 px-5">Card Label</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Sequence & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item, idx) => {
                  const countrySlug = item.country?.slug || 'dubai'
                  const publicUrl = `/properties/${countrySlug}/${item.slug}`

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5">
                        <span className="w-7 h-7 rounded flex items-center justify-center font-mono text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          Slot #{idx + 1}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-medium text-white text-sm">{item.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">/properties/{countrySlug}/{item.slug}</div>
                      </td>

                      <td className="py-4 px-5 text-gray-300">
                        {item.country?.displayName || 'N/A'}
                      </td>

                      <td className="py-4 px-5 font-mono text-gray-400">
                        {item.cardLabel || '—'}
                      </td>

                      <td className="py-4 px-5">
                        <button
                          onClick={() => handleToggle(item)}
                          className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase border bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/30 transition-all cursor-pointer"
                          title="Click to remove from space in round"
                        >
                          Active in Carousel
                        </button>
                      </td>

                      <td className="py-4 px-5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.04] disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === items.length - 1}
                          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.04] disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <Link
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.04] inline-flex items-center"
                          title="Preview Listing"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Select Modal */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-white font-medium text-sm">
                <Orbit className="w-4 h-4 text-indigo-400" />
                <span>Add Property to Space in Round</span>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {candidates
                .filter((c) => !items.some((i) => i.id === c.id))
                .map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-3.5 rounded-lg bg-[#040810] border border-white/5 hover:border-indigo-400/30 flex items-center justify-between transition-all"
                  >
                    <div>
                      <div className="text-xs font-medium text-white">{candidate.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {candidate.country?.displayName || 'Unassigned'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddCandidate(candidate)}
                      disabled={processing}
                      className="px-3 py-1.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 text-xs font-mono transition-all cursor-pointer"
                    >
                      Add Slot
                    </button>
                  </div>
                ))}
            </div>

            <div className="pt-3 border-t border-white/5 text-right">
              <button
                onClick={() => setShowDrawer(false)}
                className="px-4 py-2 rounded-lg bg-[#0B1528] text-xs text-gray-300 hover:text-white border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
