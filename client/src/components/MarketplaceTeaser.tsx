"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Tag, Package } from "lucide-react";
import type { WordPressPostCard } from "@/lib/wordpress";

// Datos de demostración - se usan solo si WordPress no devuelve posts de la categoría "marketplace"
const FALLBACK_POSTS = [
  { id: "1", title: "Sensor de Proximidad Inductivo IP67", slug: "sensor-proximidad-ip67", date: "", categories: { nodes: [{ name: "Sensores & Detección", slug: "marketplace" }] }, featuredImage: undefined },
  { id: "2", title: "Cilindro Neumático Serie ISO 15552", slug: "cilindro-neumatico-iso", date: "", categories: { nodes: [{ name: "Neumática", slug: "marketplace" }] }, featuredImage: undefined },
  { id: "3", title: "Variador de Frecuencia 7.5 kW Trifásico", slug: "variador-frecuencia-7kw", date: "", categories: { nodes: [{ name: "Automatización", slug: "marketplace" }] }, featuredImage: undefined },
  { id: "4", title: "Banda Transportadora Modular Polipropileno", slug: "banda-transportadora", date: "", categories: { nodes: [{ name: "Manejo de Materiales", slug: "marketplace" }] }, featuredImage: undefined },
  { id: "5", title: "PLC Compacto 24 E/S con Ethernet", slug: "plc-compacto-ethernet", date: "", categories: { nodes: [{ name: "Control Industrial", slug: "marketplace" }] }, featuredImage: undefined },
] as WordPressPostCard[];

interface MarketplaceTeaserProps {
  posts?: WordPressPostCard[];
}

export default function MarketplaceTeaser({ posts }: MarketplaceTeaserProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const items = posts && posts.length > 0 ? posts : FALLBACK_POSTS;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-[#050505] border-y border-white/5 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
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
            <a href="#" className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors group ml-2">
              Ver Todo el Catálogo
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Carrusel */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((post, idx) => {
            const category = post.categories?.nodes?.[0];
            const imageUrl = post.featuredImage?.node?.sourceUrl;
            const href = `/${category?.slug || "marketplace"}/${post.slug}`;

            return (
              <motion.div
                key={post.id}
                className="snap-start shrink-0 w-[260px] sm:w-[280px]"
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
                        alt={post.title}
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
                        {category?.name || "Marketplace"}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white leading-snug mb-4 flex-1 line-clamp-2 group-hover:text-[#F58634] transition-colors">
                      {post.title}
                    </h4>
                    <div className="mt-auto">
                      <p className="text-xs text-[#F58634] mb-4 font-medium">Solicitar Cotización</p>
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
      </div>
    </section>
  );
}
