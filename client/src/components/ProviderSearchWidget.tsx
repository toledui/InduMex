"use client";

import { useState } from "react";
import { Globe2, ArrowRight } from "lucide-react";

const PROVIDER_CATEGORIES = [
  "Maquinaria CNC",
  "Acero",
  "Logística 3PL",
  "Empaque",
  "Automatización",
];

export default function ProviderSearchWidget() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <section className="py-16 md:py-24 lg:py-32 relative border-b border-white/5 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#004AAD]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="mb-12 flex flex-col items-center text-center">
          <Globe2 className="h-10 w-10 text-[#F58634] mb-6" />
          <h3 className="font-['Space_Grotesk'] text-2xl md:text-3xl font-bold uppercase tracking-tight text-gray-400 mb-2">
            Directorio de Proveedores
          </h3>
          <p className="text-gray-500">
            Más de 15,000 empresas verificadas en México.
          </p>
        </div>

        <div className="relative group">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="¿QUÉ NECESITA TU PLANTA?"
            className="w-full bg-transparent border-b-2 border-gray-700 pb-4 md:pb-6 text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-['Space_Grotesk'] font-bold tracking-tight text-white placeholder-gray-800 focus:outline-none focus:border-[#F58634] transition-colors"
          />
          <button
            className={`absolute right-0 bottom-6 text-[#F58634] transition-all duration-300 ${
              searchValue ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
            }`}
          >
            <ArrowRight className="h-12 w-12" />
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          {PROVIDER_CATEGORIES.map((tag) => (
            <span
              key={tag}
              className="text-xs uppercase tracking-widest border border-gray-800 text-gray-400 px-4 py-2 rounded-full hover:border-[#004AAD] hover:text-white cursor-pointer transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
