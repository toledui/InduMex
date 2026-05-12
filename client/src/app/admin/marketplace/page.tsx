'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Plus, RefreshCw, Star, Trash2, X } from 'lucide-react';
import {
  createAdminMarketplacePlan,
  deleteAdminMarketplacePlan,
  getAdminMarketplacePlans,
  getAuthTokenFromCookie,
  getMarketplaceFeatureCatalog,
  type MarketplacePlanPublic,
} from '@/lib/api';

type PlanFormState = {
  nombre: string;
  descripcion: string;
  precio: string;
  moneda: string;
  periodicidad: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  maxProductos: string;
  maxProductosDestacados: string;
  nivelVisibilidad: 'base' | 'media' | 'alta';
  activo: boolean;
  caracteristicas: string[];
};

const emptyForm: PlanFormState = {
  nombre: '',
  descripcion: '',
  precio: '',
  moneda: 'MXN',
  periodicidad: 'mensual',
  maxProductos: '20',
  maxProductosDestacados: '0',
  nivelVisibilidad: 'base',
  activo: true,
  caracteristicas: [],
};

function formatCurrency(amount: number, currency: string): string {
  return Number(amount || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  });
}

function formatFeatureLabel(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

export default function AdminMarketplacePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [plans, setPlans] = useState<MarketplacePlanPublic[]>([]);
  const [featureCatalog, setFeatureCatalog] = useState<string[]>([]);
  const [form, setForm] = useState<PlanFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const token = useMemo(() => getAuthTokenFromCookie(), []);

  const loadData = useCallback(async () => {
    if (!token) {
      setError('No autorizado. Inicia sesión nuevamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [plansData, featuresData] = await Promise.all([
        getAdminMarketplacePlans(token),
        getMarketplaceFeatureCatalog(token),
      ]);

      setPlans(
        plansData.map((plan) => ({
          ...plan,
          caracteristicas: normalizeStringList(plan.caracteristicas),
        }))
      );
      setFeatureCatalog(featuresData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar Marketplace.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function toggleFeature(feature: string) {
    setForm((prev) => ({
      ...prev,
      caracteristicas: prev.caracteristicas.includes(feature)
        ? prev.caracteristicas.filter((item) => item !== feature)
        : [...prev.caracteristicas, feature],
    }));
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setMessage(null);

    const price = Number(form.precio);
    const maxProductos = Number(form.maxProductos);
    const maxDestacados = Number(form.maxProductosDestacados);

    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError('El precio debe ser mayor a 0.');
      return;
    }

    if (!Number.isInteger(maxProductos) || maxProductos <= 0) {
      setError('El límite de productos debe ser un entero mayor a 0.');
      return;
    }

    if (!Number.isInteger(maxDestacados) || maxDestacados < 0) {
      setError('Los productos destacados deben ser un entero mayor o igual a 0.');
      return;
    }

    try {
      setSaving(true);
      const created = await createAdminMarketplacePlan(token, {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio: price,
        moneda: form.moneda,
        periodicidad: form.periodicidad,
        caracteristicas: form.caracteristicas,
        maxProductos,
        maxProductosDestacados: maxDestacados,
        nivelVisibilidad: form.nivelVisibilidad,
        activo: form.activo,
      });

      setPlans((prev) => [
        ...prev,
        {
          ...created,
          caracteristicas: normalizeStringList(created.caracteristicas),
        },
      ].sort((a, b) => Number(a.precio) - Number(b.precio)));
      setForm(emptyForm);
      setMessage('Plan marketplace creado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el plan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlan(id: number) {
    if (!token) return;
    if (!window.confirm('¿Eliminar plan de marketplace? Si tiene suscripciones activas no se podrá.')) return;

    setDeletingId(id);
    setError(null);
    setMessage(null);

    try {
      await deleteAdminMarketplacePlan(token, id);
      setPlans((prev) => prev.filter((item) => item.id !== id));
      setMessage('Plan eliminado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketplace: Planes</h1>
          <p className="mt-1 text-sm text-white/45">
            Creador de planes para habilitar perfil marketplace, límites de productos y beneficios de visibilidad.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/70 hover:text-white hover:border-white/30"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Recargar
        </button>
      </header>

      {error && <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      {message && <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</p>}

      <form onSubmit={handleCreatePlan} className="rounded-2xl border border-white/10 bg-[#031c38] p-5 space-y-4">
        <div className="flex items-center gap-2 text-white">
          <Plus size={16} className="text-[#F58634]" />
          <h2 className="font-semibold">Nuevo Plan Marketplace</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={form.nombre}
            onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
            placeholder="Nombre del plan"
            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white"
          />
          <input
            value={form.precio}
            type="number"
            min="1"
            step="0.01"
            onChange={(e) => setForm((prev) => ({ ...prev, precio: e.target.value }))}
            placeholder="Precio"
            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white"
          />
          <select
            value={form.periodicidad}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, periodicidad: e.target.value as PlanFormState['periodicidad'] }))
            }
            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white"
          >
            <option value="mensual">Mensual</option>
            <option value="bimestral">Bimestral</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>
          <select
            value={form.nivelVisibilidad}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, nivelVisibilidad: e.target.value as PlanFormState['nivelVisibilidad'] }))
            }
            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white"
          >
            <option value="base">Visibilidad base</option>
            <option value="media">Visibilidad media</option>
            <option value="alta">Visibilidad alta</option>
          </select>
          <input
            value={form.maxProductos}
            type="number"
            min="1"
            onChange={(e) => setForm((prev) => ({ ...prev, maxProductos: e.target.value }))}
            placeholder="Max productos"
            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white"
          />
          <input
            value={form.maxProductosDestacados}
            type="number"
            min="0"
            onChange={(e) => setForm((prev) => ({ ...prev, maxProductosDestacados: e.target.value }))}
            placeholder="Max destacados"
            className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white"
          />
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
            placeholder="Descripción del plan"
            className="md:col-span-2 rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white"
            rows={3}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Características predefinidas</p>
          <div className="flex flex-wrap gap-2">
            {featureCatalog.map((feature) => {
              const active = form.caracteristicas.includes(feature);
              return (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-[#004AAD]/40 bg-[#004AAD]/20 text-[#8fb2e6]'
                      : 'border-white/15 text-white/60 hover:text-white'
                  }`}
                >
                  {formatFeatureLabel(feature)}
                </button>
              );
            })}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-white/75">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
            className="h-4 w-4 accent-[#F58634]"
          />
          Plan activo
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#F58634] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Crear plan'}
        </button>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          [1, 2].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-white/5" />)
        ) : plans.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#031c38] p-6 text-sm text-white/45">
            No hay planes de marketplace creados.
          </p>
        ) : (
          plans.map((plan) => (
            <article key={plan.id} className="rounded-2xl border border-white/10 bg-[#031c38] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.nombre}</h3>
                  <p className="mt-1 text-sm text-white/55">{plan.descripcion || 'Sin descripción'}</p>
                </div>
                <button
                  onClick={() => void handleDeletePlan(plan.id)}
                  disabled={deletingId === plan.id}
                  className="rounded-lg border border-white/15 p-2 text-white/50 hover:text-red-400"
                  title="Eliminar plan"
                >
                  {deletingId === plan.id ? <X size={14} /> : <Trash2 size={14} />}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/65">
                <p><span className="text-white/35">Precio:</span> {formatCurrency(plan.precio, plan.moneda)}</p>
                <p><span className="text-white/35">Periodo:</span> {plan.periodicidad}</p>
                <p><span className="text-white/35">Visibilidad:</span> {plan.nivelVisibilidad}</p>
                <p><span className="text-white/35">Productos:</span> {plan.maxProductos}</p>
                <p><span className="text-white/35">Destacados:</span> {plan.maxProductosDestacados}</p>
                <p className="inline-flex items-center gap-1">
                  {plan.activo ? <BadgeCheck size={12} className="text-green-400" /> : <Star size={12} className="text-gray-400" />}
                  {plan.activo ? 'Activo' : 'Inactivo'}
                </p>
              </div>

              {plan.caracteristicas.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {plan.caracteristicas.map((feature) => (
                    <span key={feature} className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-white/60">
                      {formatFeatureLabel(feature)}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
