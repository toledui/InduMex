import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPrimaryCategory } from "@/lib/wordpress";

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const title = `${category} | InduMex 2.0`;
  const description = `Contenido tecnico de la categoria ${category} en InduMex 2.0.`;
  const url = `https://indumex.blog/${category}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url,
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
      title,
      description,
      images: ["https://indumex.blog/images/indumex-image.jpg"],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;

  let posts = [] as Awaited<ReturnType<typeof getAllPosts>>;
  try {
    posts = await getAllPosts(30);
  } catch {
    posts = [];
  }

  const filtered = posts.filter((post) => getPrimaryCategory(post)?.slug === category);

  if (filtered.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--indumex-primary)]/20 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--indumex-accent)]">
          Categoria
        </p>
        <h1 className="mt-2 font-heading text-4xl font-black text-[var(--indumex-primary)]">
          {category}
        </h1>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((post) => (
            <article key={post.id} className="rounded-2xl border border-slate-200 p-4">
              <h2 className="font-heading text-lg font-bold text-[var(--indumex-primary)]">
                {post.title}
              </h2>
              <Link
                href={`/${category}/${post.slug}`}
                className="mt-3 inline-block rounded-full bg-[var(--indumex-accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white"
              >
                Leer
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
