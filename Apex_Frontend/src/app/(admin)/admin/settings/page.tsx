'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Database,
  Save,
  CheckCircle2,
  Film,
  Layers,
  Building2,
  Sparkles,
  Orbit,
  FolderOpen,
  ChevronRight,
  FileText,
} from 'lucide-react'

const CMS_SECTIONS = [
  {
    title: 'Homepage Video & Media',
    description: 'Manage the master homepage background video, poster frame, and player behavior.',
    href: '/admin/homepage-video',
    icon: Film,
    badge: 'Hero Video',
  },
  {
    title: 'Homepage Section Copy',
    description: 'Edit Unveil, Collection, Spaces in Round, and Private Advisory headings and descriptions.',
    href: '/admin/homepage',
    icon: FileText,
    badge: 'Editorial Copy',
  },
  {
    title: 'One Team, End to End',
    description: 'Configure the 4 architectural category cards, center video reel, and section copy.',
    href: '/admin/one-team',
    icon: Layers,
    badge: 'One Team CMS',
  },
  {
    title: 'Country Collections Media',
    description: 'Manage independent hero videos and cover artwork for UAE, Thailand, Malaysia, Australia, and Georgia.',
    href: '/admin/collection-media',
    icon: Globe,
    badge: 'Destinations',
  },
  {
    title: 'Countries Directory',
    description: 'Edit country tags, descriptions, regional classifications, and display ordering.',
    href: '/admin/countries',
    icon: Building2,
    badge: '5 Countries',
  },
  {
    title: 'Advisory Services',
    description: 'Manage Luxury Villas, Commercial, Sky Residences, and Waterfront services and deliverables.',
    href: '/admin/services',
    icon: Shield,
    badge: '4 Services',
  },
  {
    title: 'Featured Launches Stack',
    description: 'Curate properties for the pinned cinematic scroll stack and arrange display order.',
    href: '/admin/launches',
    icon: Sparkles,
    badge: 'Cinematic Stack',
  },
  {
    title: 'Spaces in the Round',
    description: 'Curate the 3D rotating carousel cards, assign properties, and set display order.',
    href: '/admin/space-in-round',
    icon: Orbit,
    badge: '3D Carousel',
  },
  {
    title: 'Cloudflare R2 Media Library',
    description: 'Browse, inspect, upload, and organize all property images, videos, and layouts in Cloudflare R2.',
    href: '/admin/media',
    icon: FolderOpen,
    badge: 'R2 Storage',
  },
]

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState('Apex Pacific Holdings')
  const [defaultCurrency, setDefaultCurrency] = useState('AED')
  const [inquiryNotifications, setInquiryNotifications] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-[#7DD3FC]" />
          <h1 className="text-xl font-bold text-white tracking-wide font-display">Settings</h1>
        </div>
        <p className="text-xs text-gray-400">
          General application preferences, default currencies, and notification settings.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings successfully updated.</span>
        </div>
      )}

      {/* Website CMS & Content Management Quick Hub */}
      <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#7DD3FC]" />
            <h2 className="text-sm font-semibold text-white">Website CMS &amp; Content Management</h2>
          </div>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
            All Content Database-Driven
          </span>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          Manage all public website content, hero videos, editorial text, country collections, services, launches, and media without editing code or database records.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {CMS_SECTIONS.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.title}
                href={section.href}
                className="group p-4 rounded-xl bg-[#040810] border border-white/10 hover:border-[#7DD3FC]/50 hover:bg-white/[0.03] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#7DD3FC] group-hover:bg-[#7DD3FC]/15 group-hover:border-[#7DD3FC]/30 transition-all">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10 uppercase tracking-wider">
                      {section.badge}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-white group-hover:text-[#7DD3FC] transition-colors mb-1">
                    {section.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    {section.description}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#7DD3FC] group-hover:translate-x-0.5 transition-transform">
                  <span>Manage Content</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand & Platform */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Globe className="w-4 h-4 text-[#7DD3FC]" />
            <h2 className="text-sm font-semibold text-white">Platform Identity</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 block mb-1.5 font-medium">Platform Title</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 block mb-1.5 font-medium">Primary Operational Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full bg-[#040810] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7DD3FC]"
              >
                <option value="AED">AED - United Arab Emirates Dirham</option>
                <option value="USD">USD - United States Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="THB">THB - Thai Baht</option>
                <option value="MYR">MYR - Malaysian Ringgit</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="GEL">GEL - Georgian Lari</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications & Communications */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Bell className="w-4 h-4 text-[#7DD3FC]" />
            <h2 className="text-sm font-semibold text-white">Notifications & Alerts</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-[#040810] border border-white/5 cursor-pointer">
              <div>
                <span className="text-xs font-medium text-white block">Email Enquiry Notifications</span>
                <span className="text-[11px] text-gray-400">Receive alert when customer submits a website enquiry.</span>
              </div>
              <input
                type="checkbox"
                checked={inquiryNotifications}
                onChange={(e) => setInquiryNotifications(e.target.checked)}
                className="rounded border-white/20 text-[#7DD3FC] focus:ring-0 bg-transparent w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* System & Database Health */}
        <div className="bg-[#070E1C] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Database className="w-4 h-4 text-[#7DD3FC]" />
            <h2 className="text-sm font-semibold text-white">System Status</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#040810] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-mono text-gray-500">Database Engine</span>
              <p className="text-emerald-400 font-mono text-[11px]">PostgreSQL 16 (Online)</p>
            </div>
            <div className="p-3 rounded-lg bg-[#040810] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-mono text-gray-500">Schema Migrations</span>
              <p className="text-emerald-400 font-mono text-[11px]">Synchronized (v7)</p>
            </div>
            <div className="p-3 rounded-lg bg-[#040810] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-mono text-gray-500">Security Architecture</span>
              <p className="text-[#7DD3FC] font-mono text-[11px]">RBAC + JWT Lax</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-[#040810] font-semibold text-xs transition-all shadow-[0_0_15px_rgba(125,211,252,0.2)] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  )
}
