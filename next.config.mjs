/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Alternate URL if anything blocks the literal `/superadmin` path (proxy, cache, typo).
      { source: "/owner", destination: "/superadmin" },
      { source: "/owner/:path*", destination: "/superadmin/:path*" }
    ];
  },
  async redirects() {
    return [
      { source: "/super-admin", destination: "/superadmin", permanent: false },
      { source: "/super-admin/:path*", destination: "/superadmin/:path*", permanent: false },
      // Keep only dashed alias; mixed-case aliases can self-match on some hosts and cause loops.
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**"
      }
    ]
  }
};

export default nextConfig;
