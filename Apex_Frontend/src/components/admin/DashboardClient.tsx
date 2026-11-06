'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2,
  CheckCircle2,
  FileEdit,
  Flame,
  Orbit,
  Mail,
  ArrowUpRight,
  Globe2,
  Clock,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  RefreshCw,
  Calendar,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Award,
} from 'lucide-react'

interface DashboardData {
  dateRange: {
    rangeKey: string
    startDate: string
    endDate: string
    interval: string
  }
  websiteVisits: {
    metricLabel: string
    totalQualifyingVisits: number
    monthlyVisits: number
    todayVisits: number
    repeatVisitsCount: number
    repeatVisitsRatio: number
    dailyTrend: Array<{ date: string; visits: number; pageViews: number }>
  }
  totalProjects: number
  spacesInRoundCount: number
  pendingDeals: {
    inquiry: number
    contacted: number
    offerMade: number
    underContract: number
    lost: number
    totalPending: number
  }
  totalPortfolioValuation: {
    byCurrency: Array<{ currency: string; totalAmount: string; propertyCount: number }>
    scopeDescription: string
  }
  activePublishedValuation: {
    byCurrency: Array<{ currency: string; totalAmount: string; activeListingCount: number }>
    scopeDescription: string
  }
  completedDealVolume: {
    byCurrency: Array<{
      currency: string
      originalSalesVolume: string
      effectiveSalesVolume: string
      closedDealsCount: number
      adjustedDealsCount: number
    }>
  }
  completedDealMetrics: {
    totalCompletedDeals: number
    optionAVisibleCount: number
    optionBUnlistedCount: number
    totalLostDeals: number
    totalActivePipelineDeals: number
    totalDealsCount: number
    winRate: {
      ratioPercent: number | null
      numerator: number
      denominator: number
      formula: string
      eligibilityDescription: string
    }
    pipelineThroughputRate: {
      ratioPercent: number | null
      numerator: number
      denominator: number
      formula: string
      eligibilityDescription: string
    }
  }
  assetInventoryCounts: {
    totalPropertiesCount: number
    activePublicListingsCount: number
    totalPublishedCount: number
    draftCount: number
    archivedCount: number
    poaCount: number
    unpricedCount: number
  }
}

