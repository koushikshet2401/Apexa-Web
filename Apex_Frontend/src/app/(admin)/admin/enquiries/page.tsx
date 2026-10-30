import React from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminEnquiriesPage() {
  const enquiries = await db.enquiry.findMany({
    orderBy: { submittedAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <Link href="/admin" className="text-gray-400 hover:text-white flex items-center gap-1 text-xs font-mono mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Client & Investor Inquiries
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review and follow up with inquiries received from the public enquiry form.
          </p>
        </div>
      </div>

      <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-2 text-xs font-mono uppercase text-gray-300">
          <Mail className="w-4 h-4 text-[#7DD3FC]" />
          <span>All Submissions ({enquiries.length})</span>
        </div>
        {enquiries.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 font-mono">
            No inquiries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#040810]/70 text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3 px-5">Ref #</th>
                  <th className="py-3 px-5">Client Name</th>
                  <th className="py-3 px-5">Email / Phone</th>
                  <th className="py-3 px-5">Service / Property</th>
                  <th className="py-3 px-5">Message</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {enquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-5 font-mono text-[#7DD3FC]">{enq.enquiryRef}</td>
                    <td className="py-3.5 px-5 font-medium text-white">{enq.name}</td>
                    <td className="py-3.5 px-5 text-gray-300">
                      <div>{enq.email}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{enq.phone}</div>
                    </td>
                    <td className="py-3.5 px-5 text-gray-300">{enq.serviceInterest || 'General'}</td>
                    <td className="py-3.5 px-5 text-gray-400 max-w-xs truncate">{enq.message || '—'}</td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border bg-rose-500/10 text-rose-300 border-rose-500/30">
                        {enq.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-gray-400 text-[11px]">
                      {new Date(enq.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
