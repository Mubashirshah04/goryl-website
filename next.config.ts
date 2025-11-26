import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable type checking and linting during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'goryl-storage.s3.ap-south-1.amazonaws.com',
      'zaillisy-storage.s3.ap-south-1.amazonaws.com',
      's3.ap-south-1.amazonaws.com',
      'ui-avatars.com',
    ],
    unoptimized: true,
  },
};

export default nextConfig;
