'use client'

import React from 'react'
import Link from 'next/link'
import { PlusCircle, Building2, Mail } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecentEnquiry {
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
}

interface RecentEnquiriesWidgetProps {
  enquiries: RecentEnquiry[]
  loading?: boolean
}

interface ActivityEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  summary: string
  adminEmail: string
  createdAt: string
  admin: { id: string; name: string | null } | null
}

interface RecentActivityWidgetProps {
  activities: ActivityEntry[]
  loading?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  if (diffMs < 0) return 'just now'
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function statusBadge(status: string): React.ReactElement {
  const styles: Record<string, string> = {
    NEW: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
    READ: 'bg-gray-500/15 text-gray-400 border border-gray-500/25',
    IN_PROGRESS: 'bg-sky-500/15 text-sky-300 border border-sky-500/25',
    CLOSED: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  }
  const cls = styles[status] ?? 'bg-gray-500/15 text-gray-400 border border-gray-500/25'
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${cls}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function activityDot(action: string): React.ReactElement {
  let color = 'bg-gray-500'
  if (action.startsWith('PROJECT_')) color = 'bg-emerald-400'
  else if (action.startsWith('DEAL_')) color = 'bg-amber-400'
  else if (action.startsWith('ENQUIRY_')) color = 'bg-sky-400'
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 mt-0.5 ${color}`} />
}

// ---------------------------------------------------------------------------
// RecentEnquiriesWidget
// ---------------------------------------------------------------------------

export function RecentEnquiriesWidget({ enquiries, loading }: RecentEnquiriesWidgetProps) {
  return (
    <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
            Recent Enquiries
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Latest 5 submissions</p>
        </div>
        <Mail className="w-4 h-4 text-[#7DD3FC]" />
      </div>

      {/* Body */}
      {loading ? (
        <div className="text-xs text-gray-500 font-mono text-center py-6">Loading…</div>
      ) : enquiries.length === 0 ? (
        <div className="text-xs text-gray-500 font-mono text-center py-6">
          No enquiries yet.
        </div>
      ) : (
        <div className="flex-1 divide-y divide-white/5">
          {enquiries.map((enq) => (
            <Link
              key={enq.id}
              href="/admin/messages"
              className="flex items-start justify-between gap-3 py-2.5 hover:bg-white/[0.04] transition-colors -mx-5 px-5 rounded-lg"
            >
              {/* Left: name + email + property */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-semibold text-white truncate">
                    {enq.name}
                  </span>
                  {!enq.isRead && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] font-mono text-gray-400 truncate">{enq.email}</div>
                {enq.property && (
                  <div className="text-[10px] font-mono text-[#7DD3FC] truncate">
                    {enq.property.name}
                  </div>
                )}
              </div>

              {/* Right: badge + date */}
              <div className="shrink-0 flex flex-col items-end gap-1">
                {statusBadge(enq.status)}
                <span className="text-[10px] font-mono text-gray-500">
                  {new Date(enq.submittedAt).toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer link */}
      <div className="pt-3 border-t border-white/5 mt-3">
        <Link
          href="/admin/messages"
          className="text-[11px] font-mono text-[#7DD3FC] hover:text-white transition-colors"
        >
          View All →
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// RecentActivityWidget
// ---------------------------------------------------------------------------

export function RecentActivityWidget({ activities, loading }: RecentActivityWidgetProps) {
  return (
    <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">
            Recent Activity
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Latest 10 admin actions</p>
        </div>
        <span className="w-4 h-4 rounded-full bg-emerald-400/20 border border-emerald-400/40 inline-block" />
      </div>

      {/* Body */}
      {loading ? (
        <div className="text-xs text-gray-500 font-mono text-center py-6">Loading…</div>
      ) : activities.length === 0 ? (
        <div className="text-xs text-gray-500 font-mono text-center py-6">
          No activity recorded yet.
        </div>
      ) : (
        <div className="flex-1 divide-y divide-white/5">
          {activities.map((act) => {
            const actor = act.admin?.name || act.adminEmail.split('@')[0]
            return (
              <div
                key={act.id}
                className="flex items-start gap-2.5 py-2.5 hover:bg-white/[0.04] transition-colors -mx-5 px-5"
              >
                {activityDot(act.action)}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono text-white truncate leading-snug">
                    {act.summary || act.action}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-gray-400">{actor}</span>
                    <span className="text-[10px] font-mono text-gray-600">·</span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {timeAgo(act.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// QuickActionsWidget
// ---------------------------------------------------------------------------

export function QuickActionsWidget() {
  return (
    <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-white font-mono mb-4">
        Quick Actions
      </h2>
      <div className="flex flex-wrap gap-3">
        {/* Add Project */}
        <Link
          href="/admin/properties/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-200"
        >
          <PlusCircle className="w-4 h-4" />
          Add Project
        </Link>

        {/* Current Projects */}
        <Link
          href="/admin/properties?tab=current"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-[#7DD3FC] text-xs font-medium transition-all hover:bg-sky-500/20 hover:border-sky-500/50 hover:text-sky-200"
        >
          <Building2 className="w-4 h-4" />
          Current Projects
        </Link>

        {/* Messages */}
        <Link
          href="/admin/messages"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium transition-all hover:bg-amber-500/20 hover:border-amber-500/50 hover:text-amber-200"
        >
          <Mail className="w-4 h-4" />
          Messages
        </Link>
      </div>
    </div>
  )
}
