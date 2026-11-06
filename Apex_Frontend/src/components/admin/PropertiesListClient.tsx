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
  CheckCircle2,
  FileEdit,
  Flame,
  Orbit,
  AlertCircle,
  Archive,
  RotateCcw,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Award,
  Filter,
} from 'lucide-react'

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
    actualSalePrice: string | null
    saleCurrency: string | null
    status: string
    keepPubliclyVisible: boolean
    closedAt: string | null
    closedBy: { id: string; name: string | null; email: string } | null
    adjustments: Array<{
      adjustmentSequence: number
      previousSalePrice: string
      previousCurrency: string
      adjustedSalePrice: string
      adjustedCurrency: string
    }>
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
}

const SUPPORTED_CURRENCIES = [
  'AED', 'USD', 'EUR', 'GBP', 'INR', 'THB', 'MYR', 'AUD', 'GEL', 'SGD', 'CHF', 'CAD', 'JPY'
]

const ITEMS_PER_PAGE = 10

export default function PropertiesListClient({
  initialProperties,
  countries,
}: {
  initialProperties: PropertyItem[]
  countries: CountryOption[]
}) {
  const router = useRouter()
  const [properties, setProperties] = useState<PropertyItem[]>(initialProperties)

  // Primary Sections: Current Projects | Sold Projects | Archived Projects
  const [activeTab, setActiveTab] = useState<'current' | 'sold' | 'archived'>('current')

  // Sub-filters for Current Projects
  const [currentSubFilter, setCurrentSubFilter] = useState<'all' | 'published' | 'draft'>('all')

  // Sub-filters for Sold Projects
  const [soldSubFilter, setSoldSubFilter] = useState<'all' | 'visible' | 'hidden'>('all')

  // Country filter & search query
  const [selectedCountryId, setSelectedCountryId] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [archiveModalItem, setArchiveModalItem] = useState<PropertyItem | null>(null)
  const [archiveReason, setArchiveReason] = useState<string>('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Reprice modal state
  const [repriceItem, setRepriceItem] = useState<PropertyItem | null>(null)
  const [repriceState, setRepriceState] = useState<'PRICED' | 'POA' | 'UNPRICED'>('PRICED')
  const [repriceAmount, setRepriceAmount] = useState<string>('')
  const [repriceCurrency, setRepriceCurrency] = useState<string>('AED')
  const [repriceReason, setRepriceReason] = useState<string>('')
  const [repriceLoading, setRepriceLoading] = useState<boolean>(false)

  // Categorize Properties
  const currentProjects = properties.filter((p) => !p.isArchived && p.deals.length === 0)
  const soldProjects = properties.filter((p) => !p.isArchived && p.deals.length > 0)
  const archivedProjects = properties.filter((p) => p.isArchived)

  // Filter based on active tab and search
  const displayedProperties = properties.filter((p) => {
    // 1. Tab partitioning
    if (activeTab === 'current') {
      if (p.isArchived || p.deals.length > 0) return false
      if (currentSubFilter === 'published' && !p.isPublished) return false
      if (currentSubFilter === 'draft' && !p.isDraft) return false
    } else if (activeTab === 'sold') {
      if (p.isArchived || p.deals.length === 0) return false
      const deal = p.deals[0]
      if (soldSubFilter === 'visible' && !deal?.keepPubliclyVisible) return false
      if (soldSubFilter === 'hidden' && deal?.keepPubliclyVisible) return false
    } else if (activeTab === 'archived') {
      if (!p.isArchived) return false
    }

    // 2. Country filter
    if (selectedCountryId !== 'all' && p.country?.id !== selectedCountryId) {
      return false
    }

    // 3. Search filter
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

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(displayedProperties.length / ITEMS_PER_PAGE))
  const paginatedProperties = displayedProperties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // 1. Publish / Unpublish Action
  const handleTogglePublish = async (prop: PropertyItem) => {
    setActionLoadingId(prop.id)
    const isPublishing = !prop.isPublished
    const endpoint = isPublishing
      ? `/api/admin/properties/${prop.id}/publish`
      : `/api/admin/properties/${prop.id}/unpublish`

    try {
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setProperties((prev) =>
          prev.map((item) =>
            item.id === prop.id
              ? {
                  ...item,
                  isPublished: isPublishing,
                  isDraft: !isPublishing,
                  isPubliclyVisible: isPublishing,
                }
              : item
          )
        )
        showToast('success', `Project successfully ${isPublishing ? 'published' : 'unpublished'}.`)
      } else {
        showToast('error', data.error || data.message || 'Action failed')
      }
    } catch {
      showToast('error', 'Network error during publish toggle')
    } finally {
      setActionLoadingId(null)
    }
  }

  // 2. Archive Action
  const handleArchiveConfirm = async () => {
    if (!archiveModalItem) return
    setActionLoadingId(archiveModalItem.id)

    try {
      const res = await fetch(`/api/admin/properties/${archiveModalItem.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: archiveReason.trim() || 'Administrative archive' }),
      })
      const data = await res.json()

      if (res.ok) {
        setProperties((prev) =>
          prev.map((item) =>
            item.id === archiveModalItem.id
              ? {
                  ...item,
                  isArchived: true,
                  isPublished: false,
                  isPubliclyVisible: false,
                  archivedAt: new Date().toISOString(),
                  archivedReason: archiveReason.trim() || 'Administrative archive',
                }
              : item
          )
        )
        showToast('success', `Project moved to Deleted / Archived Projects.`)
        setArchiveModalItem(null)
        setArchiveReason('')
      } else {
        showToast('error', data.error || data.message || 'Archive failed')
      }
    } catch {
      showToast('error', 'Network error while archiving project')
    } finally {
      setActionLoadingId(null)
    }
  }

  // 3. Restore Action
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
                  isDraft: true,
                  isPublished: false,
                  isPubliclyVisible: false,
                }
              : item
          )
        )
        showToast('success', `Project restored to Draft state.`)
      } else {
        showToast('error', data.error || data.message || 'Restore failed')
      }
    } catch {
      showToast('error', 'Network error while restoring project')
    } finally {
      setActionLoadingId(null)
    }
  }

  // 4. Financial Repricing Action
  const openRepriceModal = (prop: PropertyItem) => {
    setRepriceItem(prop)
    if (prop.isPOA) {
      setRepriceState('POA')
      setRepriceAmount('')
      setRepriceCurrency(prop.askingCurrency || 'AED')
    } else if (prop.askingPriceNumeric) {
      setRepriceState('PRICED')
      setRepriceAmount(prop.askingPriceNumeric)
      setRepriceCurrency(prop.askingCurrency || 'AED')
    } else {
      setRepriceState('UNPRICED')
      setRepriceAmount('')
      setRepriceCurrency(prop.askingCurrency || 'AED')
    }
    setRepriceReason('')
  }

  const handleRepriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repriceItem) return
    setRepriceLoading(true)

    let payload: any = { pricingState: repriceState, reason: repriceReason.trim() || 'Executive repricing' }
    if (repriceState === 'PRICED') {
      const num = parseFloat(repriceAmount)
      if (isNaN(num) || num <= 0) {
        showToast('error', 'Please enter a valid positive numeric amount')
        setRepriceLoading(false)
        return
      }
      payload.askingPriceNumeric = num
      payload.askingCurrency = repriceCurrency
    }

    try {
      const res = await fetch(`/api/admin/properties/${repriceItem.id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok) {
        setProperties((prev) =>
          prev.map((item) =>
            item.id === repriceItem.id
              ? {
                  ...item,
                  isPOA: repriceState === 'POA',
                  askingPriceNumeric: repriceState === 'PRICED' ? repriceAmount : null,
                  askingCurrency: repriceState === 'PRICED' ? repriceCurrency : null,
                  price:
                    repriceState === 'POA'
                      ? 'Price on Application'
                      : repriceState === 'PRICED'
                      ? `${repriceCurrency} ${Number(repriceAmount).toLocaleString()}`
                      : null,
                }
              : item
          )
        )
        showToast('success', `Project repriced successfully!`)
        setRepriceItem(null)
      } else {
        showToast('error', data.error || data.message || 'Repricing failed')
      }
    } catch {
      showToast('error', 'Network error during repricing')
    } finally {
      setRepriceLoading(false)
    }
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-mono flex items-center gap-2 border ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/30'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#0284C7] dark:text-[#7DD3FC]">
              Portfolio Inventory
            </span>
          </div>
          <h1 className="text-2xl font-display font-medium text-slate-900 dark:text-white tracking-wide">
            Projects Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Browse active residences, review completed sales & visibility, manage recoverable archives.
          </p>
        </div>

        <Link
          href="/admin/properties/new"
          className="px-4 py-2.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-medium tracking-wide flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </Link>
      </div>

      {/* SECTION TABS (Section 1.B, 1.C, 1.D) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-1">
        <button
          onClick={() => {
            setActiveTab('current')
            setCurrentPage(1)
          }}
          className={`px-4 py-2 text-xs font-semibold tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'current'
              ? 'border-[#0284C7] dark:border-[#7DD3FC] text-[#0284C7] dark:text-[#7DD3FC]'
              : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Current Projects ({currentProjects.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('sold')
            setCurrentPage(1)
          }}
          className={`px-4 py-2 text-xs font-semibold tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sold'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Sold Projects ({soldProjects.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('archived')
            setCurrentPage(1)
          }}
          className={`px-4 py-2 text-xs font-semibold tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'archived'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Deleted / Archived ({archivedProjects.length})</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sub-Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 w-fit">
          {activeTab === 'current' && (
            <>
              <button
                onClick={() => {
                  setCurrentSubFilter('all')
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                  currentSubFilter === 'all'
                    ? 'bg-white dark:bg-[#0B1528] text-[#0284C7] dark:text-[#7DD3FC] shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                All Active ({currentProjects.length})
              </button>
              <button
                onClick={() => {
                  setCurrentSubFilter('published')
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                  currentSubFilter === 'published'
                    ? 'bg-white dark:bg-[#0B1528] text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Published ({currentProjects.filter((p) => p.isPublished).length})
              </button>
              <button
                onClick={() => {
                  setCurrentSubFilter('draft')
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                  currentSubFilter === 'draft'
                    ? 'bg-white dark:bg-[#0B1528] text-amber-600 dark:text-amber-400 shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Draft ({currentProjects.filter((p) => p.isDraft).length})
              </button>
            </>
          )}

          {activeTab === 'sold' && (
            <>
              <button
                onClick={() => {
                  setSoldSubFilter('all')
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                  soldSubFilter === 'all'
                    ? 'bg-white dark:bg-[#0B1528] text-amber-600 dark:text-amber-400 shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                All Sold ({soldProjects.length})
              </button>
              <button
                onClick={() => {
                  setSoldSubFilter('visible')
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                  soldSubFilter === 'visible'
                    ? 'bg-white dark:bg-[#0B1528] text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Option A: Visible Acquired ({soldProjects.filter((p) => p.deals[0]?.keepPubliclyVisible).length})
              </button>
              <button
                onClick={() => {
                  setSoldSubFilter('hidden')
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
                  soldSubFilter === 'hidden'
                    ? 'bg-white dark:bg-[#0B1528] text-slate-800 dark:text-slate-300 shadow-sm font-semibold'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Option B: Unlisted ({soldProjects.filter((p) => !p.deals[0]?.keepPubliclyVisible).length})
              </button>
            </>
          )}

          {activeTab === 'archived' && (
            <span className="px-3 py-1.5 text-xs font-mono text-rose-600 dark:text-rose-400 font-semibold">
              Recoverable Archives ({archivedProjects.length})
            </span>
          )}
        </div>

        {/* Country Filter & Search Input */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCountryId}
            onChange={(e) => {
              setSelectedCountryId(e.target.value)
              setCurrentPage(1)
            }}
            aria-label="Filter by destination country"
            className="bg-white dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-[#7DD3FC]"
          >
            <option value="all">All Destinations</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName || c.name}
              </option>
            ))}
          </select>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search projects, buyers..."
              className="w-full bg-white dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#7DD3FC]"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        {paginatedProperties.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-gray-400 font-mono">
              No projects found matching the selected criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#040810]/70 text-slate-500 dark:text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-white/5">
                <tr>
                  <th className="py-3 px-5">Project & Route</th>
                  <th className="py-3 px-5">Destination</th>
                  {activeTab === 'current' && (
                    <>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5">Asking Price</th>
                      <th className="py-3 px-5">Curations</th>
                    </>
                  )}
                  {activeTab === 'sold' && (
                    <>
                      <th className="py-3 px-5">Sale Price & Currency</th>
                      <th className="py-3 px-5">Buyer / Client</th>
                      <th className="py-3 px-5">Closure Date</th>
                      <th className="py-3 px-5">Public Visibility</th>
                    </>
                  )}
                  {activeTab === 'archived' && (
                    <>
                      <th className="py-3 px-5">Archived On</th>
                      <th className="py-3 px-5">Archived By</th>
                      <th className="py-3 px-5">Reason</th>
                    </>
                  )}
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {paginatedProperties.map((p) => {
                  const countrySlug = p.country?.slug || 'dubai'
                  const publicUrl = `/collection/${countrySlug}/${p.slug}`
                  const deal = p.deals[0]
                  const adj = deal?.adjustments[0]

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      {/* Name & Route */}
                      <td className="py-4 px-5">
                        <div className="font-medium text-slate-900 dark:text-white text-sm">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 dark:text-gray-400 font-mono">{publicUrl}</span>
                          <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">
                            ({p._count.images} images)
                          </span>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="py-4 px-5 text-slate-600 dark:text-gray-300">
                        {p.country?.displayName || p.country?.name || 'Unassigned'}
                      </td>

                      {/* CURRENT TAB SPECIFIC COLUMNS */}
                      {activeTab === 'current' && (
                        <>
                          <td className="py-4 px-5">
                            <button
                              onClick={() => handleTogglePublish(p)}
                              disabled={actionLoadingId === p.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                                p.isPublished
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                              }`}
                              title="Click to toggle publish status"
                            >
                              {p.isPublished ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  <span>Published</span>
                                </>
                              ) : (
                                <>
                                  <FileEdit className="w-3 h-3 text-amber-500" />
                                  <span>Draft</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-4 px-5 font-mono">
                            {p.isPOA ? (
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">POA</span>
                            ) : p.askingPriceNumeric ? (
                              <div className="text-slate-900 dark:text-white text-xs">
                                <span className="text-[#0284C7] dark:text-[#7DD3FC] font-semibold">{p.askingCurrency}</span>{' '}
                                {Number(p.askingPriceNumeric).toLocaleString()}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-gray-500 text-[11px]">Unpriced</span>
                            )}
                          </td>

                          <td className="py-4 px-5 space-x-1.5">
                            {p.isFeaturedLaunch && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                <Flame className="w-3 h-3" /> Launch #{p.launchOrder ?? 1}
                              </span>
                            )}
                            {p.isSpaceInRound && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                                <Orbit className="w-3 h-3" /> Space #{p.spaceOrder ?? 1}
                              </span>
                            )}
                            {!p.isFeaturedLaunch && !p.isSpaceInRound && (
                              <span className="text-slate-400 dark:text-gray-500 font-mono">—</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* SOLD TAB SPECIFIC COLUMNS (Section 1.C) */}
                      {activeTab === 'sold' && (
                        <>
                          <td className="py-4 px-5 font-mono">
                            <div className="text-amber-600 dark:text-amber-400 font-semibold text-xs">
                              {deal?.saleCurrency}{' '}
                              {deal?.actualSalePrice ? Number(deal.actualSalePrice).toLocaleString() : '—'}
                            </div>
                            {adj && (
                              <div className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">
                                Adj: {adj.adjustedCurrency} {Number(adj.adjustedSalePrice).toLocaleString()}
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-5">
                            <div className="text-slate-800 dark:text-gray-200 font-medium">
                              {deal?.buyerName || 'Private Client'}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 dark:text-gray-400">
                              Ref: {deal?.dealRef}
                            </div>
                          </td>

                          <td className="py-4 px-5 text-slate-500 dark:text-gray-400 font-mono text-[11px]">
                            {deal?.closedAt
                              ? new Date(deal.closedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>

                          <td className="py-4 px-5">
                            {deal?.keepPubliclyVisible ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                                <Eye className="w-3 h-3" /> Option A (Visible Acquired)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-500/10 text-slate-600 dark:text-gray-400 border border-slate-500/20">
                                <EyeOff className="w-3 h-3" /> Option B (Unlisted Sold)
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {/* ARCHIVED TAB SPECIFIC COLUMNS (Section 1.D) */}
                      {activeTab === 'archived' && (
                        <>
                          <td className="py-4 px-5 font-mono text-slate-500 dark:text-gray-400 text-[11px]">
                            {p.archivedAt
                              ? new Date(p.archivedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>

                          <td className="py-4 px-5 text-slate-700 dark:text-gray-300">
                            {p.archivedBy?.name || p.archivedBy?.email || 'Administrator'}
                          </td>

                          <td className="py-4 px-5 text-slate-600 dark:text-gray-400 italic text-xs max-w-xs truncate">
                            &quot;{p.archivedReason || 'Administrative archive'}&quot;
                          </td>
                        </>
                      )}

                      {/* Actions Column */}
                      <td className="py-4 px-5 text-right space-x-1 whitespace-nowrap">
                        {/* Live Site Link */}
                        <Link
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] inline-flex items-center"
                          title="View on Live Site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Edit Link (Current only) */}
                        {activeTab === 'current' && (
                          <>
                            <Link
                              href={`/admin/properties/${p.id}`}
                              className="p-1.5 rounded-md text-slate-500 dark:text-gray-400 hover:text-[#0284C7] dark:hover:text-[#7DD3FC] hover:bg-slate-100 dark:hover:bg-white/[0.04] inline-flex items-center"
                              title="Edit Project"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => openRepriceModal(p)}
                              className="p-1.5 rounded-md text-slate-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] inline-flex items-center cursor-pointer"
                              title="Financial Repricing"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setArchiveModalItem(p)}
                              className="p-1.5 rounded-md text-slate-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 inline-flex items-center cursor-pointer"
                              title="Archive Project"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Restore Button (Archived only) */}
                        {activeTab === 'archived' && (
                          <button
                            onClick={() => handleRestore(p)}
                            disabled={actionLoadingId === p.id}
                            className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono inline-flex items-center gap-1 cursor-pointer"
                            title="Restore Project to Draft"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-gray-400">
            <div>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, displayedProperties.length)} of{' '}
              {displayedProperties.length} projects
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ARCHIVE MODAL (Section 1.D) */}
      {archiveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#070E1C] border border-rose-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <Archive className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Archive Project</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              Moving <strong className="text-slate-900 dark:text-white">{archiveModalItem.name}</strong> to the Deleted / Archived section.
              The project will be unpublished and hidden from public discovery, but all records and media remain safely preserved.
            </p>
            <div>
              <label className="block text-[11px] font-mono text-slate-500 dark:text-gray-400 mb-1">
                Archive Reason (Required for audit trail)
              </label>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="e.g. Delisted by owner request, superseded by new phase..."
                rows={2}
                className="w-full bg-slate-50 dark:bg-[#040810] border border-slate-200 dark:border-white/10 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setArchiveModalItem(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#0B1528] text-xs text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchiveConfirm}
                disabled={Boolean(actionLoadingId)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-medium disabled:opacity-50 cursor-pointer"
              >
                {actionLoadingId ? 'Archiving...' : 'Archive Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINANCIAL REPRICING MODAL (Section 1.B Repricing) */}
      {repriceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleRepriceSubmit}
            className="bg-white dark:bg-[#070E1C] border border-indigo-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Financial Repricing — {repriceItem.name}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              Updates the official asking price and currency with immutable audit log recording.
            </p>

            {/* Pricing State Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-slate-500 dark:text-gray-400">Pricing State</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'PRICED', label: 'Priced' },
                  { id: 'POA', label: 'POA' },
                  { id: 'UNPRICED', label: 'Unpriced' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setRepriceState(st.id as any)}
                    className={`py-2 px-3 text-xs font-mono rounded-lg border transition-all text-center ${
                      repriceState === st.id
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount and Currency inputs (only if PRICED) */}
            {repriceState === 'PRICED' && (
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[11px] font-mono text-slate-500 dark:text-gray-400 mb-1">Currency</label>
                  <select
                    value={repriceCurrency}
                    onChange={(e) => setRepriceCurrency(e.target.value)}
                    aria-label="Select ISO 4217 Currency"
                    className="w-full bg-slate-50 dark:bg-[#040810] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-400"
                  >
                    {SUPPORTED_CURRENCIES.map((cur) => (
                      <option key={cur} value={cur}>
                        {cur}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-mono text-slate-500 dark:text-gray-400 mb-1">Asking Amount</label>
                  <input
                    type="number"
                    step="any"
                    value={repriceAmount}
                    onChange={(e) => setRepriceAmount(e.target.value)}
                    placeholder="e.g. 45000000"
                    required
                    className="w-full bg-slate-50 dark:bg-[#040810] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-slate-500 dark:text-gray-400 mb-1">
                Reason for Reprice
              </label>
              <input
                type="text"
                value={repriceReason}
                onChange={(e) => setRepriceReason(e.target.value)}
                placeholder="e.g. Annual Q4 portfolio repricing adjustment..."
                className="w-full bg-slate-50 dark:bg-[#040810] border border-slate-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setRepriceItem(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#0B1528] text-xs text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={repriceLoading}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium disabled:opacity-50 cursor-pointer"
              >
                {repriceLoading ? 'Saving...' : 'Confirm Reprice'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
