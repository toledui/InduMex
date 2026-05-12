'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Award, ChevronRight, Globe2, MapPin, Search, ShieldCheck, Star } from 'lucide-react';
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
  if (words.length <= maxWords) {
    return value.trim();
  }

  return `${words.slice(0, maxWords).join(' ')}...`;
}

function ProviderCard({ provider }: { provider: B2BProvider }) {
  const premium = provider.tier === 'premium';
  const shortPreview = truncateWords(provider.shortDescription, 18);
  const aboutPreview = truncateWords(stripHtml(sanitizeRichText(provider.about)), 32);

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
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-black uppercase tracking-[0.2em] ${
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

export default function DirectorioClient({
  providers,
  sectors,
  initialSector,
}: {
  providers: B2BProvider[];
  sectors: string[];
  initialSector?: string | null;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSector, setActiveSector] = useState<string | null>(initialSector ?? null);
  const [showAllCustomSectors, setShowAllCustomSectors] = useState(false);

  const sectorCounts = useMemo(() => {
    const counts = new Map<string, number>();

    providers
      .filter((provider) => provider.isActive)
      .forEach((provider) => {
        provider.sectors.forEach((sector) => {
          counts.set(sector, (counts.get(sector) ?? 0) + 1);
        });
      });

    return counts;
  }, [providers]);

  const customSectors = useMemo(() => {
    const fixedSectors = new Set(sectors);

    return Array.from(
      new Set(providers.flatMap((provider) => provider.sectors.filter((sector) => !fixedSectors.has(sector))))
    ).sort((left, right) => {
      const leftCount = sectorCounts.get(left) ?? 0;
      const rightCount = sectorCounts.get(right) ?? 0;
      if (rightCount !== leftCount) return rightCount - leftCount;
      return left.localeCompare(right, 'es');
    });
  }, [providers, sectors, sectorCounts]);

  const visibleCustomSectors = useMemo(
    () => (showAllCustomSectors ? customSectors : customSectors.slice(0, 12)),
    [customSectors, showAllCustomSectors]
  );

  const filteredProviders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const results = providers
      .filter((provider) => provider.isActive)
      .filter((provider) => !activeSector || provider.sectors.includes(activeSector))
      .filter((provider) => {
        if (!normalizedSearch) return true;

        const bag = [
          provider.name,
          provider.shortDescription,
          stripHtml(sanitizeRichText(provider.about)),
          provider.tier,
          provider.location.city,
          provider.location.state,
          provider.location.country,
          provider.contact.website,
          provider.contact.email,
          ...provider.sectors,
          ...provider.certifications,
        ]
          .join(' ')
          .toLowerCase();

        return bag.includes(normalizedSearch);
      });

    return sortProvidersByBusinessPriority(results);
  }, [providers, activeSector, searchTerm]);

  return (
    <>
      <section className="border-b border-white/5 bg-[#010b17] pt-36 pb-12">
        <div className="mx-auto max-w-7xl px-6">
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.3em] text-[#F58634]">
            B2B Industrial Network
          </span>
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
                Directorio B2B Industrial
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
                Conecta con proveedores industriales verificados por sector, certificaciones, ubicación
                y nivel comercial dentro del ecosistema InduMex.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#031c38] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">
                <Search className="h-4 w-4 text-[#F58634]" />
                Terminal de búsqueda
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/45 focus-within:border-[#F58634]/40 focus-within:ring-1 focus-within:ring-[#F58634]/30">
                <span className="font-mono text-[#F58634]">[</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="BUSCAR EMPRESA, SERVICIO O CERTIFICACIÓN"
                  className="w-full bg-transparent text-sm uppercase tracking-[0.18em] text-white outline-none placeholder:text-white/25"
                />
                <span className="font-mono text-[#F58634]">]</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b border-white/5 bg-[#021325]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl overflow-x-auto px-6 py-4">
          <div className="flex min-w-max gap-3">
            <button
              type="button"
              onClick={() => setActiveSector(null)}
              className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:border-[#F58634]/40 hover:text-white ${
                !activeSector
                  ? 'border-[#F58634]/40 bg-[#F58634]/10 text-[#F58634]'
                  : 'border-white/10 bg-white/5 text-white/55'
              }`}
            >
              Todos
            </button>
            {sectors.map((sector) => (
              <button
                key={sector}
                type="button"
                onClick={() => setActiveSector(sector)}
                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:border-[#F58634]/40 hover:text-white ${
                  activeSector === sector
                    ? 'border-[#F58634]/40 bg-[#F58634]/10 text-[#F58634]'
                    : 'border-white/10 bg-white/5 text-white/55'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
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
            No hay proveedores activos para el criterio de búsqueda/sector seleccionado.
          </div>
        )}
      </section>
    </>
  );
}