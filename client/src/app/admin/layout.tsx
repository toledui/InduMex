'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Building2,
  ShoppingBag,
  UserCog,
  Users,
  Settings,
  Share2,
  Megaphone,
  Handshake,
  ChevronRight,
  ChevronDown,
  Bell,
  CircleUserRound,
  LogOut,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { CreditCard, LayoutGrid, BadgeCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { clearAdminSession } from '@/lib/api';

const navItems = [
  // ── Principal
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, group: 'principal' },

  // ── Monetización (Publicidad & Pagos)
  { href: '/admin/media-kit', label: 'Media Kit', icon: LayoutGrid, group: 'monetizacion' },
  { href: '/admin/anuncios', label: 'Anuncios', icon: Megaphone, group: 'monetizacion' },
  { href: '/admin/pagos', label: 'Pagos / Ventas', icon: CreditCard, group: 'monetizacion' },
  { href: '/admin/suscripciones', label: 'Suscripciones', icon: BadgeCheck, group: 'monetizacion' },

  // ── Marketplace
  { href: '/admin/marketplace', label: 'Marketplace', icon: ShoppingBag, group: 'tienda' },

  // ── Audiencia
  { href: '/admin/usuarios', label: 'Usuarios', icon: UserCog, group: 'audiencia' },
  { href: '/admin/suscriptores', label: 'Suscriptores', icon: Users, group: 'audiencia' },
  { href: '/admin/directorio', label: 'Directorio B2B', icon: Building2, group: 'audiencia' },

  // ── Sitio Web
  { href: '/admin/articulos', label: 'Artículos', icon: FileText, group: 'sitioweb' },
  { href: '/admin/empresas-lectoras', label: 'Empresas Lectoras', icon: Handshake, group: 'sitioweb' },
  { href: '/admin/redes-sociales', label: 'Redes Sociales', icon: Share2, group: 'sitioweb' },

  // ── Configuración
  { href: '/admin/settings', label: 'Configuración', icon: Settings, group: 'configuracion' },
  { href: '/admin/settings/chat', label: 'Chat Widget', icon: MessageSquare, group: 'configuracion' },
];

const sectionLabels: Record<string, string> = {
  principal: 'Inicio',
  tienda: 'Tienda',
  monetizacion: 'Monetización',
  audiencia: 'Audiencia',
  sitioweb: 'Sitio Web',
  configuracion: 'Configuración',
};

