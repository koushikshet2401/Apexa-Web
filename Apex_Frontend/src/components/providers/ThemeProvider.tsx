'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes'

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = (theme ?? resolvedTheme ?? 'dark') as 'light' | 'dark'
  const isLight = mounted && (currentTheme === 'light' || resolvedTheme === 'light')
  const isDark = !isLight
  const toggleTheme = () => setTheme(isLight ? 'dark' : 'light')

  return {
    theme: currentTheme,
    toggleTheme,
    setTheme: (t: 'light' | 'dark') => setTheme(t),
    resolvedTheme,
    systemTheme,
    isLight,
    isDark,
    mounted,
  }
}
