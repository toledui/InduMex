import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.198.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "indumex.blog",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        pathname: "/avatar/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    qualities: [75, 85, 90],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
