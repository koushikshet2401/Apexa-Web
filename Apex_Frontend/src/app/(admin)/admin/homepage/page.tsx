import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function AdminHomepageContentPage() {
  redirect('/admin/homepage-video')
}
