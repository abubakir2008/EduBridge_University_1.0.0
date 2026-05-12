/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  output: isProd ? 'standalone' : undefined,

  async rewrites() {
    const apiBase = process.env.INTERNAL_API_URL || 'http://app:8000'
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'http', hostname: 'minio', port: '9000' },
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
