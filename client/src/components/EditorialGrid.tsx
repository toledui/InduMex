"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import type { WordPressPostCard } from "@/lib/wordpress";
import type { Anuncio } from "@/lib/api";
import AdBanner from "@/components/AdBanner";

interface EditorialGridProps {
  posts: WordPressPostCard[];
  editorialAds?: Anuncio[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function EditorialGrid({
  posts,
  editorialAds = [],
  onMouseEnter,
  onMouseLeave,
}: EditorialGridProps) {
  if (posts.length === 0) return null;

  // Define layout: primero grande, luego dos medianos, resto normal
  const layoutClasses = [
    "md:col-span-8 md:row-span-2",
    "md:col-span-4",
    "md:col-span-4",
    "md:col-span-4",
    "md:col-span-4",
  ];

  return (
    <section className="py-16 md:py-24 lg:py-32 max-w-[1600px] mx-auto px-4 sm:px-6">
      <div className="flex justify-between items-end mb-8 md:mb-16 border-b border-gray-800 pb-4 md:pb-6">
        <h3 className="font-['Space_Grotesk'] text-3xl font-bold uppercase tracking-tight">
          Última <span className="text-[#004AAD]">Inteligencia</span>
        </h3>
        <Link
          href="/blog"
          className="text-sm uppercase tracking-widest text-gray-500 hover:text-white flex items-center gap-2 group data-interactive"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          data-interactive
        >
          Ver Todo
          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 lg:gap-8 md:auto-rows-[380px] lg:auto-rows-[420px]">
        {posts.map((post, idx) => {
          // Insertar AdBanner después del 2º artículo (índice 1)
          const gridClass = layoutClasses[idx] || "md:col-span-4";
          const imageUrl = post.featuredImage?.node?.sourceUrl;
          const category = post.categories?.nodes?.[0];

          return (
            <React.Fragment key={post.id}>
              <article
                key={post.id}
                className={`relative overflow-hidden group cursor-pointer rounded-xl bg-gray-900 border border-white/5 min-h-[280px] md:min-h-0 ${gridClass}`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                data-interactive
              >
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity"></div>

                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#004AAD] to-[#F58634] opacity-20"></div>
                  )}
                </div>

                <div className="absolute inset-0 z-20 p-5 md:p-8 flex flex-col justify-end">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-[#F58634] text-xs font-bold uppercase tracking-widest block mb-3">
                      {category?.name || "Industria"}
                    </span>
                    <h4
                      className={`font-['Space_Grotesk'] font-bold text-white leading-tight ${
                        idx === 0 ? "text-2xl sm:text-3xl md:text-4xl max-w-2xl" : "text-lg md:text-xl"
                      }`}
                    >
                      {post.title}
                    </h4>
                  </div>
                </div>

                {/* Hover Button */}
                <Link
                  href={`/${category?.slug || "noticias"}/${post.slug}`}
                  className="absolute top-8 right-8 z-20 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-500"
                >
                  <Play className="h-5 w-5 ml-1" />
                </Link>
              </article>

              {/* AdBanner nativo después del artículo 1 (idx=1) */}
              {idx === 1 && (
                <AdBanner ads={editorialAds} className="md:col-span-4" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
