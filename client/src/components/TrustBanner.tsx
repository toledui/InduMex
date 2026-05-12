"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getReaderCompanies, type EmpresaLectora } from "@/lib/api";

// Logotipos representados con texto estilizado (SVG inline) —
// reemplazar con <Image> cuando se tengan los archivos reales.
const FALLBACK_BRANDS = [
  { name: "Volkswagen", abbr: "VW" },
  { name: "Cemex", abbr: "CEMEX" },
  { name: "Vitro", abbr: "VITRO" },
  { name: "AHMSA", abbr: "AHMSA" },
  { name: "Grupo Herdez", abbr: "HERDEZ" },
  { name: "Mabe", abbr: "MABE" },
  { name: "GRUMA", abbr: "GRUMA" },
  { name: "Nemak", abbr: "NEMAK" },
];

export default function TrustBanner() {
  const [brands, setBrands] = useState(FALLBACK_BRANDS);

  useEffect(() => {
    let mounted = true;

    const loadBrands = async () => {
      try {
        const data = await getReaderCompanies();
        if (!mounted || data.length === 0) return;

        const normalized = data.map((item: EmpresaLectora) => ({
          name: item.nombre,
          abbr: item.abreviatura,
        }));
        setBrands(normalized);
      } catch {
        // Si falla API, se mantiene fallback local.
      }
    };

    loadBrands();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      className="border-y border-white/5 bg-[#010b17] py-8 overflow-hidden"
      aria-label="Empresas que leen InduMex"
    >
      <div className="max-w-400 mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
          {/* Etiqueta */}
          <p className="shrink-0 text-[11px] text-gray-600 uppercase tracking-[0.2em] font-bold text-center md:text-left leading-relaxed max-w-40">
            Ingenieros y compradores de estas empresas leen InduMex:
          </p>

          {/* Separador vertical — solo desktop */}
          <div className="hidden md:block w-px h-10 bg-white/10 shrink-0" />

          {/* Logos marquee */}
          <div className="relative flex-1 overflow-hidden w-full">
            {/* Fade izquierda/derecha */}
            <div className="absolute left-0 top-0 h-full w-12 bg-linear-to-r from-[#080808] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 h-full w-12 bg-linear-to-l from-[#080808] to-transparent z-10 pointer-events-none" />

            <motion.div
              className="flex gap-10 items-center"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 28,
                ease: "linear",
                repeat: Infinity,
              }}
              style={{ width: "max-content" }}
            >
              {/* Duplicamos para que el loop sea seamless */}
              {[...brands, ...brands].map((brand, idx) => (
                <div
                  key={`${brand.abbr}-${idx}`}
                  className="shrink-0 flex items-center justify-center h-8 px-4"
                  aria-label={brand.name}
                >
                  <span className="font-['Space_Grotesk'] text-sm font-bold tracking-tight text-gray-700 hover:text-gray-400 transition-colors cursor-default select-none whitespace-nowrap">
                    {brand.abbr}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
