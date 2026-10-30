'use client'

import React, { useState, useEffect } from 'react'

export interface PhotoCardProps {
  src: string
  alt?: string
  rotation?: number
  text?: string
  index?: number
  className?: string
  style?: React.CSSProperties
  cardWidth?: string
  cardHeight?: string
}

// Component for the individual photo cards
export const PhotoCard = ({
  src,
  alt = 'Photograph',
  rotation = 0,
  text = '',
  index = 0,
  className = '',
  style = {},
  cardWidth,
  cardHeight,
}: PhotoCardProps) => {
  const [, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 700 + index * 300)
    return () => clearTimeout(timer)
  }, [index])

  const cardStyle: React.CSSProperties = {
    position: 'absolute',
    transform: `rotate(${rotation}deg) ${
      isHovered ? `rotate(${rotation + 2}deg) scale(1.05)` : `rotate(${rotation}deg) scale(1)`
    }`,
    zIndex: isHovered ? 40 : index === 1 ? 3 : 2,
    transition: 'all 0.35s ease-out',
    opacity: isVisible ? 1 : 0,
    ...(cardWidth ? { width: cardWidth } : {}),
    ...(cardHeight ? { height: cardHeight } : {}),
    ...style,
  }

  const hasExplicitDimensions = className.includes('w-') || className.includes('h-') || cardWidth || cardHeight

  return (
    <div
      className={`bg-white p-2.5 sm:p-3 rounded-lg shadow-2xl cursor-pointer select-none transition-shadow duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)] ${
        !hasExplicitDimensions ? 'w-[162px] h-[240px]' : ''
      } ${className}`}
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full h-[84%] bg-[var(--bg-card)] rounded-sm overflow-hidden relative">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: isHovered ? 'scale(1.03)' : 'scale(1)' }}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            const target = e.currentTarget
            target.onerror = null
            target.src =
              'https://cdn.21st.dev/assets/mirror/0b/0be2d94a6a455af793e731bcf996aea18fba31be3bfdc94ed350776022410502.svg'
            setIsLoaded(true)
          }}
        />
      </div>
      <div className="h-[16%] flex items-center justify-center px-1">
        <p
          style={{ fontFamily: '"Zeyada", cursive' }}
          className="text-lg sm:text-xl text-stone-700 tracking-tight text-center leading-none truncate max-w-full"
        >
          {text}
        </p>
      </div>
    </div>
  )
}

// Animated Gradient Grid Background Component
export const AnimatedGrid = () => {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 0.5) % 40)
    }, 80)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Main grid with gradient fade - Light theme */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, transparent 0%, #ffffff 50%, #ffffff 100%),
            linear-gradient(#e5e7eb 1px, transparent 1px),
            linear-gradient(90deg, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: 'cover, 40px 40px, 40px 40px',
          backgroundPosition: `center, ${offset}px ${offset}px, ${offset}px ${offset}px`,
        }}
      />

      {/* Main grid with gradient fade - Dark theme */}
      <div
        className="absolute inset-0 hidden dark:block bg-background"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, transparent 0%, #0f172a 50%, #0f172a 100%),
            linear-gradient(#374151 1px, transparent 1px),
            linear-gradient(90deg, #374151 1px, transparent 1px)
          `,
          backgroundSize: 'cover, 40px 40px, 40px 40px',
          backgroundPosition: `center, ${offset}px ${offset}px, ${offset}px ${offset}px`,
        }}
      />

      {/* Subtle moving overlay for depth - Light theme */}
      <div
        className="absolute inset-0 opacity-30 dark:hidden"
        style={{
          background: `
            radial-gradient(circle at ${50 + Math.sin(offset * 0.1) * 20}% ${
            50 + Math.cos(offset * 0.1) * 20
          }%, rgba(107, 114, 128, 0.1) 0%, transparent 60%)
          `,
        }}
      />

      {/* Subtle moving overlay for depth - Dark theme */}
      <div
        className="absolute inset-0 opacity-30 hidden dark:block"
        style={{
          background: `
            radial-gradient(circle at ${50 + Math.sin(offset * 0.1) * 20}% ${
            50 + Math.cos(offset * 0.1) * 20
          }%, rgba(156, 163, 175, 0.15) 0%, transparent 60%)
          `,
        }}
      />
    </div>
  )
}

// Main App Component / Demo
export function Component() {
  return (
    <>
      <div className="bg-background min-h-screen flex items-center justify-center w-full p-8 relative">
        {/* Animated Grid Background */}
        <AnimatedGrid />
        {/* Photo Cards Container - positioned exactly like your image */}
        <div className="relative w-[300px] h-[300px] flex items-center justify-center">
          {/* Back Photo Card - rotated left, positioned behind */}
          <PhotoCard
            src="https://cdn.21st.dev/assets/mirror/08/0848e3c5dbf9d272bcb68e86cf23ba2d2a1e621c91b03b9c8e6da1ff54e78fce.jpg"
            alt="A person standing in a field with mountains in the background"
            rotation={-8}
            text="Some of my recent photography"
            index={0}
            style={{ top: '20px', left: '0px' }}
          />

          {/* Front Photo Card - rotated right, positioned on top */}
          <PhotoCard
            src="https://cdn.21st.dev/assets/mirror/c0/c0bbf68045e4c1475f360b9939c43b20e6322f01fc3f40c40001cf3be5cbca47.jpg"
            alt="A close-up of a person's face"
            rotation={15}
            text="Some of my recent photography"
            index={1}
            style={{ top: '10px', right: '0px' }}
          />
        </div>
      </div>
    </>
  )
}

export default Component
