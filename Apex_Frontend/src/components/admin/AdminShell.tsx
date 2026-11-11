'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  PlusCircle,
  Building2,
  Award,
  Archive,
  Mail,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
  CheckCircle2,
} from 'lucide-react'

interface AdminProfile {
  id: string
  email: string
  name?: string | null
  role?: string | null
  roleDescription?: string | null
  permissions?: string[]
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') return

    fetch('/api/admin/auth/me', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          router.push('/admin/login')
          return null
        }
        return res.ok ? res.json() : null
      })
      .then((data) => {
        if (data) setProfile(data)
      })
      .catch((err) => {
        console.error('Error fetching admin profile:', err)
      })
  }, [pathname, router])

  // If on login page, render clean layout without sidebar
  if (pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-[#040810] text-[#F8FAFC]">
        {children}
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      setLoggingOut(false)
    }
  }

  const currentTab = searchParams ? searchParams.get('tab') : null

  // EXACTLY NINE MAIN SIDEBAR ITEMS
  const NAV_ITEMS = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Add Project', href: '/admin/properties/new', icon: PlusCircle, badge: 'New' },
    { label: 'Current Project', href: '/admin/properties?tab=current', icon: Building2 },
    { label: 'Soldout Project', href: '/admin/properties?tab=sold', icon: Award },
    { label: 'Deleted Project', href: '/admin/properties?tab=archived', icon: Archive },
    { label: 'Messages', href: '/admin/messages', icon: Mail },
    { label: 'Team Management', href: '/admin/users', icon: Users },
    { label: 'Account Management', href: '/admin/account', icon: UserCheck },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  const isNavItemActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.label === 'Dashboard') {
      return pathname === '/admin'
    }
    if (item.label === 'Add Project') {
      return pathname === '/admin/properties/new' || pathname === '/admin/projects/new'
    }
    if (item.label === 'Current Project') {
      return (pathname === '/admin/properties' && (!currentTab || currentTab === 'current')) ||
        (pathname.startsWith('/admin/properties/') && pathname !== '/admin/properties/new')
    }
    if (item.label === 'Soldout Project') {
      return pathname === '/admin/properties' && currentTab === 'sold'
    }
    if (item.label === 'Deleted Project') {
      return pathname === '/admin/properties' && currentTab === 'archived'
    }
    if (item.label === 'Messages') {
      return pathname === '/admin/messages' || pathname.startsWith('/admin/enquiries')
    }
    if (item.label === 'Team Management') {
      return pathname === '/admin/users' || pathname.startsWith('/admin/users/') || pathname === '/admin/team'
    }
    if (item.label === 'Account Management') {
      return pathname === '/admin/account'
    }
    if (item.label === 'Settings') {
      return pathname === '/admin/settings'
    }
    return false
  }

  return (
    <div className="min-h-screen bg-[#040810] text-[#F8FAFC] flex flex-col md:flex-row font-sans selection:bg-[#7DD3FC]/20">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#070E1C] sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-[#7DD3FC]/40 flex items-center justify-center bg-[#0B1528] shadow-[0_0_12px_rgba(125,211,252,0.18)]">
            <span className="font-display font-bold text-sm text-[#7DD3FC]">A</span>
          </div>
          <div>
            <h1 className="text-xs uppercase tracking-[0.2em] font-medium text-white">Apex Pacific</h1>
            <p className="text-[10px] tracking-widest text-[#7DD3FC] uppercase font-mono">Admin Portal</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded border border-white/10 bg-[#0B1528] text-gray-300 hover:text-white transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar for Desktop & Mobile Overlay - Sticky and Constant on Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#070E1C] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:max-h-screen shrink-0 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 bg-[#070E1C] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md border border-[#7DD3FC]/40 flex items-center justify-center bg-[#0B1528] shadow-[0_0_15px_rgba(125,211,252,0.18)]">
                <span className="font-display font-bold text-base text-[#7DD3FC]">A</span>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white block">
                  Apex Pacific
                </span>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#7DD3FC] font-mono block">
                  Admin Panel
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-gray-400 hover:text-white p-1"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin User Profile Card */}
          <Link
            href="/admin/account"
            onClick={() => setMobileOpen(false)}
            className="w-full block p-2.5 rounded-lg bg-[#040810] border border-white/10 hover:border-[#7DD3FC]/40 transition-all group"
            title="View Administrator Account & Profile"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Shield className="w-3.5 h-3.5 text-[#7DD3FC] shrink-0" />
                <span className="text-[11px] font-medium text-white truncate group-hover:text-[#7DD3FC] transition-colors">
                  {profile?.name || profile?.email?.split('@')[0] || 'Administrator'}
                </span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#7DD3FC]/15 text-[#7DD3FC] font-mono tracking-wider font-semibold uppercase border border-[#7DD3FC]/20">
                {profile?.role || 'SUPER_ADMIN'}
              </span>
            </div>
            {profile?.email && (
              <p className="text-[10px] text-gray-400 truncate pl-5 font-mono mt-0.5">
                {profile.email}
              </p>
            )}
          </Link>
        </div>

        {/* Navigation Section: EXACTLY NINE CLEAN LINKS */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon
            const active = isNavItemActive(item)
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  active
                    ? 'bg-[#7DD3FC]/10 text-[#7DD3FC] border border-[#7DD3FC]/30 shadow-[0_0_12px_rgba(125,211,252,0.12)] font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-[#7DD3FC]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold uppercase border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-white/10 space-y-2 bg-[#040810]/70 shrink-0">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-3.5 py-2 rounded-md text-xs text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Live Website
            </span>
            <span className="text-[10px] font-mono text-gray-400">↗</span>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-md text-xs text-rose-400/90 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all font-medium disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Quick Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#070E1C] border border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B1528] border border-[#7DD3FC]/30 flex items-center justify-center text-[#7DD3FC] shadow-[0_0_15px_rgba(125,211,252,0.15)]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Administrator Profile</h3>
                  <p className="text-xs text-gray-400">Apex Pacific Holdings</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#040810] border border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">Name</span>
                <p className="text-sm font-medium text-white">{profile?.name || 'Apex Administrator'}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#040810] border border-white/5 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">Email Address</span>
                <p className="text-xs font-mono text-[#7DD3FC]">{profile?.email || 'admin@apexpacificholdings.com'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#040810] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">System Role</span>
                  <span className="inline-block px-2 py-0.5 rounded bg-[#7DD3FC]/15 text-[#7DD3FC] font-mono text-[10px] font-semibold border border-[#7DD3FC]/25">
                    {profile?.role || 'SUPER_ADMIN'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-[#040810] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">Status</span>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <Link
                href="/admin/account"
                onClick={() => setProfileModalOpen(false)}
                className="text-xs text-[#7DD3FC] hover:underline flex items-center gap-1 font-medium"
              >
                <span>Full Account Management</span>
                <span>→</span>
              </Link>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
