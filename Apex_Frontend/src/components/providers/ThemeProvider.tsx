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
  const toggleTheme = () => setTheme(theme === 'dark' || resolvedTheme === 'dark' ? 'light' : 'dark')
  return {
    theme: (theme ?? 'dark') as 'light' | 'dark',
    toggleTheme,
    setTheme: (t: 'light' | 'dark') => setTheme(t),
    resolvedTheme,
    systemTheme,
  }
}
