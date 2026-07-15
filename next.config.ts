import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow external cover-art images (iTunes CDN, Cover Art Archive, Discogs).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "is1-ssl.mzstatic.com" },
      { protocol: "https", hostname: "**.mzstatic.com" },
      { protocol: "https", hostname: "**.archive.org" },
      { protocol: "https", hostname: "**.discogs.com" },
      { protocol: "https", hostname: "coverartarchive.org" },
      { protocol: "https", hostname: "i.discogs.com" },
    ],
  },
  // Tree-shake heavy libs (lucide-react, framer-motion) on import.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache API responses briefly to reduce redundant compute.
        source: "/api/albums",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/api/tracklist",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
