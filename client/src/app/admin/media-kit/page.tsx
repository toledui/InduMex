'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Save, X, CheckCircle2, AlertCircle,
  Package, DollarSign, ListChecks, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import {
  getMediaKitPlanes, createMediaKitPlan, updateMediaKitPlan, deleteMediaKitPlan,
  getAuthTokenFromCookie, type MediaKitPlan, type EcartPayItem
} from '@/lib/api';

const inputBase =
  'w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/30';

const EMPTY_PLAN: Omit<MediaKitPlan, 'id' | 'createdAt' | 'updatedAt'> = {
  nombre: '',
  descripcion: '',
  precio: 0,
  moneda: 'MXN',
  items: [{ name: '', price: 0, quantity: 1 }],
  features: [''],
  activo: true,
};

function normalizeItems(raw: unknown): EcartPayItem[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const row = item as { name?: unknown; price?: unknown; quantity?: unknown };
        return {
          name: typeof row.name === 'string' ? row.name : '',
          price: Number(row.price ?? 0),
          quantity: Number(row.quantity ?? 1) || 1,
        };
      });
  }

  if (typeof raw === 'string') {
    try {
      return normalizeItems(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === 'string');
  }

  if (typeof raw === 'string') {
    try {
      return normalizeFeatures(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  return [];
}

function normalizePlan(plan: MediaKitPlan): MediaKitPlan {
  return {
    ...plan,
    items: normalizeItems((plan as { items?: unknown }).items),
    features: normalizeFeatures((plan as { features?: unknown }).features),
  };
}

function StatusBadge({ activo }: { activo: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${
      activo
        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400'
        : 'border-white/10 bg-white/5 text-white/40'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${activo ? 'bg-emerald-400' : 'bg-white/30'}`} />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}

export default function MediaKitPage() {
  const [planes, setPlanes] = useState<MediaKitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [editing, setEditing] = useState<MediaKitPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Omit<MediaKitPlan, 'id' | 'createdAt' | 'updatedAt'>>(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const token = getAuthTokenFromCookie() ?? '';

  const loadPlanes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMediaKitPlanes(token);
      setPlanes(data.map(normalizePlan));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar planes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadPlanes(); }, [loadPlanes]);

  function openCreate() {
    setForm(EMPTY_PLAN);
    setEditing(null);
    setIsCreating(true);
    setSaveResult(null);
  }

  function openEdit(plan: MediaKitPlan) {
    setForm({
      nombre: plan.nombre,
      descripcion: plan.descripcion ?? '',
      precio: plan.precio,
      moneda: plan.moneda,
      items: plan.items.length > 0 ? plan.items : [{ name: '', price: 0, quantity: 1 }],
      features: plan.features.length > 0 ? plan.features : [''],
      activo: plan.activo,
    });
    setEditing(plan);
    setIsCreating(true);
    setSaveResult(null);
  }

  function closeEditor() {
    setIsCreating(false);
    setEditing(null);
    setSaveResult(null);
  }

  // Items helpers
  function setItem(idx: number, field: keyof EcartPayItem, value: string | number) {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: field === 'name' ? value : Number(value) };
      return { ...prev, items };
    });
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, { name: '', price: 0, quantity: 1 }] }));
  }

  function removeItem(idx: number) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  }

  // Features helpers
  function setFeature(idx: number, value: string) {
    setForm((prev) => {
      const features = [...prev.features];
      features[idx] = value;
      return { ...prev, features };
    });
  }

  function addFeature() {
    setForm((prev) => ({ ...prev, features: [...prev.features, ''] }));
  }

  function removeFeature(idx: number) {
    setForm((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    if (!form.nombre.trim()) {
      setSaveResult({ ok: false, msg: 'El nombre del plan es obligatorio.' });
      return;
    }
    if (form.precio <= 0) {
      setSaveResult({ ok: false, msg: 'El precio debe ser mayor a 0.' });
      return;
    }

    setSaving(true);
    setSaveResult(null);
    try {
      const payload = {
        ...form,
        precio: Number(form.precio),
        items: form.items.filter((i) => i.name.trim()),
        features: form.features.filter((f) => f.trim()),
      };

      if (editing) {
        await updateMediaKitPlan(token, editing.id, payload);
        setSaveResult({ ok: true, msg: 'Plan actualizado correctamente.' });
      } else {
        await createMediaKitPlan(token, payload);
        setSaveResult({ ok: true, msg: 'Plan creado correctamente.' });
      }
      await loadPlanes();
      setTimeout(closeEditor, 1500);
    } catch (err) {
      setSaveResult({ ok: false, msg: err instanceof Error ? err.message : 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(plan: MediaKitPlan) {
    if (!confirm(`¿Eliminar el plan "${plan.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteMediaKitPlan(token, plan.id);
      await loadPlanes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Media Kit — Planes</h1>
          <p className="mt-1 text-sm text-white/40">
            Crea y administra los planes del media kit para vender con EcartPay.
          </p>
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#F58634] text-black hover:bg-[#e5762a] transition-all"
          >
            <Plus size={16} />
            Nuevo Plan
          </button>
        )}
      </div>

      {/* Editor */}
      {isCreating && (
        <section className="bg-[#031c38] border border-[#F58634]/20 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">{editing ? `Editar: ${editing.nombre}` : 'Nuevo Plan'}</h2>
            <button type="button" onClick={closeEditor} className="text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Nombre del Plan</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Plan Básico, Plan Premium, etc."
                className={inputBase}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Precio</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={(e) => setForm((p) => ({ ...p, precio: Number(e.target.value) }))}
                className={inputBase}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Moneda</label>
              <select
                value={form.moneda}
                onChange={(e) => setForm((p) => ({ ...p, moneda: e.target.value }))}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#F58634] appearance-none"
              >
                <option value="MXN">MXN — Peso Mexicano</option>
                <option value="USD">USD — Dólar Americano</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Descripción</label>
              <textarea
                value={form.descripcion ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                rows={2}
                placeholder="Descripción corta visible al cliente"
                className={`${inputBase} resize-none`}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">
                Estado
              </label>
              <select
                value={form.activo ? 'true' : 'false'}
                onChange={(e) => setForm((p) => ({ ...p, activo: e.target.value === 'true' }))}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#F58634] appearance-none"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Items (sent to EcartPay) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/40">
                <Package size={12} className="text-[#F58634]" />
                Ítems del carrito (EcartPay)
              </label>
              <button type="button" onClick={addItem} className="text-xs text-[#F58634] hover:text-white flex items-center gap-1">
                <Plus size={12} /> Agregar ítem
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_120px_80px_32px] gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Nombre del ítem"
                    value={item.name}
                    onChange={(e) => setItem(idx, 'name', e.target.value)}
                    className={inputBase}
                  />
                  <input
                    type="number"
                    placeholder="Precio"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => setItem(idx, 'price', e.target.value)}
                    className={inputBase}
                  />
                  <input
                    type="number"
                    placeholder="Cant."
                    min="1"
                    value={item.quantity}
                    onChange={(e) => setItem(idx, 'quantity', e.target.value)}
                    className={inputBase}
                  />
                  <button type="button" onClick={() => removeItem(idx)} className="text-white/25 hover:text-red-400 transition-colors flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/40">
                <ListChecks size={12} className="text-[#F58634]" />
                Features del plan (card pública)
              </label>
              <button type="button" onClick={addFeature} className="text-xs text-[#F58634] hover:text-white flex items-center gap-1">
                <Plus size={12} /> Agregar feature
              </button>
            </div>
            <div className="space-y-2">
              {form.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ej. Anuncio 300×600 por 30 días"
                    value={feature}
                    onChange={(e) => setFeature(idx, e.target.value)}
                    className={inputBase}
                  />
                  <button type="button" onClick={() => removeFeature(idx)} className="text-white/25 hover:text-red-400 transition-colors shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Result */}
          {saveResult && (
            <div className={`flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl border ${
              saveResult.ok
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {saveResult.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {saveResult.msg}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
            <button type="button" onClick={closeEditor} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white/50 border border-white/10 hover:text-white hover:border-white/20 transition-all">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#F58634] text-black hover:bg-[#e5762a] disabled:opacity-60 transition-all"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Guardando…' : 'Guardar Plan'}
            </button>
          </div>
        </section>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/30 py-8">
          <Loader2 size={16} className="animate-spin" />
          Cargando planes…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-400">{error}</div>
      ) : planes.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#031c38] p-8 text-center text-white/30 text-sm">
          No hay planes creados aún. Haz clic en <strong className="text-[#F58634]">Nuevo Plan</strong> para comenzar.
        </div>
      ) : (
        <div className="space-y-3">
          {planes.map((plan) => (
            <div key={plan.id} className="bg-[#031c38] border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F58634]/10">
                  <DollarSign size={18} className="text-[#F58634]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{plan.nombre}</span>
                    <StatusBadge activo={plan.activo} />
                  </div>
                  <p className="text-sm text-white/40 mt-0.5">
                    {Number(plan.precio).toLocaleString('es-MX', { style: 'currency', currency: plan.moneda })}
                    {' '}·{' '}{plan.items.length} ítem(s){' '}·{' '}{plan.features.length} feature(s)
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                    className="p-2 rounded-lg text-white/30 hover:text-white transition-colors"
                  >
                    {expandedId === plan.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(plan)}
                    className="p-2 rounded-lg text-white/30 hover:text-[#F58634] transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(plan)}
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {expandedId === plan.id && (
                <div className="border-t border-white/5 px-5 pb-5 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.descripcion && (
                    <div className="md:col-span-2">
                      <p className="text-xs uppercase tracking-widest text-white/25 mb-1">Descripción</p>
                      <p className="text-sm text-white/60">{plan.descripcion}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/25 mb-2">Ítems EcartPay</p>
                    <ul className="space-y-1">
                      {plan.items.map((item, i) => (
                        <li key={i} className="flex justify-between text-sm text-white/50">
                          <span>{item.name} ×{item.quantity}</span>
                          <span>{Number(item.price).toLocaleString('es-MX', { style: 'currency', currency: plan.moneda })}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/25 mb-2">Features</p>
                    <ul className="space-y-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#F58634]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
