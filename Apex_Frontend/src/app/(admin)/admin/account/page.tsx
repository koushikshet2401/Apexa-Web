'use client'

import React, { useState, useEffect } from 'react'
import { Shield, User, Mail, Lock, CheckCircle2, AlertCircle, Save, KeyRound } from 'lucide-react'

export default function AccountManagementPage() {
  const [profile, setProfile] = useState<{
    id: string
    email: string
    name: string | null
    role: string | null
    roleDescription: string | null
  } | null>(null)

  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProfile(data)
          setName(data.name || '')
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setToast(null)

    if (newPassword && newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'New password and confirm password do not match.' })
      return
    }

    if (newPassword && !currentPassword) {
      setToast({ type: 'error', message: 'Please provide your current password to set a new password.' })
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/admin/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          ...(newPassword ? { currentPassword, newPassword } : {}),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update account')
      }

      setToast({ type: 'success', message: 'Account information successfully updated!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      if (data.admin) {
        setProfile((prev) => (prev ? { ...prev, name: data.admin.name } : null))
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'An error occurred while saving.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center text-sm text-gray-400 font-mono">
        Loading account details...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-[#7DD3FC]" />
          <h1 className="text-xl font-bold text-white tracking-wide font-display">Account Management</h1>
        </div>
        <p className="text-xs text-gray-400">
          Manage your administrator profile, security credentials, and system settings.
        </p>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-lg text-xs flex items-center gap-2.5 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Account Profile Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Details Overview */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="w-12 h-12 rounded-xl bg-[#0B1528] border border-[#7DD3FC]/30 flex items-center justify-center text-[#7DD3FC] shadow-[0_0_15px_rgba(125,211,252,0.15)]">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">{profile?.name || 'Administrator'}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#7DD3FC]/15 text-[#7DD3FC] font-mono font-semibold uppercase border border-[#7DD3FC]/25">
                {profile?.role || 'SUPER_ADMIN'}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 block mb-0.5">Email</span>
              <p className="text-gray-300 font-mono text-[11px] truncate">{profile?.email}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 block mb-0.5">Role Description</span>
              <p className="text-gray-400 text-[11px]">
                {profile?.roleDescription || 'Full administrative control over properties, deals, and settings.'}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500 block mb-0.5">Status</span>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active & Authenticated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Password Form */}
        <div className="md:col-span-2 bg-[#070E1C] border border-white/10 rounded-xl p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-white mb-1">Profile Information</h2>
              <p className="text-xs text-gray-400">Update your account name.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-300 block mb-1.5 font-medium">Administrator Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#040810] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                    placeholder="e.g. Apex Administrator"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 block mb-1.5 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full bg-[#040810]/50 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-400 font-mono cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">Primary login email is managed securely.</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-[#7DD3FC]" />
                <h2 className="text-sm font-semibold text-white">Change Password</h2>
              </div>
              <p className="text-xs text-gray-400 mb-3">Leave blank if you do not wish to update your password.</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-300 block mb-1.5 font-medium">Current Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#040810] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-300 block mb-1.5 font-medium">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-[#040810] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                        placeholder="Min 8 characters"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-300 block mb-1.5 font-medium">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#040810] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-[#040810] font-semibold text-xs transition-all shadow-[0_0_15px_rgba(125,211,252,0.2)] disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
