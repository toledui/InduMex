import type { Metadata } from 'next';
import MarketplaceCatalogClient from '@/components/MarketplaceCatalogClient';
import { getMarketplaceCatalog } from '@/lib/api';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Marketplace Industrial | InduMex',
    description:
      'Explora productos industriales con filtros, destacados, búsqueda global y catálogo B2B para manufactura.',
    openGraph: {
      title: 'Marketplace Industrial | InduMex',
      description:
        'Marketplace B2B con productos destacados, filtros por categoría, moneda, visibilidad y más.',
      type: 'website',
      url: 'https://indumex.blog/marketplace',
    },
  };
}

export default async function MarketplacePage() {
  try {
    const catalog = await getMarketplaceCatalog();

    return (
      <MarketplaceCatalogClient
        productos={catalog.productos}
        categorias={catalog.categorias}
      />
    );
  } catch {
    return (
      <MarketplaceCatalogClient
        productos={[]}
        categorias={[]}
      />
    );
  }
}
