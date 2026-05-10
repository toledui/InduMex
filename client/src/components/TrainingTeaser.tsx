"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Clock, Users, ArrowRight, BookOpen } from "lucide-react";
import type { WordPressPostCard } from "@/lib/wordpress";

// Datos de demostración - se usan solo si WordPress no tiene posts en la categoría "capacitacion"
const FALLBACK_POSTS = [
  { id: "1", title: "Posiciona tu empresa en Google: SEO para manufacturas B2B", slug: "seo-manufacturas-b2b", date: "2026-01-15", categories: { nodes: [{ name: "Marketing Digital", slug: "capacitacion" }] }, featuredImage: undefined },
  { id: "2", title: "LinkedIn B2B: Prospecta directores de compras en la industria", slug: "linkedin-b2b-industrial", date: "2026-02-10", categories: { nodes: [{ name: "Estrategia Comercial", slug: "capacitacion" }] }, featuredImage: undefined },
  { id: "3", title: "Industria 4.0: Cómo digitalizar tu planta sin morir en el intento", slug: "industria-40-digitalizacion", date: "2026-03-05", categories: { nodes: [{ name: "Transformación Digital", slug: "capacitacion" }] }, featuredImage: undefined },
  { id: "4", title: "Costeo ABC y fijación de precios para proveedores industriales", slug: "costeo-abc-proveedores", date: "2026-04-20", categories: { nodes: [{ name: "Finanzas Directivas", slug: "capacitacion" }] }, featuredImage: undefined },
] as WordPressPostCard[];

interface TrainingTeaserProps {
  posts?: WordPressPostCard[];
}

export default function TrainingTeaser({ posts }: TrainingTeaserProps) {
  const items = posts && posts.length > 0 ? posts : FALLBACK_POSTS;

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#004AAD]/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F58634]/20 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 md:mb-16">
          <div>
            <p className="text-xs text-[#004AAD] uppercase tracking-[0.2em] font-bold mb-3">
              InduMex Academy · Formación Directiva
            </p>
            <h3 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold uppercase tracking-tight">
              Capacitación <span className="text-[#F58634]">Industrial</span>
            </h3>
            <p className="mt-3 text-gray-500 text-sm max-w-xl">
              Masterclasses y cursos diseñados para ingenieros, directores de planta y emprendedores del sector manufacturero mexicano.
            </p>
          </div>
          <a href="#" className="shrink-0 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors group">
            Ver Todo el Catálogo
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((post, idx) => {
            const category = post.categories?.nodes?.[0];
            const imageUrl = post.featuredImage?.node?.sourceUrl;
            const href = `/${category?.slug || "capacitacion"}/${post.slug}`;
            const accent = idx % 2 === 0 ? "#F58634" : "#004AAD";

            return (
              <motion.article
                key={post.id}
                className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1 hover:border-white/15 hover:shadow-xl transition-all duration-300 cursor-pointer"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                {/* Imagen / Cabecera */}
                <div
                  className="relative h-36 flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: `${accent}12` }}
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 280px"
                      className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <BookOpen className="h-10 w-10 opacity-25" style={{ color: accent }} />
                  )}
                  <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}80, transparent)` }} />
                </div>

                {/* Contenido */}
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2 line-clamp-1">
                    {category?.name || "Capacitación"}
                  </span>
                  <h4 className="text-sm font-semibold text-white leading-snug mb-4 flex-1 line-clamp-3 group-hover:text-[#F58634] transition-colors">
                    {post.title}
                  </h4>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(post.date).toLocaleDateString("es-MX", { month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      InduMex Academy
                    </span>
                  </div>

                  <Link
                    href={href}
                    className="block w-full text-center text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg border transition-colors duration-200"
                    style={{ borderColor: `${accent}50`, color: accent }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = accent; (e.currentTarget as HTMLAnchorElement).style.color = "#000"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = accent; }}
                  >
                    Ver Curso
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* CTA inferior */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-gray-600 text-sm mb-4">¿Eres experto en manufactura o industria 4.0?</p>
          <a href="#" className="inline-flex items-center gap-2 border border-gray-700 text-gray-400 hover:border-[#F58634] hover:text-[#F58634] text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-full transition-colors">
            Propón tu Masterclass
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
