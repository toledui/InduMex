'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  getAdsAdmin,
  createAd,
  updateAd,
  deleteAd,
  getAuthTokenFromCookie,
  type Anuncio,
  type AdZona,
} from '@/lib/api';
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';

type AdForm = {
  titulo: string;
  descripcion: string;
  cta_texto: string;
  cta_url: string;
  imagen_url: string;
  zona: AdZona;
  activo: boolean;
  orden: number;
  metrica: string;
  sector: string;
  acento: string;
};

const emptyForm: AdForm = {
  titulo: '',
  descripcion: '',
  cta_texto: 'Ver más',
  cta_url: '#',
  imagen_url: '',
  zona: 'hero-slider',
  activo: true,
  orden: 0,
  metrica: '',
  sector: '',
  acento: '#F58634',
};

const ZONAS: { value: AdZona; label: string }[] = [
  { value: 'hero-slider', label: 'Hero Slider (Homepage, pantalla completa)' },
  { value: 'editorial-grid', label: 'Editorial Grid (entre artículos)' },
  { value: 'post-in-content', label: 'Post — Banner dentro del artículo' },
  { value: 'post-sidebar', label: 'Post — Sidebar (300×600)' },
];

const ZONA_BADGE: Record<AdZona, string> = {
  'hero-slider': 'bg-orange-900/50 text-orange-300',
  'editorial-grid': 'bg-blue-900/50 text-blue-300',
  'post-in-content': 'bg-purple-900/50 text-purple-300',
  'post-sidebar': 'bg-green-900/50 text-green-300',
};

