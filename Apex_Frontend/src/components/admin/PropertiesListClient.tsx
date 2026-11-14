'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  CheckCircle2,
  FileEdit,
  Flame,
  Orbit,
  AlertCircle,
  Archive,
  RotateCcw,
  DollarSign,
  Eye,
  EyeOff,
  Award,
  Globe2,
  X,
  User,
  ChevronRight,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { SUPPORTED_CURRENCY_CODES } from '@/config/currencies'

interface PropertyItem {
  id: string
  name: string
  slug: string
  price: string | null
  askingPriceNumeric: string | null
  askingCurrency: string | null
  isPOA: boolean
  cityName: string | null
  locationLine: string | null
  isPublished: boolean
  isDraft: boolean
  isArchived: boolean
  archivedAt: string | null
  archivedReason: string | null
  isPubliclyVisible: boolean
  hasCompletedDeal: boolean
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
  deals: Array<{
    id: string
    dealRef: string
    buyerName: string | null
    buyerContact: string | null
    actualSalePrice: string | null
    saleCurrency: string | null
    status: string
    keepPubliclyVisible: boolean
    closedAt: string | null
    closedBy: { id: string; name: string | null; email: string } | null
  }>
  archivedBy: {
    id: string
    name: string | null
    email: string
  } | null
  _count: {
    images: number
  }
}

interface CountryOption {
  id: string
  name: string
  displayName: string
  slug: string
  region?: string
}

