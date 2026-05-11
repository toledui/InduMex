"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Share2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import NewsletterCapture from "@/components/NewsletterCapture";
import { getConfig } from "@/lib/api";

export default function PremiumFooter() {
  const currentYear = new Date().getFullYear();
  const defaultCopyright = `© ${currentYear} INDUMEX MEDIA SA DE CV. HECHO EN MÉXICO.`;

  const [copyright, setCopyright] = useState(defaultCopyright);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const cfg = await getConfig();
        if (active && cfg.site_copyright) {
          setCopyright(cfg.site_copyright);
        }
      } catch {
        if (active) {
          setCopyright(defaultCopyright);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [defaultCopyright]);

  return (
    <footer className="bg-[#050505] border-t border-gray-900">
      <NewsletterCapture />

      <div className="max-w-400 mx-auto px-6 pt-16 md:pt-24 lg:pt-32 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12 md:mb-16 lg:mb-24">
          {/* Branding Section */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
              <Image
                src="/images/indumex-logo.svg"
                alt="InduMex"
                width={140}
                height={40}
                className="h-9 w-auto"
              />
            </Link>
            <p className="text-gray-500 font-light mb-8 max-w-sm">
              Plataforma de inteligencia de negocios B2B. Conectando oferta y
              demanda técnica en la manufactura nacional.
            </p>

            <button className="text-xs uppercase tracking-widest font-bold border border-gray-700 px-6 py-3 rounded hover:border-[#F58634] hover:text-[#F58634] transition-colors">
              Solicitar Media Kit B2B
            </button>
          </div>

          {/* Links Section */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-white text-xs uppercase tracking-widest font-bold mb-6">
                Explorar
              </h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-white transition-colors"
                  >
                    Noticias
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="hover:text-white transition-colors"
                  >
                    Revista Inmersiva
                  </Link>
                </li>
                <li>
                  <Link
                    href="/directorio"
                    className="hover:text-white transition-colors"
                  >
                    Directorio de Proveedores
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="hover:text-white transition-colors"
                  >
                    Marketplace Técnico
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs uppercase tracking-widest font-bold mb-6">
                Corporativo
              </h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li>
                  <Link
                    href="/sobre-nosotros"
                    className="hover:text-white transition-colors"
                  >
                    Sobre Nosotros
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contacto"
                    className="hover:text-white transition-colors"
                  >
                    Contacto Ventas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacidad"
                    className="hover:text-white transition-colors"
                  >
                    Aviso de Privacidad
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terminos-y-condiciones"
                    className="hover:text-white transition-colors"
                  >
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link
                    href="/facturacion-electronica"
                    className="hover:text-white transition-colors"
                  >
                    Política de Facturación
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* VALOR B2B Y NETWORKING */}
          <div className="lg:col-span-4">
            <div className="bg-[#111] border border-gray-800 p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <TrendingUp className="w-40 h-40" />
              </div>

              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="h-8 w-8 rounded-full bg-[#004AAD]/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-[#004AAD]" />
                </div>
                <span className="text-white text-xs uppercase tracking-widest font-bold">Acelerador de Negocios</span>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed mb-6 relative z-10">
                Conectamos tu marca directamente con <strong className="text-white">tomadores de decisión, directores de planta e ingenieros</strong>. Nuestro ecosistema digital está diseñado estratégicamente para posicionar tu autoridad y <strong className="text-[#F58634]">potenciar las ventas</strong> de tu empresa en el sector manufacturero.
              </p>
              <a href="/media-kit" className="text-[#004AAD] text-xs uppercase tracking-widest font-bold hover:underline relative z-10 inline-flex items-center gap-2">
                Haz crecer tus ventas B2B <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600 uppercase tracking-widest font-bold">
          <p>{copyright}</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors flex items-center gap-2">
              <Share2 className="h-4 w-4" /> LinkedIn
            </Link>
            <span>/</span>
            <Link href="#" className="hover:text-white transition-colors flex items-center gap-2">
              <Share2 className="h-4 w-4" /> Twitter
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