export default function AdminAnunciosPage() {
  const [ads, setAds] = useState<Anuncio[]>([]);
  const [form, setForm] = useState<AdForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filterZona, setFilterZona] = useState<AdZona | 'all'>('all');

  async function fetchAds() {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('Sesión inválida. Inicia sesión de nuevo.');
      return;
    }
    try {
      setLoading(true);
      const data = await getAdsAdmin(token);
      setAds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los anuncios.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAds();
  }, []);

  function handleEdit(ad: Anuncio) {
    setEditingId(ad.id);
    setForm({
      titulo: ad.titulo,
      descripcion: ad.descripcion,
      cta_texto: ad.cta_texto,
      cta_url: ad.cta_url,
      imagen_url: ad.imagen_url ?? '',
      zona: ad.zona,
      activo: ad.activo,
      orden: ad.orden,
      metrica: ad.metrica ?? '',
      sector: ad.sector ?? '',
      acento: ad.acento ?? '#F58634',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getAuthTokenFromCookie();
    if (!token) { setError('Sesión inválida'); return; }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        ...form,
        imagen_url: form.imagen_url.trim() || null,
        metrica: form.metrica.trim() || null,
        sector: form.sector.trim() || null,
        acento: form.acento.trim() || null,
        orden: Number(form.orden),
      };

      if (editingId !== null) {
        await updateAd(token, editingId, payload);
        setMessage('Anuncio actualizado correctamente.');
      } else {
        await createAd(token, payload);
        setMessage('Anuncio creado correctamente.');
      }

      setEditingId(null);
      setForm(emptyForm);
      await fetchAds();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el anuncio.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este anuncio? Esta acción no se puede deshacer.')) return;
    const token = getAuthTokenFromCookie();
    if (!token) { setError('Sesión inválida'); return; }
    try {
      await deleteAd(token, id);
      setMessage('Anuncio eliminado.');
      await fetchAds();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar.');
    }
  }

  const filteredAds = filterZona === 'all' ? ads : ads.filter((a) => a.zona === filterZona);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Megaphone className="h-7 w-7 text-[#F58634]" />
        <div>
          <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">Gestión de Anuncios</h1>
          <p className="text-sm text-gray-400">Administra todos los bloques publicitarios del sitio</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</div>
      )}
      {message && (
        <div className="rounded-xl border border-green-800 bg-green-950/40 px-4 py-3 text-sm text-green-300">{message}</div>
      )}

      {/* Form */}
      <section className="rounded-2xl border border-white/10 bg-[#111] p-6">
        <h2 className="text-lg font-bold text-white mb-6 font-['Space_Grotesk']">
          {editingId !== null ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Zona */}
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Zona *</label>
            <select
              className="w-full rounded-lg bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 text-sm focus:border-[#F58634] focus:outline-none"
              value={form.zona}
              onChange={(e) => setForm({ ...form, zona: e.target.value as AdZona })}
              required
            >
              {ZONAS.map((z) => (
                <option key={z.value} value={z.value}>{z.label}</option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Título *</label>
            <input
              type="text"
              className="w-full rounded-lg bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 text-sm focus:border-[#F58634] focus:outline-none"
              placeholder="Soluciones de Automatización KUKA"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
          </div>

          {/* Descripción */}
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Descripción *</label>
            <textarea
              rows={3}
              className="w-full rounded-lg bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 text-sm focus:border-[#F58634] focus:outline-none resize-none"
              placeholder="Texto descriptivo del anuncio..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              required
            />
          </div>

          {/* CTA Texto */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Texto CTA *</label>
            <input
              type="text"
              className="w-full rounded-lg bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 text-sm focus:border-[#F58634] focus:outline-none"
              placeholder="Solicitar Demo"
              value={form.cta_texto}
              onChange={(e) => setForm({ ...form, cta_texto: e.target.value })}
              required
            />
          </div>

          {/* CTA URL */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">URL de destino *</label>
            <input
              type="url"
              className="w-full rounded-lg bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 text-sm focus:border-[#F58634] focus:outline-none"
              placeholder="https://..."
              value={form.cta_url}
              onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
              required
            />
          </div>

          {/* Imagen URL */}
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">URL de Imagen</label>
            <input
              type="text"
              className="w-full rounded-lg bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 text-sm focus:border-[#F58634] focus:outline-none"
              placeholder="https://cdn.ejemplo.com/imagen.jpg"
              value={form.imagen_url}
              onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
            />
            {form.imagen_url && (
              <div className="mt-2 relative h-20 w-40 rounded-lg overflow-hidden border border-white/10">
                <Image src={form.imagen_url} alt="Preview" fill className="object-cover" />
              </div>
            )}
          </div>

          {/* Sector */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Sector / Etiqueta</label>
            <input
              type="text"
              className="w-full rounded-lg bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 text-sm focus:border-[#F58634] focus:outline-none"
              placeholder="Automatización, ERP, Materiales..."
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
            />
          </div>

          {/* Métrica */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Métrica destacada</label>
            <input
              type="text"
              className="w-full rounded-lg bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 text-sm focus:border-[#F58634] focus:outline-none"
              placeholder="OEE +18%, Entrega 72h..."
              value={form.metrica}
              onChange={(e) => setForm({ ...form, metrica: e.target.value })}
            />
          </div>

          {/* Color acento */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Color de Acento</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-10 w-14 rounded-lg border border-white/10 bg-[#1a1a1a] cursor-pointer"
                value={form.acento}
                onChange={(e) => setForm({ ...form, acento: e.target.value })}
              />
              <input
                type="text"
                className="flex-1 rounded-lg bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 text-sm focus:border-[#F58634] focus:outline-none"
                placeholder="#F58634"
                value={form.acento}
                onChange={(e) => setForm({ ...form, acento: e.target.value })}
              />
            </div>
          </div>

          {/* Orden */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Orden</label>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 text-sm focus:border-[#F58634] focus:outline-none"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
            />
          </div>

          {/* Activo */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="activo"
              className="h-5 w-5 accent-[#F58634] rounded"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            <label htmlFor="activo" className="text-sm text-gray-300">Anuncio activo</label>
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#F58634] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-black hover:bg-[#e07b2a] disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {editingId !== null ? 'Guardar Cambios' : 'Crear Anuncio'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-white/20 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-300 hover:border-white/50 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs uppercase tracking-widest text-gray-400">Filtrar por zona:</span>
        <button
          onClick={() => setFilterZona('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${filterZona === 'all' ? 'bg-[#F58634] text-black' : 'border border-white/20 text-gray-400 hover:border-white/40'}`}
        >
          Todos ({ads.length})
        </button>
        {ZONAS.map((z) => (
          <button
            key={z.value}
            onClick={() => setFilterZona(z.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${filterZona === z.value ? 'bg-[#F58634] text-black' : 'border border-white/20 text-gray-400 hover:border-white/40'}`}
          >
            {z.value} ({ads.filter((a) => a.zona === z.value).length})
          </button>
        ))}
      </div>

      {/* List */}
      <section className="rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
        {loading && ads.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Cargando anuncios...</div>
        ) : filteredAds.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No hay anuncios en esta zona.</div>
        ) : (
          <ul>
            {filteredAds.map((ad, i) => (
              <li
                key={ad.id}
                className={`flex items-start gap-4 p-5 ${i !== 0 ? 'border-t border-white/5' : ''} hover:bg-white/2 transition-colors`}
              >
                {/* Image preview */}
                <div className="relative h-16 w-24 shrink-0 rounded-lg overflow-hidden bg-[#1a1a1a] border border-white/10">
                  {ad.imagen_url ? (
                    <Image src={ad.imagen_url} alt={ad.titulo} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                      <Megaphone className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${ZONA_BADGE[ad.zona]}`}>
                      {ad.zona}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${ad.activo ? 'bg-green-900/50 text-green-300' : 'bg-gray-800 text-gray-500'}`}>
                      {ad.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    {ad.metrica && (
                      <span className="text-[10px] text-gray-400 border border-white/10 px-2 py-0.5 rounded-full">
                        {ad.metrica}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-sm truncate">{ad.titulo}</h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{ad.descripcion}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">{ad.cta_texto}</span>
                    <span className="text-[10px] text-gray-700">Orden: {ad.orden}</span>
                    {ad.sector && <span className="text-[10px] text-gray-600">{ad.sector}</span>}
                  </div>
                </div>

                {/* Color swatch */}
                <div
                  className="h-8 w-8 shrink-0 rounded-lg border border-white/10"
                  style={{ backgroundColor: ad.acento ?? '#F58634' }}
                  title={ad.acento ?? '#F58634'}
                />

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(ad)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ad.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
