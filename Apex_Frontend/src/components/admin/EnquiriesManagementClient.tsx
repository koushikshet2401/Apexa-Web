'use client'

import React, { useState } from 'react'
import {
  Mail,
  CheckCircle2,
  Clock,
  MessageSquare,
  User,
  Phone,
  Building2,
  Calendar,
  X,
  ExternalLink,
  Trash2,
} from 'lucide-react'

interface EnquiryItem {
  id: string
  enquiryRef: string
  name: string
  email: string
  phone: string
  serviceInterest: string | null
  message: string | null
  status: string
  submittedAt: string
  ipAddress: string | null
  property: {
    id: string
    name: string
    slug: string
    locationLine: string | null
  } | null
}

export default function EnquiriesManagementClient({
  initialEnquiries,
}: {
  initialEnquiries: EnquiryItem[]
}) {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>(initialEnquiries)
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'replied'>('all')
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = enquiries.filter((e) => {
    if (filter === 'all') return true
    return e.status === filter
  })

  const counts = {
    all: enquiries.length,
    new: enquiries.filter((e) => e.status === 'new').length,
    read: enquiries.filter((e) => e.status === 'read').length,
    replied: enquiries.filter((e) => e.status === 'replied').length,
  }

  const handleUpdateStatus = async (id: string, status: 'new' | 'read' | 'replied') => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setEnquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item))
        )
        if (selectedEnquiry && selectedEnquiry.id === id) {
          setSelectedEnquiry({ ...selectedEnquiry, status })
        }
      }
    } catch (err) {
      console.error('Update status error:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setEnquiries((prev) => prev.filter((item) => item.id !== id))
        if (selectedEnquiry && selectedEnquiry.id === id) {
          setSelectedEnquiry(null)
        }
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7DD3FC]">
              Client Engagement
            </span>
          </div>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Client & Investor Enquiries
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review incoming acquisition requests, private viewings, and advisory consultations.
          </p>
        </div>

        {counts.new > 0 && (
          <div className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>{counts.new} New Inquiries Awaiting Response</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#070E1C] border border-white/10 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
            filter === 'all'
              ? 'bg-[#0B1528] text-[#7DD3FC] border border-[#7DD3FC]/30 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
            filter === 'new'
              ? 'bg-[#0B1528] text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          New ({counts.new})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
            filter === 'read'
              ? 'bg-[#0B1528] text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Read ({counts.read})
        </button>
        <button
          onClick={() => setFilter('replied')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
            filter === 'replied'
              ? 'bg-[#0B1528] text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Replied ({counts.replied})
        </button>
      </div>

      {/* Enquiries Table */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 font-mono">
            No inquiries match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#040810]/70 text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="py-3 px-5">Ref #</th>
                  <th className="py-3 px-5">Client Name</th>
                  <th className="py-3 px-5">Email & Phone</th>
                  <th className="py-3 px-5">Service / Residence</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((enq) => {
                  const dateStr = new Date(enq.submittedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })

                  return (
                    <tr
                      key={enq.id}
                      onClick={() => setSelectedEnquiry(enq)}
                      className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                        enq.status === 'new' ? 'bg-rose-500/[0.03]' : ''
                      }`}
                    >
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
                        <div>{enq.serviceInterest || 'General Inquiry'}</div>
                        {enq.property && (
                          <div className="text-[11px] text-sky-300 font-mono">
                            {enq.property.name}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-5 font-mono text-gray-400 text-[11px]">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                            enq.status === 'new'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : enq.status === 'read'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {enq.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        {enq.status === 'new' && (
                          <button
                            onClick={() => handleUpdateStatus(enq.id, 'read')}
                            className="px-2 py-1 rounded bg-[#040810] hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-[10px] font-mono text-amber-300"
                          >
                            Mark Read
                          </button>
                        )}
                        {enq.status !== 'replied' && (
                          <button
                            onClick={() => handleUpdateStatus(enq.id, 'replied')}
                            className="px-2 py-1 rounded bg-[#040810] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-[10px] font-mono text-emerald-300"
                          >
                            Mark Replied
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(enq.id)}
                          className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Delete enquiry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out Enquiry Detail Panel (Drawer) */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#070E1C] border-l border-white/10 h-full p-6 md:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7DD3FC] block mb-1">
                    Enquiry Details
                  </span>
                  <h3 className="text-lg font-medium text-white">{selectedEnquiry.enquiryRef}</h3>
                </div>
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="p-2 rounded-lg bg-[#040810] border border-white/10 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#040810] border border-white/5">
                <span className="text-xs text-gray-400">Current Status:</span>
                <div className="flex items-center gap-1.5">
                  {(['new', 'read', 'replied'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedEnquiry.id, st)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
                        selectedEnquiry.status === st
                          ? 'bg-[#7DD3FC]/20 text-[#7DD3FC] border border-[#7DD3FC]/40 font-semibold'
                          : 'text-gray-400 hover:text-white bg-[#070E1C]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Info Grid */}
              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-[#7DD3FC]">
                    <User className="w-3.5 h-3.5" />
                    <span className="font-sans font-medium text-white text-sm">
                      {selectedEnquiry.name}
                    </span>
                  </div>
                  <div className="text-gray-300">
                    <span className="text-gray-500 block text-[10px]">Email:</span>
                    <a href={`mailto:${selectedEnquiry.email}`} className="text-[#7DD3FC] underline">
                      {selectedEnquiry.email}
                    </a>
                  </div>
                  <div className="text-gray-300">
                    <span className="text-gray-500 block text-[10px]">Phone:</span>
                    <a href={`tel:${selectedEnquiry.phone}`} className="text-gray-200">
                      {selectedEnquiry.phone}
                    </a>
                  </div>
                  <div className="text-gray-300">
                    <span className="text-gray-500 block text-[10px]">Service / Category:</span>
                    <span>{selectedEnquiry.serviceInterest || 'General Advisory'}</span>
                  </div>
                  {selectedEnquiry.property && (
                    <div className="text-gray-300">
                      <span className="text-gray-500 block text-[10px]">Target Property:</span>
                      <span className="text-white font-sans">{selectedEnquiry.property.name}</span>
                    </div>
                  )}
                  <div className="text-gray-400 text-[11px] pt-2 border-t border-white/5">
                    Submitted: {new Date(selectedEnquiry.submittedAt).toLocaleString()}
                  </div>
                </div>

                {/* Message */}
                <div className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-2">
                  <span className="text-gray-400 block text-[10px] uppercase tracking-wider">
                    Client Message:
                  </span>
                  <p className="font-sans text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {selectedEnquiry.message || 'No written message provided.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => handleDelete(selectedEnquiry.id)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Enquiry
              </button>

              <a
                href={`mailto:${selectedEnquiry.email}?subject=Regarding your enquiry with Apex Pacific Holdings (${selectedEnquiry.enquiryRef})`}
                className="px-4 py-2 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Reply by Email</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
