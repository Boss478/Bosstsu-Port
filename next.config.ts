import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  poweredByHeader: false,
  allowedDevOrigins: ["localhost", "100.97.15.5", "0.0.0.0"],
  experimental: {
    serverActions: {
      bodySizeLimit: "60mb",
    },
    proxyClientMaxBodySize: "60mb",
  },
  serverExternalPackages: ["sharp"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.flaticon.com',
      }
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn-uicons.flaticon.com",
              "font-src 'self' https://fonts.gstatic.com https://cdn-uicons.flaticon.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/uploads/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      }
    ];
  },
  async redirects() {
    return [
      {
        source: "/games/is-it-spelled-correctly",
        destination: "/games/spellchecker",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