interface CountryStat {
  country: string
  propertiesCount: number
  activePublishedCount: number
  valuationByCurrency: Array<{ currency: string; totalAmount: string }>
  enquiriesCount: number
  dealsClosedCount: number
  viewsCount: number
}

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
  { key: 'ytd', label: 'Year to Date' },
]

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [countries, setCountries] = useState<CountryStat[]>([])
  const [range, setRange] = useState<string>('30d')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const fetchDashboard = useCallback(async () => {
    try {
      setRefreshing(true)
      setError(null)

      const [dashRes, countriesRes] = await Promise.all([
        fetch(`/api/admin/analytics/dashboard?range=${range}`),
        fetch('/api/admin/analytics/countries'),
      ])

      if (!dashRes.ok) {
        throw new Error(`Failed to load dashboard: ${dashRes.statusText}`)
      }
      const dashJson = await dashRes.json()
      setData(dashJson)

      if (countriesRes.ok) {
        const countriesJson = await countriesRes.json()
        setCountries(countriesJson.countries || [])
      }
    } catch (err: any) {
      console.error('Error loading dashboard analytics:', err)
      setError(err.message || 'Unable to connect to live analytics database.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [range])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-16 bg-[#070E1C] dark:bg-[#070E1C] rounded-xl border border-white/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#070E1C] dark:bg-[#070E1C] rounded-xl border border-white/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-[#070E1C] dark:bg-[#070E1C] rounded-xl border border-white/10" />
          <div className="h-72 bg-[#070E1C] dark:bg-[#070E1C] rounded-xl border border-white/10" />
        </div>
      </div>
    )
  }

  const visits = data?.websiteVisits
  const inv = data?.assetInventoryCounts
  const deals = data?.completedDealMetrics
  const pipeline = data?.pendingDeals
  const portfolioVals = data?.totalPortfolioValuation?.byCurrency || []
  const activeVals = data?.activePublishedValuation?.byCurrency || []
  const dealVolumes = data?.completedDealVolume?.byCurrency || []

  return (
    <div className="space-y-8 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#0284C7] dark:text-[#7DD3FC]">
              Apex Executive System
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-medium text-slate-900 dark:text-white tracking-wide">
            Portfolio & Business Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Real-time multi-currency valuations, executive website visits telemetry, pipeline throughput, and deal revenue.
          </p>
        </div>

        {/* Date Filter & Refresh Actions */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 text-xs">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
                  range === r.key
                    ? 'bg-white dark:bg-[#0B1528] text-[#0284C7] dark:text-[#7DD3FC] shadow-sm font-semibold border border-slate-200 dark:border-[#7DD3FC]/30'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchDashboard()}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-100 dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:border-[#7DD3FC]/40 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#7DD3FC]' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchDashboard()}
            className="underline hover:text-rose-300 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* METRIC ROW 1: PRIMARY BUSINESS TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Website Visits */}
        <div className="bg-white dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-[#7DD3FC]/30 transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-gray-400">
              {visits?.metricLabel || 'Website Visits'}
            </span>
            <Eye className="w-4 h-4 text-[#0284C7] dark:text-[#7DD3FC]" />
          </div>
          <div className="text-3xl font-display font-medium text-slate-900 dark:text-white mb-2">
            {visits?.totalQualifyingVisits ?? 0}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-gray-400 pt-2 border-t border-slate-100 dark:border-white/5">
            <span className="text-emerald-600 dark:text-emerald-400">
              {visits?.monthlyVisits ?? 0} (30d active)
            </span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-300">
              {visits?.repeatVisitsRatio ?? 0}% repeat
            </span>
          </div>
        </div>

        {/* Metric 2: Total Projects (Published per Phase 1 rule) */}
        <div className="bg-white dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-[#7DD3FC]/30 transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Total Published Projects
            </span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-display font-medium text-slate-900 dark:text-white mb-2">
            {data?.totalProjects ?? 0}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-gray-400 pt-2 border-t border-slate-100 dark:border-white/5">
            <span className="text-amber-600 dark:text-amber-400">
              {inv?.draftCount ?? 0} drafts
            </span>
            <span>•</span>
            <span className="text-slate-500 dark:text-gray-400">
              {inv?.archivedCount ?? 0} archived
            </span>
          </div>
        </div>

        {/* Metric 3: Spaces in the Round */}
        <div className="bg-white dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-[#7DD3FC]/30 transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Spaces in the Round
            </span>
            <Orbit className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-display font-medium text-slate-900 dark:text-white mb-2">
            {data?.spacesInRoundCount ?? 0}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-gray-400 pt-2 border-t border-slate-100 dark:border-white/5">
            <span>Curated Showcase</span>
            <Link
              href="/admin/space-in-round"
              className="text-[#0284C7] dark:text-[#7DD3FC] hover:underline flex items-center gap-0.5 text-[10px]"
            >
              Curate <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Metric 4: Completed Deals & Win Rate */}
        <div className="bg-white dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-[#7DD3FC]/30 transition-all shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-gray-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Completed Deals
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-display font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <span>{deals?.totalCompletedDeals ?? 0}</span>
            {deals?.winRate?.ratioPercent !== null && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 font-mono">
                {deals?.winRate.ratioPercent}% Win Rate
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-gray-400 pt-2 border-t border-slate-100 dark:border-white/5">
            <span className="text-emerald-600 dark:text-emerald-400">
              {deals?.optionAVisibleCount ?? 0} Option A (Visible)
            </span>
            <span>•</span>
            <span className="text-slate-500 dark:text-gray-400">
              {deals?.optionBUnlistedCount ?? 0} Option B (Sold)
            </span>
          </div>
        </div>
      </div>

      {/* METRIC ROW 2: MULTI-CURRENCY FINANCIAL PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Corporate Portfolio Valuation by Currency */}
        <div className="bg-white dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#0284C7] dark:text-[#7DD3FC]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                Corporate Portfolio Valuation
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-gray-400" title="Includes Published, Draft, Sold, and Recoverably Archived">
              All States
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-gray-400 mb-4 leading-relaxed">
            Corporate holding value grouped strictly by currency. Cross-currency summation is strictly prohibited.
          </p>

          <div className="space-y-3">
            {portfolioVals.length === 0 ? (
              <p className="text-xs font-mono text-slate-400 dark:text-gray-400">No priced projects recorded.</p>
            ) : (
              portfolioVals.map((v) => (
                <div
                  key={v.currency}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-[#040810] border border-slate-200 dark:border-white/5 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-[#0284C7] dark:text-[#7DD3FC]">
                      {v.currency}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-gray-400 ml-2">
                      ({v.propertyCount} {v.propertyCount === 1 ? 'project' : 'projects'})
                    </span>
                  </div>
                  <div className="font-display font-medium text-sm text-slate-900 dark:text-white">
                    {Number(v.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Published Listings Valuation (Live Customer Showcase) */}
        <div className="bg-white dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                Active Listings Valuation
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              Live Showcase
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-gray-400 mb-4 leading-relaxed">
            Publicly active listings currently discoverable on the web portal by potential buyers.
          </p>

          <div className="space-y-3">
            {activeVals.length === 0 ? (
              <p className="text-xs font-mono text-slate-400 dark:text-gray-400">No active published listings.</p>
            ) : (
              activeVals.map((v) => (
                <div
                  key={v.currency}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-[#040810] border border-slate-200 dark:border-white/5 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {v.currency}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-gray-400 ml-2">
                      ({v.activeListingCount} {v.activeListingCount === 1 ? 'listing' : 'listings'})
                    </span>
                  </div>
                  <div className="font-display font-medium text-sm text-slate-900 dark:text-white">
                    {Number(v.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Deal Sales Volume (Original & Effective Adjusted) */}
        <div className="bg-white dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                Deal Closure Sales Volume
              </h2>
            </div>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              Closed Revenue
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-gray-400 mb-4 leading-relaxed">
            Closed transaction volume incorporating audit-approved adjustments and currency reclassification.
          </p>

          <div className="space-y-3">
            {dealVolumes.length === 0 ? (
              <p className="text-xs font-mono text-slate-400 dark:text-gray-400">No completed deals recorded.</p>
            ) : (
              dealVolumes.map((v) => (
                <div
                  key={v.currency}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-[#040810] border border-slate-200 dark:border-white/5 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      {v.currency}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-gray-400 ml-2">
                      ({v.closedDealsCount} {v.closedDealsCount === 1 ? 'deal' : 'deals'})
                    </span>
                  </div>
                  <div className="font-display font-medium text-sm text-slate-900 dark:text-white">
                    {Number(v.effectiveSalesVolume).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* METRIC ROW 3: PIPELINE STAGES & DESTINATION SPREAD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Pipeline Breakdown */}
        <div className="bg-white dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
              Deal Pipeline Throughput
            </h2>
            <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400">
              {pipeline?.totalPending ?? 0} in flight
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Inquiry', count: pipeline?.inquiry ?? 0, color: 'bg-sky-400' },
              { label: 'Contacted', count: pipeline?.contacted ?? 0, color: 'bg-blue-400' },
              { label: 'Offer Made', count: pipeline?.offerMade ?? 0, color: 'bg-indigo-400' },
              { label: 'Under Contract', count: pipeline?.underContract ?? 0, color: 'bg-amber-400' },
              { label: 'Completed', count: deals?.totalCompletedDeals ?? 0, color: 'bg-emerald-400' },
              { label: 'Lost', count: pipeline?.lost ?? 0, color: 'bg-rose-400' },
            ].map((st) => (
              <div key={st.label} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${st.color}`} />
                  <span className="text-slate-600 dark:text-gray-300 font-medium">{st.label}</span>
                </div>
                <span className="font-mono text-slate-900 dark:text-white font-bold">{st.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Destination Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-[#070E1C] border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#0284C7] dark:text-[#7DD3FC]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                Destinations & Regional Inventory
              </h2>
            </div>
            <Link
              href="/admin/countries"
              className="text-xs text-[#0284C7] dark:text-[#7DD3FC] hover:underline flex items-center gap-1 font-mono"
            >
              All Countries <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {countries.length === 0 ? (
              <p className="text-xs font-mono text-slate-400 dark:text-gray-400">No destination statistics found.</p>
            ) : (
              countries.slice(0, 5).map((c) => {
                const total = inv?.totalPropertiesCount || 1
                const pct = Math.round((c.propertiesCount / total) * 100)
                return (
                  <div key={c.country} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-gray-200">{c.country}</span>
                      <span className="font-mono text-slate-500 dark:text-gray-400 text-[11px]">
                        {c.propertiesCount} projects ({c.activePublishedCount} active) • {c.enquiriesCount} inquiries
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#040810] border border-slate-200 dark:border-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0284C7] to-[#7DD3FC] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, c.propertiesCount > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
