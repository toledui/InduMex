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
    title: 'Revista Mayo 2026 | InduMex',
    description: 'Primera edición de la revista industrial InduMex.',
    images: ['https://indumex.blog/images/indumex-image.jpg'],
  },
};

export default function RevistaMayo2026Page() {
  return <InduMexMagazine />;
}