'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Award, ChevronRight, Filter, Globe2, MapPin, Search, ShieldCheck, Star, X } from 'lucide-react';

type ModalTab = 'sector' | 'ubicacion' | 'tipo';

const TIER_LABELS: Record<string, string> = {
  premium: 'Patrocinador',
  verified: 'Verificado',
  basic: 'Básico',
};
import type { B2BProvider } from '@/types/b2b-provider';
import { isImageLogo, sanitizeRichText, stripHtml } from '@/lib/provider-sectors';

const TIER_PRIORITY: Record<B2BProvider['tier'], number> = {
  premium: 0,
  verified: 1,
  basic: 2,
};

function sortProvidersByBusinessPriority(items: B2BProvider[]): B2BProvider[] {
  return [...items].sort((left, right) => {
    const tierDiff = TIER_PRIORITY[left.tier] - TIER_PRIORITY[right.tier];
    if (tierDiff !== 0) return tierDiff;
    return left.name.localeCompare(right.name, 'es', { sensitivity: 'base' });
  });
}

function ProviderBadge({ tier }: { tier: B2BProvider['tier'] }) {
  if (tier !== 'premium') return null;

  return (
    <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[#F58634]/30 bg-[#F58634]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F58634]">
      <Award className="h-3.5 w-3.5" />
      Patrocinador
    </span>
  );
}

function truncateWords(value: string, maxWords: number): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return value.trim();
  return `${words.slice(0, maxWords).join(' ')}...`;
}

