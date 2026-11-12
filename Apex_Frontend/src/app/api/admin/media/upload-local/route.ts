// Strict R2-only endpoint compatibility wrapper.
// Permanent local disk writes to public/uploads/ are permanently disabled.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export { POST, PUT } from '@/app/api/admin/media/upload/route'
