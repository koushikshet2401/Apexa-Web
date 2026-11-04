import { OrbitalLoader } from '@/components/ui/orbital-loader'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] bg-[#FBF9F6] text-[#0B1325] dark:bg-[#040810] dark:text-[#F8FAFC] flex flex-col items-center justify-center pointer-events-auto select-none transition-colors">
      <OrbitalLoader size="md" message="Entering Residence..." messagePlacement="bottom" />
    </div>
  )
}
