import type { Metadata } from "next";
import BlogArchiveClient from "@/components/BlogArchiveClient";
import { getAllPostsUnlimited, getAllCategoriesUnlimited } from "@/lib/wordpress";
import { getAdsByZona } from "@/lib/api";

export const metadata: Metadata = {
  title: "Blog Industrial | InduMex 2.0",
  description:
    "Archivo de noticias industriales, señales de mercado y análisis técnico para directivos y proveedores B2B.",
};

export default async function BlogPage() {
  const [posts, categories, editorialAds] = await Promise.all([
    getAllPostsUnlimited(50).catch(() => []),
    getAllCategoriesUnlimited(50).catch(() => []),
    getAdsByZona("editorial-grid"),
  ]);

  return <BlogArchiveClient initialPosts={posts} categories={categories} editorialAds={editorialAds} />;
}
