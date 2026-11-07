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
    <Suspense fallback={<div className="min-h-screen bg-[#040810]" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  )
}
