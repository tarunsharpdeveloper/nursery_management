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
    ],
  },
  // reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
