"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Anuncio } from "@/lib/api";

interface Props {
  ads: Anuncio[];
}

export default function PremiumAdSliderClient({ ads }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ads.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const ad = ads[activeIndex];
  const acento = ad.acento ?? "#F58634";
  const glow = acento === "#004AAD" ? "rgba(0, 74, 173, 0.35)" : "rgba(245, 134, 52, 0.3)";

  return (
    <section className="py-16 md:py-24">
        <div className="max-w-400 mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#031c38]/85 backdrop-blur-xl">
          {/* Grid pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <AnimatePresence mode="wait">
            <motion.article
              key={ad.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative z-10 grid min-h-80 grid-cols-1 gap-8 p-6 sm:p-8 lg:min-h-90 lg:grid-cols-12 lg:items-center lg:gap-10 lg:p-12"
            >
              {/* Left: text */}
              <div className="lg:col-span-7">
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#F58634]/85">
                  {ad.sector ?? "Patrocinador Premium"}
                </span>

                <h3 className="mt-5 max-w-3xl font-['Rubik'] text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                  {ad.titulo}
                </h3>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                  {ad.descripcion}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href={ad.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110"
                    style={{ backgroundColor: acento, color: acento === "#004AAD" ? "#fff" : "#000" }}
                  >
                    {ad.cta_texto}
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  {ad.metrica && (
                    <span className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300">
                      {ad.metrica}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: image or icon */}
              <div className="lg:col-span-5">
                <div className="relative h-57.5 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b] sm:h-65 lg:h-72.5">
                  <div className="absolute -inset-8 blur-3xl" style={{ backgroundColor: glow }} />

                  <motion.div
                    key={`${ad.id}-visual`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className="relative z-10 flex h-full items-center justify-center"
                  >
                    {ad.imagen_url ? (
                      <Image
                        src={ad.imagen_url}
                        alt={ad.titulo}
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-cover opacity-80"
                        priority
                      />
                    ) : (
                      <div className="relative flex h-40 w-40 items-center justify-center rounded-4xl border border-white/15 bg-black/35 shadow-2xl sm:h-48 sm:w-48">
                        <Zap className="h-16 w-16 text-white" style={{ color: acento }} />
                        <div
                          className="absolute -right-5 -top-5 rounded-xl border border-white/20 bg-white/8 px-3 py-2 text-[10px] font-bold uppercase tracking-widest"
                          style={{ color: acento }}
                        >
                          Sponsor
                        </div>
                        <div className="absolute -bottom-6 left-1/2 w-32 -translate-x-1/2 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-300">
                          {ad.sector ?? "InduMex"}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>

          {/* Dots */}
          <div className="relative z-10 flex items-center justify-center gap-2 pb-6 lg:pb-7">
            {ads.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Ir al patrocinador ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className="group h-2 rounded-full bg-white/20 transition-all"
                style={{ width: activeIndex === index ? 52 : 22 }}
              >
                <span
                  className="block h-full rounded-full transition-colors"
                  style={{ backgroundColor: activeIndex === index ? "#F58634" : "rgba(255,255,255,0.5)" }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
