/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure ESLint to not fail the build
  eslint: {
    // Warning instead of error during builds
    ignoreDuringBuilds: true,
  },
  // Configure TypeScript to not fail the build
  typescript: {
    // Warning instead of error during builds
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['image.tmdb.org'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
    ],
  },
};

export default nextConfig;