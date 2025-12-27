/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbo: false, // Disable Turbopack for stable deployment
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  },
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif']
  },
  webpack: (config) => {
    // Ensure stable webpack build
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  }
}

export default nextConfig