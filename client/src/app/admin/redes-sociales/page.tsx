'use client';

import { useEffect, useState } from 'react';
import {
  getSocialNetworksAdmin,
  createSocialNetwork,
  updateSocialNetwork,
  deleteSocialNetwork,
  getAuthTokenFromCookie,
  type SocialNetwork,
} from '@/lib/api';
import { Pencil, Plus, Trash2, Share2, GripVertical } from 'lucide-react';

type SocialForm = {
  nombre: string;
  url: string;
  icono?: string;
  activa: boolean;
};

const emptyForm: SocialForm = {
  nombre: '',
  url: '',
  icono: '',
  activa: true,
};

const ICON_OPTIONS = [
  'Twitter',
  'Linkedin',
  'Facebook',
  'Instagram',
  'Youtube',
  'Github',
  'Dribbble',
  'Behance',
  'Globe',
];

export default function AdminRedesSocialesPage() {
  const [networks, setNetworks] = useState<SocialNetwork[]>([]);
  const [form, setForm] = useState<SocialForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function fetchNetworks() {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('Sesión inválida. Inicia sesión de nuevo.');
      return;
    }

    try {
      setLoading(true);
      const data = await getSocialNetworksAdmin(token);
      setNetworks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las redes sociales.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNetworks();
  }, []);

  function onFieldChange<K extends keyof SocialForm>(field: K, value: SocialForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(network: SocialNetwork) {
    setEditingId(network.id);
    setForm({
      nombre: network.nombre,
      url: network.url,
      icono: network.icono || '',
      activa: network.activa,
    });
    setError(null);
    setMessage(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('Sesión inválida. Inicia sesión de nuevo.');
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await updateSocialNetwork(token, editingId, {
          nombre: form.nombre,
          url: form.url,
          icono: form.icono || undefined,
          activa: form.activa,
        });
        setMessage('Red social actualizada correctamente.');
      } else {
        await createSocialNetwork(token, {
          nombre: form.nombre,
          url: form.url,
          icono: form.icono || undefined,
          activa: form.activa,
        });
        setMessage('Red social creada correctamente.');
      }

      resetForm();
      await fetchNetworks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la red social.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(network: SocialNetwork) {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('Sesión inválida. Inicia sesión de nuevo.');
      return;
    }

    const confirmed = window.confirm('¿Deseas eliminar esta red social?');
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteSocialNetwork(token, network.id);
      setMessage('Red social eliminada correctamente.');
      await fetchNetworks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la red social.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Redes Sociales</h1>
        <p className="text-sm text-white/45 mt-1">Gestiona los enlaces a redes sociales que aparecen en el footer.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        {/* Formulario */}
        <article className="rounded-2xl border border-white/10 bg-[#021325] p-5 h-fit">
          <h2 className="text-sm uppercase tracking-widest text-white/55 font-semibold">
            {editingId ? 'Editar Red Social' : 'Nueva Red Social'}
          </h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              value={form.nombre}
              onChange={(e) => onFieldChange('nombre', e.target.value)}
              placeholder="Nombre (ej: Twitter, LinkedIn)"
              required
              className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/30"
            />

            <input
              type="url"
              value={form.url}
              onChange={(e) => onFieldChange('url', e.target.value)}
              placeholder="URL completa (https://...)"
              required
              className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/30"
            />

            <select
              value={form.icono}
              onChange={(e) => onFieldChange('icono', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/30 appearance-none cursor-pointer"
            >
              <option value="">Seleccionar ícono</option>
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={form.activa}
                onChange={(e) => onFieldChange('activa', e.target.checked)}
                className="w-4 h-4 rounded bg-black/20 border border-white/10 cursor-pointer"
              />
              <span>Red social activa</span>
            </label>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">{error}</p>
            )}
            {message && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-2">
                {message}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#F58634] text-black text-xs font-bold hover:bg-[#e17729] transition-colors disabled:opacity-60"
              >
                {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </article>

        {/* Lista de redes */}
        <div className="space-y-3">
          {loading && networks.length === 0 ? (
            <div className="text-center py-8 text-white/40">Cargando...</div>
          ) : networks.length === 0 ? (
            <div className="text-center py-8 text-white/40">No hay redes sociales aún. Crea la primera.</div>
          ) : (
            networks.map((network) => (
              <div
                key={network.id}
                className="rounded-xl border border-white/10 bg-[#031c38] p-4 flex items-center justify-between group hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical size={16} className="text-white/20 group-hover:text-white/40 transition-colors cursor-grab" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{network.nombre}</h3>
                    <p className="text-xs text-white/50 truncate">{network.url}</p>
                  </div>
                  {network.icono && (
                    <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded">{network.icono}</span>
                  )}
                  {!network.activa && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Inactiva</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(network)}
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(network)}
                    className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
