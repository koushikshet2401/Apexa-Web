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
  Archive,
  Send,
  Plus,
  UserCheck,
  AlertCircle,
  FileText,
} from 'lucide-react'

interface NoteItem {
  id: string
  note: string
  createdAt: string
  author: {
    id: string
    name: string | null
  }
}

interface ReplyItem {
  id: string
  subject: string | null
  message: string
  sentAt: string
  sender: {
    id: string
    name: string | null
  }
}

interface AdminUser {
  id: string
  name: string | null
  email: string
}

interface EnquiryItem {
  id: string
  enquiryRef: string
  name: string
  email: string
  phone: string
  country: string | null
  serviceInterest: string | null
  message: string | null
  status: 'NEW' | 'READ' | 'IN_PROGRESS' | 'CLOSED' | string
  submittedAt: string
  readAt: string | null
  closedAt: string | null
  assignedAdmin: {
    id: string
    name: string | null
    email: string
  } | null
  property: {
    id: string
    name: string
    slug: string
    locationLine: string | null
  } | null
  notes?: NoteItem[]
  replies?: ReplyItem[]
}

interface EnquiriesProps {
  initialEnquiries: EnquiryItem[]
  admins?: AdminUser[]
}

type FilterStatus = 'ALL' | 'NEW' | 'READ' | 'IN_PROGRESS' | 'CLOSED'

