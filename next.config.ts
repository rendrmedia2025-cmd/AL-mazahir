/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {}, // Empty turbopack config to silence warning
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp', 'image/avif']
  }
}

export default nextConfig