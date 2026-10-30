import { cn } from '@/lib/utils'

interface ApexMonogramProps {
  className?: string
  size?: number
  strokeWidth?: number
  color?: string
}

export function ApexMonogram({
  className,
  size = 40,
  strokeWidth = 1,
  color = 'currentColor',
}: ApexMonogramProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none', className)}
      aria-label="Apex Monogram"
    >
      {/* Delicate circular outline */}
      <circle
        cx="24"
        cy="24"
        r="22.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity="0.85"
      />

      {/* Handcrafted architectural serif 'A' with naturally transparent counter */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 23.1 11.5 H 24.9 L 34.4 36 H 31.8 L 29.3 29.4 H 18.7 L 16.2 36 H 13.6 L 23.1 11.5 Z M 24 16.8 L 20.2 26.6 H 27.8 L 24 16.8 Z"
        fill={color}
      />
    </svg>
  )
}
