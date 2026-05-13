"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, Building2, MonitorCog, Pickaxe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Anuncio, AdZona } from "@/lib/api";

// ── Icono fallback por zona ─────────────────────────────────────
const FALLBACK_ICONS: Record<AdZona, React.ElementType> = {
  "hero-slider": Zap,
  "editorial-grid": MonitorCog,
  "post-in-content": Pickaxe,
  "post-sidebar": Building2,
};

// ── Intervalo de rotación por zona (ms) ─────────────────────────
const INTERVALS: Record<AdZona, number> = {
  "hero-slider": 6000,
  "editorial-grid": 5000,
  "post-in-content": 7000,
  "post-sidebar": 6000,
};

interface AdZoneSliderProps {
  ads: Anuncio[];
  zona: AdZona;
  className?: string;
  layout?: "card" | "wide";
}

export default function AdZoneSlider({ ads, zona, className = "", layout = "card" }: AdZoneSliderProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(next, INTERVALS[zona]);
    return () => clearInterval(timer);
  }, [ads.length, zona, next]);

  if (ads.length === 0) return null;

  const ad = ads[current];
  const FallbackIcon = FALLBACK_ICONS[zona];
  const acento = ad.acento ?? "#F58634";

  if (zona === "hero-slider") {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full"
          >
            {/* Sector badge */}
            <span
              className="inline-block text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-sm mb-4"
              style={{ color: acento, border: `1px solid ${acento}40` }}
            >
              {ad.sector ?? "Patrocinado"}
            </span>

            <h3 className="font-['Space_Grotesk'] text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight max-w-lg">
              {ad.titulo}
            </h3>
            <p className="text-slate-300 text-sm md:text-base mb-6 max-w-md leading-relaxed">
              {ad.descripcion}
            </p>

            <div className="flex items-center gap-6">
              <Link
                href={ad.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-lg transition-colors"
                style={{ backgroundColor: acento, color: acento === "#004AAD" ? "#fff" : "#000" }}
              >
                {ad.cta_texto}
              </Link>
              {ad.metrica && (
                <span
                  className="text-xs font-bold uppercase tracking-widest border-b-2 pb-0.5"
                  style={{ color: acento, borderColor: acento }}
                >
                  {ad.metrica}
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        {ads.length > 1 && (
          <div className="flex gap-2 mt-8">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? "2rem" : "0.5rem",
                  backgroundColor: i === current ? acento : "#ffffff40",
                }}
                aria-label={`Ir al anuncio ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (zona === "editorial-grid") {
    if (layout === "wide") {
      return (
        <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#031c38] ${className}`}>
          {ad.imagen_url ? (
            <Image
              src={ad.imagen_url}
              alt={ad.titulo}
              fill
              sizes="100vw"
              className="object-cover opacity-20"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `radial-gradient(circle at right, ${acento}30, #021325 60%)` }}
            />
          )}

          <div className="absolute inset-0 bg-linear-to-r from-[#021325]/95 via-[#021325]/88 to-[#021325]/78" />

          <AnimatePresence mode="wait">
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="relative z-10 grid gap-6 p-5 md:grid-cols-[1.2fr_0.8fr] md:items-stretch md:p-8 lg:p-10"
            >
              <div className="flex flex-col justify-between">
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-gray-300 bg-black/60 px-2.5 py-1 rounded-sm">
                      Publicidad
                    </span>
                    {ad.sector && (
                      <span
                        className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-sm"
                        style={{ color: acento, background: `${acento}22` }}
                      >
                        {ad.sector}
                      </span>
                    )}
                  </div>

                  <h4 className="font-['Space_Grotesk'] font-bold text-white text-2xl md:text-3xl leading-tight">
                    {ad.titulo}
                  </h4>
                  <p className="mt-3 max-w-2xl text-slate-300 text-sm md:text-base leading-relaxed">
                    {ad.descripcion}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Link
                    href={ad.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[11px] uppercase tracking-widest font-bold px-5 py-2.5 rounded-lg transition-colors"
                    style={{ backgroundColor: acento, color: acento === "#004AAD" ? "#fff" : "#000" }}
                  >
                    {ad.cta_texto}
                  </Link>
                  {ad.metrica && (
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: acento }}>
                      {ad.metrica}
                    </span>
                  )}
                </div>

                {ads.length > 1 && (
                  <div className="mt-5 flex gap-1.5">
                    {ads.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className="h-1 rounded-full transition-all duration-300"
                        style={{
                          width: i === current ? "1.8rem" : "0.45rem",
                          backgroundColor: i === current ? acento : "#ffffff30",
                        }}
                        aria-label={`Anuncio ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative h-52 overflow-hidden rounded-xl border border-white/15 bg-black/30 md:h-full md:min-h-65">
                {ad.imagen_url ? (
                  <Image
                    src={ad.imagen_url}
                    alt={ad.titulo}
                    fill
                    sizes="(max-width: 768px) 100vw, 35vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${acento}1f, #021325)` }}>
                    <FallbackIcon className="h-14 w-14 opacity-50" style={{ color: acento }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-[#021325]/45 via-transparent to-transparent" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      );
    }

    return (
      <div className={`relative overflow-hidden rounded-xl bg-[#031c38] border border-white/5 flex flex-col ${className}`}>
        {/* Image area */}
        <div className="relative flex-1 min-h-40">
          {ad.imagen_url ? (
            <Image
              src={ad.imagen_url}
              alt={ad.titulo}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${acento}20, #021325)` }}>
              <FallbackIcon className="w-16 h-16 opacity-40" style={{ color: acento }} />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-transparent to-transparent" />
          <span className="absolute top-3 left-3 text-[9px] uppercase tracking-widest text-gray-400 bg-black/60 px-2 py-1 rounded-sm">
            Publicidad
          </span>
          {ad.sector && (
            <span
              className="absolute top-3 right-3 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm"
              style={{ color: acento, background: `${acento}20` }}
            >
              {ad.sector}
            </span>
          )}
        </div>

        {/* Text area */}
        <div className="p-5 flex flex-col gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <h4 className="font-['Space_Grotesk'] font-bold text-white text-lg leading-tight mb-2">
                {ad.titulo}
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">{ad.descripcion}</p>
              <Link
                href={ad.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[11px] uppercase tracking-widest font-bold px-5 py-2.5 rounded-lg transition-colors"
                style={{ backgroundColor: acento, color: acento === "#004AAD" ? "#fff" : "#000" }}
              >
                {ad.cta_texto}
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          {ads.length > 1 && (
            <div className="flex gap-1.5 mt-1">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: i === current ? "1.5rem" : "0.4rem",
                    backgroundColor: i === current ? acento : "#ffffff30",
                  }}
                  aria-label={`Anuncio ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (zona === "post-in-content") {
    return (
      <div className={`my-16 bg-[#031c38] border rounded-2xl p-8 relative overflow-hidden group ${className}`} style={{ borderColor: `${acento}30` }}>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `linear-gradient(${acento} 1px, transparent 1px), linear-gradient(90deg, ${acento} 1px, transparent 1px)`, backgroundSize: "24px 24px" }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.45 }}
            className="relative z-10 flex flex-col md:flex-row items-center gap-8"
          >
            <div className="flex-1">
              <span className="text-[10px] text-gray-300 uppercase tracking-widest border border-gray-600 px-2 py-1 rounded-sm mb-4 inline-block">
                Anuncio Patrocinado
              </span>
              {ad.sector && (
                <span className="ml-2 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm mb-4 inline-block" style={{ color: acento }}>
                  {ad.sector}
                </span>
              )}
              <h4 className="font-['Space_Grotesk'] text-2xl font-bold text-white mb-3 leading-tight">
                {ad.titulo}
              </h4>
              <p className="text-sm text-slate-300 mb-6">{ad.descripcion}</p>
              <div className="flex items-center gap-4">
                <Link
                  href={ad.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-lg transition-colors"
                  style={{ backgroundColor: acento, color: acento === "#004AAD" ? "#fff" : "#000" }}
                >
                  {ad.cta_texto}
                </Link>
                {ad.metrica && (
                  <span className="text-xs font-bold" style={{ color: acento }}>{ad.metrica}</span>
                )}
              </div>
            </div>

            {/* Visual panel */}
            <div className="w-full md:w-1/3 aspect-square bg-[#1a1a1a] rounded-xl flex items-center justify-center border border-white/10 group-hover:border-[#F58634]/50 transition-colors overflow-hidden relative">
              {ad.imagen_url ? (
                <Image
                  src={ad.imagen_url}
                  alt={ad.titulo}
                  fill
                  sizes="300px"
                  className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <FallbackIcon className="h-16 w-16 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: acento }} />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        {ads.length > 1 && (
          <div className="flex gap-2 mt-6 relative z-10">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? "1.5rem" : "0.4rem",
                  backgroundColor: i === current ? acento : "#ffffff30",
                }}
                aria-label={`Anuncio ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // zona === "post-sidebar"
  return (
    <div className={`w-full bg-[#021325] border border-white/10 flex flex-col relative overflow-hidden group cursor-pointer rounded-xl ${className}`}>
      <span className="absolute top-2 right-2 z-10 text-[9px] text-gray-400 uppercase tracking-widest">Publicidad</span>

      {/* Image */}
      <div className="relative w-full aspect-video overflow-hidden">
        {ad.imagen_url ? (
          <Image
            src={ad.imagen_url}
            alt={ad.titulo}
            fill
            sizes="300px"
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, #1a1a1a, #021325)` }}>
            <FallbackIcon className="w-16 h-16 text-gray-500 group-hover:text-white transition-colors duration-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-[#021325] via-transparent to-transparent" />
      </div>

      {/* Text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={ad.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center p-6 gap-3"
        >
          {ad.sector && (
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: acento }}>
              {ad.sector}
            </span>
          )}
          <h4 className="font-['Space_Grotesk'] font-bold text-xl text-white leading-tight">
            {ad.titulo}
          </h4>
          <p className="text-sm text-slate-300">{ad.descripcion}</p>
          <Link
            href={ad.cta_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[11px] font-bold uppercase tracking-widest border-b pb-0.5 group-hover:px-4 transition-all duration-300"
            style={{ color: acento, borderColor: acento }}
          >
            {ad.cta_texto}
          </Link>

          {ad.metrica && (
            <span className="text-[10px] text-gray-400 mt-1">{ad.metrica}</span>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      {ads.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-4">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === current ? "1.5rem" : "0.4rem",
                backgroundColor: i === current ? acento : "#ffffff30",
              }}
              aria-label={`Anuncio ${i + 1}`}
            />
          ))}
        </div>
      )}

      <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 transition-all duration-500 pointer-events-none rounded-xl" />
    </div>
  );
}
