'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Globe2,
  Briefcase,
  Flame,
  Orbit,
  Home,
  Mail,
  Image as ImageIcon,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Properties', href: '/admin/properties', icon: Building2 },
  { name: 'Countries', href: '/admin/countries', icon: Globe2 },
  { name: 'Services', href: '/admin/services', icon: Briefcase },
  { name: 'Latest Launches', href: '/admin/launches', icon: Flame },
  { name: 'Space in Round', href: '/admin/space-in-round', icon: Orbit },
  { name: 'Homepage', href: '/admin/homepage', icon: Home },
  { name: 'Enquiries', href: '/admin/enquiries', icon: Mail },
  { name: 'Media', href: '/admin/media', icon: ImageIcon },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

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
      })
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#040810] text-[#F8FAFC] flex flex-col md:flex-row font-sans selection:bg-[#7DD3FC]/20">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#070E1C] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center bg-[#0B1528]">
            <span className="font-display font-bold text-sm text-[#7DD3FC]">A</span>
          </div>
          <div>
            <h1 className="text-xs uppercase tracking-[0.2em] font-medium text-white">Apex Pacific</h1>
            <p className="text-[10px] tracking-widest text-[#7DD3FC] uppercase font-mono">Admin Portal</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded border border-white/10 bg-[#0B1528] text-gray-300 hover:text-white"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#070E1C] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md border border-[#7DD3FC]/30 flex items-center justify-center bg-[#0B1528] shadow-[0_0_15px_rgba(125,211,252,0.15)]">
                <span className="font-display font-bold text-base text-[#7DD3FC]">A</span>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white block">
                  Apex Pacific
                </span>
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#7DD3FC] font-mono block">
                  Holdings
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#040810] border border-white/5">
            <Shield className="w-3.5 h-3.5 text-[#7DD3FC]" />
            <span className="text-[10px] uppercase tracking-wider font-mono text-gray-400">
              Authenticated Admin
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#7DD3FC]/10 text-[#7DD3FC] border border-[#7DD3FC]/30 shadow-[0_0_12px_rgba(125,211,252,0.12)] font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#7DD3FC]' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 space-y-2 bg-[#040810]/60">
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
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-md text-xs text-rose-400/90 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all font-medium disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        <div className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
