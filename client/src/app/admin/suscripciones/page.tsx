'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BadgeCheck,
  Star,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProveedorSuscripcionPlan {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  moneda: string;
  periodicidad: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  beneficios: string[];
  status: 'verificado' | 'patrocinado';
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Suscripcion {
  id: number;
  usuarioId: number;
  planId: number;
  estado: 'activa' | 'pausada' | 'cancelada' | 'vencida';
  fechaInicio: string;
  fechaVencimiento: string;
  proximoLinkPagoGeneradoEn: string | null;
  ultimoLinkPagoId: number | null;
  periodoGraciaVencimentoEn: string | null;
  notificacionesPendientes: number;
  createdAt: string;
  updatedAt: string;
  usuario?: { nombre: string; email: string };
  plan?: { nombre: string; status: string };
}

interface PlanFormState {
  nombre: string;
  descripcion: string;
  precio: string;
  moneda: string;
  periodicidad: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  beneficios: string[];
  status: 'verificado' | 'patrocinado';
  activo: boolean;
}

const emptyForm: PlanFormState = {
  nombre: '',
  descripcion: '',
  precio: '',
  moneda: 'MXN',
  periodicidad: 'mensual',
  beneficios: [''],
  status: 'verificado',
  activo: true,
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

function getAuthHeaders(): HeadersInit {
  const token =
    document.cookie
      .split('; ')
      .find((r) => r.startsWith('indumex_admin_token='))
      ?.split('=')[1] ?? '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function estadoBadge(estado: Suscripcion['estado']) {
  const map = {
    activa: 'bg-green-500/15 text-green-400',
    pausada: 'bg-yellow-500/15 text-yellow-400',
    cancelada: 'bg-red-500/15 text-red-400',
    vencida: 'bg-gray-500/15 text-gray-400',
  };
  return map[estado] ?? 'bg-white/10 text-white/60';
}

function statusIcon(status: ProveedorSuscripcionPlan['status']) {
  return status === 'patrocinado' ? (
    <Star size={14} className="text-[#F58634]" />
  ) : (
    <BadgeCheck size={14} className="text-[#004AAD]" />
  );
}

// ─── Plan Form Modal ──────────────────────────────────────────────────────────

function PlanModal({
  plan,
  onClose,
  onSaved,
}: {
  plan: ProveedorSuscripcionPlan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = plan !== null;
  const [form, setForm] = useState<PlanFormState>(
    plan
      ? {
          nombre: plan.nombre,
          descripcion: plan.descripcion ?? '',
          precio: String(plan.precio),
          moneda: plan.moneda,
          periodicidad: plan.periodicidad,
          beneficios: plan.beneficios.length > 0 ? plan.beneficios : [''],
          status: plan.status,
          activo: plan.activo,
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setBeneficio(index: number, value: string) {
    setForm((prev) => {
      const updated = [...prev.beneficios];
      updated[index] = value;
      return { ...prev, beneficios: updated };
    });
  }

  function addBeneficio() {
    setForm((prev) => ({ ...prev, beneficios: [...prev.beneficios, ''] }));
  }

  function removeBeneficio(index: number) {
    setForm((prev) => ({
      ...prev,
      beneficios: prev.beneficios.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const precio = Number(form.precio);
    if (!form.nombre.trim()) return setError('El nombre es obligatorio');
    if (isNaN(precio) || precio <= 0) return setError('El precio debe ser mayor a 0');

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio,
      moneda: form.moneda,
      periodicidad: form.periodicidad,
      beneficios: form.beneficios.filter((b) => b.trim() !== ''),
      status: form.status,
      activo: form.activo,
    };

    try {
      setSaving(true);
      const url = isEdit
        ? `${API_BASE}/admin/proveedor-suscripcion-planes/${plan!.id}`
        : `${API_BASE}/admin/proveedor-suscripcion-planes`;
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error ?? 'Error desconocido');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-bold text-white font-['Rubik']">
            {isEdit ? 'Editar Plan' : 'Nuevo Plan de Suscripción'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Nombre del Plan</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              placeholder="Ej. Verificado Mensual"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#004AAD] transition-colors"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setField('descripcion', e.target.value)}
              placeholder="Descripción opcional del plan..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#004AAD] transition-colors resize-none"
            />
          </div>

          {/* Precio + Moneda + Periodicidad */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Precio</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.precio}
                onChange={(e) => setField('precio', e.target.value)}
                placeholder="299"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#004AAD] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Moneda</label>
              <select
                value={form.moneda}
                onChange={(e) => setField('moneda', e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#004AAD] transition-colors"
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Periodicidad</label>
              <select
                value={form.periodicidad}
                onChange={(e) => setField('periodicidad', e.target.value as PlanFormState['periodicidad'])}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#004AAD] transition-colors"
              >
                <option value="mensual">Mensual</option>
                <option value="bimestral">Bimestral</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Tier de Proveedor</label>
            <div className="grid grid-cols-2 gap-3">
              {(['verificado', 'patrocinado'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setField('status', s)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    form.status === s
                      ? s === 'patrocinado'
                        ? 'border-[#F58634] bg-[#F58634]/10 text-[#F58634]'
                        : 'border-[#004AAD] bg-[#004AAD]/10 text-[#004AAD]'
                      : 'border-white/10 text-white/40 hover:border-white/30'
                  }`}
                >
                  {s === 'patrocinado' ? <Star size={14} /> : <BadgeCheck size={14} />}
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Beneficios */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Beneficios</label>
            <div className="space-y-2">
              {form.beneficios.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={b}
                    onChange={(e) => setBeneficio(i, e.target.value)}
                    placeholder={`Beneficio ${i + 1}`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#004AAD] transition-colors"
                  />
                  {form.beneficios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBeneficio(i)}
                      className="p-2 text-white/30 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addBeneficio}
                className="text-xs text-[#004AAD] hover:text-blue-400 transition-colors flex items-center gap-1 mt-1"
              >
                <Plus size={12} /> Agregar beneficio
              </button>
            </div>
          </div>

          {/* Activo toggle */}
          <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg border border-white/10">
            <span className="text-sm text-white/70">Plan activo</span>
            <button
              type="button"
              onClick={() => setField('activo', !form.activo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.activo ? 'bg-[#004AAD]' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  form.activo ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-[#F58634] text-white text-sm font-semibold hover:bg-orange-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuscripcionesPage() {
  const [planes, setPlanes] = useState<ProveedorSuscripcionPlan[]>([]);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [modalPlan, setModalPlan] = useState<ProveedorSuscripcionPlan | null | 'new'>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSubs, setShowSubs] = useState(true);
  const [subFilter, setSubFilter] = useState<'all' | Suscripcion['estado']>('all');

  const fetchPlanes = useCallback(async () => {
    setLoadingPlanes(true);
    try {
      const res = await fetch(`${API_BASE}/admin/proveedor-suscripcion-planes`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        const normalized = (json.data as ProveedorSuscripcionPlan[]).map((p) => ({
          ...p,
          beneficios: Array.isArray(p.beneficios)
            ? p.beneficios
            : typeof p.beneficios === 'string'
            ? (() => { try { return JSON.parse(p.beneficios as unknown as string); } catch { return []; } })()
            : [],
        }));
        setPlanes(normalized);
      }
    } finally {
      setLoadingPlanes(false);
    }
  }, []);

  const fetchSuscripciones = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch(`${API_BASE}/admin/proveedor-suscripciones`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) setSuscripciones(json.data);
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanes();
    fetchSuscripciones();
  }, [fetchPlanes, fetchSuscripciones]);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este plan? No se puede eliminar si tiene suscripciones activas.')) return;
    setDeletingId(id);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/admin/proveedor-suscripcion-planes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'No se pudo eliminar');
      fetchPlanes();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved() {
    setModalPlan(null);
    fetchPlanes();
  }

  const filteredSubs =
    subFilter === 'all' ? suscripciones : suscripciones.filter((s) => s.estado === subFilter);

  const statsCounts = {
    activa: suscripciones.filter((s) => s.estado === 'activa').length,
    vencida: suscripciones.filter((s) => s.estado === 'vencida').length,
    cancelada: suscripciones.filter((s) => s.estado === 'cancelada').length,
  };

  return (
    <>
      {/* Modal */}
      {modalPlan !== null && (
        <PlanModal
          plan={modalPlan === 'new' ? null : modalPlan}
          onClose={() => setModalPlan(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="space-y-8">
        {/* ── Header ── */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white font-['Rubik'] tracking-tight">
              Suscripciones de Proveedores
            </h1>
            <p className="text-sm text-white/50 mt-0.5">
              Gestiona los planes de suscripción por periodicidad para tiers verificado y patrocinado.
            </p>
          </div>
          <button
            onClick={() => setModalPlan('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F58634] text-white text-sm font-semibold hover:bg-orange-500 transition-colors"
          >
            <Plus size={16} />
            Nuevo Plan
          </button>
        </header>

        {/* ── Error global ── */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <XCircle size={15} />
            {errorMsg}
            <button onClick={() => setErrorMsg(null)} className="ml-auto">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Planes Grid ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider">
              Planes Disponibles
            </h2>
            <button
              onClick={fetchPlanes}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              title="Recargar"
            >
              <RefreshCw size={14} className={loadingPlanes ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingPlanes ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : planes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BadgeCheck size={40} className="text-white/20 mb-3" />
              <p className="text-white/40 text-sm">No hay planes configurados.</p>
              <button
                onClick={() => setModalPlan('new')}
                className="mt-4 text-[#F58634] text-sm hover:underline"
              >
                Crear el primer plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {planes.map((plan) => (
                <article
                  key={plan.id}
                  className="relative bg-[#111] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/20 transition-colors"
                >
                  {/* Status badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        plan.status === 'patrocinado'
                          ? 'bg-[#F58634]/15 text-[#F58634]'
                          : 'bg-[#004AAD]/15 text-[#004AAD]'
                      }`}
                    >
                      {statusIcon(plan.status)}
                      {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs ${
                        plan.activo ? 'text-green-400' : 'text-white/30'
                      }`}
                    >
                      {plan.activo ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {plan.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Name + price */}
                  <div>
                    <h3 className="font-bold text-white font-['Rubik'] text-base leading-tight">
                      {plan.nombre}
                    </h3>
                    {plan.descripcion && (
                      <p className="text-xs text-white/50 mt-1 line-clamp-2">{plan.descripcion}</p>
                    )}
                    <p className="text-2xl font-black text-white mt-2 font-['Rubik']">
                      {formatCurrency(plan.precio, plan.moneda)}
                      <span className="text-xs font-normal text-white/40 ml-1">/ {plan.periodicidad}</span>
                    </p>
                  </div>

                  {/* Beneficios */}
                  {plan.beneficios.length > 0 && (
                    <ul className="space-y-1">
                      {plan.beneficios.slice(0, 4).map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                          <CheckCircle2 size={12} className="text-green-400 mt-0.5 shrink-0" />
                          {b}
                        </li>
                      ))}
                      {plan.beneficios.length > 4 && (
                        <li className="text-xs text-white/30">
                          +{plan.beneficios.length - 4} más...
                        </li>
                      )}
                    </ul>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-white/10">
                    <button
                      onClick={() => setModalPlan(plan)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      <Pencil size={12} /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      disabled={deletingId === plan.id}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-white/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      {deletingId === plan.id ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Stats ── */}
        <section className="grid grid-cols-3 gap-4">
          {[
            { label: 'Activas', count: statsCounts.activa, color: 'text-green-400' },
            { label: 'Vencidas', count: statsCounts.vencida, color: 'text-gray-400' },
            { label: 'Canceladas', count: statsCounts.cancelada, color: 'text-red-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-[#111] border border-white/10 rounded-2xl p-4 text-center">
              <p className={`text-3xl font-black font-['Rubik'] ${color}`}>{count}</p>
              <p className="text-xs text-white/50 mt-1">{label}</p>
            </div>
          ))}
        </section>

        {/* ── Suscripciones Table ── */}
        <section className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          {/* Section header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-white/10 cursor-pointer select-none"
            onClick={() => setShowSubs((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-white/50" />
              <h2 className="text-sm font-bold text-white/80">
                Suscripciones de Usuarios
              </h2>
              <span className="text-xs text-white/30">({suscripciones.length})</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); fetchSuscripciones(); }}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                title="Recargar"
              >
                <RefreshCw size={13} className={loadingSubs ? 'animate-spin' : ''} />
              </button>
              {showSubs ? <ChevronUp size={15} className="text-white/40" /> : <ChevronDown size={15} className="text-white/40" />}
            </div>
          </div>

          {showSubs && (
            <>
              {/* Filter */}
              <div className="flex gap-2 px-6 py-3 border-b border-white/5">
                {(['all', 'activa', 'vencida', 'cancelada', 'pausada'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSubFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      subFilter === f
                        ? 'bg-[#004AAD]/20 text-[#004AAD] border border-[#004AAD]/30'
                        : 'text-white/40 hover:text-white/70 border border-transparent'
                    }`}
                  >
                    {f === 'all' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Table */}
              {loadingSubs ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-10 rounded-lg bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : filteredSubs.length === 0 ? (
                <div className="py-12 text-center text-white/30 text-sm">
                  No hay suscripciones {subFilter !== 'all' ? `con estado "${subFilter}"` : ''}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
                        <th className="text-left px-6 py-3">ID</th>
                        <th className="text-left px-4 py-3">Usuario</th>
                        <th className="text-left px-4 py-3">Plan</th>
                        <th className="text-left px-4 py-3">Estado</th>
                        <th className="text-left px-4 py-3">Inicio</th>
                        <th className="text-left px-4 py-3">Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubs.map((sub) => (
                        <tr
                          key={sub.id}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors"
                        >
                          <td className="px-6 py-3 text-white/40 font-mono text-xs">#{sub.id}</td>
                          <td className="px-4 py-3">
                            {sub.usuario ? (
                              <div>
                                <p className="text-white text-xs font-medium">{sub.usuario.nombre}</p>
                                <p className="text-white/40 text-xs">{sub.usuario.email}</p>
                              </div>
                            ) : (
                              <span className="text-white/30 text-xs">Usuario #{sub.usuarioId}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {sub.plan ? (
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                                sub.plan.status === 'patrocinado' ? 'text-[#F58634]' : 'text-[#004AAD]'
                              }`}>
                                {sub.plan.status === 'patrocinado'
                                  ? <Star size={11} />
                                  : <BadgeCheck size={11} />}
                                {sub.plan.nombre}
                              </span>
                            ) : (
                              <span className="text-white/30 text-xs">Plan #{sub.planId}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge(sub.estado)}`}>
                              {sub.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/50 text-xs">
                            {formatDate(sub.fechaInicio)}
                          </td>
                          <td className="px-4 py-3 text-white/50 text-xs">
                            {formatDate(sub.fechaVencimiento)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
