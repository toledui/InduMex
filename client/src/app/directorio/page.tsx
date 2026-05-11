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
  },
};

const sectors = [...PROVIDER_SECTORS];

const mockProviders: B2BProvider[] = [
  {
    id: '1',
    name: 'Apex Logistics MX',
    slug: 'apex-logistics-mx',
    logo: 'AL',
    tier: 'premium',
    shortDescription: 'Operación 3PL para manufactura y distribución con trazabilidad total.',
    about:
      'Especialistas en logística industrial, almacenamiento, cross-docking y entregas técnicas para plantas de producción en el Bajío y norte del país.',
    sectors: ['Logística 3PL', 'Energía'],
    certifications: ['ISO 9001', 'AAA Logistics'],
    location: { city: 'Querétaro', state: 'Querétaro', country: 'México' },
    contact: {
      website: 'https://apexlogistics.mx',
      email: 'ventas@apexlogistics.mx',
      phone: '+52 442 555 0182',
      whatsapp: '+52 442 555 0182',
    },
    isActive: true,
  },
  {
    id: '2',
    name: 'Motion Control Studio',
    slug: 'motion-control-studio',
    logo: 'MC',
    tier: 'verified',
    shortDescription: 'Integración de celdas robotizadas y sistemas de automatización.',
    about:
      'Diseño, integración y puesta en marcha de soluciones de automatización para líneas de ensamble, visión artificial y control industrial.',
    sectors: ['Automatización', 'Robótica', 'Sensórica'],
    certifications: ['SIEMENS Solution Partner', 'ISO 14001'],
    location: { city: 'Monterrey', state: 'Nuevo León', country: 'México' },
    contact: {
      website: 'https://motioncontrolstudio.mx',
      email: 'hola@motioncontrolstudio.mx',
      phone: '+52 81 5550 4411',
      whatsapp: '+52 81 5550 4411',
    },
    isActive: true,
  },
  {
    id: '3',
    name: 'Precision CNC Bajío',
    slug: 'precision-cnc-bajio',
    logo: 'PC',
    tier: 'basic',
    shortDescription: 'Maquinados de alta precisión para piezas industriales y prototipos.',
    about:
      'Taller de maquinados con foco en fresado, torneado y fabricación de componentes personalizados para mantenimiento industrial.',
    sectors: ['CNC', 'Maquinados', 'Mantenimiento'],
    certifications: ['AS9100'],
    location: { city: 'Celaya', state: 'Guanajuato', country: 'México' },
    contact: {
      website: 'https://precisioncncbajio.mx',
      email: 'contacto@precisioncncbajio.mx',
      phone: '+52 461 555 3321',
      whatsapp: '+52 461 555 3321',
    },
    isActive: true,
  },
  {
    id: '4',
    name: 'Shield Industrial Supply',
    slug: 'shield-industrial-supply',
    logo: 'SI',
    tier: 'premium',
    shortDescription: 'Seguridad industrial y EPP para plantas con operación crítica.',
    about:
      'Suministro integral de EPP, señalización, auditorías de seguridad y estandarización para entornos de manufactura y logística.',
    sectors: ['Seguridad Industrial', 'Logística 3PL'],
    certifications: ['ANSI', 'ISO 45001'],
    location: { city: 'Guadalajara', state: 'Jalisco', country: 'México' },
    contact: {
      website: 'https://shieldindustrial.mx',
      email: 'ventas@shieldindustrial.mx',
      phone: '+52 33 5558 9000',
      whatsapp: '+52 33 5558 9000',
    },
    isActive: true,
  },
];

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

  let providersData = mockProviders;

  try {
    const dbProviders = await getPublicProviders();
    if (dbProviders.length > 0) {
      providersData = dbProviders.map(mapPublicProvider);
    }
  } catch {
    // fallback a mock si API no disponible
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#F58634] selection:text-white">
      <DirectorioClient
        providers={providersData}
        sectors={sectors}
        initialSector={activeSector}
        initialSearchTerm={initialSearchTerm}
      />
    </div>
  );
}
