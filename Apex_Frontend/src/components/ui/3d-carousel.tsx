"use client"

import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  AnimatePresence,
  animate,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/providers/ThemeProvider"
import { themeTokens } from "@/lib/theme"

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

type UseMediaQueryOptions = {
  defaultValue?: boolean
  initializeWithValue?: boolean
}

const IS_SERVER = typeof window === "undefined"

export function useMediaQuery(
  query: string,
  {
    defaultValue = false,
  }: UseMediaQueryOptions = {}
): boolean {
  const [matches, setMatches] = useState<boolean>(defaultValue)

  useEffect(() => {
    if (typeof window === "undefined") return
    const matchMedia = window.matchMedia(query)
    setMatches(matchMedia.matches)

    const handleChange = () => {
      setMatches(matchMedia.matches)
    }

    matchMedia.addEventListener("change", handleChange)

    return () => {
      matchMedia.removeEventListener("change", handleChange)
    }
  }, [query])

  return matches
}

export interface CarouselCardItem {
  id?: string
  image: string
  title?: string
  subtitle?: string
  tag?: string
  href?: string
  cardLabel?: string
  city?: string
  country?: string
}

const defaultStockImages = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504615755583-2916b52192a3?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80&auto=format&fit=crop",
]

const duration = 0.15
const transition = { duration, ease: [0.32, 0.72, 0, 1] as const }
const transitionOverlay = { duration: 0.5, ease: [0.32, 0.72, 0, 1] as const }

export interface CarouselProps {
  handleClick: (imgUrl: string, index: number, item?: CarouselCardItem) => void
  controls: any
  cards: (string | CarouselCardItem)[]
  isCarouselActive: boolean
  renderItem?: (item: CarouselCardItem, index: number, radius: number) => React.ReactNode
  autoRotateSpeed?: number
  onRotateRef?: React.MutableRefObject<((delta: number) => void) | null>
}

interface CarouselCardProps {
  card: string | CarouselCardItem
  index: number
  faceCount: number
  faceWidth: number
  radius: number
  rotation: any
  handleClick: (imgUrl: string, index: number, item?: CarouselCardItem) => void
  renderItem?: (item: CarouselCardItem, index: number, radius: number) => React.ReactNode
}

const CarouselCard = memo(
  ({
    card,
    index,
    faceCount,
    faceWidth,
    radius,
    rotation,
    handleClick,
    renderItem,
  }: CarouselCardProps) => {
    const imgUrl = typeof card === "string" ? card : card.image
    const itemObj: CarouselCardItem =
      typeof card === "string" ? { image: card } : card
    const angleBase = index * (360 / faceCount)

    // Calculate dynamic visibility and opacity based on angle from camera
    // Any card whose angle is > 85 deg or < -85 deg is facing away and completely culled
    const cardOpacity = useTransform(rotation, (rot: number) => {
      let angle = (angleBase + rot) % 360
      if (angle > 180) angle -= 360
      if (angle < -180) angle += 360
      const absAngle = Math.abs(angle)
      if (absAngle >= 84) return 0
      if (absAngle <= 65) return 1
      return (84 - absAngle) / 19
    })

    const pointerEvents = useTransform(cardOpacity, (op: number) =>
      op > 0.4 ? "auto" : "none"
    )

    return (
      <motion.div
        suppressHydrationWarning
        key={`key-${imgUrl}-${index}`}
        className="absolute flex h-full origin-center items-center justify-center rounded-xl p-1 sm:p-2"
        style={{
          width: `${faceWidth}px`,
          transform: `rotateY(${angleBase}deg) translateZ(${radius}px)`,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          opacity: cardOpacity,
          pointerEvents,
        }}
        onClick={() => handleClick(imgUrl, index, itemObj)}
      >
        {renderItem ? (
          renderItem(itemObj, index, radius)
        ) : (
          <motion.img
            src={imgUrl}
            alt={itemObj.title || `keyword_${index} ${imgUrl}`}
            layoutId={`img-${imgUrl}`}
            className="pointer-events-none w-full rounded-xl object-cover aspect-square shadow-xl select-none"
            initial={{ filter: "blur(4px)" }}
            layout="position"
            animate={{ filter: "blur(0px)" }}
            transition={transition}
          />
        )}
      </motion.div>
    )
  }
)
CarouselCard.displayName = "CarouselCard"

