import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Lint runs explicitly via `npm run lint`; don't block event-day builds on style.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
