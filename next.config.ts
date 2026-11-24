import type { NextConfig } from "next";

const isProdCommand = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  distDir: isProdCommand ? ".next-prod" : ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "digi-api.com", pathname: "/images/**" }],
    minimumCacheTTL: 2678400,
  },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/.git/**", "**/node_modules/**", "**/.next/**", "**/.next-prod/**", "**/*.db", "**/*.db-journal", "**/*.db-wal", "**/*.db-shm", "**/uploads/**", "**/prisma/.cache/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
