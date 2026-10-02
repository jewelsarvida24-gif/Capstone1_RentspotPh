
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '192.168.56.1:3000'],
    },
  },
};

module.exports = nextConfig;