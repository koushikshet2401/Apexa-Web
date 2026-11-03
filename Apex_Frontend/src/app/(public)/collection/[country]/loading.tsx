import { OrbitalLoader } from '@/components/ui/orbital-loader'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] bg-[#040810] flex flex-col items-center justify-center pointer-events-auto select-none">
      <OrbitalLoader size="md" message="Loading Collection..." messagePlacement="bottom" />
    </div>
  )
}
