'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, UserCircle2, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Revista", href: "/revista" },
  { label: "Blog", href: "/blog" },
  { label: "Directorio B2B", href: "/directorio" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Contacto", href: "/contacto" },
];

export default function PremiumHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el menú al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Evita scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header
        className="fixed top-0 w-full z-50 border-b border-white/5"
        style={{ backdropFilter: "blur(20px)", backgroundColor: "rgba(10,10,10,0.85)" }}
        role="banner"
      >
        <div className="max-w-400 mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 hover:opacity-80 transition-opacity"
            aria-label="InduMex — Revista Industrial"
          >
            <Image
              src="/images/indumex-logo.svg"
              alt="InduMex"
              width={156}
              height={36}
              priority
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-10 text-xs uppercase tracking-[0.2em] font-semibold text-white" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="hover:text-[#F58634] transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#F58634] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/mi-cuenta"
              className="hidden sm:inline-flex items-center justify-center h-10 w-10 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-[#F58634] transition-colors"
              aria-label="Mi cuenta"
              title="Mi cuenta"
            >
              <UserCircle2 size={18} />
            </Link>

            {/* CTA — oculto en móvil para no saturar */}
            <Link
              href="/#newsletter"
              className="hidden sm:inline-flex text-xs uppercase tracking-widest font-bold border border-white/30 px-5 py-2 rounded-full text-white hover:bg-[#F58634] hover:border-[#F58634] hover:text-black transition-colors"
            >
              Suscribirse
            </Link>

            {/* Hamburger button — solo móvil */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-white/15 text-white hover:border-[#F58634] hover:text-[#F58634] transition-colors"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile menu panel */}
      <nav
        id="mobile-menu"
        aria-label="Menú móvil"
        className={`fixed top-16 left-0 right-0 z-40 md:hidden transition-all duration-300 ease-in-out ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
        style={{ backdropFilter: "blur(24px)", backgroundColor: "rgba(8,8,8,0.97)" }}
      >
        <ul className="flex flex-col border-b border-white/10 py-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center px-6 py-4 text-sm uppercase tracking-widest font-bold transition-colors border-l-2 ${
                  pathname === item.href
                    ? "text-[#F58634] border-[#F58634] bg-[#F58634]/5"
                    : "text-white/70 border-transparent hover:text-white hover:border-[#F58634]/50"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="px-6 py-4">
            <Link
              href="/mi-cuenta"
              onClick={() => setOpen(false)}
              className="mb-3 flex items-center justify-center w-full py-3 rounded-xl text-xs uppercase tracking-widest font-bold border border-white/20 text-white hover:border-[#F58634] hover:text-[#F58634] transition-colors"
            >
              Mi Cuenta
            </Link>
            <Link
              href="/#newsletter"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-full py-3 rounded-xl text-xs uppercase tracking-widest font-bold bg-[#F58634] text-black hover:bg-[#e5762a] transition-colors"
            >
              Suscribirse
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
