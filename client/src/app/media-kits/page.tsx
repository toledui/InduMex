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
  },
};

export default function MediaKitsPage() {
  return <MediaKitsClient />;
}
