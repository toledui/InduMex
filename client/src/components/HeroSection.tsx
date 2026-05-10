"use client";

import { useMemo } from "react";
import { motion, easeOut } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BarChart3, Building2, MapPinned } from "lucide-react";
import NetworkBackground from "@/components/NetworkBackground";
import type { WordPressPostCard } from "@/lib/wordpress";

interface HeroSectionProps {
  post: WordPressPostCard;
}

export default function HeroSection({ post }: HeroSectionProps) {
  const category = post.categories?.nodes?.[0];
  const postUrl = `/${category?.slug || "noticias"}/${post.slug}`;

  const ecosystemMetrics = useMemo(
    () => [
      { value: "15K+", label: "Directivos", icon: Building2 },
      { value: "500+", label: "Proveedores", icon: BarChart3 },
      { value: "32", label: "Estados", icon: MapPinned },
    ],
    []
  );

  const sectors = useMemo(
    () => ["Automatización", "Nearshoring", "Logística", "Mecanizado", "Energía", "Y mucho más"],
    []
  );

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: easeOut, delay },
  });

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505] pt-20 pb-16 lg:pb-8">
      {/* BACKGROUND: CANVAS NETWORK */}
      <div className="absolute inset-0 z-0">
        <NetworkBackground />

        {/* Máscaras para legibilidad y fusión con el layout */}
        <div className="absolute inset-0 bg-linear-to-r from-[#050505] via-[#050505]/40 to-[#050505]/80 pointer-events-none"></div>
        <div className="absolute inset-0 bg-linear-to-b from-[#050505] via-transparent to-[#050505] pointer-events-none"></div>
      </div>

      {/* Main Content - 60/40 Split */}
      <div className="max-w-400 w-full mx-auto px-4 sm:px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-32 lg:py-0 min-h-dvh lg:min-h-screen">
        {/* Left Side - 60% */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {/* Overline / Tag */}
          <motion.div
            className="flex flex-wrap items-center gap-3 mb-8"
            {...reveal(0.2)}
          >
            <span className="bg-[#F58634] text-black text-xs font-bold px-4 py-1.5 uppercase tracking-[0.15em] rounded-full">
              En Portada
            </span>
            <span className="text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#004AAD] animate-pulse"></span>
              Análisis Sectorial
            </span>
          </motion.div>

          {/* H1 - SEO Optimized (Invisible) */}
          <h1 className="sr-only">
            Revista Industrial en México: Inteligencia B2B y Negocios
          </h1>

          {/* H1 - Visual (Animated Reveal) */}
          <motion.div
            className="mb-6 lg:mb-8 overflow-hidden"
            {...reveal(0.35)}
          >
            <h2 className="font-['Space_Grotesk'] text-4xl md:text-5xl lg:text-7xl font-bold leading-[0.95] tracking-tight text-white">
              Revista{" "}
              <span className="text-[#004AAD] block sm:inline">Industrial</span>{" "}
              <br className="hidden sm:block" />
              en{" "}
              <span className="text-[#F58634]">
                México
              </span>
              : Inteligencia B2B
            </h2>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="text-base sm:text-lg text-gray-300 font-light leading-relaxed max-w-2xl mb-8 lg:mb-12 border-l-2 border-[#F58634] pl-4 sm:pl-6"
            {...reveal(0.5)}
          >
            Conectando oferta y demanda técnica. Descubre noticias, tendencias
            de automatización, y el directorio de proveedores B2B más completo
            del sector manufacturero.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
            {...reveal(0.65)}
          >
            {/* Primary CTA - Orange */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: easeOut, delay: 0.75 }}
            >
              <Link
                href={postUrl}
                className="group inline-flex items-center gap-3 bg-[#F58634] hover:bg-[#E07B2A] text-black text-sm font-bold uppercase tracking-widest px-8 py-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-[#F58634]/30 data-interactive"
                data-interactive
              >
                Leer Última Edición
                <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Secondary CTA - Outlined */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: easeOut, delay: 0.85 }}
            >
              <button
                className="inline-flex items-center gap-3 border-2 border-white/30 hover:border-[#004AAD] text-white hover:text-[#004AAD] text-sm font-bold uppercase tracking-widest px-8 py-4 rounded-lg transition-all duration-300 hover:bg-white/5 group data-interactive"
                data-interactive
              >
                Explorar Directorio B2B
                <span className="w-5 h-5 border-2 border-current rounded-full flex items-center justify-center group-hover:bg-current group-hover:text-[#0a0a0a] transition-all">
                  →
                </span>
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side - 40% - Ecosystem Panel */}
        <motion.div
          className="lg:col-span-5 flex justify-center w-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <div className="relative w-full max-w-lg">
            <motion.aside
              className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/8 p-6 backdrop-blur-xl shadow-2xl md:p-8"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.75, ease: easeOut }}
            >
              <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#F58634]/18 blur-3xl" />
              <div className="absolute -left-20 bottom-8 h-40 w-40 rounded-full bg-[#004AAD]/22 blur-3xl" />

              <div className="relative z-10">
                <div className="rounded-2xl border border-white/12 bg-black/25 p-5">
                  <h3 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">
                    El Ecosistema
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {ecosystemMetrics.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.55 + idx * 0.1, duration: 0.45 }}
                          className="rounded-xl border border-white/12 bg-black/35 px-3 py-4 text-center"
                        >
                          <Icon className="mx-auto mb-2 h-4 w-4 text-[#F58634]" />
                          <p className="text-2xl font-black text-white">{item.value}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-widest text-gray-400">{item.label}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/12 bg-black/25 p-5">
                  <h4 className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">
                    Inteligencia por Sector
                  </h4>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {sectors.map((sector, idx) => (
                      <motion.button
                        key={sector}
                        type="button"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.75 + idx * 0.08, duration: 0.35 }}
                        className="rounded-full border border-white/18 bg-white/5 px-4 py-2 text-xs uppercase tracking-widest text-gray-200 transition-all hover:border-[#F58634] hover:bg-[#F58634]/15 hover:text-white data-interactive"
                        data-interactive
                      >
                        {sector}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <span className="text-xs text-gray-500 uppercase tracking-[0.3em]">
          Scroll
        </span>
        <div className="w-px h-12 bg-gray-600 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-white animate-[ping_1.5s_ease-in-out_infinite]"></div>
        </div>
      </motion.div>
    </section>
  );
}
