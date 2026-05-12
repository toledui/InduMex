import type { MetadataRoute } from "next";

const BASE_URL = "https://indumex.blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─────────────────────────────────────────────────────────────────────────
  // RUTAS DINÁMICAS – Implementación futura
  //
  // Para incluir artículos del blog, descomenta y adapta:
  //
  //   import { getAllPosts } from "@/lib/wordpress";
  //   const posts = await getAllPosts(1000);
  //   const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
  //     url: `${BASE_URL}/${post.primaryCategory?.slug ?? "blog"}/${post.slug}`,
  //     lastModified: new Date(post.modified),
  //     changeFrequency: "weekly",
  //     priority: 0.7,
  //   }));
  //
  // Para incluir productos del marketplace:
  //
  //   import { getMarketplaceCatalog } from "@/lib/api";
  //   const { productos } = await getMarketplaceCatalog();
  //   const productEntries: MetadataRoute.Sitemap = productos.map((p) => ({
  //     url: `${BASE_URL}/marketplace/${p.slug}`,
  //     lastModified: new Date(),
  //     changeFrequency: "daily",
  //     priority: 0.6,
  //   }));
  //
  // Después agrégalos al return: [...staticRoutes, ...postEntries, ...productEntries]
  // ─────────────────────────────────────────────────────────────────────────

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/revista`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/directorio`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/marketplace`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  return staticRoutes;
}
