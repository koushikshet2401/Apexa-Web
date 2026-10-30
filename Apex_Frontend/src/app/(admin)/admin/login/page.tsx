'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setError(data.error || 'Authentication failed. Please verify your credentials.')
        setLoading(false)
        return
      }

      // Hard navigation to ensure middleware and server components recognize cookie immediately
      window.location.href = '/admin'
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected network error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#040810] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#070E1C]/80 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#7DD3FC]/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card Container */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {/* Header Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-[#0B1528] border border-[#7DD3FC]/30 mb-4 shadow-[0_0_20px_rgba(125,211,252,0.15)]">
              <span className="font-display font-bold text-2xl text-[#7DD3FC]">A</span>
            </div>
            <h1 className="text-xl font-medium tracking-tight text-white mb-1">
              Apex Pacific Holdings
            </h1>
            <p className="text-xs uppercase tracking-[0.25em] text-[#7DD3FC] font-mono">
              Management Portal
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2"
              >
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apexpacificholdings.com"
                  autoComplete="email"
                  className="w-full bg-[#040810] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]/60 focus:ring-1 focus:ring-[#7DD3FC]/40 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#040810] border border-white/10 rounded-lg pl-10 pr-11 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#7DD3FC]/60 focus:ring-1 focus:ring-[#7DD3FC]/40 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#CBD5E1] hover:bg-white text-[#040810] font-medium py-3 px-4 rounded-lg text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(203,213,225,0.15)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#040810] border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security footnote */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] font-mono text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#7DD3FC]" />
            <span>Encrypted Session • Authorized Access Only</span>
          </div>
        </div>
      </div>
    </div>
  )
}