const Carousel = memo(
  ({
    handleClick,
    controls,
    cards,
    isCarouselActive,
    renderItem,
    autoRotateSpeed = 0,
    onRotateRef,
  }: CarouselProps) => {
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
      setIsMounted(true)
    }, [])
    const isScreenSizeSm = useMediaQuery("(max-width: 640px)")
    const effectiveScreenSizeSm = isMounted ? isScreenSizeSm : false
    // Tuned cylinder widths: on mobile 880px allows 3 cards (~146px each) to fit cleanly without edge clipping
    const cylinderWidth = effectiveScreenSizeSm ? 880 : 1500
    const faceCount = Math.max(cards.length, 1)
    const faceWidth = cylinderWidth / faceCount
    const radius = cylinderWidth / (2 * Math.PI)
    const rotation = useMotionValue(0)
    const transform = useTransform(
      rotation,
      (value) => `rotate3d(0, 1, 0, ${value}deg)`
    )

    const isHoveredRef = useRef(false)
    const isDraggingRef = useRef(false)

    // Expose programmatic rotation for Prev/Next controls
    useEffect(() => {
      if (onRotateRef) {
        onRotateRef.current = (delta: number) => {
          const current = rotation.get()
          animate(rotation, current + delta, {
            type: "spring",
            stiffness: 140,
            damping: 24,
            mass: 0.1,
          })
        }
      }
    }, [onRotateRef, rotation])

    // Optional gentle auto-rotation when user is not dragging or hovering
    useEffect(() => {
      if (autoRotateSpeed <= 0) return
      let lastTime: number | null = null
      let animId: number

      const loop = (now: number) => {
        if (lastTime !== null && !isHoveredRef.current && !isDraggingRef.current) {
          const deltaSec = (now - lastTime) / 1000
          if (deltaSec > 0 && deltaSec < 0.1) {
            rotation.set(rotation.get() + autoRotateSpeed * deltaSec)
          }
        }
        lastTime = now
        animId = requestAnimationFrame(loop)
      }

      animId = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(animId)
    }, [autoRotateSpeed, rotation])

    return (
      <div
        suppressHydrationWarning
        className="flex h-full items-center justify-center bg-transparent"
        style={{
          perspective: effectiveScreenSizeSm ? "850px" : "1200px",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        onMouseEnter={() => {
          isHoveredRef.current = true
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false
        }}
      >
        <motion.div
          drag={isCarouselActive ? "x" : false}
          className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
          style={{
            transform,
            width: cylinderWidth,
            transformStyle: "preserve-3d",
          }}
          onDragStart={() => {
            isDraggingRef.current = true
          }}
          onDrag={(_, info) => {
            if (isCarouselActive) {
              rotation.set(rotation.get() + info.offset.x * 0.08)
            }
          }}
          onDragEnd={(_, info) => {
            isDraggingRef.current = false
            if (isCarouselActive) {
              const currentRot = rotation.get()
              const targetRot = currentRot + info.velocity.x * 0.08
              animate(rotation, targetRot, {
                type: "spring",
                stiffness: 120,
                damping: 25,
                mass: 0.1,
              })
            }
          }}
          animate={controls}
        >
          {cards.map((card, i) => (
            <CarouselCard
              key={`card-${typeof card === "string" ? card : card.image}-${i}`}
              card={card}
              index={i}
              faceCount={faceCount}
              faceWidth={faceWidth}
              radius={radius}
              rotation={rotation}
              handleClick={handleClick}
              renderItem={renderItem}
            />
          ))}
        </motion.div>
      </div>
    )
  }
)
Carousel.displayName = "Carousel"

