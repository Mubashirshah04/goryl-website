/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Cache busting: Add version to force updates
  generateBuildId: async () => {
    return `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // ✅ Performance: Optimize production builds
  compress: true,

  // ✅ Performance: Enable React compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // ✅ Professional-level performance optimizations
  // ✅ Performance: Professional-level performance optimizations for Firebase compatibility
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@headlessui/react",
      "firebase",
      "@firebase",
    ],
    optimizeCss: false, // Disable for Firebase compatibility
    scrollRestoration: true,
  },

  // ✅ Specify build directory for Firebase Functions
  distDir: ".next",

  // ✅ Performance: Image optimization
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "lh3.googleusercontent.com",
      "api.dicebear.com",
      "ui-avatars.com",
      "images.unsplash.com",
      "source.unsplash.com",
      "localhost",
      "imagedelivery.net", // Cloudflare Images
      "cloudflare.com",
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },

  // ✅ Performance: Optimize headers for caching with cache busting
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate, max-age=0",
          },
        ],
      },
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },

  // TypeScript and ESLint configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Use export output type for Firebase compatibility
  // output: "export", // Commented out for SSR with Firebase Functions

  // ✅ Firebase deployment specific settings
  poweredByHeader: false,
  generateEtags: false,

  // ✅ Error handling improvement for Firebase deployment
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },

  // ✅ Explicitly expose environment variables (Next.js 15 compatibility)
  // This ensures NEXT_PUBLIC_ variables are available in browser
  env: {
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_AWS_ACCESS_KEY_ID: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    NEXT_PUBLIC_S3_BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
    NEXT_PUBLIC_S3_CDN_URL: process.env.NEXT_PUBLIC_S3_CDN_URL,
  },
};

module.exports = nextConfig;
