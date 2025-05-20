import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["fonts.googleapis.com", "fonts.gstatic.com"],
  },
};

export default nextConfig;
