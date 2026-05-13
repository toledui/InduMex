import type { Metadata } from "next";
import BlogArchiveClient from "@/components/BlogArchiveClient";
import { getAllPostsUnlimited, getAllCategoriesUnlimited } from "@/lib/wordpress";
import { getAdsByZona } from "@/lib/api";

export const metadata: Metadata = {
  title: "Blog Industrial | InduMex 2.0",
  description:
    "Archivo de noticias industriales, señales de mercado y análisis técnico para directivos y proveedores B2B.",
  openGraph: {
    title: "Blog Industrial | InduMex 2.0",
    description:
      "Archivo de noticias industriales, señales de mercado y análisis técnico para directivos y proveedores B2B.",
    type: "website",
    url: "https://indumex.blog/blog",
    siteName: "InduMex",
    locale: "es_MX",
    images: [
      {
        url: "https://indumex.blog/images/indumex-image.jpg",
        width: 1200,
        height: 630,
        alt: "InduMex - Plataforma Industrial B2B",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog Industrial | InduMex 2.0",
    description:
      "Archivo de noticias industriales, señales de mercado y análisis técnico para directivos y proveedores B2B.",
    images: ["https://indumex.blog/images/indumex-image.jpg"],
  },
};

export default async function BlogPage() {
  const [posts, categories, editorialAds] = await Promise.all([
    getAllPostsUnlimited(50).catch(() => []),
    getAllCategoriesUnlimited(50).catch(() => []),
    getAdsByZona("editorial-grid"),
  ]);

  return <BlogArchiveClient initialPosts={posts} categories={categories} editorialAds={editorialAds} />;
}
