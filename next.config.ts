import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Redirect root to dashboard handled by middleware
  async redirects() {
    return []
  },
}

export default nextConfig
