import type { Metadata } from 'next';
import InduMexMagazine from '@/components/InduMexMagazine';

export const metadata: Metadata = {
  title: 'Revista Mayo 2026 | InduMex',
  description:
    'Primera edición hardcodeada de la revista industrial InduMex, con portada editorial, reportaje principal y contenido especial.',
  alternates: {
    canonical: 'https://indumex.blog/revista/mayo-2026',
  },
  openGraph: {
    title: 'Revista Mayo 2026 | InduMex',
    description:
      'Primera edición de la revista industrial InduMex.',
    url: 'https://indumex.blog/revista/mayo-2026',
    siteName: 'InduMex',
    locale: 'es_MX',
    type: 'website',
  },
};

export default function RevistaMayo2026Page() {
  return <InduMexMagazine />;
}