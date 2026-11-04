import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['gsap'],
  allowedDevOrigins: ['localhost:3000', '*.trycloudflare.com'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.cloudflare.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
  },
  redirects: async () => [
    {
      source: '/destinations/uae',
      destination: '/collection/dubai',
      permanent: true,
    },
    {
      source: '/destinations/thailand',
      destination: '/collection/thailand',
      permanent: true,
    },
    {
      source: '/destinations/malaysia',
      destination: '/collection/malaysia',
      permanent: true,
    },
    {
      source: '/destinations/australia',
      destination: '/collection/australia',
      permanent: true,
    },
    {
      source: '/destinations/georgia',
      destination: '/collection/georgia',
      permanent: true,
    },
    // Redirect /destinations → /collection
    {
      source: '/destinations',
      destination: '/collection',
      permanent: true,
    },
    // Redirect old /properties/[country]/[slug] → /collection/[country]/[slug]
    {
      source: '/properties/:country/:slug',
      destination: '/collection/:country/:slug',
      permanent: true,
    },
    // Redirect old /properties/[slug] → /collection (best-effort, can't know country)
    {
      source: '/properties/:slug',
      destination: '/collection',
      permanent: false,
    },
    // Redirect /properties → /collection
    {
      source: '/properties',
      destination: '/collection',
      permanent: true,
    },
    // Redirect /residences → /collection
    {
      source: '/residences',
      destination: '/collection',
      permanent: true,
    },
    {
      source: '/residences/:slug',
      destination: '/collection',
      permanent: false,
    },
    {
      source: '/privacy',
      destination: '/privacy-policy',
      permanent: true,
    },
    {
      source: '/communities',
      destination: '/#collection',
      permanent: true,
    },
    {
      source: '/enquire',
      destination: '/contact',
      permanent: true,
    },
    {
      source: '/enquiry',
      destination: '/contact',
      permanent: true,
    },
  ],
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options',         value: 'DENY' },
        { key: 'X-Content-Type-Options',  value: 'nosniff' },
        { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.tailwindcss.com https://code.iconify.design",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://images.unsplash.com https://*.cloudflare.com https://*.r2.cloudflarestorage.com https://*.r2.dev https://cdn.21st.dev",
            "media-src 'self' data: blob: https://*.cloudflare.com https://*.r2.cloudflarestorage.com https://*.r2.dev",
            "connect-src 'self' https://*.r2.cloudflarestorage.com https://*.r2.dev",
            "frame-src 'self' data: blob: about:",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    },
  ],
}

export default nextConfig
