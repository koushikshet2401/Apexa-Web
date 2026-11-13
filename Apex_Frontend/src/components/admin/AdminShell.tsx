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
  Film,
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
  Layers,
  Globe,
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
      <div className="admin-portal min-h-screen bg-[#A3B4C4] text-[#0B1320]">
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

  // EXACTLY NINE MAIN APPROVED SIDEBAR ITEMS
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

  const isCmsSubpage =
    pathname === '/admin/settings' ||
    pathname.startsWith('/admin/homepage') ||
    pathname.startsWith('/admin/one-team') ||
    pathname.startsWith('/admin/collection-media') ||
    pathname.startsWith('/admin/countries') ||
    pathname.startsWith('/admin/services') ||
    pathname.startsWith('/admin/launches') ||
    pathname.startsWith('/admin/space-in-round') ||
    pathname.startsWith('/admin/media')

  const CMS_SUB_TABS = [
    { label: 'Settings Hub', href: '/admin/settings' },
    { label: 'Homepage Video & Copy', href: '/admin/homepage-video' },
    { label: 'One Team', href: '/admin/one-team' },
    { label: 'Collection Media', href: '/admin/collection-media' },
    { label: 'Countries', href: '/admin/countries' },
    { label: 'Services', href: '/admin/services' },
    { label: 'Launches', href: '/admin/launches' },
    { label: 'Spaces in Round', href: '/admin/space-in-round' },
    { label: 'Media Library', href: '/admin/media' },
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
      return pathname === '/admin/settings' || isCmsSubpage
    }
    return false
  }

  return (
    <div className="admin-portal min-h-screen bg-[#A3B4C4] text-[#0B1320] flex flex-col md:flex-row font-sans selection:bg-[#0B1320]/15">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-black/10 bg-[#8FA0B2] sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-black/15 flex items-center justify-center bg-[#A3B4C4] shadow-sm">
            <span className="font-display font-bold text-sm text-[#0B1320]">A</span>
          </div>
          <div>
            <h1 className="text-xs uppercase tracking-[0.2em] font-medium text-[#0B1320]">Apex Pacific</h1>
            <p className="text-[10px] tracking-widest text-[#0E2A47] uppercase font-mono font-semibold">Admin Portal</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded border border-black/10 bg-white/40 text-[#0B1320] hover:bg-white/70 transition-colors"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar for Desktop & Mobile Overlay - Sticky and Constant on Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#8FA0B2] border-r border-black/10 flex flex-col justify-between transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:max-h-screen shrink-0 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-black/10 bg-[#8FA0B2] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md border border-black/15 flex items-center justify-center bg-[#A3B4C4] shadow-sm">
                <span className="font-display font-bold text-base text-[#0B1320]">A</span>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0B1320] block">
                  Apex Pacific
                </span>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#0E2A47] font-mono font-semibold block">
                  Admin Panel
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-gray-700 hover:text-black p-1"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin User Profile Card */}
          <Link
            href="/admin/account"
            onClick={() => setMobileOpen(false)}
            className="w-full block p-2.5 rounded-lg bg-white/80 border border-black/10 hover:border-black/30 transition-all group shadow-sm"
            title="View Administrator Account & Profile"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Shield className="w-3.5 h-3.5 text-[#0E2A47] shrink-0" />
                <span className="text-[11px] font-medium text-[#0B1320] truncate group-hover:text-black transition-colors">
                  {profile?.name || profile?.email?.split('@')[0] || 'Administrator'}
                </span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/10 text-[#0B1320] font-mono tracking-wider font-semibold uppercase border border-black/15">
                {profile?.role || 'SUPER_ADMIN'}
              </span>
            </div>
            {profile?.email && (
              <p className="text-[10px] text-gray-600 truncate pl-5 font-mono mt-0.5">
                {profile.email}
              </p>
            )}
          </Link>
        </div>

        {/* Navigation Section: EXACTLY NINE CLEAN LINKS */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-black/10">
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
                    ? 'bg-white text-[#0B1320] border border-black/15 shadow-sm font-semibold'
                    : 'text-[#1E293B] hover:text-[#0B1320] hover:bg-white/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-[#0B1320]' : 'text-[#334155]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600/15 text-emerald-800 font-mono font-semibold uppercase border border-emerald-600/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-black/10 space-y-2 bg-[#8FA0B2] shrink-0">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-3.5 py-2 rounded-md text-xs text-[#1E293B] hover:text-[#0B1320] hover:bg-white/40 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Live Website
            </span>
            <span className="text-[10px] font-mono text-[#334155]">↗</span>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-md text-xs text-rose-800 hover:text-rose-950 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/25 transition-all font-medium disabled:opacity-50 cursor-pointer"
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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {isCmsSubpage && (
          <div className="w-full bg-[#8FA0B2]/95 border-b border-black/10 px-4 md:px-8 py-2.5 backdrop-blur-md sticky top-0 z-30 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#0B1320] shrink-0 flex items-center gap-1.5 mr-2">
                <Settings className="w-3.5 h-3.5 text-[#0E2A47]" />
                CMS Configuration
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {CMS_SUB_TABS.map((tab) => {
                  const isActive =
                    tab.href === '/admin/settings'
                      ? pathname === '/admin/settings'
                      : pathname.startsWith(tab.href) ||
                        (tab.href === '/admin/homepage-video' && pathname === '/admin/homepage')
                  return (
                    <Link
                      key={tab.label}
                      href={tab.href}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-medium font-mono tracking-tight transition-all shrink-0 ${
                        isActive
                          ? 'bg-white text-[#0B1320] font-bold shadow-sm border border-black/15'
                          : 'text-[#1E293B] hover:text-[#0B1320] hover:bg-white/40'
                      }`}
                    >
                      {tab.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Quick Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-black/10 rounded-xl shadow-2xl max-w-md w-full p-6 text-[#0B1320] space-y-5">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#A3B4C4] border border-black/15 flex items-center justify-center text-[#0B1320] shadow-sm">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0B1320]">Administrator Profile</h3>
                  <p className="text-xs text-gray-500">Apex Pacific Holdings</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-gray-500 hover:text-black p-1 rounded-md transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-black/5 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block">Name</span>
                <p className="text-sm font-medium text-[#0B1320]">{profile?.name || 'Apex Administrator'}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-black/5 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block">Email Address</span>
                <p className="text-xs font-mono text-[#0B1320]">{profile?.email || 'admin@apexpacificholdings.com'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-black/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block">System Role</span>
                  <span className="inline-block px-2 py-0.5 rounded bg-black/10 text-[#0B1320] font-mono text-[10px] font-semibold border border-black/15">
                    {profile?.role || 'SUPER_ADMIN'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-black/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block">Status</span>
                  <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-black/10">
              <Link
                href="/admin/account"
                onClick={() => setProfileModalOpen(false)}
                className="text-xs text-[#0B1320] font-semibold hover:underline flex items-center gap-1"
              >
                <span>Full Account Management</span>
                <span>→</span>
              </Link>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#0B1320] hover:bg-black text-xs text-white font-medium transition-colors cursor-pointer"
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
