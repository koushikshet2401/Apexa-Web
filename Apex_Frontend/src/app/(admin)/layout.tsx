import type { Metadata } from 'next'
import { Suspense } from 'react'
import AdminShell from '@/components/admin/AdminShell'

export const metadata: Metadata = {
  title: 'Admin Portal | Apex Pacific Holdings',
  description: 'Apex Pacific Holdings Administration and Content Management Portal',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<div className="admin-portal min-h-screen bg-[#1F2F33]" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  )
}
