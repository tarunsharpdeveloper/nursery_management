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
};

module.exports = nextConfig;
