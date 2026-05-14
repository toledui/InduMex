'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, User, RefreshCw, Search, Zap, Loader2 } from 'lucide-react';
import {
  getAuthTokenFromCookie,
  getSubscriberSyncStatus,
  getSubscribers,
  runSubscriberSync,
  setSubscriberAutoSync,
  type Subscriber,
  type SubscriberSyncStatus,
} from '@/lib/api';

export default function AdminSuscriptoresPage() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SubscriberSyncStatus | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [autoSyncLoading, setAutoSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  async function loadSubscribers(emailQuery?: string, options?: { silent?: boolean }) {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('No autorizado. Inicia sesión nuevamente.');
      setLoading(false);
      return;
    }

    if (!options?.silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await getSubscribers(token, emailQuery);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los suscriptores.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSyncStatus() {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('No autorizado. Inicia sesión nuevamente.');
      return;
    }

    try {
      const status = await getSubscriberSyncStatus(token);
      setSyncStatus(status);
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'No se pudo cargar el estado de sincronización.');
    }
  }

  async function handleManualSync() {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('No autorizado. Inicia sesión nuevamente.');
      return;
    }

    setSyncLoading(true);
    setSyncMessage(null);

    try {
      const result = await runSubscriberSync(token, { provider: 'active' });
      setSyncMessage(
        `Sync ${result.provider}: procesados ${result.processed}, sincronizados ${result.synced}, errores ${result.failed}, pendientes ${result.remaining}.`
      );
      await Promise.all([loadSubscribers(query), loadSyncStatus()]);
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'No se pudo ejecutar la sincronización.');
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleToggleAutoSync() {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('No autorizado. Inicia sesión nuevamente.');
      return;
    }

    if (!syncStatus) {
      return;
    }

    setAutoSyncLoading(true);
    setSyncMessage(null);

    try {
      const updated = await setSubscriberAutoSync(token, {
        enabled: !syncStatus.autoSyncEnabled,
      });
      setSyncStatus(updated);
      setSyncMessage(
        updated.autoSyncEnabled
          ? `Sincronización automática iniciada. Se enviarán ${updated.hourlyBatchSize} suscriptores por hora.`
          : 'Sincronización automática detenida.'
      );
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'No se pudo actualizar la sincronización automática.');
    } finally {
      setAutoSyncLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void Promise.all([loadSubscribers(undefined, { silent: true }), loadSyncStatus()]);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const activeProviderLabel =
    syncStatus?.activeProvider === 'mailrelay'
      ? 'Mailrelay'
      : syncStatus?.activeProvider === 'mailchimp'
        ? 'Mailchimp'
        : 'Local';

  const canRunSync = Boolean(
    syncStatus &&
      syncStatus.activeProvider !== 'local' &&
      syncStatus.providerReady &&
      syncStatus.pending.activeProvider > 0
  );

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Suscriptores</h1>
          <p className="mt-1 text-sm text-white/40">
            Base de datos central para newsletter y futuras sincronizaciones con Mailrelay/Mailchimp.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#031c38] px-4 py-3 text-sm text-white/80">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Proveedor activo: <strong className="text-white">{activeProviderLabel}</strong>
            </span>
            {syncStatus && (
              <span className="text-white/60">
                Pendientes: {syncStatus.pending.activeProvider} (Mailrelay: {syncStatus.pending.mailrelay} | Mailchimp: {syncStatus.pending.mailchimp})
              </span>
            )}
          </div>
          {syncStatus && !syncStatus.providerReady && syncStatus.activeProvider !== 'local' && (
            <p className="mt-2 text-xs text-amber-300">
              La cuenta activa no está configurada correctamente en ajustes (API key, URL o audience/lista).
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleManualSync()}
            disabled={syncLoading || !canRunSync}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#F58634] text-black hover:bg-[#e5762a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Sincronizar ahora
          </button>

          <button
            type="button"
            onClick={() => void handleToggleAutoSync()}
            disabled={
              autoSyncLoading ||
              !syncStatus ||
              syncStatus.activeProvider === 'local' ||
              !syncStatus.providerReady
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-white/20 text-white hover:border-white/35 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {autoSyncLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {syncStatus?.autoSyncEnabled
              ? 'Detener sincronización automática'
              : 'Iniciar sincronización automática'}
          </button>

          {syncStatus?.autoSyncEnabled && (
            <span className="text-xs text-emerald-300">
              Activa: {syncStatus.hourlyBatchSize} suscriptores/hora
            </span>
          )}
        </div>

        <form
          className="flex flex-wrap items-center gap-2 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            void loadSubscribers(query);
          }}
        >
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por email"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-black/20 border border-white/10 text-white outline-none focus:border-[#F58634]"
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
            onClick={() => void Promise.all([loadSubscribers(query), loadSyncStatus()])}
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

      {syncMessage && (
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
          {syncMessage}
        </div>
      )}

      <div className="w-full border border-white/10 rounded-xl bg-[#031c38] overflow-hidden">
        <div className="md:hidden divide-y divide-white/10">
          {loading ? (
            <div className="px-4 py-8 text-center text-white/40">Cargando suscriptores...</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-white/40">No hay suscriptores todavía.</div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-white break-all">
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
                <div className="grid grid-cols-2 gap-2 text-xs text-white/65 pt-1">
                  <div>
                    <span className="text-white/40">Origen:</span> {item.origen}
                  </div>
                  <div>
                    <span className="text-white/40">Estado:</span> {item.estatus}
                  </div>
                  <div>
                    <span className="text-white/40">Mailrelay:</span> {item.syncMailrelay}
                  </div>
                  <div>
                    <span className="text-white/40">Mailchimp:</span> {item.syncMailchimp}
                  </div>
                </div>
                <div className="text-[11px] text-white/45">Alta: {new Date(item.createdAt).toLocaleString('es-MX')}</div>
              </article>
            ))
          )}
        </div>

        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full min-w-245 text-sm table-auto">
            <thead className="bg-black/30 text-white/60 uppercase text-xs tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 whitespace-nowrap">Contacto</th>
              <th className="text-left px-4 py-3 whitespace-nowrap">Origen</th>
              <th className="text-left px-4 py-3 whitespace-nowrap">Estado</th>
              <th className="text-left px-4 py-3 whitespace-nowrap">Sync Mailrelay</th>
              <th className="text-left px-4 py-3 whitespace-nowrap">Sync Mailchimp</th>
              <th className="text-left px-4 py-3 whitespace-nowrap">Alta</th>
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
                  <td className="px-4 py-3 w-[34%]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-white break-all">
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
    </div>
  );
}
