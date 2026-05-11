"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Tag, Package } from "lucide-react";
import type { MarketplaceCatalogProducto } from "@/lib/api";

interface MarketplaceTeaserProps {
  products?: MarketplaceCatalogProducto[];
}

function isAllowedImageUrl(url: string): boolean {
  return (
    url.startsWith('/') ||
    url.includes('indumex.blog') ||
    url.includes('secure.gravatar.com') ||
    url.includes('images.unsplash.com') ||
    url.includes('encrypted-tbn0.gstatic.com') ||
    url.includes('localhost:4000/uploads/') ||
    url.includes('127.0.0.1:4000/uploads/')
  );
}

export default function MarketplaceTeaser({ products = [] }: MarketplaceTeaserProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const items = [...products]
    .sort((a, b) => Number(b.destacado) - Number(a.destacado))
    .slice(0, 8);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-[#050505] border-y border-white/5 overflow-hidden">
      <div className="max-w-400 mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 md:mb-14">
          <div>
            <p className="text-xs text-[#F58634] uppercase tracking-[0.2em] font-bold mb-3">
              Compra Directa B2B
            </p>
            <h3 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold uppercase tracking-tight">
              Marketplace <span className="text-[#004AAD]">Industrial</span>
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => scroll("left")} aria-label="Anterior" className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:border-[#004AAD] hover:text-white transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => scroll("right")} aria-label="Siguiente" className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:border-[#004AAD] hover:text-white transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
            <Link href="/marketplace" className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors group ml-2">
              Ver Todo el Catálogo
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Carrusel */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((product, idx) => {
            const imageUrl = product.imagenes.find((image) => isAllowedImageUrl(image));
            const href = `/marketplace/${product.slug}`;

            return (
              <motion.div
                key={product.id}
                className="snap-start shrink-0 w-65 sm:w-70"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
              >
                <article className="h-full bg-[#111] border border-white/8 rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1 hover:shadow-lg hover:shadow-[#004AAD]/15 transition-all duration-300">
                  {/* Imagen */}
                  <div className="relative bg-[#181818] flex items-center justify-center h-44 border-b border-white/5 overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product.nombre}
                        fill
                        sizes="280px"
                        className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-gray-700" />
                    )}
                    <div
                      className="absolute inset-0 opacity-[0.03] pointer-events-none"
                      style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }}
                    />
                  </div>

                  {/* Contenido */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Tag className="h-3 w-3 text-[#004AAD] shrink-0" />
                      <span className="text-xs text-[#004AAD] font-bold uppercase tracking-widest line-clamp-1">
                        {product.categoria?.nombre || "Marketplace"}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white leading-snug mb-4 flex-1 line-clamp-2 group-hover:text-[#F58634] transition-colors">
                      {product.nombre}
                    </h4>
                    <div className="mt-auto">
                      <p className="text-xs text-[#F58634] mb-4 font-medium">
                        {product.destacado ? 'Destacado · Solicitar cotización' : 'Solicitar cotización'}
                      </p>
                      <Link
                        href={href}
                        className="block w-full text-center text-xs font-bold uppercase tracking-widest border border-[#004AAD] text-[#004AAD] py-2.5 rounded-lg hover:bg-[#004AAD] hover:text-white transition-colors duration-200"
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                </article>
              </motion.div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#111] p-6 text-sm text-white/60">
            No hay productos publicados en este momento.
          </div>
        )}
      </div>
    </section>
  );
}
