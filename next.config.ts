import type { NextConfig } from "next";

const isProdCommand = process.env.NODE_ENV === "production" && !process.env.VERCEL;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  allowedDevOrigins: ["172.16.20.223"],
  distDir: isProdCommand ? ".next-prod" : ".next",
  outputFileTracingIncludes: { "/**": ["./prisma/dev.db"] },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "digi-api.com", pathname: "/images/**" }],
    minimumCacheTTL: 2678400,
  },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
