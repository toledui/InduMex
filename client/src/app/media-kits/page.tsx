import { Metadata } from 'next';
import MediaKitsClient from './MediaKitsClient';

export const metadata: Metadata = {
  title: 'Media Kits Publicitarios | InduMex',
  description: 'Aumenta la visibilidad de tu negocio en la industria manufacturera con nuestros planes publicitarios personalizados.',
  openGraph: {
    title: 'Media Kits Publicitarios | InduMex',
    description: 'Aumenta la visibilidad de tu negocio con nuestros planes publicitarios.',
    type: 'website',
    url: 'https://indumex.blog/media-kits',
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
    title: 'Media Kits Publicitarios | InduMex',
    description: 'Aumenta la visibilidad de tu negocio con nuestros planes publicitarios.',
    images: ['https://indumex.blog/images/indumex-image.jpg'],
  },
};

export default function MediaKitsPage() {
  return <MediaKitsClient />;
}
