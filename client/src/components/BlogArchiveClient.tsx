"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Search, ArrowRight, Play, SlidersHorizontal } from "lucide-react";
import AdBanner from "@/components/AdBanner";
import type { WordPressCategory, WordPressPostCard } from "@/lib/wordpress";
import type { Anuncio } from "@/lib/api";

type BlogArchiveClientProps = {
  initialPosts: WordPressPostCard[];
  categories: WordPressCategory[];
  editorialAds?: Anuncio[];
};

const PAGE_SIZE = 9;

export default function BlogArchiveClient({
  initialPosts,
  categories,
  editorialAds = [],
}: BlogArchiveClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchValue, setSearchValue] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const categoryBySlug = useMemo(
    () =>
      new Map(
        categories.map((category) => [category.slug.toLowerCase(), category])
      ),
    [categories]
  );

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const category of categories) {
      const parentId = category.parent?.node?.id;
      if (!parentId) continue;

      const children = map.get(parentId) || [];
      children.push(category.id);
      map.set(parentId, children);
    }

    return map;
  }, [categories]);

  const usedCategorySlugs = useMemo(() => {
    const set = new Set<string>();
    for (const post of initialPosts) {
      for (const category of post.categories?.nodes || []) {
        set.add(category.slug.toLowerCase());
      }
    }
    return set;
  }, [initialPosts]);

  const availableCategories = useMemo(() => {
    const cache = new Map<string, boolean>();

    const hasPostsInTree = (categoryId: string): boolean => {
      if (cache.has(categoryId)) {
        return cache.get(categoryId) || false;
      }

      const category = categoryById.get(categoryId);
      if (!category) {
        cache.set(categoryId, false);
        return false;
      }

      if (usedCategorySlugs.has(category.slug.toLowerCase())) {
        cache.set(categoryId, true);
        return true;
      }

      const children = childrenByParentId.get(categoryId) || [];
      for (const childId of children) {
        if (hasPostsInTree(childId)) {
          cache.set(categoryId, true);
          return true;
        }
      }

      cache.set(categoryId, false);
      return false;
    };

    return categories.filter((category) => hasPostsInTree(category.id));
  }, [categories, categoryById, childrenByParentId, usedCategorySlugs]);

  const selectedCategorySlugs = useMemo(() => {
    if (selectedCategory === "all") {
      return null;
    }

    const root = categoryBySlug.get(selectedCategory.toLowerCase());
    if (!root) {
      return new Set([selectedCategory.toLowerCase()]);
    }

    const slugs = new Set<string>();
    const queue: string[] = [root.id];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || visited.has(currentId)) continue;
      visited.add(currentId);

      const current = categoryById.get(currentId);
      if (!current) continue;

      slugs.add(current.slug.toLowerCase());
      const children = childrenByParentId.get(currentId) || [];
      queue.push(...children);
    }

    return slugs;
  }, [selectedCategory, categoryBySlug, categoryById, childrenByParentId]);

  const filteredPosts = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return initialPosts.filter((post) => {
      const categorySlugs = post.categories?.nodes?.map((category) => category.slug.toLowerCase()) || [];
      const matchesCategory =
        !selectedCategorySlugs ||
        categorySlugs.some((slug) => selectedCategorySlugs.has(slug));
      const matchesSearch =
        query.length === 0 || post.title.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [initialPosts, searchValue, selectedCategorySlugs]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setVisibleCount(PAGE_SIZE);
  };

  const marqueeText =
    "ABRIR DIRECTORIO B2B / CONECTA TU OFERTA / ACTIVA TU RED INDUSTRIAL / ";

  return (
    <div className="pb-20">
      <section className="pt-28 pb-10 md:pt-36 md:pb-14">
        <div className="max-w-400 mx-auto px-4 sm:px-6">
          <h1 className="font-['Space_Grotesk'] text-4xl md:text-5xl lg:text-7xl font-bold leading-[0.95] tracking-tight text-white">
            Archivo{" "}
            <span className="text-[#004AAD] block sm:inline">Editorial</span>{" "}
            <br className="hidden sm:block" />
            de <span className="text-[#F58634]">Noticias Industriales</span>
          </h1>

          <div className="mt-8 md:mt-10 rounded-2xl border border-white/15 bg-[#021325] px-5 py-4 md:px-6 md:py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex w-full items-center gap-3">
                <Search className="h-5 w-5 text-[#F58634]" />
                <input
                  value={searchValue}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  type="text"
                  placeholder="[ ¿QUÉ NOTICIA O TEMA ESTÁS BUSCANDO HOY? ]"
                  className="w-full bg-transparent text-sm md:text-base text-white placeholder:text-gray-500 font-['Space_Grotesk'] uppercase tracking-[0.12em] focus:outline-none"
                  aria-label="Buscar noticias"
                />
              </div>

              <div className="relative md:shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen((prev) => !prev)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-200 hover:border-[#F58634] hover:text-white transition-colors md:w-auto"
                >
                  <SlidersHorizontal className="h-4 w-4 text-[#F58634]" />
                  Categorías
                </button>

                {isCategoryOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-full min-w-60 rounded-xl border border-white/15 bg-[#021e3a] p-3 shadow-2xl md:w-auto">
                    <label className="mb-2 block text-[10px] uppercase tracking-widest text-gray-500">
                      Selecciona categoría
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(event) => {
                        handleCategoryChange(event.target.value);
                        setIsCategoryOpen(false);
                      }}
                      className="w-full rounded-lg border border-white/20 bg-[#021325] px-3 py-2 text-sm text-white focus:border-[#F58634] focus:outline-none"
                    >
                      <option value="all">Todas</option>
                      {availableCategories.map((category) => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-8 md:pt-10">
        <div className="max-w-400 mx-auto px-4 sm:px-6">
          <AdBanner ads={editorialAds} />
        </div>
      </section>

      <section className="pt-10 md:pt-12">
        <div className="max-w-400 mx-auto px-4 sm:px-6">
          {filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#031c38] p-8 text-center text-gray-400 font-['Space_Grotesk']">
              No se encontraron resultados para este parámetro.
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedCategory}-${searchValue}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12"
              >
                {visiblePosts.map((post, index) => {
                  const category = post.categories?.nodes?.[0];
                  const postHref = `/${category?.slug || "noticias"}/${post.slug}`;
                  const imageUrl = post.featuredImage?.node?.sourceUrl;
                  const cardSpan =
                    index === 0
                      ? "lg:col-span-8 lg:min-h-[520px]"
                      : "lg:col-span-4 lg:min-h-[250px]";

                  return (
                    <div key={post.id} className="contents">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ delay: index * 0.05, duration: 0.35 }}
                        className={cardSpan}
                      >
                        <article className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[#031c38]">
                          <Link href={postHref} className="absolute inset-0 z-20" aria-label={post.title} />
                          <div className="absolute inset-0">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={post.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover grayscale opacity-55 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-[1.04]"
                              />
                            ) : (
                              <div className="h-full w-full bg-linear-to-br from-[#004AAD]/40 via-[#021325] to-[#F58634]/30" />
                            )}
                            <div className="absolute inset-0 bg-linear-to-t from-[#021325] via-[#021325]/65 to-transparent" />
                          </div>

                          <div className="relative z-10 flex h-full flex-col justify-end p-5 md:p-7">
                            <span className="mb-3 text-[10px] uppercase tracking-[0.18em] text-[#F58634] font-bold">
                              {category?.name || "Industria"}
                            </span>
                            <h2
                              className={`font-['Space_Grotesk'] font-bold text-white leading-tight ${
                                index === 0 ? "text-2xl md:text-4xl" : "text-lg md:text-xl"
                              }`}
                            >
                              {post.title}
                            </h2>

                            <div className="mt-5 flex items-center justify-between">
                              <p className="text-[11px] uppercase tracking-widest text-gray-400">
                                {new Date(post.date).toLocaleDateString("es-MX")}
                              </p>
                              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors group-hover:border-[#F58634] group-hover:text-[#F58634]">
                                Leer
                                <Play className="h-3.5 w-3.5" />
                              </span>
                            </div>
                          </div>
                        </article>
                      </motion.div>

                      {index === 3 && (
                        <div className="md:col-span-2 lg:col-span-4">
                          <AdBanner ads={editorialAds} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="inline-flex items-center gap-2 rounded-full border border-[#F58634]/70 bg-[#F58634]/15 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#F58634]/25 transition-colors"
              >
                Cargar más artículos
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="mt-16 md:mt-24 border-y border-white/10 bg-[#0c0c0c] py-6 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.22em] text-[#F58634]">
          <span>{marqueeText.repeat(6)}</span>
        </div>
        <div className="max-w-400 mx-auto px-4 sm:px-6 mt-6 text-center">
          <Link
            href="/directorio"
            className="inline-flex items-center gap-2 rounded-full bg-[#004AAD] px-7 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#003b89] transition-colors"
          >
            Abrir Directorio B2B
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
