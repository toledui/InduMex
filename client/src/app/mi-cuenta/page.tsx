import type { Metadata } from 'next';
import MiCuentaClient from './MiCuentaClient';

export const metadata: Metadata = {
  title: 'Mi Cuenta | InduMex',
  description:
    'Gestiona tu cuenta de usuario cliente en InduMex, actualiza tus datos y crea tu perfil de proveedor basic.',
  openGraph: {
    title: 'Mi Cuenta | InduMex',
    description:
      'Gestiona tu cuenta de usuario cliente en InduMex, actualiza tus datos y crea tu perfil de proveedor basic.',
    type: 'website',
    url: 'https://indumex.blog/mi-cuenta',
    siteName: 'InduMex',
    locale: 'es_MX',
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
    title: 'Mi Cuenta | InduMex',
    description:
      'Gestiona tu cuenta de usuario cliente en InduMex, actualiza tus datos y crea tu perfil de proveedor basic.',
    images: ['https://indumex.blog/images/indumex-image.jpg'],
  },
};

export default function MiCuentaPage() {
  return <MiCuentaClient />;
}
