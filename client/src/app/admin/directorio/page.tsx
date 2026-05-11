'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  Building2,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  CircleDashed,
  ListFilter,
  PlusCircle,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { getAdminProviders, getAuthTokenFromCookie, toggleProviderActive, deleteAdminProvider, type PublicProvider } from '@/lib/api';
import { isImageLogo } from '@/lib/provider-sectors';

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export default function AdminDirectoryPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const token = getAuthTokenFromCookie();
    if (!token) {
      router.push('/admin/login');
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getAdminProviders(token);
        setProviders(data);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los proveedores.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleToggleActive(provider: PublicProvider, event: React.MouseEvent) {
    event.stopPropagation();
    const token = getAuthTokenFromCookie();
    if (!token || provider.id == null) return;
    setTogglingId(provider.id);
    try {
      const updated = await toggleProviderActive(token, provider.id, !provider.isActive);
      setProviders((prev) => prev.map((p) => (p.id === provider.id ? { ...p, isActive: updated.isActive } : p)));
    } catch {
      // silent
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(providerId: number, event: React.MouseEvent) {
    event.stopPropagation();
    const token = getAuthTokenFromCookie();
    if (!token) return;
    setDeletingId(providerId);
    try {
      await deleteAdminProvider(token, providerId);
      setProviders((prev) => prev.filter((p) => p.id !== providerId));
    } catch {
      // silent
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  const filteredProviders = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return providers;

    return providers.filter((provider) => {
      const haystack = [
        provider.name,
        provider.slug,
        provider.shortDescription,
        provider.about,
        provider.city,
        provider.state,
        provider.country,
        provider.website,
        provider.email,
        provider.phone,
        provider.whatsapp,
        provider.tier,
        ...(provider.sectors ?? []),
        ...(provider.certifications ?? []),
      ]
        .map((value) => normalizeText(value))
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [providers, query]);

  const stats = useMemo(() => {
    const total = providers.length;
    const premium = providers.filter((provider) => provider.tier === 'premium').length;
    const verified = providers.filter((provider) => provider.tier === 'verified').length;
    const active = providers.filter((provider) => provider.isActive).length;

    return { total, premium, verified, active };
  }, [providers]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 text-white">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#F58634]">
            <Building2 className="h-4 w-4" /> Directorio B2B
          </div>
          <h1 className="text-3xl font-black tracking-tight">Panel de Directorio</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/45">
            Gestiona proveedores, niveles comerciales, certificaciones y perfiles destacados del directorio.
          </p>
        </div>

        <Link
          href="/admin/directorio/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#F58634] px-5 py-3 text-sm font-bold text-black transition-all hover:bg-[#e5762a]"
        >
          <PlusCircle size={16} />
          Alta de Proveedor
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: 'Proveedores', value: stats.total, icon: Building2 },
          { label: 'Activos', value: stats.active, icon: CircleCheckBig },
          { label: 'Verificados', value: stats.verified, icon: ShieldCheck },
          { label: 'Patrocinadores', value: stats.premium, icon: Award },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-white/10 bg-[#111] p-6">
            <metric.icon className="h-5 w-5 text-[#F58634]" />
            <p className="mt-4 text-3xl font-black">{metric.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/35">{metric.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Proveedores registrados</h2>
            <p className="mt-1 text-sm text-white/45">Listado sincronizado con la base de datos de InduMex.</p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 focus-within:border-[#F58634]/40 focus-within:ring-1 focus-within:ring-[#F58634]/30">
            <Search className="h-4 w-4 text-[#F58634]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar proveedor, sector, ciudad o certificación"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-white/45">
            <RefreshCw className="h-4 w-4 animate-spin text-[#F58634]" />
            Cargando proveedores desde la base de datos…
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <div className="flex items-center gap-2 font-semibold">
              <CircleAlert className="h-4 w-4" />
              No se pudo cargar el directorio
            </div>
            <p className="mt-2 text-red-200/80">{error}</p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-black/30 text-xs uppercase tracking-[0.2em] text-white/35">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Proveedor</th>
                    <th className="px-4 py-3 font-semibold">Tier</th>
                    <th className="px-4 py-3 font-semibold">Sectores</th>
                    <th className="px-4 py-3 font-semibold">Ubicación</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#0d0d0d]">
                  {filteredProviders.map((provider) => (
                    <tr
                      key={provider.slug}
                      className="cursor-pointer transition-colors hover:bg-white/5"
                      onClick={() => router.push(`/admin/directorio/new?slug=${encodeURIComponent(provider.slug)}`)}
                    >
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 text-xs font-black uppercase text-white/70">
                            {isImageLogo(provider.logo) ? (
                              <img src={provider.logo} alt={provider.name} className="h-full w-full object-contain p-1.5" />
                            ) : (
                              provider.logo || provider.name.slice(0, 2)
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{provider.name}</p>
                            <p className="mt-1 max-w-xs text-xs text-white/45">{provider.shortDescription}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                            provider.tier === 'premium'
                              ? 'border-[#F58634]/30 bg-[#F58634]/10 text-[#F58634]'
                              : provider.tier === 'verified'
                                ? 'border-[#004AAD]/30 bg-[#004AAD]/10 text-[#004AAD]'
                                : 'border-white/10 bg-white/5 text-white/60'
                          }`}
                        >
                          {provider.tier}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex max-w-xs flex-wrap gap-2">
                          {(provider.sectors ?? []).map((sector) => (
                            <span key={sector} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60">
                              {sector}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-white/60">
                        {provider.city}, {provider.state}
                      </td>
                      <td className="px-4 py-4 align-top">
                        {provider.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                            <CircleCheckBig className="h-3.5 w-3.5" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                            <CircleDashed className="h-3.5 w-3.5" /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/directorio/${provider.slug}`}
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-bold text-white/60 transition-colors hover:border-white/20 hover:text-white"
                          >
                            Ver <ChevronRight className="h-3.5 w-3.5" />
                          </Link>

                          <button
                            onClick={(e) => handleToggleActive(provider, e)}
                            disabled={togglingId === provider.id}
                            title={provider.isActive ? 'Desactivar' : 'Activar'}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                              provider.isActive
                                ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                            {togglingId === provider.id ? '...' : provider.isActive ? 'Desactivar' : 'Activar'}
                          </button>

                          {confirmDeleteId === provider.id ? (
                            <>
                              <button
                                onClick={(e) => handleDelete(provider.id!, e)}
                                disabled={deletingId === provider.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/15 px-2.5 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
                              >
                                {deletingId === provider.id ? '...' : '¿Confirmar?'}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                className="rounded-lg border border-white/10 px-2 py-1.5 text-xs text-white/40 hover:text-white"
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(provider.id ?? null); }}
                              title="Eliminar"
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs font-bold text-red-400/70 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProviders.length === 0 && (
              <div className="border-t border-white/10 px-4 py-8 text-sm text-white/45">
                No se encontraron proveedores con ese criterio de búsqueda.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
