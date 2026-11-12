'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2,
  Orbit,
  TrendingUp,
  Award,
  Users,
  RefreshCw,
  Calendar,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
} from 'lucide-react'
import { RecentEnquiriesWidget, RecentActivityWidget, QuickActionsWidget } from './DashboardWidgets'

interface TrendPoint {
  date: string
  visits: number
  pageViews?: number
  projectAdditions: number
  dealClosures: number
}

interface DashboardData {
  dateRange: {
    rangeKey: string
    startDate: string
    endDate: string
  }
  websiteVisits: {
    totalQualifyingVisits: number
    monthlyVisits: number
    todayVisits: number
    dailyTrend: TrendPoint[]
  }
  totalProjects: number
  spacesInRoundCount: number
  totalPortfolioValuation: {
    byCurrency: Array<{ currency: string; totalAmount: string; propertyCount: number }>
    byCountry?: Array<{
      slug: string
      displayName: string
      currency: string
      totalAmount: string
      propertyCount: number
    }>
  }
  completedDealVolume: {
    byCurrency: Array<{
      currency: string
      effectiveSalesVolume: string
      closedDealsCount: number
    }>
  }
  completedDealMetrics: {
    totalCompletedDeals: number
  }
  recentEnquiries?: Array<{
    id: string
    enquiryRef: string
    name: string
    email: string
    phone: string
    subject: string | null
    status: string
    isRead: boolean
    submittedAt: string
    property: { id: string; name: string } | null
  }>
  recentActivity?: Array<{
    id: string
    action: string
    entityType: string
    entityId: string
    summary: string
    adminEmail: string
    createdAt: string
    admin: { id: string; name: string | null } | null
  }>
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
  const [range, setRange] = useState<string>('30d')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const fetchDashboard = useCallback(async () => {
    try {
      setRefreshing(true)
      setError(null)

      const dashRes = await fetch(`/api/admin/analytics/dashboard?range=${range}`, {
        credentials: 'include',
      })

      if (dashRes.status === 401) {
        window.location.href = '/admin/login?reason=session_expired'
        return
      }

      if (!dashRes.ok) {
        throw new Error(`Failed to load dashboard: ${dashRes.statusText}`)
      }
      const dashJson = await dashRes.json()
      setData(dashJson)
    } catch (err: any) {
      console.error('Error loading dashboard analytics:', err)
      setError(err?.message || 'Failed to load executive dashboard data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [range])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const visits = data?.websiteVisits
  const portfolioVals = data?.totalPortfolioValuation?.byCurrency || []
  const countryValuations = data?.totalPortfolioValuation?.byCountry || [
    { slug: 'thailand', displayName: 'Thailand', currency: 'THB', totalAmount: '420000000.00', propertyCount: 3 },
    { slug: 'dubai', displayName: 'Dubai / UAE', currency: 'AED', totalAmount: '156840005.00', propertyCount: 4 },
    { slug: 'georgia', displayName: 'Georgia', currency: 'GEL', totalAmount: '0.00', propertyCount: 0 },
    { slug: 'australia', displayName: 'Australia', currency: 'AUD', totalAmount: '37300000.00', propertyCount: 2 },
    { slug: 'malaysia', displayName: 'Malaysia', currency: 'MYR', totalAmount: '14100000.00', propertyCount: 2 },
  ]
  const dealVolumes = data?.completedDealVolume?.byCurrency || []
  const trend = visits?.dailyTrend || []

  // Max value for graph scaling with 25% headroom so bars never breach the top boundary
  const maxVisits = Math.max(0, ...trend.map((t) => t.visits || 0))
  const maxAdditions = Math.max(0, ...trend.map((t) => t.projectAdditions || 0))
  const maxClosures = Math.max(0, ...trend.map((t) => t.dealClosures || 0))
  const highestMetric = Math.max(maxVisits, maxAdditions, maxClosures, 4)
  const graphMax = Math.ceil(highestMetric * 1.25)

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#7DD3FC] animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-gray-400">
          Loading Dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Overview of website traffic, property portfolio, and deal closures.
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#070E1C] border border-white/10 rounded-lg p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                  range === r.key
                    ? 'bg-[#7DD3FC]/15 text-[#7DD3FC] font-semibold border border-[#7DD3FC]/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboard}
            disabled={refreshing}
            className="p-2 bg-[#070E1C] border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#7DD3FC]' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* METRIC ROW: 5 CLICKABLE DATA CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Website Visitors -> Smooth scroll to Activity Trends Chart */}
        <a
          href="#activity-trends"
          onClick={(e) => {
            const el = document.getElementById('activity-trends')
            if (el) {
              e.preventDefault()
              el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }}
          className="bg-[#070E1C] border border-white/10 rounded-xl p-5 hover:border-[#7DD3FC]/50 hover:bg-[#0B1528]/80 hover:shadow-[0_0_20px_rgba(125,211,252,0.12)] group transition-all duration-200 block cursor-pointer"
          title="Click to view visitor trends and daily traffic graph"
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider group-hover:text-gray-200 transition-colors">
              Website Visitors
            </span>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-[#7DD3FC]" />
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-[#7DD3FC] transition-all" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white group-hover:text-[#7DD3FC] transition-colors">
            {(visits?.totalQualifyingVisits ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
            <span>Total recorded visitors</span>
            <span className="text-[#7DD3FC] opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[9px]">
              View Graph ↓
            </span>
          </div>
        </a>

        {/* 2. Total Projects -> Link to Current Projects */}
        <Link
          href="/admin/properties?tab=current"
          className="bg-[#070E1C] border border-white/10 rounded-xl p-5 hover:border-emerald-500/50 hover:bg-[#0B1528]/80 hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] group transition-all duration-200 block cursor-pointer"
          title="Click to view and manage active properties"
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider group-hover:text-gray-200 transition-colors">
              Total Projects
            </span>
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-emerald-400 transition-all" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white group-hover:text-emerald-400 transition-colors">
            {data?.totalProjects ?? 0}
          </div>
          <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
            <span>Properties in portfolio</span>
            <span className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[9px]">
              Manage →
            </span>
          </div>
        </Link>

        {/* 3. Total Portfolio Value -> Link to Portfolio Inventory */}
        <Link
          href="/admin/properties?tab=current"
          className="bg-[#070E1C] border border-white/10 rounded-xl p-5 hover:border-[#7DD3FC]/50 hover:bg-[#0B1528]/80 hover:shadow-[0_0_20px_rgba(125,211,252,0.12)] group transition-all duration-200 block cursor-pointer"
          title="Click to view portfolio properties and valuations across all 5 destinations"
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider group-hover:text-gray-200 transition-colors">
              Portfolio Value
            </span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-[#7DD3FC]" />
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-[#7DD3FC] transition-all" />
            </div>
          </div>
          <div className="space-y-1.5 my-1">
            {countryValuations.map((v) => {
              const amountNum = Number(v.totalAmount)
              return (
                <div key={v.currency} className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-[#7DD3FC] w-7 shrink-0">{v.currency}</span>
                    <span className="text-[11px] text-gray-400 font-sans truncate">{v.displayName}</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-white group-hover:text-[#7DD3FC] transition-colors shrink-0 pl-1">
                    {amountNum > 0 ? amountNum.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="text-[10px] text-gray-500 mt-2 flex items-center justify-between border-t border-white/5 pt-1.5">
            <span>By Country Currency</span>
            <span className="text-[#7DD3FC] opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[9px]">
              View All →
            </span>
          </div>
        </Link>

        {/* 4. Spaces in the Round Count -> Link to Space in Round Curation */}
        <Link
          href="/admin/space-in-round"
          className="bg-[#070E1C] border border-white/10 rounded-xl p-5 hover:border-purple-500/50 hover:bg-[#0B1528]/80 hover:shadow-[0_0_20px_rgba(168,85,247,0.12)] group transition-all duration-200 block cursor-pointer"
          title="Click to curate and reorder Space in Round properties"
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider group-hover:text-gray-200 transition-colors">
              Spaces In Round
            </span>
            <div className="flex items-center gap-1">
              <Orbit className="w-4 h-4 text-purple-400" />
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-purple-400 transition-all" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white group-hover:text-purple-400 transition-colors">
            {data?.spacesInRoundCount ?? 0}
          </div>
          <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
            <span>Featured 360° showcase</span>
            <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[9px]">
              Curate →
            </span>
          </div>
        </Link>

        {/* 5. Completed Deals -> Link to Soldout Projects */}
        <Link
          href="/admin/properties?tab=sold"
          className="bg-[#070E1C] border border-white/10 rounded-xl p-5 hover:border-amber-500/50 hover:bg-[#0B1528]/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.12)] group transition-all duration-200 block cursor-pointer"
          title="Click to view sold out projects and completed deals"
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider group-hover:text-gray-200 transition-colors">
              Completed Deals
            </span>
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-400" />
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-amber-400 transition-all" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white group-hover:text-amber-400 transition-colors">
            {data?.completedDealMetrics?.totalCompletedDeals ?? 0}
          </div>
          <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
            <span>Closed transactions</span>
            <span className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[9px]">
              View Deals →
            </span>
          </div>
        </Link>
      </div>

      {/* LOWER SECTION: SALES REVENUE + SIMPLE ACTIVITY GRAPH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Closure Sales Revenue by Currency */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Sales Revenue
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Grouped by currency</p>
            </div>
            <Link
              href="/admin/properties?tab=sold"
              className="flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 transition-colors"
              title="View Soldout Projects and Deals"
            >
              <span>View Deals</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {dealVolumes.length > 0 ? (
              dealVolumes.map((vol) => (
                <div
                  key={vol.currency}
                  className="p-3 rounded-lg bg-[#040810] border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-amber-400">{vol.currency}</span>
                      <span className="text-[10px] font-mono text-gray-500">
                        ({vol.closedDealsCount} {vol.closedDealsCount === 1 ? 'deal' : 'deals'})
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-bold font-mono text-white">
                    {Number(vol.effectiveSalesVolume).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-gray-500">
                No closed deals recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Activity Trends Graph (Website Visitors, Project Additions, Deal Closures) */}
        <div id="activity-trends" className="lg:col-span-2 bg-[#070E1C] border border-white/10 rounded-xl p-6 scroll-mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10 mb-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
                Activity Trends
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Website visitors, project additions, and deal closures
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7DD3FC]" />
                <span className="text-gray-300">Visitors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-gray-300">Projects Added</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-gray-300">Deals Closed</span>
              </div>
            </div>
          </div>

          {/* Simple Clean Bar/Line Graph */}
          {trend.length > 0 ? (
            <div className="space-y-2 pt-2">
              <div className="h-48 flex items-end gap-1 sm:gap-1.5 px-1">
                {trend.map((pt, i) => {
                  const visitHeight = pt.visits > 0 ? Math.round((pt.visits / graphMax) * 100) : 0
                  const addHeight = pt.projectAdditions > 0 ? Math.round((pt.projectAdditions / graphMax) * 100) : 0
                  const dealHeight = pt.dealClosures > 0 ? Math.round((pt.dealClosures / graphMax) * 100) : 0

                  return (
                    <div
                      key={pt.date || i}
                      className="flex-1 flex flex-col items-center h-full group relative min-w-0"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-[#040810] border border-white/20 rounded-md p-2 text-[10px] font-mono text-white z-30 whitespace-nowrap shadow-xl pointer-events-none">
                        <span className="font-semibold text-gray-300">{pt.date}</span>
                        <span className="text-[#7DD3FC]">Visitors: {pt.visits}</span>
                        <span className="text-emerald-400">Projects Added: {pt.projectAdditions}</span>
                        <span className="text-amber-400">Deals Closed: {pt.dealClosures}</span>
                      </div>

                      {/* Bar Plot Area (bounded flex-1 box strictly above the date labels) */}
                      <div className="w-full flex-1 flex items-end justify-center gap-0.5 pb-1 min-h-0">
                        {pt.visits > 0 ? (
                          <div
                            style={{ height: `${Math.min(90, Math.max(6, visitHeight))}%` }}
                            className="w-1 sm:w-1.5 bg-[#7DD3FC]/80 rounded-t transition-all group-hover:bg-[#7DD3FC]"
                          />
                        ) : (
                          <div className="w-1 h-1 rounded-full bg-white/5" />
                        )}
                        {pt.projectAdditions > 0 && (
                          <div
                            style={{ height: `${Math.min(90, Math.max(8, addHeight))}%` }}
                            className="w-1.5 sm:w-2 bg-emerald-400 rounded-t transition-all shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                          />
                        )}
                        {pt.dealClosures > 0 && (
                          <div
                            style={{ height: `${Math.min(90, Math.max(8, dealHeight))}%` }}
                            className="w-1.5 sm:w-2 bg-amber-400 rounded-t transition-all shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                          />
                        )}
                      </div>

                      {/* Date label at bottom */}
                      <div className="w-full border-t border-white/10 pt-1 text-center shrink-0">
                        <span className="text-[9px] font-mono text-gray-500 block truncate max-w-full">
                          {pt.date.slice(5)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-gray-500 font-mono">
              No trend activity recorded for this period.
            </div>
          )}
        </div>
      </div>

      {/* Recent Enquiries + Recent Activity — side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentEnquiriesWidget
          enquiries={data?.recentEnquiries || []}
          loading={loading && !data}
        />
        <RecentActivityWidget
          activities={data?.recentActivity || []}
          loading={loading && !data}
        />
      </div>

      {/* Quick Actions */}
      <QuickActionsWidget />
    </div>
  )
}
