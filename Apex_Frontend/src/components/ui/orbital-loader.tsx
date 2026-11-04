"use client"

import React, { useEffect, useState } from "react"
import { cva } from "class-variance-authority"
import { motion } from "motion/react"
import { useTheme } from "@/components/providers/ThemeProvider"
import { cn } from "@/lib/utils"

const orbitalLoaderVariants = cva("flex gap-2 items-center justify-center", {
  variants: {
    messagePlacement: {
      bottom: "flex-col",
      top: "flex-col-reverse",
      right: "flex-row",
      left: "flex-row-reverse",
    },
  },
  defaultVariants: {
    messagePlacement: "bottom",
  },
})

export interface OrbitalLoaderProps {
  message?: string
  /**
   * Position of the message relative to the spinner.
   * @default bottom
   */
  messagePlacement?: "top" | "bottom" | "left" | "right"
  size?: "xs" | "sm" | "md" | "lg"
  isLight?: boolean
}

export function OrbitalLoader({
  className,
  message,
  messagePlacement,
  size = "md",
  isLight: isLightProp,
  ...props
}: React.ComponentProps<"div"> & OrbitalLoaderProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLight = isLightProp ?? (mounted && (theme === "light" || resolvedTheme === "light"))

  const sizeClasses =
    {
      xs: "w-4 h-4",
      sm: "w-6 h-6",
      md: "w-16 h-16",
      lg: "w-24 h-24",
    }[size] || "w-16 h-16"

  const strokeWidth = size === "xs" || size === "sm" ? "border" : "border-2"
  const inset2 = size === "xs" ? "inset-0.5" : size === "sm" ? "inset-1" : "inset-2"
  const inset4 = size === "xs" ? "inset-1" : size === "sm" ? "inset-1.5" : "inset-4"

  const ringOuterColor =
    isLightProp !== undefined
      ? (isLightProp ? "border-t-[#0B1325]" : "border-t-sky-400")
      : isLight
      ? "border-t-[#0B1325]"
      : "border-t-[#0B1325] dark:border-t-sky-400"

  const ringMidColor =
    isLightProp !== undefined
      ? (isLightProp ? "border-t-[#6B6661]" : "border-t-white")
      : isLight
      ? "border-t-[#6B6661]"
      : "border-t-[#6B6661] dark:border-t-white"

  const ringInnerColor =
    isLightProp !== undefined
      ? (isLightProp ? "border-t-[#0B1325]/40" : "border-t-sky-300")
      : isLight
      ? "border-t-[#0B1325]/40"
      : "border-t-[#0B1325]/40 dark:border-t-sky-300"

  const messageColor =
    isLightProp !== undefined
      ? (isLightProp ? "text-[#0B1325] font-semibold" : "text-sky-200")
      : isLight
      ? "text-[#0B1325] font-semibold"
      : "text-[#0B1325] font-semibold dark:text-sky-200 dark:font-normal"

  return (
    <div className={cn(orbitalLoaderVariants({ messagePlacement }))}>
      <div className={cn("relative shrink-0", sizeClasses, className)} {...props}>
        <motion.div
          className={cn(
            "absolute inset-0 border-transparent rounded-full transition-colors duration-300",
            ringOuterColor,
            strokeWidth
          )}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className={cn(
            "absolute border-transparent rounded-full transition-colors duration-300",
            ringMidColor,
            inset2,
            strokeWidth
          )}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className={cn(
            "absolute border-transparent rounded-full transition-colors duration-300",
            ringInnerColor,
            inset4,
            strokeWidth
          )}
          animate={{ rotate: 360 }}
          transition={{
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </div>
      {message && (
        <div
          className={cn(
            "font-mono text-xs uppercase tracking-widest transition-colors duration-300",
            messageColor
          )}
        >
          {message}
        </div>
      )}
    </div>
  )
}
