'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Box,
  Filter,
  Grid3X3,
  Search,
  X,
} from 'lucide-react';
import type {
  MarketplaceCatalogCategoria,
  MarketplaceCatalogProducto,
} from '@/lib/api';

const COMMON_UNITS = [
  { value: 'pieza', label: 'Pieza' },
  { value: 'unidad', label: 'Unidad' },
  { value: 'caja', label: 'Caja' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'kit', label: 'Kit' },
  { value: 'juego', label: 'Juego' },
  { value: 'metro', label: 'Metro' },
  { value: 'metro_cuadrado', label: 'Metro cuadrado' },
  { value: 'metro_cubico', label: 'Metro cúbico' },
  { value: 'kilogramo', label: 'Kilogramo' },
  { value: 'litro', label: 'Litro' },
  { value: 'par', label: 'Par' },
  { value: 'rollo', label: 'Rollo' },
];

const VISIBILITY_OPTIONS = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'base', label: 'Base' },
] as const;

const CURRENCY_OPTIONS = ['MXN', 'USD', 'EUR'];

type MarketplaceCatalogClientProps = {
  productos: MarketplaceCatalogProducto[];
  categorias: MarketplaceCatalogCategoria[];
  errorMessage?: string | null;
};

type FilterState = {
  categories: string[];
  currencies: string[];
  visibilities: Array<(typeof VISIBILITY_OPTIONS)[number]['value']>;
  units: string[];
  characteristics: string[];
  featuredOnly: boolean;
  inStockOnly: boolean;
  withImageOnly: boolean;
  minPrice: string;
  maxPrice: string;
};

const emptyFilters: FilterState = {
  categories: [],
  currencies: [],
  visibilities: [],
  units: [],
  characteristics: [],
  featuredOnly: false,
  inStockOnly: false,
  withImageOnly: false,
  minPrice: '',
  maxPrice: '',
};

function formatMoney(value: number, currency: string): string {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  });
}

function normalizeText(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(normalizeText).join(' ');
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).map(normalizeText).join(' ');
  return String(value);
}

function humanizeKey(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCharacteristicPath(path: string[]): string {
  return path.map(humanizeKey).join(' · ');
}

function collectCharacteristicLabels(value: unknown, path: string[] = []): string[] {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectCharacteristicLabels(item, path));
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      collectCharacteristicLabels(child, [...path, key])
    );
  }

  const text = String(value).trim();
  if (!text) return [];

  const label = path.length > 0 ? `${formatCharacteristicPath(path)}: ${text}` : text;
  return [label];
}

