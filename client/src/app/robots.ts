import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/mi-cuenta/", "/admin/", "/api/"],
    },
    sitemap: "https://indumex.blog/sitemap.xml",
  };
}
