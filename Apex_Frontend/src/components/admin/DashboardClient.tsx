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
  const dealVolumes = data?.completedDealVolume?.byCurrency || []
  const trend = visits?.dailyTrend || []

  // Max value for graph scaling
  const maxVisits = Math.max(1, ...trend.map((t) => t.visits || 0))
  const maxAdditions = Math.max(1, ...trend.map((t) => t.projectAdditions || 0))
  const maxClosures = Math.max(1, ...trend.map((t) => t.dealClosures || 0))
  const graphMax = Math.max(maxVisits, maxAdditions, maxClosures, 5)

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

      {/* METRIC ROW: 5 SIMPLE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Website Visitors */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5 hover:border-[#7DD3FC]/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">Website Visitors</span>
            <Users className="w-4 h-4 text-[#7DD3FC]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {(visits?.totalQualifyingVisits ?? 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Total recorded site visitors</p>
        </div>

        {/* 2. Total Projects */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5 hover:border-[#7DD3FC]/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Projects</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {data?.totalProjects ?? 0}
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Properties in portfolio</p>
        </div>

        {/* 3. Total Portfolio Value */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5 hover:border-[#7DD3FC]/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">Portfolio Value</span>
            <TrendingUp className="w-4 h-4 text-[#7DD3FC]" />
          </div>
          <div className="space-y-0.5">
            {portfolioVals.length > 0 ? (
              portfolioVals.slice(0, 2).map((v) => (
                <div key={v.currency} className="flex items-baseline gap-1.5">
                  <span className="text-xs font-mono font-semibold text-[#7DD3FC]">{v.currency}</span>
                  <span className="text-base font-bold font-mono text-white truncate">
                    {Number(v.totalAmount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xl font-bold font-mono text-gray-400">POA / Unpriced</div>
            )}
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Cumulative asking valuation</p>
        </div>

        {/* 4. Spaces in the Round Count */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5 hover:border-[#7DD3FC]/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">Spaces In Round</span>
            <Orbit className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {data?.spacesInRoundCount ?? 0}
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Featured 360° showcase projects</p>
        </div>

        {/* 5. Completed Deals */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5 hover:border-[#7DD3FC]/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider">Completed Deals</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {data?.completedDealMetrics?.totalCompletedDeals ?? 0}
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Successfully closed transactions</p>
        </div>
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
            <Award className="w-4 h-4 text-amber-400" />
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
        <div className="lg:col-span-2 bg-[#070E1C] border border-white/10 rounded-xl p-6">
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
              <div className="h-48 flex items-end gap-1.5 sm:gap-2 px-1">
                {trend.map((pt, i) => {
                  const visitHeight = Math.max(4, Math.round((pt.visits / graphMax) * 100))
                  const addHeight = Math.max(0, Math.round((pt.projectAdditions / graphMax) * 100))
                  const dealHeight = Math.max(0, Math.round((pt.dealClosures / graphMax) * 100))
                  return (
                    <div
                      key={pt.date || i}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-[#040810] border border-white/20 rounded-md p-2 text-[10px] font-mono text-white z-20 whitespace-nowrap shadow-xl">
                        <span className="font-semibold text-gray-300">{pt.date}</span>
                        <span className="text-[#7DD3FC]">Visitors: {pt.visits}</span>
                        <span className="text-emerald-400">Projects Added: {pt.projectAdditions}</span>
                        <span className="text-amber-400">Deals Closed: {pt.dealClosures}</span>
                      </div>

                      {/* Bars */}
                      <div className="w-full flex items-end justify-center gap-0.5 h-full">
                        <div
                          style={{ height: `${visitHeight}%` }}
                          className="w-1.5 sm:w-2 bg-[#7DD3FC]/80 rounded-t transition-all group-hover:bg-[#7DD3FC]"
                        />
                        {pt.projectAdditions > 0 && (
                          <div
                            style={{ height: `${Math.max(12, addHeight)}%` }}
                            className="w-1.5 sm:w-2 bg-emerald-400 rounded-t transition-all"
                          />
                        )}
                        {pt.dealClosures > 0 && (
                          <div
                            style={{ height: `${Math.max(12, dealHeight)}%` }}
                            className="w-1.5 sm:w-2 bg-amber-400 rounded-t transition-all"
                          />
                        )}
                      </div>

                      {/* Date label at bottom */}
                      <span className="text-[9px] font-mono text-gray-500 mt-1 truncate max-w-full">
                        {pt.date.slice(5)}
                      </span>
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
    </div>
  )
}
