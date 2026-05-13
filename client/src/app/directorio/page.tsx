import type { Metadata } from 'next';
import { getPublicProviders } from '@/lib/api';
import DirectorioClient from '@/components/DirectorioClientModern';
import { PROVIDER_SECTORS } from '@/lib/provider-sectors';
import type { B2BProvider } from '@/types/b2b-provider';

export const metadata: Metadata = {
  title: 'Directorio B2B Industrial | InduMex',
  description:
    'Explora proveedores industriales verificados por sector, certificaciones y ubicación dentro del Directorio B2B de InduMex.',
  alternates: {
    canonical: 'https://indumex.blog/directorio',
  },
  openGraph: {
    title: 'Directorio B2B Industrial | InduMex',
    description:
      'Conecta con proveedores premium, verified y básicos en el ecosistema industrial B2B de InduMex.',
    url: 'https://indumex.blog/directorio',
    siteName: 'InduMex',
    locale: 'es_MX',
    type: 'website',
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
    title: 'Directorio B2B Industrial | InduMex',
    description:
      'Conecta con proveedores premium, verified y básicos en el ecosistema industrial B2B de InduMex.',
    images: ['https://indumex.blog/images/indumex-image.jpg'],
  },
};

const sectors = [...PROVIDER_SECTORS];

function mapPublicProvider(provider: {
  id: number;
  name: string;
  slug: string;
  logo: string;
  tier: 'premium' | 'verified' | 'basic';
  shortDescription: string;
  about: string;
  sectors: string[];
  certifications: string[];
  city: string;
  state: string;
  country: string;
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  isActive: boolean;
}): B2BProvider {
  return {
    id: String(provider.id),
    name: provider.name,
    slug: provider.slug,
    logo: provider.logo,
    tier: provider.tier,
    shortDescription: provider.shortDescription,
    about: provider.about,
    sectors: provider.sectors ?? [],
    certifications: provider.certifications ?? [],
    location: {
      city: provider.city,
      state: provider.state,
      country: provider.country,
    },
    contact: {
      website: provider.website,
      email: provider.email,
      phone: provider.phone,
      whatsapp: provider.whatsapp,
    },
    isActive: provider.isActive,
  };
}

function normalizeSectorFilter(raw: string | string[] | undefined): string | null {
  if (Array.isArray(raw)) {
    return raw[0] ?? null;
  }
  return raw ?? null;
}

function normalizeSearchFilter(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) {
    return (raw[0] ?? '').trim();
  }

  return (raw ?? '').trim();
}

export default async function DirectorioPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string | string[]; q?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const activeSector = normalizeSectorFilter(resolvedSearchParams.sector);
  const initialSearchTerm = normalizeSearchFilter(resolvedSearchParams.q);

  let providersData: B2BProvider[] = [];

  try {
    const dbProviders = await getPublicProviders();
    providersData = dbProviders.map(mapPublicProvider);
  } catch {
    // API no disponible, se mostrará lista vacía
  }

  return (
    <div className="min-h-screen bg-[#021325] text-white selection:bg-[#F58634] selection:text-white">
      <DirectorioClient
        providers={providersData}
        sectors={sectors}
        initialSector={activeSector}
        initialSearchTerm={initialSearchTerm}
      />
    </div>
  );
}
