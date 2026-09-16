    /** @type {import('next').NextConfig} */
const nextConfig = {
  // Dynamic deployment (no standalone, no static export)
  
  images: {
    // Keep unoptimized for now, or remove this line to enable Next.js image optimization
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.awantikaseeds.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  // reactStrictMode: false,
  async rewrites() {
    return [
      // Local uploads proxy
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/uploads/:path*`,
      },
      // Production images fallback proxy (when local server can't serve them)
      {
        source: '/api/production-uploads/:path*',
        destination: 'https://api.awantikaseeds.com/uploads/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
