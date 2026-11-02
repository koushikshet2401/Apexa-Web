import { ThreeDPhotoCarousel } from "@/components/ui/3d-carousel"

export function ThreeDPhotoCarouselDemo() {
  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="min-h-[500px] flex flex-col justify-center border border-white/10 rounded-2xl bg-[#040810]/50 backdrop-blur-xl p-4">
        <ThreeDPhotoCarousel />
      </div>
    </div>
  )
}

export default ThreeDPhotoCarouselDemo
