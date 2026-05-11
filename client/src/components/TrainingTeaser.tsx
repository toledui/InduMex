"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface TrainingTeaserProps {
  posts?: unknown[];
}

export default function TrainingTeaser({ posts: _posts }: TrainingTeaserProps) {

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#004AAD]/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#F58634]/20 to-transparent" />

      <div className="max-w-400 mx-auto px-4 sm:px-6">
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
            <div className="mt-4 inline-flex items-center rounded-full border border-[#F58634]/35 bg-[#F58634]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#F58634]">
              Próximamente tendremos capacitaciones industriales :) en temas de ventas, marketing y más.
            </div>
          </div>
          <a href="#" className="shrink-0 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-white transition-colors group">
            Ver Todo el Catálogo
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <motion.div
          className="rounded-3xl border border-white/10 bg-[#111] p-8 text-center sm:p-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm leading-relaxed text-white/75 sm:text-base">
            Próximamente tendremos capacitaciones industriales en temas de ventas, marketing, liderazgo comercial y crecimiento B2B.
          </p>
        </motion.div>

        {/* CTA inferior */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-gray-600 text-sm mb-4">¿Eres experto en manufactura o industria 4.0?</p>
          <a href="/contacto" className="inline-flex items-center gap-2 border border-gray-700 text-gray-400 hover:border-[#F58634] hover:text-[#F58634] text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-full transition-colors">
            Propón tu Masterclass
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
