import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  ...(process.env.NEXT_OUTPUT_STANDALONE === 'true' ? { output: 'standalone' } : {}),
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/file/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        // Apply CORS headers to player page
        source: '/player/:path*',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Content-Type',
            value: 'text/html; charset=utf-8',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; media-src 'self' blob: data:; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self' https:;",
          },
        ],
      },
    ];
  },
  turbopack: {
    root: '../../',
  },

  // Ignore data folder changes to prevent dev server restarts
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/data/**', '**/node_modules/**'],
      };
    }
    return config;
  },
};

export default nextConfig;
