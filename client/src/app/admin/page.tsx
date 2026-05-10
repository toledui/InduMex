import type { Metadata } from 'next';
import { ChartColumnIncreasing, ShieldCheck, UsersRound, Settings2 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin | Dashboard | InduMex 2.0',
  description: 'Panel de administración para controlar servicios y usuarios de InduMex.',
};

const cards = [
  {
    title: 'Usuarios Activos',
    value: '12',
    icon: UsersRound,
    color: 'text-[#F58634]',
  },
  {
    title: 'Servicios Configurados',
    value: '5',
    icon: Settings2,
    color: 'text-[#004AAD]',
  },
  {
    title: 'Estado de Seguridad',
    value: 'Óptimo',
    icon: ShieldCheck,
    color: 'text-emerald-400',
  },
];

export default function AdminDashboardPage() {
  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Centro de Comando</h1>
        <p className="text-sm text-white/45">Monitorea configuración global, seguridad y operación del ecosistema InduMex.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/50">{card.title}</p>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="mt-4 text-2xl font-bold text-white">{card.value}</p>
          </article>
        ))}
      </div>

      <article className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-white">Administración de usuarios</h2>
            <p className="text-sm text-white/45 mt-1">
              Crea, actualiza y elimina usuarios del panel administrativo.
            </p>
          </div>
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F58634] px-4 py-2 text-sm font-bold text-black hover:bg-[#e17729]"
          >
            <ChartColumnIncreasing size={15} />
            Ir al CRUD
          </Link>
        </div>
      </article>
    </section>
  );
}
