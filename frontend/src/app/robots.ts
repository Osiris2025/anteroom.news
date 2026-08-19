import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/admin", "/api/auth", "/dms", "/profile"],
    },
    sitemap: "https://nexus.osiris2025.com/sitemap.xml",
  };
}
