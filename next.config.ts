import type { NextConfig } from "next";

const isProdCommand = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  distDir: isProdCommand ? ".next-prod" : ".next",
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
