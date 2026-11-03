import { OrbitalLoader } from '@/components/ui/orbital-loader'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#040810] flex flex-col items-center justify-center pointer-events-auto select-none">
      <OrbitalLoader size="md" message="Apex Pacific Holdings" messagePlacement="bottom" />
    </div>
  )
}