function getMetadataValue(product: MarketplaceCatalogProducto, key: string): string {
  const value = product.metadata?.[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function getUnitValue(product: MarketplaceCatalogProducto): string {
  const unidadClave = getMetadataValue(product, 'unidadClave');
  const unidadLabel = getMetadataValue(product, 'unidadLabel');
  return unidadClave || unidadLabel || 'pieza';
}

function getUnitLabel(product: MarketplaceCatalogProducto): string {
  const unidadClave = getMetadataValue(product, 'unidadClave');
  const unidadLabel = getMetadataValue(product, 'unidadLabel');
  const common = COMMON_UNITS.find((item) => item.value === unidadClave);
  if (common) return common.label;
  if (unidadLabel) return unidadLabel;
  return 'Pieza';
}

function getTaxLabel(product: MarketplaceCatalogProducto): string {
  const tipo = getMetadataValue(product, 'impuestoTipo');
  const porcentaje = getMetadataValue(product, 'impuestoPorcentaje');
  if (tipo === 'exento') return 'Exento';
  if (tipo === 'tasa_0') return 'Tasa 0%';
  if (porcentaje) return `IVA ${porcentaje}%`;
  return 'IVA 16%';
}

function getVisibilityLabel(value?: (typeof VISIBILITY_OPTIONS)[number]['value'] | null): string {
  return VISIBILITY_OPTIONS.find((option) => option.value === value)?.label ?? 'Base';
}

function getVisibilityRank(value?: 'alta' | 'media' | 'base' | null): number {
  if (value === 'alta') return 2;
  if (value === 'media') return 1;
  return 0;
}

function isProductImageAllowed(url: string): boolean {
  return (
    url.startsWith('/') ||
    url.includes('indumex.blog') ||
    url.includes('secure.gravatar.com') ||
    url.includes('images.unsplash.com')
  );
}

function getSellerLabel(product: MarketplaceCatalogProducto): string {
  if (!product.vendedor) return 'Marketplace';
  return (
    product.vendedor.empresa?.trim() ||
    [product.vendedor.nombre, product.vendedor.apellido].filter(Boolean).join(' ').trim() ||
    product.vendedor.email?.trim() ||
    'Proveedor'
  );
}

function getSearchIndex(product: MarketplaceCatalogProducto): string {
  return [
    product.nombre,
    product.slug,
    product.sku,
    product.descripcion ?? '',
    product.moneda,
    product.estado,
    String(product.precio),
    String(product.stock),
    product.destacado ? 'destacado' : '',
    product.categoria?.nombre ?? '',
    product.categoria?.slug ?? '',
    product.vendedor?.nombre ?? '',
    product.vendedor?.apellido ?? '',
    product.vendedor?.empresa ?? '',
    product.vendedor?.planNombre ?? '',
    getUnitLabel(product),
    getTaxLabel(product),
    normalizeText(product.metadata),
    product.camposPersonalizados.map((field) => `${field.clave} ${field.valor}`).join(' '),
  ]
    .join(' ')
    .toLowerCase();
}

  function getCharacteristicLabels(product: MarketplaceCatalogProducto): string[] {
    const labels = new Set<string>();

    collectCharacteristicLabels(product.metadata).forEach((label) => labels.add(label));
    product.camposPersonalizados.forEach((field) => {
      const clave = field.clave?.trim();
      const valor = field.valor?.trim();
      if (!clave || !valor) return;
      labels.add(`${humanizeKey(clave)}: ${valor}`);
    });

    return [...labels];
  }

export default function MarketplaceCatalogClient({ productos, categorias, errorMessage }: MarketplaceCatalogClientProps) {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  const categoriesWithCount = useMemo(() => {
    const counts = new Map<number, number>();
    productos.forEach((producto) => {
      counts.set(producto.categoriaId, (counts.get(producto.categoriaId) ?? 0) + 1);
    });

    return categorias
      .map((categoria) => ({
        ...categoria,
        count: counts.get(categoria.id) ?? 0,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [categorias, productos]);

  const unitOptions = useMemo(() => {
    const map = new Map<string, string>();
    COMMON_UNITS.forEach((item) => map.set(item.value, item.label));
    productos.forEach((product) => {
      const value = getUnitValue(product);
      const label = getUnitLabel(product);
      if (value) map.set(value, label);
    });
    return [...map.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [productos]);

  const characteristicOptions = useMemo(() => {
    const map = new Map<string, string>();

    productos.forEach((product) => {
      getCharacteristicLabels(product).forEach((label) => {
        map.set(label.toLowerCase(), label);
      });
    });

    return [...map.values()].sort((a, b) => a.localeCompare(b, 'es'));
  }, [productos]);

  const stats = useMemo(() => {
    const featured = productos.filter((item) => item.destacado).length;
    const sellers = new Set(productos.map((item) => item.usuarioId)).size;
    return {
      total: productos.length,
      featured,
      categories: categorias.length,
      sellers,
    };
  }, [categorias.length, productos]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minPrice = filters.minPrice ? Number(filters.minPrice) : null;
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;

    return [...productos]
      .filter((product) => {
        if (q && !getSearchIndex(product).includes(q)) return false;
        if (filters.featuredOnly && !product.destacado) return false;
        if (filters.inStockOnly && Number(product.stock) <= 0) return false;
        if (filters.withImageOnly && product.imagenes.length === 0) return false;
        if (filters.categories.length > 0 && !filters.categories.includes(String(product.categoriaId))) return false;
        if (filters.currencies.length > 0 && !filters.currencies.includes(product.moneda)) return false;
        if (filters.visibilities.length > 0 && !filters.visibilities.includes(product.vendedor?.nivelVisibilidad ?? 'base')) return false;
        if (filters.units.length > 0 && !filters.units.includes(getUnitValue(product))) return false;
        if (filters.characteristics.length > 0) {
          const productCharacteristics = getCharacteristicLabels(product).map((item) => item.toLowerCase());
          if (!filters.characteristics.every((selected) => productCharacteristics.includes(selected.toLowerCase()))) return false;
        }
        if (minPrice !== null && Number(product.precio) < minPrice) return false;
        if (maxPrice !== null && Number(product.precio) > maxPrice) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.destacado !== b.destacado) return Number(b.destacado) - Number(a.destacado);
        const visibilityDiff = getVisibilityRank(b.vendedor?.nivelVisibilidad ?? null) - getVisibilityRank(a.vendedor?.nivelVisibilidad ?? null);
        if (visibilityDiff !== 0) return visibilityDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [filters, productos, query]);

  const sortedProducts = useMemo(
    () => [...filteredProducts].sort((a, b) => Number(b.destacado) - Number(a.destacado)),
    [filteredProducts]
  );

  const activeFilterCount =
    filters.categories.length +
    filters.currencies.length +
    filters.visibilities.length +
    filters.units.length +
    filters.characteristics.length +
    Number(filters.featuredOnly) +
    Number(filters.inStockOnly) +
    Number(filters.withImageOnly) +
    Number(Boolean(filters.minPrice)) +
    Number(Boolean(filters.maxPrice));

  function updateMultiFilter<K extends 'categories' | 'currencies' | 'visibilities' | 'units' | 'characteristics'>(
    key: K,
    value: string
  ) {
    setFilters((prev) => {
      const current = prev[key] as string[];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  }

  function resetFilters() {
    setFilters(emptyFilters);
  }

  function toggleVisibility(value: (typeof VISIBILITY_OPTIONS)[number]['value']) {
    updateMultiFilter('visibilities', value);
  }

  return (
    <section className="bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 sm:pt-20 lg:pb-14 lg:pt-24">
        <div
          className="rounded-3xl border border-white/10 p-6 sm:p-8 lg:p-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at top left, rgba(0,74,173,0.25), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
          }}
        >
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-5">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#F58634]">RED DE ABASTECIMIENTO B2B</p>
              <h1 className="font-['Rubik'] text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                El Hub de Suministro para la Manufactura Avanzada
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                Conectamos a directores de planta y compradores estratégicos con proveedores verificados. Encuentra el componente, equipo o material exacto para tu línea de producción.
              </p>
              <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-white/55">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">+10K SKUs Activos</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Proveedores Verificados</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Cotización Directa</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Industria 4.0</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-96 xl:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Tecnología Destacada</p>
                <p className="mt-2 text-3xl font-black text-white">{stats.featured}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Nodos de Suministro</p>
                <p className="mt-2 text-3xl font-black text-white">{filteredProducts.length}</p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
            <label className="flex-1 border-b-2 border-gray-800 pb-3 text-white focus-within:border-[#004AAD]">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-white/30" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="[ INGRESAR NÚMERO DE PARTE, SKU O TECNOLOGÍA ]"
                  className="w-full bg-transparent text-lg font-semibold tracking-wide text-white outline-none placeholder:text-white/30"
                />
              </div>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white hover:border-[#F58634]/40 hover:text-[#F58634]"
              >
                <Filter className="h-4 w-4" /> Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.featuredOnly && <FilterChip label="Solo destacados" onRemove={() => setFilters((prev) => ({ ...prev, featuredOnly: false }))} />}
              {filters.inStockOnly && <FilterChip label="Con stock" onRemove={() => setFilters((prev) => ({ ...prev, inStockOnly: false }))} />}
              {filters.withImageOnly && <FilterChip label="Con imagen" onRemove={() => setFilters((prev) => ({ ...prev, withImageOnly: false }))} />}
              {filters.categories.map((id) => {
                const category = categorias.find((item) => String(item.id) === id);
                return <FilterChip key={id} label={category?.nombre ?? 'Categoría'} onRemove={() => updateMultiFilter('categories', id)} />;
              })}
              {filters.currencies.map((currency) => (
                <FilterChip key={currency} label={currency} onRemove={() => updateMultiFilter('currencies', currency)} />
              ))}
              {filters.visibilities.map((visibility) => (
                <FilterChip key={visibility} label={getVisibilityLabel(visibility)} onRemove={() => toggleVisibility(visibility)} />
              ))}
              {filters.units.map((unit) => (
                <FilterChip key={unit} label={unitOptions.find((item) => item.value === unit)?.label ?? unit} onRemove={() => updateMultiFilter('units', unit)} />
              ))}
              {filters.characteristics.map((characteristic) => (
                <FilterChip key={characteristic} label={characteristic} onRemove={() => updateMultiFilter('characteristics', characteristic)} />
              ))}
              {filters.minPrice && <FilterChip label={`Min ${filters.minPrice}`} onRemove={() => setFilters((prev) => ({ ...prev, minPrice: '' }))} />}
              {filters.maxPrice && <FilterChip label={`Max ${filters.maxPrice}`} onRemove={() => setFilters((prev) => ({ ...prev, maxPrice: '' }))} />}
              <button type="button" onClick={resetFilters} className="rounded-full border border-white/15 px-3 py-1.5 text-xs uppercase tracking-widest text-white/55 hover:text-white">
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        <section className="mt-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/35">Inventario Global</p>
              <h2 className="font-['Rubik'] text-2xl font-bold text-white">
                [{filteredProducts.length}] componentes técnicos indexados
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-white/50">
              <Grid3X3 className="h-3.5 w-3.5" /> Orden: destacados primero
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-10 text-center">
              <Box className="mx-auto h-10 w-10 text-white/25" />
              <h3 className="mt-4 text-xl font-bold text-white">No encontramos productos con esos filtros</h3>
              <p className="mt-2 text-sm text-white/55">Amplía la búsqueda, quita filtros o revisa otro segmento del catálogo.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {sortedProducts.map((product, index) => (
                <motion.article
                  key={product.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.4, delay: index * 0.02 }}
                  className={`group overflow-hidden rounded-3xl border shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${
                    product.destacado ? 'border-[#F58634]/40 bg-[#F58634]/5' : 'border-white/10 bg-[#111]'
                  }`}
                >
                  <div className="relative aspect-square bg-[#111]">
                    {product.imagenes[0] && isProductImageAllowed(product.imagenes[0]) ? (
                      <Image
                        src={product.imagenes[0]}
                        alt={product.nombre}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="flex h-full items-center justify-center"
                        style={{
                          backgroundImage:
                            'radial-gradient(circle at top, rgba(0,74,173,0.24), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                        }}
                      >
                        <Box className="h-12 w-12 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
                    {product.destacado && (
                      <span className="absolute left-2 top-2 rounded-full bg-[#F58634] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-black">
                        Patrocinado
                      </span>
                    )}
                    <span className="absolute right-2 top-2 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-white/75">
                      {getVisibilityLabel(product.vendedor?.nivelVisibilidad ?? 'base')}
                    </span>
                    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[9px] uppercase tracking-[0.18em] text-white/55">{product.categoria?.nombre ?? 'Sin categoría'}</p>
                        <h3 className="mt-1 line-clamp-2 text-xs font-bold leading-snug text-white">{product.nombre}</h3>
                      </div>
                      <p className="shrink-0 rounded-xl bg-black/60 px-2 py-1 text-right text-sm font-black text-white">
                        {formatMoney(product.precio, product.moneda)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 p-3">
                    <div className="flex flex-wrap gap-1.5 text-[9px] uppercase tracking-widest text-white/55">
                      <span className="rounded bg-white/10 px-1.5 py-0.5">SKU {product.sku}</span>
                      <span className="rounded bg-white/10 px-1.5 py-0.5">{getUnitLabel(product)}</span>
                      <span className="rounded bg-white/10 px-1.5 py-0.5">Stock {product.stock}</span>
                    </div>

                    {product.vendedor && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          <p className="truncate text-[10px] text-gray-400">{getSellerLabel(product)}</p>
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/marketplace/${product.slug}`}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        product.destacado
                          ? 'bg-[#F58634] text-black hover:bg-[#ff9a4a]'
                          : 'bg-[#0f172a] text-white hover:bg-[#17233a]'
                      }`}
                    >
                      Cotizar / Specs
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm">
          <div className="flex h-full items-start justify-center overflow-y-auto p-4 sm:items-center sm:py-6">
            <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0b] shadow-2xl sm:max-h-[calc(100vh-3rem)]">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#F58634]">Filtros del catálogo</p>
                  <h3 className="mt-1 text-xl font-bold text-white">Ajusta la vista sin ocupar espacio</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-full border border-white/15 p-2 text-white/55 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid flex-1 gap-6 overflow-y-auto px-5 py-5 sm:px-6 lg:grid-cols-2">
                <div className="space-y-5">
                  <FilterGroup title="Categorías">
                    <div className="grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {categoriesWithCount.map((category) => (
                        <label key={category.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(String(category.id))}
                            onChange={() => updateMultiFilter('categories', String(category.id))}
                            className="h-4 w-4 accent-[#F58634]"
                          />
                          <span className="min-w-0 flex-1 truncate">{category.nombre}</span>
                          <span className="text-xs text-white/35">{category.count}</span>
                        </label>
                      ))}
                    </div>
                  </FilterGroup>

                  <FilterGroup title="Visibilidad del vendedor">
                    <div className="grid gap-2 sm:grid-cols-3">
                      {VISIBILITY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleVisibility(option.value)}
                          className={`rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                            filters.visibilities.includes(option.value)
                              ? 'border-[#F58634]/40 bg-[#F58634]/10 text-[#F58634]'
                              : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </FilterGroup>
                </div>

                <div className="space-y-5">
                  <FilterGroup title="Precio">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/70">
                        <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-white/35">Mínimo</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={filters.minPrice}
                          onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                          className="w-full bg-transparent text-sm text-white outline-none"
                        />
                      </label>
                      <label className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/70">
                        <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-white/35">Máximo</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                          className="w-full bg-transparent text-sm text-white outline-none"
                        />
                      </label>
                    </div>
                  </FilterGroup>

                  <FilterGroup title="Moneda">
                    <div className="flex flex-wrap gap-2">
                      {CURRENCY_OPTIONS.map((currency) => (
                        <button
                          key={currency}
                          type="button"
                          onClick={() => updateMultiFilter('currencies', currency)}
                          className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                            filters.currencies.includes(currency)
                              ? 'border-[#004AAD]/40 bg-[#004AAD]/10 text-[#9cc3ff]'
                              : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {currency}
                        </button>
                      ))}
                    </div>
                  </FilterGroup>

                  <FilterGroup title="Unidad">
                    <div className="grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {unitOptions.map((unit) => (
                        <label key={unit.value} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                          <input
                            type="checkbox"
                            checked={filters.units.includes(unit.value)}
                            onChange={() => updateMultiFilter('units', unit.value)}
                            className="h-4 w-4 accent-[#F58634]"
                          />
                          <span className="min-w-0 flex-1 truncate">{unit.label}</span>
                        </label>
                      ))}
                    </div>
                  </FilterGroup>

                  <FilterGroup title="Características del producto">
                    <div className="space-y-2">
                      <p className="text-[11px] leading-5 text-white/45">
                        Filtros derivados del JSON del producto y de campos personalizados.
                      </p>
                      <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                        {characteristicOptions.map((characteristic) => {
                          const selected = filters.characteristics.includes(characteristic);

                          return (
                            <button
                              key={characteristic}
                              type="button"
                              onClick={() => updateMultiFilter('characteristics', characteristic)}
                              className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors ${
                                selected
                                  ? 'border-[#F58634]/40 bg-[#F58634]/10 text-[#F58634]'
                                  : 'border-white/10 bg-white/5 text-white/65 hover:border-white/20 hover:text-white'
                              }`}
                            >
                              <span className="block line-clamp-2">{characteristic}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </FilterGroup>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex flex-wrap gap-2 text-xs text-white/55">
                  <ToggleBadge checked={filters.featuredOnly} label="Solo destacados" onClick={() => setFilters((prev) => ({ ...prev, featuredOnly: !prev.featuredOnly }))} />
                  <ToggleBadge checked={filters.inStockOnly} label="Solo con stock" onClick={() => setFilters((prev) => ({ ...prev, inStockOnly: !prev.inStockOnly }))} />
                  <ToggleBadge checked={filters.withImageOnly} label="Con imagen" onClick={() => setFilters((prev) => ({ ...prev, withImageOnly: !prev.withImageOnly }))} />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white"
                  >
                    Limpiar filtros
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="rounded-xl bg-[#F58634] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black"
                  >
                    Ver resultados
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:border-[#F58634]/40 hover:text-[#F58634]"
    >
      {label}
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

function ToggleBadge({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 transition-colors ${
        checked ? 'border-[#F58634]/40 bg-[#F58634]/10 text-[#F58634]' : 'border-white/10 bg-white/5 text-white/55 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

