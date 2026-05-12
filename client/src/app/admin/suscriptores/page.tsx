'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, User, RefreshCw, Search } from 'lucide-react';
import { getAuthTokenFromCookie, getSubscribers, type Subscriber } from '@/lib/api';

export default function AdminSuscriptoresPage() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function loadSubscribers(emailQuery?: string) {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('No autorizado. Inicia sesión nuevamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getSubscribers(token, emailQuery);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los suscriptores.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSubscribers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Suscriptores</h1>
          <p className="mt-1 text-sm text-white/40">
            Base de datos central para newsletter y futuras sincronizaciones con Mailrelay/Mailchimp.
          </p>
        </div>

        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void loadSubscribers(query);
          }}
        >
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por email"
              className="pl-9 pr-3 py-2 text-sm rounded-lg bg-black/20 border border-white/10 text-white outline-none focus:border-[#F58634]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#F58634] text-black hover:bg-[#e5762a]"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={() => void loadSubscribers(query)}
            className="px-3 py-2 rounded-lg border border-white/15 text-white/70 hover:text-white hover:border-white/30"
            title="Refrescar"
          >
            <RefreshCw size={14} />
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-white/10 rounded-xl bg-[#031c38]">
        <table className="min-w-full text-sm">
          <thead className="bg-black/30 text-white/60 uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Contacto</th>
              <th className="text-left px-4 py-3">Origen</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Sync Mailrelay</th>
              <th className="text-left px-4 py-3">Sync Mailchimp</th>
              <th className="text-left px-4 py-3">Alta</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/40">
                  Cargando suscriptores...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/40">
                  No hay suscriptores todavía.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-white/5 hover:bg-white/2">
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-white">
                        <Mail size={14} className="text-[#F58634]" />
                        {item.email}
                      </div>
                      {item.nombre && (
                        <div className="flex items-center gap-2 text-white/70 text-xs">
                          <User size={13} />
                          {item.nombre}
                        </div>
                      )}
                      {item.telefono && (
                        <div className="flex items-center gap-2 text-white/70 text-xs">
                          <Phone size={13} />
                          {item.telefono}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/70">{item.origen}</td>
                  <td className="px-4 py-3 text-white/70">{item.estatus}</td>
                  <td className="px-4 py-3 text-white/70">{item.syncMailrelay}</td>
                  <td className="px-4 py-3 text-white/70">{item.syncMailchimp}</td>
                  <td className="px-4 py-3 text-white/70">{new Date(item.createdAt).toLocaleString('es-MX')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
