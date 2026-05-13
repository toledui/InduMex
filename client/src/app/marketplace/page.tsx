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
      images: [
        {
          url: 'https://indumex.blog/images/indumex-image.jpg',
          width: 1200,
          height: 630,
          alt: 'InduMex - Plataforma Industrial B2B',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Marketplace Industrial | InduMex',
      description:
        'Explora productos industriales con filtros, destacados, búsqueda global y catálogo B2B para manufactura.',
      images: ['https://indumex.blog/images/indumex-image.jpg'],
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
