import type { Metadata } from 'next';
import MiCuentaClient from './MiCuentaClient';

export const metadata: Metadata = {
  title: 'Mi Cuenta | InduMex',
  description:
    'Gestiona tu cuenta de usuario cliente en InduMex, actualiza tus datos y crea tu perfil de proveedor basic.',
};

export default function MiCuentaPage() {
  return <MiCuentaClient />;
}
