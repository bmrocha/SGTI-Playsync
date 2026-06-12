import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  ...(process.env.NEXT_OUTPUT_STANDALONE === 'true' ? { output: 'standalone' } : {}),

  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Increase body size limit for file uploads (1GB)
  experimental: {
    serverActions: {
      bodySizeLimit: '1024mb',
    },
  },

  // Exclude Sentry from production builds if not configured
  ...(process.env.SENTRY_DISABLED === 'true'
    ? {
        sentry: {
          hideSourceMaps: true,
          disableServerWebpackPlugin: true,
          disableClientWebpackPlugin: true,
        },
      }
    : {}),

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
        // Allow internal routes to be embedded in iframes
        source: '/dashboard/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' *;",
          },
        ],
      },
      {
        // Allow API routes to be embedded in iframes
        source: '/api/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' *;",
          },
        ],
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
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https: http:; font-src 'self' data:; media-src 'self' blob: data: https: http:; frame-src 'self' http: https: data: blob:; connect-src 'self' https: http:; frame-ancestors 'self' *;",
          },
        ],
      },
    ];
  },
  turbopack: {
    root: '../../',
  },

  // Ignore data folder changes to prevent dev server restarts
  webpack: (config, { dev, isServer: _isServer }) => {
    // Optimize build in production
    if (!dev) {
      // Enable webpack cache
      config.cache = {
        type: 'filesystem',
        allowCollectingMemory: true,
        buildDependencies: {
          config: [__filename],
        },
      };

      // Reduce chunk size warnings
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module: { context: string | null }) {
                const context = module.context?.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                return context ? `vendor.${context}` : 'vendor.unknown';
              },
              chunks: 'all',
              priority: 40,
            },
            // React chunk
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              priority: 50,
            },
          },
        },
      };
    }

    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/data/**', '**/node_modules/**', '**/.next/**'],
      };
    }

    return config;
  },
};

export default nextConfig;