export default function EnquiriesManagementClient({
  initialEnquiries,
  admins = [],
}: EnquiriesProps) {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>(initialEnquiries)
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Internal Note form
  const [newNote, setNewNote] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)

  // Reply form
  const [replySubject, setReplySubject] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  // Assign form
  const [selectedAdminId, setSelectedAdminId] = useState('')
  const [assigning, setAssigning] = useState(false)

  // Close modal
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [closeReason, setCloseReason] = useState('')
  const [closing, setClosing] = useState(false)

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const filtered = enquiries.filter((e) => {
    if (filter === 'ALL') return true
    return e.status?.toUpperCase() === filter
  })

  const counts = {
    all: enquiries.length,
    new: enquiries.filter((e) => e.status?.toUpperCase() === 'NEW').length,
    read: enquiries.filter((e) => e.status?.toUpperCase() === 'READ').length,
    in_progress: enquiries.filter((e) => e.status?.toUpperCase() === 'IN_PROGRESS').length,
    closed: enquiries.filter((e) => e.status?.toUpperCase() === 'CLOSED').length,
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setEnquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        )
        if (selectedEnquiry && selectedEnquiry.id === id) {
          setSelectedEnquiry({ ...selectedEnquiry, status: newStatus })
        }
        setToast({ type: 'success', message: `Status updated to ${newStatus}` })
      } else {
        const data = await res.json()
        setToast({ type: 'error', message: data.error || 'Failed to update status' })
      }
    } catch {
      setToast({ type: 'error', message: 'Network error updating status' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAssign = async (adminId: string) => {
    if (!selectedEnquiry || !adminId) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      })
      const data = await res.json()
      if (res.ok) {
        const assigned = admins.find((a) => a.id === adminId) || null
        setEnquiries((prev) =>
          prev.map((item) =>
            item.id === selectedEnquiry.id ? { ...item, assignedAdmin: assigned } : item
          )
        )
        setSelectedEnquiry({ ...selectedEnquiry, assignedAdmin: assigned })
        setToast({ type: 'success', message: `Enquiry assigned successfully!` })
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to assign enquiry' })
      }
    } catch {
      setToast({ type: 'error', message: 'Network error assigning enquiry' })
    } finally {
      setAssigning(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEnquiry || !newNote.trim()) return
    setSubmittingNote(true)
    try {
      const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        const updatedNotes = [data.note, ...(selectedEnquiry.notes || [])]
        setSelectedEnquiry({ ...selectedEnquiry, notes: updatedNotes })
        setNewNote('')
        setToast({ type: 'success', message: 'Internal note saved' })
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to add note' })
      }
    } catch {
      setToast({ type: 'error', message: 'Network error saving note' })
    } finally {
      setSubmittingNote(false)
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEnquiry || !replyMessage.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: replySubject.trim() || undefined,
          message: replyMessage.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const updatedReplies = [data.reply, ...(selectedEnquiry.replies || [])]
        setSelectedEnquiry({
          ...selectedEnquiry,
          status: 'IN_PROGRESS',
          replies: updatedReplies,
        })
        setEnquiries((prev) =>
          prev.map((item) =>
            item.id === selectedEnquiry.id ? { ...item, status: 'IN_PROGRESS' } : item
          )
        )
        setReplyMessage('')
        setReplySubject('')
        setToast({ type: 'success', message: 'Reply sent and logged in conversation history' })
      } else {
        setToast({ type: 'error', message: data.error || 'Failed to send reply' })
      }
    } catch {
      setToast({ type: 'error', message: 'Network error sending reply' })
    } finally {
      setSendingReply(false)
    }
  }

  const handleCloseEnquiry = async () => {
    if (!selectedEnquiry) return
    setClosing(true)
    try {
      const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: closeReason.trim() || 'Resolved by advisory team' }),
      })
      if (res.ok) {
        setEnquiries((prev) =>
          prev.map((item) =>
            item.id === selectedEnquiry.id ? { ...item, status: 'CLOSED' } : item
          )
        )
        setSelectedEnquiry({ ...selectedEnquiry, status: 'CLOSED' })
        setShowCloseModal(false)
        setCloseReason('')
        setToast({ type: 'success', message: 'Enquiry safely closed' })
      } else {
        const data = await res.json()
        setToast({ type: 'error', message: data.error || 'Failed to close enquiry' })
      }
    } catch {
      setToast({ type: 'error', message: 'Network error closing enquiry' })
    } finally {
      setClosing(false)
    }
  }

  const handleReopenEnquiry = async () => {
    if (!selectedEnquiry) return
    try {
      const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}/reopen`, {
        method: 'POST',
      })
      if (res.ok) {
        setEnquiries((prev) =>
          prev.map((item) =>
            item.id === selectedEnquiry.id ? { ...item, status: 'IN_PROGRESS' } : item
          )
        )
        setSelectedEnquiry({ ...selectedEnquiry, status: 'IN_PROGRESS' })
        setToast({ type: 'success', message: 'Enquiry reopened in IN_PROGRESS state' })
      }
    } catch {
      setToast({ type: 'error', message: 'Network error reopening enquiry' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-xs font-mono transition-all animate-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-[#0B1528] border-emerald-500/40 text-emerald-300'
              : 'bg-[#0B1528] border-rose-500/40 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7DD3FC]">
              Client Engagement Desk
            </span>
          </div>
          <h1 className="text-2xl font-display font-medium text-white tracking-wide">
            Client & Investor Enquiries
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review incoming acquisition requests, private viewings, and advisory consultations with full audit integrity.
          </p>
        </div>

        {counts.new > 0 && (
          <div className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>{counts.new} New Inquiries Awaiting Review</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#070E1C] border border-white/10 w-fit overflow-x-auto">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
            filter === 'ALL'
              ? 'bg-[#0B1528] text-[#7DD3FC] border border-[#7DD3FC]/30 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setFilter('NEW')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
            filter === 'NEW'
              ? 'bg-[#0B1528] text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          New ({counts.new})
        </button>
        <button
          onClick={() => setFilter('READ')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
            filter === 'READ'
              ? 'bg-[#0B1528] text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Read ({counts.read})
        </button>
        <button
          onClick={() => setFilter('IN_PROGRESS')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
            filter === 'IN_PROGRESS'
              ? 'bg-[#0B1528] text-sky-300 border border-sky-500/30 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          In Progress ({counts.in_progress})
        </button>
        <button
          onClick={() => setFilter('CLOSED')}
          className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all ${
            filter === 'CLOSED'
              ? 'bg-[#0B1528] text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Closed ({counts.closed})
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
                  <th className="py-3 px-5">Assigned To</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Quick Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((enq) => {
                  const dateStr = new Date(enq.submittedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })

                  const normStatus = (enq.status || 'NEW').toUpperCase()

                  return (
                    <tr
                      key={enq.id}
                      onClick={() => {
                        setSelectedEnquiry(enq)
                        if (enq.assignedAdmin) {
                          setSelectedAdminId(enq.assignedAdmin.id)
                        } else {
                          setSelectedAdminId('')
                        }
                      }}
                      className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                        normStatus === 'NEW' ? 'bg-rose-500/[0.03]' : ''
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

                      <td className="py-3.5 px-5 text-gray-300 font-mono text-[11px]">
                        {enq.assignedAdmin ? (
                          <span className="text-[#CBD5E1]">{enq.assignedAdmin.name || enq.assignedAdmin.email}</span>
                        ) : (
                          <span className="text-gray-600">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 font-mono text-gray-400 text-[11px]">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                            normStatus === 'NEW'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : normStatus === 'READ'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : normStatus === 'IN_PROGRESS'
                              ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {normStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        {normStatus === 'NEW' && (
                          <button
                            onClick={() => handleUpdateStatus(enq.id, 'READ')}
                            className="px-2 py-1 rounded bg-[#040810] hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-[10px] font-mono text-amber-300 cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                        {normStatus !== 'IN_PROGRESS' && normStatus !== 'CLOSED' && (
                          <button
                            onClick={() => handleUpdateStatus(enq.id, 'IN_PROGRESS')}
                            className="px-2 py-1 rounded bg-[#040810] hover:bg-sky-500/10 border border-white/10 hover:border-sky-500/30 text-[10px] font-mono text-sky-300 cursor-pointer"
                          >
                            In Progress
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
      </div>

      {/* Slide-out Enquiry Detail Drawer */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-[#070E1C] border-l border-white/10 h-full p-6 md:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl space-y-6">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7DD3FC] block mb-1">
                    Enquiry Details & Conversation
                  </span>
                  <h3 className="text-lg font-medium text-white">{selectedEnquiry.enquiryRef}</h3>
                </div>
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="p-2 rounded-lg bg-[#040810] border border-white/10 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status & Lifecycle Controls */}
              <div className="p-3.5 rounded-lg bg-[#040810] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono">Status:</span>
                  <div className="flex items-center gap-1.5">
                    {(['NEW', 'READ', 'IN_PROGRESS'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedEnquiry.id, st)}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                          selectedEnquiry.status?.toUpperCase() === st
                            ? 'bg-[#7DD3FC]/20 text-[#7DD3FC] border border-[#7DD3FC]/40 font-semibold'
                            : 'text-gray-400 hover:text-white bg-[#070E1C]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                    {selectedEnquiry.status?.toUpperCase() === 'CLOSED' ? (
                      <button
                        onClick={handleReopenEnquiry}
                        className="px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 cursor-pointer"
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowCloseModal(true)}
                        className="px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 cursor-pointer"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>

                {/* Assignment Dropdown */}
                {admins.length > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Assigned:
                    </span>
                    <select
                      value={selectedAdminId}
                      onChange={(e) => {
                        setSelectedAdminId(e.target.value)
                        handleAssign(e.target.value)
                      }}
                      disabled={assigning}
                      className="bg-[#070E1C] border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                    >
                      <option value="">Unassigned</option>
                      {admins.map((adm) => (
                        <option key={adm.id} value={adm.id}>
                          {adm.name || adm.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Client Info Grid */}
              <div className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-3 text-xs font-mono">
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
                {selectedEnquiry.country && (
                  <div className="text-gray-300">
                    <span className="text-gray-500 block text-[10px]">Country:</span>
                    <span>{selectedEnquiry.country}</span>
                  </div>
                )}
                <div className="text-gray-300">
                  <span className="text-gray-500 block text-[10px]">Service / Category:</span>
                  <span>{selectedEnquiry.serviceInterest || 'General Advisory'}</span>
                </div>
                {selectedEnquiry.property && (
                  <div className="text-gray-300">
                    <span className="text-gray-500 block text-[10px]">Target Project:</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-white font-sans font-medium">{selectedEnquiry.property.name}</span>
                      <a
                        href={`/admin/properties/${selectedEnquiry.property.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#7DD3FC] hover:underline flex items-center gap-1 text-[11px]"
                      >
                        View Project <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
                <div className="text-gray-400 text-[11px] pt-2 border-t border-white/5">
                  Submitted: {new Date(selectedEnquiry.submittedAt).toLocaleString()}
                </div>
              </div>

              {/* Client Original Message */}
              <div className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-2">
                <span className="text-gray-400 block text-[10px] font-mono uppercase tracking-wider">
                  Client Inbound Message:
                </span>
                <p className="font-sans text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {selectedEnquiry.message || 'No written message provided.'}
                </p>
              </div>

              {/* Email Replies Thread */}
              <div className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#7DD3FC] flex items-center gap-1.5 uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5" /> Conversation Replies ({selectedEnquiry.replies?.length || 0})
                  </span>
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    placeholder={`Subject (Default: Regarding your enquiry ${selectedEnquiry.enquiryRef})`}
                    className="w-full bg-[#070E1C] border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
                  />
                  <textarea
                    rows={3}
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Compose official email response to client..."
                    className="w-full bg-[#070E1C] border border-white/10 rounded p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sendingReply || !replyMessage.trim()}
                      className="px-3.5 py-1.5 rounded bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>{sendingReply ? 'Sending...' : 'Send Official Reply'}</span>
                    </button>
                  </div>
                </form>

                {/* Thread of replies */}
                {selectedEnquiry.replies && selectedEnquiry.replies.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {selectedEnquiry.replies.map((rep) => (
                      <div key={rep.id} className="p-3 rounded bg-[#070E1C] border border-white/5 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                          <span className="text-[#7DD3FC]">From: {rep.sender?.name || 'Advisory Desk'}</span>
                          <span>{new Date(rep.sentAt).toLocaleString()}</span>
                        </div>
                        {rep.subject && (
                          <div className="font-medium text-white text-[11px]">Subject: {rep.subject}</div>
                        )}
                        <p className="text-gray-300 whitespace-pre-wrap">{rep.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              <div className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-4">
                <span className="text-xs font-mono text-[#7DD3FC] flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5" /> Internal Advisory Notes ({selectedEnquiry.notes?.length || 0})
                </span>

                <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-white/5">
                  <textarea
                    rows={2}
                    required
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add confidential internal note (only visible to team)..."
                    className="w-full bg-[#070E1C] border border-white/10 rounded p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingNote || !newNote.trim()}
                      className="px-3.5 py-1.5 rounded bg-[#0B1528] border border-white/10 hover:border-white/20 text-xs text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{submittingNote ? 'Saving...' : 'Add Note'}</span>
                    </button>
                  </div>
                </form>

                {selectedEnquiry.notes && selectedEnquiry.notes.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {selectedEnquiry.notes.map((note) => (
                      <div key={note.id} className="p-3 rounded bg-[#070E1C] border border-white/5 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                          <span className="text-amber-300">{note.author?.name || 'Admin'}</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap">{note.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-mono">
                Physical deletion disabled per compliance policy.
              </span>
              <a
                href={`mailto:${selectedEnquiry.email}?subject=Regarding your enquiry with Apex Pacific Holdings (${selectedEnquiry.enquiryRef})`}
                className="px-4 py-2 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] text-xs font-medium tracking-wide flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open Mail Client</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Close Enquiry Modal */}
      {showCloseModal && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-white">
              <Archive className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold">Close Enquiry</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Closing enquiry <strong className="text-white font-mono">{selectedEnquiry.enquiryRef}</strong> marks it resolved and archives it from active review while preserving all communications and internal notes.
            </p>
            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1">
                Resolution Reason / Summary
              </label>
              <input
                type="text"
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="e.g. Consultation completed; investor dossier dispatched"
                className="w-full bg-[#040810] border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 rounded-lg bg-[#0B1528] text-xs text-gray-300 hover:text-white border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseEnquiry}
                disabled={closing}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium disabled:opacity-50"
              >
                {closing ? 'Closing...' : 'Confirm & Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