function getBreadcrumbs(pathname: string): string[] {
  const segments = pathname.replace('/admin', '').split('/').filter(Boolean);
  const labelMap: Record<string, string> = {
    articulos: 'Artículos',
    directorio: 'Directorio B2B',
    marketplace: 'Marketplace',
    'media-kit': 'Media Kit',
    pagos: 'Pagos / Ventas',
    suscripciones: 'Suscripciones',
    usuarios: 'Usuarios',
    suscriptores: 'Suscriptores',
    'redes-sociales': 'Redes Sociales',
    anuncios: 'Anuncios',
    'empresas-lectoras': 'Empresas Lectoras',
    settings: 'Configuración',
    chat: 'Chat Widget',
  };
  return ['Admin', ...segments.map((s) => labelMap[s] ?? s.charAt(0).toUpperCase() + s.slice(1))];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ nombre?: string; email?: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    principal: true,
    tienda: true,
    monetizacion: true,
    audiencia: true,
    sitioweb: true,
    configuracion: true,
  });

  useEffect(() => {
    const raw = document.cookie
      .split('; ')
      .find((row) => row.startsWith('indumex_admin_user='));
    if (raw) {
      try {
        setCurrentUser(JSON.parse(decodeURIComponent(raw.split('=')[1])));
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  const isAuthPage =
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/admin/recuperar') ||
    pathname.startsWith('/admin/restablecer');

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-[#010b17] text-white font-['Space_Grotesk']">
        {children}
      </main>
    );
  }

  const breadcrumbs = getBreadcrumbs(pathname);

  function handleLogout(): void {
    clearAdminSession();
    router.push('/admin/login');
  }

  function toggleSection(section: string): void {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="flex h-screen bg-[#021325] text-white font-['Space_Grotesk'] overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-[#010b17] border-r border-white/10">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <Image
            src="/images/Indumex_logo.png"
            alt="InduMex Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <div className="leading-tight">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#F58634] uppercase">
              InduMex
            </p>
            <p className="text-[10px] text-white/40 tracking-widest uppercase">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-0 overflow-y-auto">
          {Object.entries(
            navItems.reduce(
              (acc, item) => {
                if (!acc[item.group]) acc[item.group] = [];
                acc[item.group].push(item);
                return acc;
              },
              {} as Record<string, typeof navItems>
            )
          ).map(([group, items]) => {
            const isExpanded = expandedSections[group] ?? true;

            return (
              <div key={group} className="mb-2">
                {/* Section Header */}
                {group !== 'principal' && (
                  <button
                    onClick={() => toggleSection(group)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all duration-150 uppercase tracking-wider"
                  >
                    <ChevronDown
                      size={14}
                      className={`shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                    {sectionLabels[group] || group}
                  </button>
                )}

                {/* Section Items */}
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="space-y-1">
                    {items.map(({ href, label, icon: Icon }) => {
                      const isActive =
                        href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

                      return (
                        <Link
                          key={href}
                          href={href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                            isActive
                              ? 'bg-[#F58634]/10 text-[#F58634] border border-[#F58634]/20'
                              : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon
                            size={17}
                            className={`shrink-0 transition-colors ${
                              isActive
                                ? 'text-[#F58634]'
                                : 'text-white/30 group-hover:text-white/70'
                            }`}
                          />
                          <span className="font-medium">{label}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F58634]" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer del sidebar */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-[10px] text-white/20 text-center tracking-wider">
            InduMex 2.0 · Panel de Control
          </p>
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR ── */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[1px] md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col bg-[#010b17] border-r border-white/10 transform transition-transform duration-200 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Image
              src="/images/Indumex_logo.png"
              alt="InduMex Logo"
              width={28}
              height={28}
              className="object-contain"
            />
            <div className="leading-tight">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#F58634] uppercase">
                InduMex
              </p>
              <p className="text-[10px] text-white/40 tracking-widest uppercase">Admin Panel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
            className="rounded-lg p-1.5 text-white/45 hover:text-white hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0 overflow-y-auto">
          {Object.entries(
            navItems.reduce(
              (acc, item) => {
                if (!acc[item.group]) acc[item.group] = [];
                acc[item.group].push(item);
                return acc;
              },
              {} as Record<string, typeof navItems>
            )
          ).map(([group, items]) => {
            const isExpanded = expandedSections[group] ?? true;

            return (
              <div key={group} className="mb-2">
                {group !== 'principal' && (
                  <button
                    onClick={() => toggleSection(group)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all duration-150 uppercase tracking-wider"
                  >
                    <ChevronDown
                      size={14}
                      className={`shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                    {sectionLabels[group] || group}
                  </button>
                )}

                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="space-y-1">
                    {items.map(({ href, label, icon: Icon }) => {
                      const isActive =
                        href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

                      return (
                        <Link
                          key={href}
                          href={href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                            isActive
                              ? 'bg-[#F58634]/10 text-[#F58634] border border-[#F58634]/20'
                              : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon
                            size={17}
                            className={`shrink-0 transition-colors ${
                              isActive
                                ? 'text-[#F58634]'
                                : 'text-white/30 group-hover:text-white/70'
                            }`}
                          />
                          <span className="font-medium">{label}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F58634]" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* TOPBAR */}
        <header className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#010b17]/80 backdrop-blur-md shrink-0">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex md:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5"
            >
              <Menu size={18} />
            </button>
            <nav aria-label="Ruta actual" className="hidden sm:flex items-center gap-1.5 text-sm min-w-0">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && <ChevronRight size={13} className="text-white/25" />}
                  <span
                    className={`truncate ${
                      i === breadcrumbs.length - 1
                        ? 'text-white font-semibold'
                        : 'text-white/40'
                    }`}
                  >
                    {crumb}
                  </span>
                </span>
              ))}
            </nav>
            <p className="sm:hidden text-sm font-semibold text-white truncate">
              {breadcrumbs[breadcrumbs.length - 1]}
            </p>
          </div>

          {/* Acciones del usuario */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              aria-label="Notificaciones"
              className="relative p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F58634]" />
            </button>

            <div className="flex items-center gap-2.5 pl-2 sm:pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white leading-none">
                  {currentUser?.nombre || 'Administrador'}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {currentUser?.email || 'contacto@indumex.blog'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#F58634]/20 border border-[#F58634]/30 flex items-center justify-center">
                <CircleUserRound size={18} className="text-[#F58634]" />
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="ml-1 p-1.5 rounded-lg text-white/35 hover:text-white hover:bg-white/5 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-[#021325] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
