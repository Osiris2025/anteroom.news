import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/admin", "/api/auth", "/dms", "/profile"],
    },
    sitemap: (process.env.SITE_BASE_URL || "https://anteroom.news") + "/sitemap.xml",
  };
}
