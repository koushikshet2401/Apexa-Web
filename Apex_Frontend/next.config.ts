import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['gsap'],
  images: {
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
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // unsafe-eval needed by Next.js dev mode
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://images.unsplash.com https://*.cloudflare.com https://*.r2.cloudflarestorage.com https://*.r2.dev",
            "media-src 'self' data: blob: https://*.cloudflare.com https://*.r2.cloudflarestorage.com https://*.r2.dev",
            "connect-src 'self' https://*.r2.cloudflarestorage.com https://*.r2.dev",
            "frame-ancestors 'none'",
          ].join('; '),
        },
      ],
    },
  ],
}

export default nextConfig
