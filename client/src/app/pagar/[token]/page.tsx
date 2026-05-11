import type { Metadata } from 'next';
import { getPublicPayLink, type PublicPayLink } from '@/lib/api';
import PayCheckoutClient from './PayCheckoutClient';

export const metadata: Metadata = {
  title: 'Pagar | InduMex',
  description: 'Completa tu pago de forma segura.',
  robots: { index: false, follow: false },
};

export default async function PagarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let link: PublicPayLink | null = null;
  let fetchError: string | null = null;

  try {
    link = await getPublicPayLink(token);
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Error al cargar el link de pago.';
  }

  if (fetchError || !link) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
        <div className="max-w-md w-full bg-[#111] border border-red-500/20 rounded-2xl p-8 text-center space-y-4">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-xl font-bold text-white">Link no disponible</h1>
          <p className="text-sm text-white/50">{fetchError ?? 'Este link de pago no existe o ya expiró.'}</p>
        </div>
      </main>
    );
  }

  if (link.estado === 'paid') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
        <div className="max-w-md w-full bg-[#111] border border-emerald-500/20 rounded-2xl p-8 text-center space-y-4">
          <p className="text-4xl">✅</p>
          <h1 className="text-xl font-bold text-white">Pago ya realizado</h1>
          <p className="text-sm text-white/50">Este link ya fue pagado. Gracias por tu compra.</p>
        </div>
      </main>
    );
  }

  if (link.estado === 'expired' || link.estado === 'cancelled') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
        <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-2xl p-8 text-center space-y-4">
          <p className="text-4xl">🔒</p>
          <h1 className="text-xl font-bold text-white">Link inactivo</h1>
          <p className="text-sm text-white/50">Este link de pago ha {link.estado === 'expired' ? 'expirado' : 'sido cancelado'}.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 pt-28 pb-12 md:pt-32 flex items-center justify-center">
      <PayCheckoutClient link={link} linkToken={token} />
    </main>
  );
}
