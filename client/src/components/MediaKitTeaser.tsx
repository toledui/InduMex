'use client';

import { ArrowRight, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function MediaKitTeaser() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-[#004AAD]/10 via-transparent to-[#F58634]/5 border-y border-[#004AAD]/20 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 md:mb-14">
          <div>
            <p className="text-xs text-[#F58634] uppercase tracking-[0.2em] font-bold mb-3">
              Aumenta tu Visibilidad
            </p>
            <h3 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold uppercase tracking-tight">
              Media Kits <span className="text-[#F58634]">Publicitarios</span>
            </h3>
          </div>
          <Link
            href="/media-kits"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#004AAD] hover:text-[#F58634] transition-colors group"
          >
            Ver Todos los Planes
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Plans Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Basic Plan */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg hover:border-[#004AAD] transition-all duration-300">
            <h4 className="text-xl font-bold text-[#004AAD] mb-2">Plan Básico</h4>
            <p className="text-sm text-gray-600 mb-4">
              Perfecta para startups y pequeños negocios.
            </p>
            <div className="mb-6">
              <span className="text-3xl font-bold text-[#004AAD]">$5,850</span>
              <span className="text-xs text-gray-500 ml-2 line-through">$6,500</span>
              <span className="text-xs bg-[#F58634]/20 text-[#F58634] px-2 py-1 rounded ml-2 font-bold">
                -10%
              </span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-[#004AAD]">✓</span> Logo en Media Kit
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-[#004AAD]">✓</span> Mención en newsletter
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-[#004AAD]">✓</span> 3 meses de validez
              </li>
            </ul>
            <Link
              href="/media-kits"
              className="w-full block text-center py-2 border-2 border-[#004AAD] text-[#004AAD] font-bold rounded-lg hover:bg-[#004AAD] hover:text-white transition-colors"
            >
              Más Información
            </Link>
          </div>

          {/* Professional Plan - Featured */}
          <div className="bg-gradient-to-br from-[#004AAD] to-[#004AAD]/90 text-white border border-[#F58634]/50 rounded-2xl p-8 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-4 right-4 bg-[#F58634] text-black px-3 py-1 rounded-full text-xs font-bold">
              POPULAR
            </div>
            <h4 className="text-xl font-bold mb-2">Plan Profesional</h4>
            <p className="text-sm text-white/80 mb-4">
              La opción más elegida por nuestros clientes.
            </p>
            <div className="mb-6">
              <span className="text-3xl font-bold">$11,050</span>
              <span className="text-xs text-white/60 ml-2 line-through">$13,000</span>
              <span className="text-xs bg-[#F58634]/40 text-[#F58634] px-2 py-1 rounded ml-2 font-bold">
                -15%
              </span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm">
                <span className="text-[#F58634]">✓</span> Logo destacado
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-[#F58634]">✓</span> Banner en homepage
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-[#F58634]">✓</span> 6 meses de validez
              </li>
            </ul>
            <Link
              href="/media-kits"
              className="w-full block text-center py-2 bg-[#F58634] text-black font-bold rounded-lg hover:bg-[#e5762a] transition-colors"
            >
              Ver Plan Completo
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg hover:border-[#F58634] transition-all duration-300">
            <h4 className="text-xl font-bold text-[#F58634] mb-2">Plan Premium</h4>
            <p className="text-sm text-gray-600 mb-4">
              Máxima exposición para líderes industriales.
            </p>
            <div className="mb-6">
              <span className="text-3xl font-bold text-[#F58634]">$16,000</span>
              <span className="text-xs text-gray-500 ml-2 line-through">$20,000</span>
              <span className="text-xs bg-[#F58634]/20 text-[#F58634] px-2 py-1 rounded ml-2 font-bold">
                -20%
              </span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-[#F58634]">✓</span> Máxima visibilidad
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-[#F58634]">✓</span> Webinar exclusivo
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-[#F58634]">✓</span> 12 meses de validez
              </li>
            </ul>
            <Link
              href="/media-kits"
              className="w-full block text-center py-2 border-2 border-[#F58634] text-[#F58634] font-bold rounded-lg hover:bg-[#F58634] hover:text-black transition-colors"
            >
              Más Información
            </Link>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            ¿Listo para llevar tu marca al siguiente nivel?
          </p>
          <Link
            href="/media-kits"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#004AAD] text-white font-bold rounded-xl hover:bg-[#003080] transition-colors"
          >
            <CreditCard size={18} />
            Explorar Todos los Planes
          </Link>
        </div>
      </div>
    </section>
  );
}
