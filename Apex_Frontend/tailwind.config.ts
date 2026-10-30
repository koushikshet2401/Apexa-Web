import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Deep Midnight Blue & Navy Architectural Luxury Palette ────────
        midnight: {
          DEFAULT: '#040810',
          50: '#060D1A',
          100: '#0A1324',
          200: '#0F1C33',
          300: '#152542',
          400: '#1C3154',
        },
        navy: {
          DEFAULT: '#070E1C',
          light: '#0D1A33',
          card: '#0B1528',
          overlay: 'rgba(4, 8, 16, 0.85)',
        },
        obsidian: {
          DEFAULT: '#040810',
          50: '#060D1A',
          100: '#0A1324',
          200: '#0F1C33',
          300: '#152542',
          400: '#1C3154',
        },
        // Restrained Silver & Titanium
        silver: {
          DEFAULT: '#CBD5E1',
          light: '#E2E8F0',
          dark: '#94A3B8',
          muted: '#64748B',
        },
        titanium: {
          DEFAULT: '#CBD5E1',
          light: '#E2E8F0',
          dark: '#94A3B8',
          muted: '#64748B',
        },
        // Muted Slate Blue & Steel Blue
        glacier: {
          DEFAULT: '#7DD3FC',
          light: '#BAE6FD',
          steel: '#38BDF8',
          muted: 'rgba(125,211,252,0.12)',
        },
        steelblue: {
          DEFAULT: '#3B5373',
          light: '#4E6A91',
          dark: '#243449',
          muted: 'rgba(59,83,115,0.16)',
        },
        // Cool Ivory & White typography
        ivory: {
          DEFAULT: '#F8FAFC',
          off: '#F1F5F9',
        },
        diamond: {
          DEFAULT: '#FFFFFF',
          off: '#F8FAFC',
        },
        steel: {
          DEFAULT: '#94A3B8',
          dark: '#64748B',
        },
        slate: {
          DEFAULT: '#070E1C',
          card: '#0B1528',
          overlay: 'rgba(4, 8, 16, 0.82)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'DM Mono', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['clamp(3.5rem, 8vw, 7rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-xl': ['clamp(2.75rem, 6vw, 5.5rem)', { lineHeight: '0.95', letterSpacing: '-0.025em' }],
        'display-lg': ['clamp(2rem, 4vw, 3.75rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        'display-sm': ['clamp(1.125rem, 2vw, 1.5rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'label-lg': ['0.875rem', { lineHeight: '1', letterSpacing: '0.12em' }],
        'label-md': ['0.75rem', { lineHeight: '1', letterSpacing: '0.15em' }],
        'label-sm': ['0.6875rem', { lineHeight: '1', letterSpacing: '0.18em' }],
      },
      spacing: {
        'section': 'clamp(5rem, 10vw, 9rem)',
        'section-sm': 'clamp(3rem, 6vw, 5rem)',
        'gutter': 'clamp(1.5rem, 5vw, 4rem)',
      },
      maxWidth: {
        'container': '1440px',
        'content': '1200px',
        'narrow': '760px',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'entry': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'exit': 'cubic-bezier(0.4, 0.0, 1, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      animation: {
        'marquee': 'marquee 28s linear infinite',
        'marquee-reverse': 'marquee-reverse 28s linear infinite',
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