function ProviderCard({ provider }: { provider: B2BProvider }) {
  const premium = provider.tier === 'premium';
  const shortPreview = truncateWords(provider.shortDescription, 18);
  const aboutPreview = truncateWords(stripHtml(sanitizeRichText(provider.about)), 30);

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 ${
        premium
          ? 'border-[#F58634]/30 bg-linear-to-b from-[#111] to-[#021325] shadow-[0_0_0_1px_rgba(245,134,52,0.10),0_24px_60px_rgba(245,134,52,0.08)]'
          : 'border-white/10 bg-[#031c38]'
      }`}
    >
      <ProviderBadge tier={provider.tier} />

      <div className="mb-6 flex items-start gap-4 pr-16">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-sm font-black uppercase tracking-[0.2em] ${
            premium ? 'bg-[#F58634]/10 text-[#F58634]' : 'bg-white/5 text-white/70'
          }`}
        >
          {isImageLogo(provider.logo) ? (
            <img src={provider.logo} alt={provider.name} className="h-full w-full rounded-2xl object-contain p-2" />
          ) : (
            provider.logo
          )}
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-white">{provider.name}</h3>
            {provider.tier === 'verified' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#004AAD]/30 bg-[#004AAD]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#004AAD]">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
            )}
            {provider.tier === 'basic' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                Básico
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-white/55">{shortPreview}</p>
        </div>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-white/70">{aboutPreview}</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {provider.sectors.map((sector) => (
          <span
            key={sector}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/65"
          >
            {sector}
          </span>
        ))}
      </div>

      <div className="mb-6 space-y-2 text-sm text-white/60">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#F58634]" />
          {provider.location.city}, {provider.location.state}, {provider.location.country}
        </div>
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-[#004AAD]" />
          <a href={provider.contact.website} target="_blank" rel="noopener noreferrer" className="hover:text-white">
            {provider.contact.website.replace(/^https?:\/\//, '')}
          </a>
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-white/35">Certificaciones</p>
        <div className="flex flex-wrap gap-2">
          {provider.certifications.map((certification) => (
            <span
              key={certification}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/60"
            >
              {certification}
            </span>
          ))}
        </div>
      </div>

      <Link
        href={`/directorio/${provider.slug}`}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F58634] transition-colors hover:text-white"
      >
        Ver perfil <ChevronRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export default function DirectorioClientModern({
  providers,
  sectors,
  initialSector,
  initialSearchTerm,
}: {
  providers: B2BProvider[];
  sectors: string[];
  initialSector?: string | null;
  initialSearchTerm?: string;
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm ?? '');
  const [activeSector, setActiveSector] = useState<string | null>(initialSector ?? null);
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [showAllCustomSectors, setShowAllCustomSectors] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>('sector');

  const activeProviders = useMemo(() => providers.filter((p) => p.isActive), [providers]);

  /* ── Derived option lists ───────────────────────────── */
  const sectorCounts = useMemo(() => {
    const counts = new Map<string, number>();
    activeProviders.forEach((p) => p.sectors.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1)));
    return counts;
  }, [activeProviders]);

  const tierCounts = useMemo(() => {
    const counts = new Map<string, number>();
    activeProviders.forEach((p) => counts.set(p.tier, (counts.get(p.tier) ?? 0) + 1));
    return counts;
  }, [activeProviders]);

  const uniqueCountries = useMemo(
    () => Array.from(new Set(activeProviders.map((p) => p.location.country).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [activeProviders]
  );

  const uniqueStates = useMemo(
    () =>
      Array.from(
        new Set(
          activeProviders
            .filter((p) => !activeCountry || p.location.country === activeCountry)
            .map((p) => p.location.state)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [activeProviders, activeCountry]
  );

  const uniqueCities = useMemo(
    () =>
      Array.from(
        new Set(
          activeProviders
            .filter((p) => (!activeCountry || p.location.country === activeCountry) && (!activeState || p.location.state === activeState))
            .map((p) => p.location.city)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [activeProviders, activeCountry, activeState]
  );

  const customSectors = useMemo(() => {
    const fixedSectors = new Set(sectors);
    return Array.from(new Set(activeProviders.flatMap((p) => p.sectors.filter((s) => !fixedSectors.has(s))))).sort((a, b) => {
      const diff = (sectorCounts.get(b) ?? 0) - (sectorCounts.get(a) ?? 0);
      return diff !== 0 ? diff : a.localeCompare(b, 'es');
    });
  }, [activeProviders, sectors, sectorCounts]);

  const visibleCustomSectors = useMemo(
    () => (showAllCustomSectors ? customSectors : customSectors.slice(0, 12)),
    [customSectors, showAllCustomSectors]
  );

  /* ── Filtered results ──────────────────────────────── */
  const filteredProviders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const results = activeProviders
      .filter((p) => !activeSector || p.sectors.includes(activeSector))
      .filter((p) => !activeTier || p.tier === activeTier)
      .filter((p) => !activeCountry || p.location.country === activeCountry)
      .filter((p) => !activeState || p.location.state === activeState)
      .filter((p) => !activeCity || p.location.city === activeCity)
      .filter((p) => {
        if (!q) return true;
        const bag = [
          p.name, p.shortDescription, stripHtml(sanitizeRichText(p.about)), p.tier,
          p.location.city, p.location.state, p.location.country,
          p.contact.website, p.contact.email,
          ...p.sectors, ...p.certifications,
        ].join(' ').toLowerCase();
        return bag.includes(q);
      });

      return sortProvidersByBusinessPriority(results);
  }, [activeProviders, activeSector, activeTier, activeCountry, activeState, activeCity, searchTerm]);

  const activeFilterCount = [activeSector, activeTier, activeCountry, activeState, activeCity].filter(Boolean).length;

  function clearAll() {
    setSearchTerm('');
    setActiveSector(null);
    setActiveTier(null);
    setActiveCountry(null);
    setActiveState(null);
    setActiveCity(null);
  }

  /* ── Pill button helper ────────────────────────────── */
  function SectorPill({ sector }: { sector: string | null; }) {
    const isAll = sector === null;
    const active = isAll ? !activeSector : activeSector === sector;
    return (
      <button
        type="button"
        onClick={() => { setActiveSector(isAll ? null : sector); if (!isAll) setShowSectorModal(false); }}
        className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:border-[#F58634]/40 hover:text-white ${
          active ? 'border-[#F58634]/40 bg-[#F58634]/10 text-[#F58634]' : 'border-white/10 bg-white/5 text-white/55'
        }`}
      >
        <span>{isAll ? 'Todos' : sector}</span>
        <span className="ml-2 text-[10px] text-white/35">{isAll ? activeProviders.length : (sectorCounts.get(sector!) ?? 0)}</span>
      </button>
    );
  }

  return (
    <>
      {/* ── Modal de filtros ─────────────────────────────────────── */}
      {showSectorModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-[8vh]">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowSectorModal(false)} />

          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#031c38] p-6 shadow-2xl">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">Filtros avanzados</p>
                <h2 className="mt-1 text-xl font-black text-white">Refinar búsqueda</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSectorModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition-colors hover:border-white/20 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-5 flex gap-1 rounded-2xl border border-white/10 bg-black/30 p-1">
              {(['sector', 'ubicacion', 'tipo'] as ModalTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setModalTab(tab)}
                  className={`flex-1 rounded-xl py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-200 ${
                    modalTab === tab ? 'bg-[#F58634] text-black' : 'text-white/40 hover:text-white'
                  }`}
                >
                  {tab === 'sector' ? 'Sector' : tab === 'ubicacion' ? 'Ubicación' : 'Tipo'}
                </button>
              ))}
            </div>

            {/* Tab: Sector */}
            {modalTab === 'sector' && (
              <>
                <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white/35">Sectores principales</p>
                  <div className="flex flex-wrap gap-2">
                    <SectorPill sector={null} />
                    {sectors.map((s) => <SectorPill key={s} sector={s} />)}
                  </div>
                </div>
                {customSectors.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <button
                      type="button"
                      onClick={() => setShowAllCustomSectors((c) => !c)}
                      className="mb-3 flex w-full items-center justify-between text-[11px] font-bold uppercase tracking-[0.25em] text-white/55"
                    >
                      <span>Otros sectores</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/50">{customSectors.length}</span>
                    </button>
                    <div className="flex flex-wrap gap-2">
                      {visibleCustomSectors.map((s) => <SectorPill key={s} sector={s} />)}
                    </div>
                    {customSectors.length > 12 && (
                      <button
                        type="button"
                        onClick={() => setShowAllCustomSectors((c) => !c)}
                        className="mt-4 inline-flex items-center text-xs font-bold uppercase tracking-widest text-[#F58634] transition-colors hover:text-white"
                      >
                        {showAllCustomSectors ? 'Ver menos' : `Ver todos (${customSectors.length})`}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Tab: Ubicación */}
            {modalTab === 'ubicacion' && (
              <div className="space-y-4">
                {/* Country */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white/35">País</p>
                  <div className="flex flex-wrap gap-2">
                    {[null, ...uniqueCountries].map((country) => (
                      <button
                        key={country ?? '__all__'}
                        type="button"
                        onClick={() => { setActiveCountry(country); setActiveState(null); setActiveCity(null); }}
                        className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:border-[#004AAD]/40 hover:text-white ${
                          activeCountry === country ? 'border-[#004AAD]/40 bg-[#004AAD]/10 text-[#004AAD]' : 'border-white/10 bg-white/5 text-white/55'
                        }`}
                      >
                        {country ?? 'Todos'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* State */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white/35">Estado / Provincia</p>
                  <div className="flex flex-wrap gap-2">
                    {[null, ...uniqueStates].map((state) => (
                      <button
                        key={state ?? '__all__'}
                        type="button"
                        onClick={() => { setActiveState(state); setActiveCity(null); }}
                        className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:border-[#004AAD]/40 hover:text-white ${
                          activeState === state ? 'border-[#004AAD]/40 bg-[#004AAD]/10 text-[#004AAD]' : 'border-white/10 bg-white/5 text-white/55'
                        }`}
                      >
                        {state ?? 'Todos'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* City */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white/35">Ciudad</p>
                  <div className="flex flex-wrap gap-2">
                    {[null, ...uniqueCities].map((city) => (
                      <button
                        key={city ?? '__all__'}
                        type="button"
                        onClick={() => setActiveCity(city)}
                        className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:border-[#004AAD]/40 hover:text-white ${
                          activeCity === city ? 'border-[#004AAD]/40 bg-[#004AAD]/10 text-[#004AAD]' : 'border-white/10 bg-white/5 text-white/55'
                        }`}
                      >
                        {city ?? 'Todas'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Tipo */}
            {modalTab === 'tipo' && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white/35">Tipo de proveedor</p>
                <div className="flex flex-wrap gap-2">
                  {[null, 'premium', 'verified', 'basic'].map((tier) => (
                    <button
                      key={tier ?? '__all__'}
                      type="button"
                      onClick={() => { setActiveTier(tier); setShowSectorModal(false); }}
                      className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:border-[#F58634]/40 hover:text-white ${
                        activeTier === tier ? 'border-[#F58634]/40 bg-[#F58634]/10 text-[#F58634]' : 'border-white/10 bg-white/5 text-white/55'
                      }`}
                    >
                      <span>{tier ? TIER_LABELS[tier] : 'Todos'}</span>
                      <span className="ml-2 text-[10px] text-white/35">
                        {tier ? (tierCounts.get(tier) ?? 0) : activeProviders.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => { clearAll(); setShowSectorModal(false); }}
                className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/35 transition-colors hover:text-white"
              >
                Limpiar todos los filtros
              </button>
              <button
                type="button"
                onClick={() => setShowSectorModal(false)}
                className="rounded-xl bg-[#F58634] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90"
              >
                Ver {filteredProviders.length} resultados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero / Search ───────────────────────────────────────── */}
      <section className="border-b border-white/5 bg-[#010b17] pt-36 pb-12">
        <div className="mx-auto max-w-7xl px-6">
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.3em] text-[#F58634]">
            B2B Industrial Network
          </span>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
                Directorio B2B Industrial
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
                Conecta con proveedores industriales verificados por sector, certificaciones, ubicación y nivel
                comercial dentro del ecosistema InduMex.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#031c38] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">
                <Search className="h-4 w-4 text-[#F58634]" />
                Terminal de búsqueda
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/45 focus-within:border-[#F58634]/40 focus-within:ring-1 focus-within:ring-[#F58634]/30">
                <span className="font-mono text-[#F58634]">[</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="BUSCAR EMPRESA, SERVICIO O CERTIFICACIÓN"
                  className="w-full bg-transparent text-sm uppercase tracking-[0.18em] text-white outline-none placeholder:text-white/25"
                />
                <span className="font-mono text-[#F58634]">]</span>
              </div>

              {/* Filter trigger */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowSectorModal(true)}
                  className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#F58634] transition-colors hover:text-white"
                >
                  <Filter className="h-3.5 w-3.5" />
                  {activeFilterCount > 0 ? `Filtros activos (${activeFilterCount})` : 'Filtros de búsqueda'}
                </button>
                <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-white/35">
                  <span>{filteredProviders.length} resultados</span>
                  {(searchTerm || activeFilterCount > 0) && (
                    <button type="button" onClick={clearAll} className="text-white/35 transition-colors hover:text-[#F58634]">
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Provider grid ───────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        {/* Active filter pills */}
        {activeFilterCount > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {activeSector && (
              <FilterPill label={activeSector} color="orange" onRemove={() => setActiveSector(null)} />
            )}
            {activeTier && (
              <FilterPill label={TIER_LABELS[activeTier]} color="orange" onRemove={() => setActiveTier(null)} />
            )}
            {activeCountry && (
              <FilterPill label={activeCountry} color="blue" onRemove={() => { setActiveCountry(null); setActiveState(null); setActiveCity(null); }} />
            )}
            {activeState && (
              <FilterPill label={activeState} color="blue" onRemove={() => { setActiveState(null); setActiveCity(null); }} />
            )}
            {activeCity && (
              <FilterPill label={activeCity} color="blue" onRemove={() => setActiveCity(null)} />
            )}
          </div>
        )}

        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">Proveedores activos</p>
            <h2 className="mt-2 text-2xl font-black text-white">Red industrial curada para decisiones B2B</h2>
          </div>
          <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-white/35 md:flex">
            <Star className="h-4 w-4 text-[#F58634]" />
            Premium y verificados destacados
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>

        {filteredProviders.length === 0 && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#031c38] p-6 text-sm text-white/60">
            No hay proveedores activos para los filtros seleccionados.
          </div>
        )}
      </section>
    </>
  );
}

function FilterPill({ label, color, onRemove }: { label: string; color: 'orange' | 'blue'; onRemove: () => void }) {
  const colorClass =
    color === 'orange'
      ? 'border-[#F58634]/30 bg-[#F58634]/10 text-[#F58634]'
      : 'border-[#004AAD]/30 bg-[#004AAD]/10 text-[#004AAD]';
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest ${colorClass}`}>
      {label}
      <button type="button" onClick={onRemove} className="ml-1 opacity-60 transition-opacity hover:opacity-100" aria-label="Quitar filtro">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
