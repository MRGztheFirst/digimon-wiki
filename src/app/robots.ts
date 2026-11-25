import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["GPTBot", "CCBot", "Bytespider", "meta-externalagent", "Google-Extended", "anthropic-ai", "ClaudeBot"], disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/*?"] },
    ],
    sitemap: "https://www.digimondb.com/sitemap.xml",
  };
}
