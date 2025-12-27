/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  },
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif']
  }
}

export default nextConfig