export interface ThreeDPhotoCarouselProps {
  cards?: (string | CarouselCardItem)[]
  onItemClick?: (item: CarouselCardItem, index: number) => void
  renderItem?: (item: CarouselCardItem, index: number, radius: number) => React.ReactNode
  enableLightbox?: boolean
  autoRotateSpeed?: number
  showControls?: boolean
  className?: string
  heightClassName?: string
  isLight?: boolean
}

function ThreeDPhotoCarousel({
  cards: customCards,
  onItemClick,
  renderItem,
  enableLightbox = true,
  autoRotateSpeed = 0,
  showControls = false,
  className,
  heightClassName = "h-[420px] sm:h-[480px]",
  isLight: isLightProp,
}: ThreeDPhotoCarouselProps = {}) {
  const themeContext = useTheme()
  const activeIsLight = isLightProp !== undefined ? isLightProp : (themeContext?.isLight ?? false)
  const [activeImg, setActiveImg] = useState<string | null>(null)
  const [isCarouselActive, setIsCarouselActive] = useState(true)
  const controls = useAnimation()
  const rotateRef = useRef<((delta: number) => void) | null>(null)

  const cards = useMemo(() => {
    if (customCards && customCards.length > 0) return customCards
    return defaultStockImages
  }, [customCards])

  const handleClick = (imgUrl: string, index: number, item?: CarouselCardItem) => {
    if (onItemClick && item) {
      onItemClick(item, index)
      return
    }

    if (enableLightbox) {
      setActiveImg(imgUrl)
      setIsCarouselActive(false)
      controls.stop()
    }
  }

  const handleClose = () => {
    setActiveImg(null)
    setIsCarouselActive(true)
  }

  const handlePrev = () => {
    const angleStep = 360 / Math.max(cards.length, 1)
    rotateRef.current?.(-angleStep)
  }

  const handleNext = () => {
    const angleStep = 360 / Math.max(cards.length, 1)
    rotateRef.current?.(angleStep)
  }

  return (
    <motion.div layout className={`relative w-full ${className || ""}`}>
      <AnimatePresence mode="sync">
        {activeImg && enableLightbox && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            layoutId={`img-container-${activeImg}`}
            layout="position"
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 m-5 md:m-36 lg:mx-[19rem] rounded-3xl cursor-pointer"
            style={{ willChange: "opacity" }}
            transition={transitionOverlay}
          >
            <motion.img
              layoutId={`img-${activeImg}`}
              src={activeImg}
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-cover"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.4,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              style={{
                willChange: "transform",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`relative ${heightClassName} w-full overflow-visible`}>
        <Carousel
          handleClick={handleClick}
          controls={controls}
          cards={cards}
          isCarouselActive={isCarouselActive}
          renderItem={renderItem}
          autoRotateSpeed={autoRotateSpeed}
          onRotateRef={rotateRef}
        />
      </div>

      {showControls && (
        <div className="w-full flex items-center justify-center gap-6 pt-3 pb-2 shrink-0 pointer-events-auto">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Rotate Previous"
            className={cn(
              "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer active:scale-95",
              themeTokens.spacesInTheRound.navButton(activeIsLight)
            )}
          >
            <ChevronLeft size={16} />
          </button>

          <span className={cn(
            "font-mono text-[10px] sm:text-xs tracking-[0.28em] uppercase select-none transition-colors duration-300",
            themeTokens.spacesInTheRound.dragLabel(activeIsLight)
          )}>
            ← DRAG TO ROTATE →
          </span>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Rotate Next"
            className={cn(
              "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer active:scale-95",
              themeTokens.spacesInTheRound.navButton(activeIsLight)
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </motion.div>
  )
}

export { ThreeDPhotoCarousel, Carousel }
