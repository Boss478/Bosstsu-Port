import type { NextConfig } from 'next';
import { CONFIG } from './src/lib/config';
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})({
  output: 'standalone',
  compress: true,
  // reactCompiler: true, // Disabled — causes hydration error #418 (args[]=HTML) on admin/analytics
  poweredByHeader: false,
  allowedDevOrigins: ['localhost', '100.97.15.5', '0.0.0.0'],
  experimental: {
    serverActions: {
      bodySizeLimit: CONFIG.UPLOAD.MAX_SIZE_MB,
    },
    proxyClientMaxBodySize: CONFIG.UPLOAD.MAX_SIZE_MB,
  },
  serverExternalPackages: ['sharp', 'html-to-image', 'yahoo-finance2'],
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [480, 768, 1024, 1280, 1920],
    imageSizes: [32, 64, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.flaticon.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            // unsafe-inline/unsafe-eval: kept for dev mode compatibility
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn-uicons.flaticon.com",
              "font-src 'self' https://fonts.gstatic.com https://cdn-uicons.flaticon.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://cdn.jsdelivr.net",
              "worker-src 'self' blob:",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/uploads/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/games/is-it-spelled-correctly',
        destination: '/games/spellchecker',
        permanent: true,
      },
    ];
  },
});

export default nextConfig;
