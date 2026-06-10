import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  ...(process.env.NEXT_OUTPUT_STANDALONE === 'true' ? { output: 'standalone' } : {}),

  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
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
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: '' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; media-src 'self' blob: data: https:; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https:; connect-src 'self' https:;",
          },
        ],
      },
    ];
  },
  turbopack: {
    root: '../../',
  },

  // Ignore data folder changes to prevent dev server restarts
  webpack: (config, { dev, isServer }) => {
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
              name(module: any) {
                return `vendor.${module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1]}`;
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
