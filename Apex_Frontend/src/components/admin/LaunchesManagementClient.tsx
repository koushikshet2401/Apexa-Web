'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Flame,
  Plus,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  Building2,
} from 'lucide-react'

interface LaunchProperty {
  id: string
  name: string
  slug: string
  price: string | null
  launchOrder: number | null
  launchDate: string | null
  isPublished: boolean
  isFeaturedLaunch: boolean
  country: {
    name: string
    displayName: string
    slug: string
  } | null
}

interface AllPropertyCandidate {
  id: string
  name: string
  slug: string
  isFeaturedLaunch: boolean
  country: {
    displayName: string
    slug: string
  } | null
}

export default function LaunchesManagementClient({
  initialLaunches,
  availableCandidates,
}: {
  initialLaunches: LaunchProperty[]
  availableCandidates: AllPropertyCandidate[]
}) {
  const [launches, setLaunches] = useState<LaunchProperty[]>(initialLaunches)
  const [showDrawer, setShowDrawer] = useState(false)
  const [candidates, setCandidates] = useState<AllPropertyCandidate[]>(availableCandidates)
  const [processing, setProcessing] = useState(false)

  // Reorder launches
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= launches.length) return

    const newLaunches = [...launches]
    const temp = newLaunches[index]
    newLaunches[index] = newLaunches[targetIndex]
    newLaunches[targetIndex] = temp

    // Re-assign order 1..N
    const updatedWithOrder = newLaunches.map((item, idx) => ({
      ...item,
      launchOrder: idx + 1,
    }))
    setLaunches(updatedWithOrder)

    // Save order in parallel
    try {
      await Promise.all([
        fetch(`/api/admin/properties/${newLaunches[index].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ launchOrder: index + 1 }),
        }),
        fetch(`/api/admin/properties/${newLaunches[targetIndex].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ launchOrder: targetIndex + 1 }),
        }),
      ])
    } catch (err) {
      console.error('Reorder error:', err)
    }
  }

  const handleToggleLaunch = async (property: LaunchProperty) => {
    const nextStatus = !property.isFeaturedLaunch
    try {
      await fetch(`/api/admin/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeaturedLaunch: nextStatus }),
      })
      if (!nextStatus) {
        setLaunches(launches.filter((l) => l.id !== property.id))
      }
    } catch (err) {
      console.error('Toggle error:', err)
    }
  }

  const handleAddCandidate = async (candidate: AllPropertyCandidate) => {
    setProcessing(true)
    const nextOrder = launches.length + 1
    try {
      const res = await fetch(`/api/admin/properties/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeaturedLaunch: true, launchOrder: nextOrder }),
      })
      const updated = await res.json()
      if (res.ok) {
        setLaunches([...launches, updated])
        setShowDrawer(false)
      }
    } catch (err) {
      console.error('Add launch error:', err)
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
              Curated Showcase
            </span>
          </div>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Latest Launches (Homepage Stack)
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            The top 3 properties ordered by launch sequence appear directly on the homepage cinematic stack.
          </p>
        </div>

        <button
          onClick={() => setShowDrawer(true)}
          className="px-4 py-2.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(203,213,225,0.15)] transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Mark Property as Launch</span>
        </button>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <strong>Homepage Rule:</strong> Only the <strong>top 3 items</strong> in this sequence are displayed in the master pinned scroll stack on the homepage. Use the Up/Down buttons below to prioritize the flagship residences.
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden">
        {launches.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Flame className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-xs text-gray-400 font-mono">
              No properties currently featured in latest launches. Click "Mark Property as Launch" to add one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#040810]/70 text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3 px-5">Priority & Order</th>
                  <th className="py-3 px-5">Property Name</th>
                  <th className="py-3 px-5">Destination</th>
                  <th className="py-3 px-5">Launch Date</th>
                  <th className="py-3 px-5">Visibility</th>
                  <th className="py-3 px-5 text-right">Reorder & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {launches.map((l, idx) => {
                  const isTop3 = idx < 3
                  const countrySlug = l.country?.slug || 'dubai'
                  const publicUrl = `/collection/${countrySlug}/${l.slug}`

                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isTop3 ? 'bg-amber-500/[0.02]' : ''
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-semibold ${
                              isTop3
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-[#040810] text-gray-500 border border-white/10'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          {isTop3 ? (
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              Homepage Hero
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-gray-500">
                              Queue ({idx + 1})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-medium text-white text-sm">{l.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{l.price || 'P.O.A.'}</div>
                      </td>

                      <td className="py-4 px-5 text-gray-300">
                        {l.country?.displayName || l.country?.name || 'N/A'}
                      </td>

                      <td className="py-4 px-5 font-mono text-gray-400">
                        {l.launchDate ? new Date(l.launchDate).toLocaleDateString() : 'Immediate'}
                      </td>

                      <td className="py-4 px-5">
                        <button
                          onClick={() => handleToggleLaunch(l)}
                          className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase border bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/30 transition-all cursor-pointer"
                          title="Click to remove from launches"
                        >
                          Featured (Active)
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
                          disabled={idx === launches.length - 1}
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

      {/* Select Property Drawer Modal */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-white font-medium text-sm">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Select Property for Latest Launches</span>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Select an existing property to designate as a featured launch:
            </p>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {candidates
                .filter((c) => !launches.some((l) => l.id === c.id))
                .map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-3.5 rounded-lg bg-[#040810] border border-white/5 hover:border-amber-400/30 flex items-center justify-between transition-all"
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
                      className="px-3 py-1.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-mono transition-all cursor-pointer"
                    >
                      Feature
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