export default function PropertiesListClient({
  initialProperties,
  countries,
}: {
  initialProperties: PropertyItem[]
  countries: CountryOption[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<PropertyItem[]>(initialProperties)

  // Primary Sections: Current Projects | Sold Projects | Deleted Projects
  const [activeTab, setActiveTab] = useState<'current' | 'sold' | 'archived'>(() => {
    const tabParam = searchParams?.get('tab')
    if (tabParam === 'sold' || tabParam === 'archived' || tabParam === 'current') {
      return tabParam
    }
    return 'current'
  })

  useEffect(() => {
    const tabParam = searchParams?.get('tab')
    if (tabParam === 'sold' || tabParam === 'archived' || tabParam === 'current') {
      setActiveTab(tabParam)
    } else if (!tabParam) {
      setActiveTab('current')
    }
  }, [searchParams])

  // Filters
  const [search, setSearch] = useState<string>('')
  const [selectedCountryId, setSelectedCountryId] = useState<string>('all')
  const [showAllCurrent, setShowAllCurrent] = useState<boolean>(false)

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 1. Delete / Archive Modal State
  const [archiveModalItem, setArchiveModalItem] = useState<PropertyItem | null>(null)
  const [archiveReason, setArchiveReason] = useState<string>('')
  const [purgeItem, setPurgeItem] = useState<PropertyItem | null>(null)
  const [purging, setPurging] = useState<boolean>(false)

  // 2. Close Deal Modal State
  const [closeDealItem, setCloseDealItem] = useState<PropertyItem | null>(null)
  const [dealSalePrice, setDealSalePrice] = useState<string>('')
  const [dealCurrency, setDealCurrency] = useState<string>('AED')
  const [dealKeepVisible, setDealKeepVisible] = useState<boolean>(true) // Option A default
  const [dealBuyerName, setDealBuyerName] = useState<string>('')
  const [dealBuyerContact, setDealBuyerContact] = useState<string>('')
  const [dealNotes, setDealNotes] = useState<string>('')
  const [dealLoading, setDealLoading] = useState<boolean>(false)

  // Categorize Properties
  const currentProjects = properties.filter((p) => !p.isArchived && p.deals.length === 0)
  const soldProjects = properties.filter((p) => !p.isArchived && p.deals.length > 0)
  const archivedProjects = properties.filter((p) => p.isArchived)

  // Filter based on active tab, search, and country
  const displayedProperties = properties.filter((p) => {
    if (activeTab === 'current') {
      if (p.isArchived || p.deals.length > 0) return false
    } else if (activeTab === 'sold') {
      if (p.isArchived || p.deals.length === 0) return false
    } else if (activeTab === 'archived') {
      if (!p.isArchived) return false
    }

    if (selectedCountryId !== 'all' && p.country?.id !== selectedCountryId) {
      return false
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      const deal = p.deals[0]
      const matchName = p.name.toLowerCase().includes(q)
      const matchSlug = p.slug.toLowerCase().includes(q)
      const matchCountry = (p.country?.displayName || p.country?.name || '').toLowerCase().includes(q)
      const matchCity = (p.cityName || '').toLowerCase().includes(q)
      const matchBuyer = (deal?.buyerName || '').toLowerCase().includes(q)
      return matchName || matchSlug || matchCountry || matchCity || matchBuyer
    }

    return true
  })

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Toggle Publish / Draft
  const handleTogglePublish = async (prop: PropertyItem) => {
    const isCurrentlyPublished = prop.isPublished
    const endpoint = isCurrentlyPublished ? 'unpublish' : 'publish'
    setActionLoadingId(prop.id)

    try {
      const res = await fetch(`/api/admin/properties/${prop.id}/${endpoint}`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        setProperties((prev) =>
          prev.map((item) => {
            if (item.id === prop.id) {
              return {
                ...item,
                isPublished: !isCurrentlyPublished,
                isDraft: isCurrentlyPublished,
                isPubliclyVisible: !isCurrentlyPublished,
                ...(isCurrentlyPublished ? { isFeaturedLaunch: false, launchOrder: null } : {}),
              }
            }
            if (Array.isArray(data.updatedLaunches)) {
              const matched = data.updatedLaunches.find((ul: any) => ul.id === item.id)
              if (matched) {
                return {
                  ...item,
                  isFeaturedLaunch: true,
                  launchOrder: matched.launchOrder,
                }
              } else if (item.isFeaturedLaunch) {
                return {
                  ...item,
                  isFeaturedLaunch: false,
                  launchOrder: null,
                }
              }
            }
            return item
          })
        )
        router.refresh()
        showToast(
          'success',
          `Project "${prop.name}" is now ${isCurrentlyPublished ? 'Draft' : 'Published'}.`
        )
      } else {
        showToast('error', data.error || data.message || 'Action failed')
      }
    } catch {
      showToast('error', 'Network error updating project status')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Delete / Archive Confirmation
  const handleArchiveConfirm = async () => {
    if (!archiveModalItem) return
    if (!archiveReason.trim()) {
      showToast('error', 'A deletion reason is required to archive this project.')
      return
    }

    setActionLoadingId(archiveModalItem.id)

    try {
      const res = await fetch(`/api/admin/properties/${archiveModalItem.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: archiveReason.trim() }),
      })
      const data = await res.json()

      if (res.ok) {
        setProperties((prev) =>
          prev.map((item) => {
            if (item.id === archiveModalItem.id) {
              return {
                ...item,
                isArchived: true,
                isPublished: false,
                isPubliclyVisible: false,
                isFeaturedLaunch: false,
                launchOrder: null,
                archivedAt: new Date().toISOString(),
                archivedReason: archiveReason.trim(),
              }
            }
            if (Array.isArray(data.updatedLaunches)) {
              const matched = data.updatedLaunches.find((ul: any) => ul.id === item.id)
              if (matched) {
                return {
                  ...item,
                  isFeaturedLaunch: true,
                  launchOrder: matched.launchOrder,
                }
              } else if (item.isFeaturedLaunch) {
                return {
                  ...item,
                  isFeaturedLaunch: false,
                  launchOrder: null,
                }
              }
            }
            return item
          })
        )
        router.refresh()
        showToast('success', `Project "${archiveModalItem.name}" moved to Deleted Projects.`)
        setArchiveModalItem(null)
        setArchiveReason('')
      } else {
        showToast('error', data.error || data.message || 'Delete action failed')
      }
    } catch {
      showToast('error', 'Network error while deleting project')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Restore Action
  const handleRestore = async (prop: PropertyItem) => {
    setActionLoadingId(prop.id)
    try {
      const res = await fetch(`/api/admin/properties/${prop.id}/restore`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        setProperties((prev) =>
          prev.map((item) =>
            item.id === prop.id
              ? {
                  ...item,
                  isArchived: false,
                  isDraft: false,
                  isPublished: true,
                  isPubliclyVisible: true,
                }
              : item
          )
        )
        showToast('success', `Project "${prop.name}" restored and published to active portfolio.`)
      } else {
        showToast('error', data.error || data.message || 'Restore failed')
      }
    } catch {
      showToast('error', 'Network error while restoring project')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Permanent Purge Action (DB + R2)
  const handlePurge = async () => {
    if (!purgeItem) return
    setPurging(true)
    try {
      const res = await fetch(`/api/admin/properties/${purgeItem.id}?permanent=true`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        setProperties((prev) => prev.filter((item) => item.id !== purgeItem.id))
        showToast(
          'success',
          `Project "${purgeItem.name}" and all associated Cloudflare R2 media files purged permanently.`
        )
        setPurgeItem(null)
      } else {
        showToast('error', data.error || data.message || 'Permanent deletion failed')
      }
    } catch {
      showToast('error', 'Network error while permanently deleting project')
    } finally {
      setPurging(false)
    }
  }

  // Close Deal Action
  const openCloseDealModal = (prop: PropertyItem) => {
    setCloseDealItem(prop)
    setDealSalePrice(prop.askingPriceNumeric ? String(prop.askingPriceNumeric) : '')
    setDealCurrency(prop.askingCurrency || 'AED')
    setDealKeepVisible(true) // Option A default
    setDealBuyerName('')
    setDealBuyerContact('')
    setDealNotes('')
  }

  const handleCloseDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!closeDealItem) return
    if (!dealSalePrice || isNaN(parseFloat(dealSalePrice)) || parseFloat(dealSalePrice) <= 0) {
      showToast('error', 'Please provide a valid sale price greater than zero.')
      return
    }

    try {
      setDealLoading(true)
      const res = await fetch(`/api/admin/properties/${closeDealItem.id}/close-deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualSalePrice: parseFloat(dealSalePrice),
          currency: dealCurrency,
          keepPubliclyVisible: dealKeepVisible,
          buyerName: dealBuyerName.trim(),
          buyerContact: dealBuyerContact.trim(),
          notes: dealNotes.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setProperties((prev) =>
          prev.map((item) =>
            item.id === closeDealItem.id
              ? {
                  ...item,
                  hasCompletedDeal: true,
                  isPublished: dealKeepVisible,
                  isPubliclyVisible: dealKeepVisible,
                  deals: [data.deal],
                }
              : item
          )
        )
        showToast(
          'success',
          `Deal closed successfully! Moved to Soldout Projects (${
            dealKeepVisible ? 'Option A: Public Acquired' : 'Option B: Unlisted Sold'
          }).`
        )
        setCloseDealItem(null)
      } else {
        showToast('error', data.error || 'Failed to close deal.')
      }
    } catch {
      showToast('error', 'Network error while closing deal.')
    } finally {
      setDealLoading(false)
    }
  }

  const getSectionTitle = () => {
    if (activeTab === 'current') return 'Current Projects'
    if (activeTab === 'sold') return 'Soldout Projects'
    return 'Deleted Projects'
  }

  const getSectionDescription = () => {
    if (activeTab === 'current') return 'Active portfolio properties grouped by country.'
    if (activeTab === 'sold') return 'Completed transactions and buyer purchase records.'
    return 'Soft-deleted projects with deletion reasons and restore capability.'
  }

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-white">
            {getSectionTitle()}
          </h1>
          <p className="text-xs text-gray-400 mt-1">{getSectionDescription()}</p>
        </div>

        {activeTab === 'current' && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/admin/launches"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#070E1C] border border-white/15 hover:border-[#7DD3FC]/50 text-xs text-gray-200 hover:text-white transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-[#7DD3FC]" />
              <span>Top 3 Launches</span>
            </Link>
            <Link
              href="/admin/space-in-round"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#070E1C] border border-white/15 hover:border-[#7DD3FC]/50 text-xs text-gray-200 hover:text-white transition-all"
            >
              <Orbit className="w-3.5 h-3.5 text-[#7DD3FC]" />
              <span>Spaces in the Round</span>
            </Link>
            <Link
              href="/admin/properties/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-[#040810] font-bold text-xs transition-all shadow-[0_0_15px_rgba(125,211,252,0.25)]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </Link>
          </div>
        )}
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#070E1C] border border-white/10 rounded-lg p-1">
          <Link
            href="/admin/properties?tab=current"
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
              activeTab === 'current'
                ? 'bg-[#7DD3FC]/15 text-[#7DD3FC] font-semibold border border-[#7DD3FC]/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Current ({currentProjects.length})
          </Link>
          <Link
            href="/admin/properties?tab=sold"
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
              activeTab === 'sold'
                ? 'bg-[#7DD3FC]/15 text-[#7DD3FC] font-semibold border border-[#7DD3FC]/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Soldout ({soldProjects.length})
          </Link>
          <Link
            href="/admin/properties?tab=archived"
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
              activeTab === 'archived'
                ? 'bg-[#7DD3FC]/15 text-[#7DD3FC] font-semibold border border-[#7DD3FC]/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Deleted ({archivedProjects.length})
          </Link>
        </div>

        {/* Country Filter & Search */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCountryId}
            onChange={(e) => {
              setSelectedCountryId(e.target.value)
              if (e.target.value === 'all') setShowAllCurrent(true)
            }}
            className="bg-[#070E1C] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
          >
            <option value="all">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName || c.name}
              </option>
            ))}
          </select>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-[#070E1C] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
            />
          </div>
        </div>
      </div>

      {/* 5 DESTINATION COUNTRY CARDS (Current Projects tab) */}
      {activeTab === 'current' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-gray-400">
                Portfolio Destinations ({countries.length})
              </h2>
            </div>
            {selectedCountryId !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCountryId('all')
                  setShowAllCurrent(false)
                }}
                className="text-xs text-[#7DD3FC] hover:underline flex items-center gap-1 font-mono transition-colors cursor-pointer"
              >
                ← View All Destinations
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {countries.map((c) => {
              const relevantProjects =
                activeTab === 'current' ? currentProjects : activeTab === 'sold' ? soldProjects : archivedProjects
              const countryCount = relevantProjects.filter((p) => p.country?.id === c.id).length
              const soldCount = soldProjects.filter((p) => p.country?.id === c.id).length
              const isSelected = selectedCountryId === c.id

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCountryId(isSelected ? 'all' : c.id)
                    setShowAllCurrent(false)
                  }}
                  className={`text-left p-4 rounded-xl border transition-all duration-200 relative group flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#7DD3FC]/10 border-[#7DD3FC] shadow-[0_0_20px_rgba(125,211,252,0.18)] ring-1 ring-[#7DD3FC]/50'
                      : 'bg-[#070E1C] border-white/10 hover:border-white/25 hover:bg-[#040810]/80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3 w-full">
                    <div
                      className={`p-2 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-[#7DD3FC]/20 text-[#7DD3FC]'
                          : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'
                      }`}
                    >
                      <Globe2 className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                        isSelected
                          ? 'bg-[#7DD3FC]/20 text-[#7DD3FC] border border-[#7DD3FC]/30 font-semibold'
                          : 'bg-white/5 text-gray-400 border border-white/5'
                      }`}
                    >
                      {countryCount} {countryCount === 1 ? 'Project' : 'Projects'}
                      {activeTab === 'current' && soldCount > 0 && ` (${soldCount} Sold)`}
                    </span>
                  </div>

                  <div>
                    <h3
                      className={`font-semibold text-sm font-display tracking-wide ${
                        isSelected ? 'text-[#7DD3FC]' : 'text-white'
                      }`}
                    >
                      {c.displayName || c.name}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">
                      {c.region || 'Portfolio'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                    <span className={isSelected ? 'text-[#7DD3FC] font-semibold' : 'text-gray-500 group-hover:text-gray-300'}>
                      {isSelected ? 'Active Filter' : 'Click to View'}
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected
                          ? 'text-[#7DD3FC] translate-x-0.5'
                          : 'text-gray-500 group-hover:text-gray-300 group-hover:translate-x-0.5'
                      }`}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {displayedProperties.length === 0 ? (
        <div className="py-20 text-center bg-[#070E1C] border border-white/10 rounded-xl space-y-3">
          <Building2 className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No projects found</h3>
          <p className="text-xs text-gray-400">
            {search ? 'No projects match your search criteria.' : 'No projects recorded in this section.'}
          </p>
        </div>
      ) : activeTab === 'current' ? (
        /* CURRENT PROJECTS GROUPED BY COUNTRY */
        selectedCountryId === 'all' && !search && !showAllCurrent ? (
          <div className="py-14 px-6 text-center bg-[#070E1C] border border-white/10 rounded-xl space-y-3">
            <Globe2 className="w-10 h-10 text-[#7DD3FC]/60 mx-auto" />
            <h3 className="text-sm font-semibold text-white">Select a Destination Above</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Click on any of the 5 destination cards above (Dubai / UAE, Thailand, Malaysia, Australia, Georgia) to view and manage its active portfolio properties.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {countries.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCountryId(c.id)
                    setShowAllCurrent(false)
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#7DD3FC]/10 hover:bg-[#7DD3FC]/20 text-[#7DD3FC] text-xs font-mono border border-[#7DD3FC]/30 transition-colors cursor-pointer"
                >
                  {c.displayName || c.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowAllCurrent(true)}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono border border-white/10 transition-colors cursor-pointer"
              >
                View All ({currentProjects.length})
              </button>
            </div>
          </div>
        ) : (
        <div className="space-y-6">
          {countries.map((c) => {
            const countryProjects = displayedProperties.filter((p) => p.country?.id === c.id)
            if (countryProjects.length === 0) return null

            return (
              <div
                key={c.id}
                className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Country Section Header */}
                <div className="px-5 py-3.5 bg-[#040810]/70 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Globe2 className="w-4 h-4 text-[#7DD3FC]" />
                    <h3 className="text-sm font-semibold text-white tracking-wide font-display">
                      {c.displayName || c.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                      {countryProjects.length} {countryProjects.length === 1 ? 'Project' : 'Projects'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-gray-400">{c.region}</span>
                </div>

                {/* Country Projects Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5 bg-[#070E1C]">
                      <tr>
                        <th className="py-3 px-5">Project</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5">Asking Price</th>
                        <th className="py-3 px-5">Badges</th>
                        <th className="py-3 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {countryProjects.map((p) => {
                        const countrySlug = p.country?.slug || 'dubai'
                        const publicUrl = `/collection/${countrySlug}/${p.slug}`
                        return (
                          <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                            {/* Project Name & City */}
                            <td className="py-3.5 px-5">
                              <div className="font-semibold text-white text-sm">{p.name}</div>
                              <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                                {p.locationLine || p.cityName || 'Prime Location'}
                              </div>
                            </td>

                            {/* Status Toggle */}
                            <td className="py-3.5 px-5">
                              <button
                                onClick={() => handleTogglePublish(p)}
                                disabled={actionLoadingId === p.id}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                                  p.isPublished
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
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

                            {/* Asking Price */}
                            <td className="py-3.5 px-5 font-mono">
                              {p.isPOA ? (
                                <span className="text-purple-400 font-semibold text-[11px]">POA</span>
                              ) : p.askingPriceNumeric ? (
                                <div className="text-white text-xs">
                                  <span className="text-[#7DD3FC] font-semibold">{p.askingCurrency}</span>{' '}
                                  {Number(p.askingPriceNumeric).toLocaleString()}
                                </div>
                              ) : (
                                <span className="text-gray-500 text-[11px]">Unpriced</span>
                              )}
                            </td>

                            {/* Badges */}
                            <td className="py-3.5 px-5 space-x-1.5">
                              {p.isFeaturedLaunch && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                  <Flame className="w-3 h-3" /> Launch #{p.launchOrder ?? 1}
                                </span>
                              )}
                              {p.isSpaceInRound && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                                  <Orbit className="w-3 h-3" /> Space in Round
                                </span>
                              )}
                              {!p.isFeaturedLaunch && !p.isSpaceInRound && (
                                <span className="text-gray-500 font-mono">—</span>
                              )}
                            </td>

                            {/* EXACT FOUR ACTIONS: View, Edit, Close Deal, Delete */}
                            <td className="py-3.5 px-5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <Link
                                  href={publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[11px] inline-flex items-center gap-1 transition-colors"
                                  title="View Project on live website"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-[#7DD3FC]" />
                                  <span>View Project</span>
                                </Link>

                                <Link
                                  href={`/admin/properties/${p.id}`}
                                  className="px-2.5 py-1 rounded bg-[#7DD3FC]/10 hover:bg-[#7DD3FC]/20 text-[#7DD3FC] border border-[#7DD3FC]/30 text-[11px] inline-flex items-center gap-1 transition-colors font-medium"
                                  title="Edit Project details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Edit Project</span>
                                </Link>

                                <button
                                  onClick={() => openCloseDealModal(p)}
                                  className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] inline-flex items-center gap-1 transition-colors font-medium cursor-pointer"
                                  title="Close Deal and move to Soldout Project"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Close Deal</span>
                                </button>

                                <button
                                  onClick={() => setArchiveModalItem(p)}
                                  className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Delete Project (moves to Deleted Projects)"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  <span>Delete Project</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
        )
      ) : activeTab === 'sold' ? (
        /* SOLDOUT PROJECTS TABLE */
        <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#040810]/70 text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3 px-5">Project Name</th>
                  <th className="py-3 px-5">Country</th>
                  <th className="py-3 px-5">Buyer Information</th>
                  <th className="py-3 px-5">Sale Price & Currency</th>
                  <th className="py-3 px-5">Deal Information</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayedProperties.map((p) => {
                  const countrySlug = p.country?.slug || 'dubai'
                  const publicUrl = `/collection/${countrySlug}/${p.slug}`
                  const deal = p.deals[0]

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-white text-sm">{p.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">{publicUrl}</div>
                      </td>
                      <td className="py-4 px-5 text-gray-300">
                        {p.country?.displayName || p.country?.name || 'Unassigned'}
                      </td>
                      <td className="py-4 px-5">
                        <div className="text-white font-medium">{deal?.buyerName || 'Private Client'}</div>
                        {deal?.buyerContact && (
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">{deal.buyerContact}</div>
                        )}
                      </td>
                      <td className="py-4 px-5 font-mono">
                        <div className="text-amber-400 font-bold text-xs">
                          {deal?.saleCurrency}{' '}
                          {deal?.actualSalePrice ? Number(deal.actualSalePrice).toLocaleString() : '—'}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="text-[11px] font-mono text-gray-300">Ref: {deal?.dealRef}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {deal?.closedAt ? new Date(deal.closedAt).toLocaleDateString() : '—'}
                        </div>
                        <div className="mt-1">
                          {deal?.keepPubliclyVisible ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <Eye className="w-3 h-3" /> Option A (Visible Acquired)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 text-gray-400 border border-white/10">
                              <EyeOff className="w-3 h-3" /> Option B (Unlisted Sold)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(p)}
                            disabled={actionLoadingId === p.id}
                            className={`px-2 py-1 rounded text-[10px] font-mono inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                              p.isPublished
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                            title="Toggle public website visibility"
                          >
                            {p.isPublished ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-amber-400" />}
                            <span>{p.isPublished ? 'Public' : 'Hidden'}</span>
                          </button>

                          <Link
                            href={`/admin/properties/${p.id}`}
                            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[11px] inline-flex items-center gap-1 transition-colors"
                            title="Edit Project Details"
                          >
                            <Edit2 className="w-3 h-3 text-[#7DD3FC]" />
                            <span>Edit</span>
                          </Link>

                          <Link
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[11px] inline-flex items-center gap-1 transition-colors"
                            title="View on Public Website"
                          >
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                            <span>View</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setArchiveModalItem(p)}
                            className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Delete Project (moves to Deleted Projects)"
                          >
                            <Archive className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DELETED PROJECTS TABLE */
        <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#040810]/70 text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3 px-5">Project Name</th>
                  <th className="py-3 px-5">Country</th>
                  <th className="py-3 px-5">Reason for Deletion</th>
                  <th className="py-3 px-5">Date Deleted</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayedProperties.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 font-semibold text-white text-sm">{p.name}</td>
                      <td className="py-4 px-5 text-gray-300">
                        {p.country?.displayName || p.country?.name || 'Unassigned'}
                      </td>
                      <td className="py-4 px-5 text-rose-300 italic text-xs max-w-sm">
                        &quot;{p.archivedReason || 'Administrative deletion'}&quot;
                      </td>
                      <td className="py-4 px-5 font-mono text-gray-400 text-xs">
                        {p.archivedAt ? new Date(p.archivedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => handleRestore(p)}
                          disabled={actionLoadingId === p.id}
                          className="px-3 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Restore Project (preserves all data, sets as Draft)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => setPurgeItem(p)}
                          disabled={actionLoadingId === p.id}
                          className="px-3 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Permanently Delete and Purge all R2 Media Files"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge R2 & DB</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLOSE DEAL MODAL */}
      {closeDealItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#070E1C] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Close Deal & Mark as Sold</h3>
                  <p className="text-[11px] text-gray-400 truncate max-w-xs">{closeDealItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setCloseDealItem(null)}
                className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseDealSubmit} className="space-y-4 text-xs">
              {/* Financial Sale Details */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-gray-300 block mb-1 font-medium">
                    Actual Sale Price <span className="text-[#7DD3FC]">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={dealSalePrice}
                    onChange={(e) => setDealSalePrice(e.target.value)}
                    required
                    placeholder="e.g. 14500000"
                    className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1 font-medium">Currency</label>
                  <select
                    value={dealCurrency}
                    onChange={(e) => setDealCurrency(e.target.value)}
                    className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                  >
                    {SUPPORTED_CURRENCY_CODES.map((cur) => (
                      <option key={cur} value={cur}>
                        {cur}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buyer Information */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 block mb-1 font-medium">Buyer / Client Name</label>
                  <input
                    type="text"
                    value={dealBuyerName}
                    onChange={(e) => setDealBuyerName(e.target.value)}
                    placeholder="e.g. Al Habtoor Investment Office"
                    className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>
                <div>
                  <label className="text-gray-300 block mb-1 font-medium">Buyer Contact</label>
                  <input
                    type="text"
                    value={dealBuyerContact}
                    onChange={(e) => setDealBuyerContact(e.target.value)}
                    placeholder="e.g. contact@office.ae"
                    className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>
              </div>

              {/* Option A vs Option B Public Visibility */}
              <div className="space-y-2 pt-2">
                <label className="text-gray-300 block font-medium">Website Public Visibility Workflow</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDealKeepVisible(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      dealKeepVisible
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        : 'bg-[#040810] border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-400 mb-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Option A</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight">
                      Keep publicly visible with luxury &quot;Acquired / Sold&quot; showcase badge.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDealKeepVisible(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !dealKeepVisible
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-[#040810] border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-400 mb-1">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Option B</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight">
                      Delist from public website immediately and preserve in Soldout Projects.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-medium">Internal Notes</label>
                <textarea
                  rows={2}
                  value={dealNotes}
                  onChange={(e) => setDealNotes(e.target.value)}
                  placeholder="Legal contract reference, notary details, commission notes..."
                  className="w-full bg-[#040810] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCloseDealItem(null)}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dealLoading}
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#040810] font-bold text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  {dealLoading ? 'Completing Deal...' : 'Complete & Close Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / ARCHIVE MODAL */}
      {archiveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#070E1C] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Delete Project</h3>
                  <p className="text-[11px] text-gray-400">Move project to Deleted Projects</p>
                </div>
              </div>
              <button
                onClick={() => setArchiveModalItem(null)}
                className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">&quot;{archiveModalItem.name}&quot;</span>?
              This will unpublish the project from the public website and move it to Deleted Projects. All records remain recoverable.
            </p>

            <div>
              <label className="text-xs text-gray-300 block mb-1 font-medium">
                Reason for Deletion <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="Required: State why this project is being removed (e.g., Client requested withdrawal, zoning change)..."
                className="w-full bg-[#040810] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-400"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setArchiveModalItem(null)}
                className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!archiveReason.trim() || actionLoadingId === archiveModalItem.id}
                onClick={handleArchiveConfirm}
                className="px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] disabled:opacity-40 cursor-pointer"
              >
                {actionLoadingId === archiveModalItem.id ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT PURGE (DB + R2) MODAL */}
      {purgeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#070E1C] border border-rose-500/30 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-white space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Permanently Delete Project</h3>
                  <p className="text-xs text-rose-300/80">Irreversible Action & R2 Media Cleanup</p>
                </div>
              </div>
              <button
                onClick={() => setPurgeItem(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300">
              <p>
                You are about to permanently purge <strong className="text-white">{purgeItem.name}</strong>.
              </p>
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-200 text-xs space-y-1.5">
                <p className="font-semibold text-rose-100 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" /> Warning: Unrecoverable Storage Purge
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-rose-300">
                  <li>The database record and all related property images will be deleted forever.</li>
                  <li>All associated images, videos, and thumbnails in Cloudflare R2 will be purged immediately to release bucket storage.</li>
                  <li>This project cannot be restored later.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPurgeItem(null)}
                disabled={purging}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurge}
                disabled={purging}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/40 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {purging ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Purging R2 & DB...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Permanent Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
