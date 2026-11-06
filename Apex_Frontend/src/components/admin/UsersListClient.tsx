'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Trash2,
  X,
} from 'lucide-react'

interface AdminUserItem {
  id: string
  email: string
  name?: string | null
  isActive: boolean
  lastLoginAt?: string | null
  createdAt: string
  role?: {
    id: string
    name: string
    description?: string | null
  } | null
}

const ROLES_LIST = [
  { name: 'SUPER_ADMIN', label: 'Super Administrator', desc: 'Full system access & user management' },
  { name: 'PROPERTY_MANAGER', label: 'Property Manager', desc: 'Properties, media, and deal closures' },
  { name: 'CONTENT_EDITOR', label: 'Content Editor', desc: 'Public property & CMS content editing' },
  { name: 'ENQUIRY_ADVISOR', label: 'Enquiry Advisor', desc: 'Client enquiries & customer support' },
  { name: 'COMPLIANCE_OFFICER', label: 'Compliance Officer', desc: 'Audit logs & financial read-only access' },
]

export default function UsersListClient() {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Create User Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('PROPERTY_MANAGER')
  const [submitting, setSubmitting] = useState(false)

  // Delete User Dialog
  const [userToDelete, setUserToDelete] = useState<AdminUserItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        setErrorMsg('Failed to load administrators')
      }
    } catch {
      setErrorMsg('Network error fetching team members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role: selectedRole,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create administrator.')
        setSubmitting(false)
        return
      }

      setSuccessMsg(`Administrator account created for ${data.email}.`)
      setName('')
      setEmail('')
      setPassword('')
      setCreateModalOpen(false)
      fetchUsers()
    } catch {
      setErrorMsg('Network error creating administrator.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    setDeleting(true)
    setErrorMsg(null)

    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userToDelete.id))
        setUserToDelete(null)
        setSuccessMsg('Administrator account removed successfully.')
      } else {
        setErrorMsg(data.error || 'Failed to delete administrator.')
      }
    } catch {
      setErrorMsg('Network error deleting administrator.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-[#7DD3FC]" />
            <h1 className="text-xl md:text-2xl font-medium tracking-tight text-white">
              Team & Role-Based Access
            </h1>
          </div>
          <p className="text-xs text-gray-400 font-mono tracking-wide">
            Manage administrative team members, security credentials, and granular role assignments.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] font-medium text-xs tracking-wider uppercase transition-all duration-150 shadow-[0_0_15px_rgba(203,213,225,0.15)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Administrator</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Team Members Table */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#7DD3FC]" />
            <span className="text-xs uppercase font-mono tracking-wider text-white">
              Authorized Personnel ({users.length})
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 text-xs font-mono">
            Loading team members...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs font-mono">
            No administrators found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#0B1528]/50 text-gray-400 font-mono uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Administrator</th>
                  <th className="py-3.5 px-5">Assigned Role</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Last Activity</th>
                  <th className="py-3.5 px-5">Created</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {users.map((user) => {
                  const roleName = user.role?.name || 'SUPER_ADMIN'
                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-medium text-white text-sm">
                          {user.name || 'Administrative User'}
                        </div>
                        <div className="text-gray-400 font-mono text-[11px] mt-0.5">
                          {user.email}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#7DD3FC]/10 border border-[#7DD3FC]/25 text-[#7DD3FC] font-mono text-[10px] font-semibold tracking-wider uppercase">
                          <Shield className="w-3 h-3" />
                          <span>{roleName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-mono text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-gray-400 font-mono text-[11px]">
                        {user.lastLoginAt ? (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-gray-500" />
                            {new Date(user.lastLoginAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-600">Pending Login</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-gray-400 font-mono text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="p-1.5 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Administrator"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Role Reference Section */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6">
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#7DD3FC] mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Configurable Role Hierarchy Reference
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES_LIST.map((r) => (
            <div key={r.name} className="p-4 rounded-lg bg-[#040810] border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{r.label}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 uppercase">
                  {r.name}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Administrator Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#070E1C] border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Invite New Administrator
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@apexpacificholdings.com"
                  className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]/60 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                  Temporary Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]/60 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                  Initial Role Assignment
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-[#040810] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#7DD3FC]/60 font-mono"
                >
                  {ROLES_LIST.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.label} ({r.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#CBD5E1] hover:bg-white text-[#040810] font-medium text-xs tracking-wider uppercase transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#070E1C] border border-white/10 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-2">Delete Administrator?</h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to remove administrator <strong className="text-white">{userToDelete.email}</strong>? This action will revoke all access immediately.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-2 rounded-lg text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs transition-colors disabled:opacity-50"
              >
                {deleting ? 'Removing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
