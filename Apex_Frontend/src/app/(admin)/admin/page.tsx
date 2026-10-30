import React from 'react'
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
} from 'lucide-react'
import { db } from '@/lib/db'

// Force dynamic so dashboard counts always reflect latest DB state
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [
    totalProperties,
    publishedProperties,
    draftProperties,
    featuredLaunches,
    spaceInRoundCount,
    newEnquiriesCount,
    countriesWithCount,
    recentEnquiries,
  ] = await Promise.all([
    db.property.count(),
    db.property.count({ where: { isPublished: true } }),
    db.property.count({ where: { isDraft: true } }),
    db.property.count({ where: { isFeaturedLaunch: true } }),
    db.property.count({ where: { isSpaceInRound: true } }),
    db.enquiry.count({ where: { status: 'new' } }),
    db.country.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        displayName: true,
        _count: {
          select: { properties: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    }),
    db.enquiry.findMany({
      take: 5,
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        enquiryRef: true,
        name: true,
        email: true,
        phone: true,
        serviceInterest: true,
        status: true,
        submittedAt: true,
      },
    }),
  ])

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7DD3FC]">
              Apex Executive System
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-medium text-white tracking-wide">
            Portfolio Overview
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time properties inventory, portfolio distribution, and recent investor inquiries.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-md bg-[#070E1C] border border-white/10 flex items-center gap-2 text-xs font-mono text-gray-300">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Database Connected</span>
          </div>
        </div>
      </div>

      {/* Primary Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Properties */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-[#7DD3FC]/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Total Properties</span>
            <Building2 className="w-4 h-4 text-[#7DD3FC]" />
          </div>
          <div className="text-3xl font-display font-medium text-white mb-3">
            {totalProperties}
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400 pt-2 border-t border-white/5">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> {publishedProperties} Published
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-amber-400/90">
              <FileEdit className="w-3 h-3" /> {draftProperties} Draft
            </span>
          </div>
        </div>

        {/* Featured Launches */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-amber-400/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Featured Launches</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-display font-medium text-white mb-3">
            {featuredLaunches}
          </div>
          <div className="text-[11px] font-mono text-gray-400 pt-2 border-t border-white/5 flex items-center justify-between">
            <span>Hero Launches Stack</span>
            <Link
              href="/admin/launches"
              className="text-[#7DD3FC] hover:underline flex items-center gap-0.5 text-[10px]"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Space in Round */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-indigo-400/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Space in Round</span>
            <Orbit className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-display font-medium text-white mb-3">
            {spaceInRoundCount}
          </div>
          <div className="text-[11px] font-mono text-gray-400 pt-2 border-t border-white/5 flex items-center justify-between">
            <span>Perspective Carousel</span>
            <Link
              href="/admin/space-in-round"
              className="text-[#7DD3FC] hover:underline flex items-center gap-0.5 text-[10px]"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* New Enquiries */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5 relative overflow-hidden group hover:border-rose-400/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">New Enquiries</span>
            <Mail className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-display font-medium text-white mb-3 flex items-center gap-3">
            <span>{newEnquiriesCount}</span>
            {newEnquiriesCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono uppercase tracking-wider">
                Action Required
              </span>
            )}
          </div>
          <div className="text-[11px] font-mono text-gray-400 pt-2 border-t border-white/5 flex items-center justify-between">
            <span>Pending Review</span>
            <Link
              href="/admin/enquiries"
              className="text-[#7DD3FC] hover:underline flex items-center gap-0.5 text-[10px]"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Section: Distribution by Country & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Properties by Country Breakdown */}
        <div className="lg:col-span-2 bg-[#070E1C] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#7DD3FC]" />
              <h2 className="text-sm font-medium uppercase tracking-wider text-white">
                Properties By Destination
              </h2>
            </div>
            <Link
              href="/admin/countries"
              className="text-xs text-[#7DD3FC] hover:underline flex items-center gap-1 font-mono"
            >
              All Countries <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {countriesWithCount.map((c) => {
              const count = c._count.properties
              const percent = totalProperties > 0 ? Math.round((count / totalProperties) * 100) : 0
              return (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-200 font-medium">{c.displayName || c.name}</span>
                    <span className="font-mono text-gray-400">
                      {count} {count === 1 ? 'property' : 'properties'} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#040810] border border-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7DD3FC]/80 to-[#7DD3FC] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percent, count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#7DD3FC]" />
              <h2 className="text-sm font-medium uppercase tracking-wider text-white">
                Admin Shortcuts
              </h2>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Direct access to configure homepage showcases, manage properties, and handle client inquiries.
            </p>
            <div className="space-y-2">
              <Link
                href="/admin/properties"
                className="flex items-center justify-between p-3 rounded-lg bg-[#040810] border border-white/5 hover:border-[#7DD3FC]/40 text-xs text-gray-300 hover:text-white transition-all group"
              >
                <span>Manage All Properties</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#7DD3FC] transition-colors" />
              </Link>
              <Link
                href="/admin/launches"
                className="flex items-center justify-between p-3 rounded-lg bg-[#040810] border border-white/5 hover:border-[#7DD3FC]/40 text-xs text-gray-300 hover:text-white transition-all group"
              >
                <span>Curate Latest Launches</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#7DD3FC] transition-colors" />
              </Link>
              <Link
                href="/admin/space-in-round"
                className="flex items-center justify-between p-3 rounded-lg bg-[#040810] border border-white/5 hover:border-[#7DD3FC]/40 text-xs text-gray-300 hover:text-white transition-all group"
              >
                <span>Curate Space in Round</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#7DD3FC] transition-colors" />
              </Link>
              <Link
                href="/admin/enquiries"
                className="flex items-center justify-between p-3 rounded-lg bg-[#040810] border border-white/5 hover:border-[#7DD3FC]/40 text-xs text-gray-300 hover:text-white transition-all group"
              >
                <span>Review Investor Inquiries</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#7DD3FC] transition-colors" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#7DD3FC]" />
            <span>Next.js 15 App Router • Prisma ORM</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Enquiries */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#7DD3FC]" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-white">
              Recent Inquiries (Latest 5)
            </h2>
          </div>
          <Link
            href="/admin/enquiries"
            className="text-xs text-[#7DD3FC] hover:underline flex items-center gap-1 font-mono"
          >
            All Enquiries <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentEnquiries.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 font-mono">
            No inquiries received yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#040810]/70 text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3 px-5">Ref #</th>
                  <th className="py-3 px-5">Client Name</th>
                  <th className="py-3 px-5">Contact</th>
                  <th className="py-3 px-5">Service Interest</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentEnquiries.map((enq) => {
                  const dateStr = new Date(enq.submittedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  return (
                    <tr key={enq.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-5 font-mono text-[#7DD3FC]">
                        {enq.enquiryRef}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-white">
                        {enq.name}
                      </td>
                      <td className="py-3.5 px-5 text-gray-300">
                        <div>{enq.email}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{enq.phone}</div>
                      </td>
                      <td className="py-3.5 px-5 text-gray-300">
                        {enq.serviceInterest || 'General Inquiry'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                            enq.status === 'new'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : enq.status === 'contacted' || enq.status === 'read'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {enq.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-gray-400 font-mono text-[11px]">
                        {dateStr}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
