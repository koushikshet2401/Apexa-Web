"use client"

import React from "react"
import { cva } from "class-variance-authority"
import { motion } from "motion/react"

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
}

export function OrbitalLoader({
  className,
  message,
  messagePlacement,
  size = "md",
  ...props
}: React.ComponentProps<"div"> & OrbitalLoaderProps) {
  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  }[size] || "w-16 h-16"

  const strokeWidth = size === "xs" || size === "sm" ? "border" : "border-2"
  const inset2 = size === "xs" ? "inset-0.5" : size === "sm" ? "inset-1" : "inset-2"
  const inset4 = size === "xs" ? "inset-1" : size === "sm" ? "inset-1.5" : "inset-4"

  return (
    <div className={cn(orbitalLoaderVariants({ messagePlacement }))}>
      <div className={cn("relative shrink-0", sizeClasses, className)} {...props}>
        <motion.div
          className={cn("absolute inset-0 border-transparent border-t-sky-400 rounded-full", strokeWidth)}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className={cn("absolute border-transparent border-t-white rounded-full", inset2, strokeWidth)}
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className={cn("absolute border-transparent border-t-sky-300 rounded-full", inset4, strokeWidth)}
          animate={{ rotate: 360 }}
          transition={{
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </div>
      {message && (
        <div className="font-mono text-xs uppercase tracking-widest text-sky-200">{message}</div>
      )}
    </div>
  )
}
