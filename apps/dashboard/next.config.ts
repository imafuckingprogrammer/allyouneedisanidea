import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow embed script to be served from this domain with CORS headers
  async headers() {
    return [
      {
        source: '/embed.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Content-Type', value: 'application/javascript' },
        ],
      },
    ]
  },
}

export default nextConfig
