/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent wrong workspace root inference when multiple lockfiles exist
  outputFileTracingRoot: __dirname,
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Transpile ES modules
  transpilePackages: ['@excalidraw/excalidraw'],
  
  // Webpack configuration for client-side compatibility
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Exclude Node.js modules from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        child_process: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        querystring: false,
        os: false,
        buffer: false,
        assert: false,
        events: false,
        process: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    
    return config;
  },
  
  // No additional server external packages needed
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Optimized images for faster loading
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  
  // Security and Performance headers
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default nextConfig;