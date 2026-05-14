'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Plus, Copy, CheckCheck, X, Loader2, AlertCircle, CheckCircle2, Pencil, Search, Calendar,
  Link2, ShoppingBag, Clock, Ban, DollarSign, Trash2
} from 'lucide-react';
import {
  getMediaKitPlanes, getPaymentLinks, createPaymentLink, updatePaymentLink, cancelPaymentLink, deletePaymentLink, getVentas, getUsers,
  getAuthTokenFromCookie,
  type MediaKitPlan, type PaymentLink, type Venta, type EcartPayItem, type AdminUser
} from '@/lib/api';

const inputBase =
  'w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/30';

type Tab = 'links' | 'ventas';

const ESTADO_META: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pendiente',  cls: 'bg-amber-400/10 border-amber-400/20 text-amber-400' },
  paid:      { label: 'Pagado',     cls: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' },
  expired:   { label: 'Expirado',   cls: 'bg-white/5 border-white/10 text-white/30' },
  cancelled: { label: 'Cancelado',  cls: 'bg-red-400/10 border-red-400/20 text-red-400' },
  completed: { label: 'Completado', cls: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' },
  refunded:  { label: 'Reembolsado',cls: 'bg-blue-400/10 border-blue-400/20 text-blue-400' },
};

function EstadoBadge({ estado }: { estado: string }) {
  const meta = ESTADO_META[estado] ?? { label: estado, cls: 'bg-white/5 text-white/30' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button type="button" onClick={copy} className="flex items-center gap-1 text-[11px] text-white/30 hover:text-[#F58634] transition-colors shrink-0">
      {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
      {copied ? 'Copiado' : 'Copiar URL'}
    </button>
  );
}

function toDateInputValue(value: string | null): string {
  if (!value) return '';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function PagosPage() {
  const [tab, setTab] = useState<Tab>('links');
  const [planes, setPlanes] = useState<MediaKitPlan[]>([]);
  const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    usuarioId: '',
    planId: '',
    descripcion: '',
    monto: '',
    moneda: 'MXN',
    compradorEmail: '',
    compradorNombre: '',
    expiresDate: '',
    useCustomItems: false,
    items: [{ name: '', price: 0, quantity: 1 }] as EcartPayItem[],
  });
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<PaymentLink | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const expiresInputRef = useRef<HTMLInputElement | null>(null);

  const token = getAuthTokenFromCookie() ?? '';

  const filteredUsuarios = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return usuarios.slice(0, 20);
    return usuarios
      .filter((u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [usuarios, customerQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, u, l, v] = await Promise.all([
        getMediaKitPlanes(token),
        getUsers(token),
        getPaymentLinks(token),
        getVentas(token),
      ]);
      setPlanes(p);
      setUsuarios(u);
      setLinks(l);
      setVentas(v);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  function openForm() {
    setForm({ usuarioId: '', planId: '', descripcion: '', monto: '', moneda: 'MXN', compradorEmail: '', compradorNombre: '', expiresDate: '', useCustomItems: false, items: [{ name: '', price: 0, quantity: 1 }] });
    setCustomerQuery('');
    setShowCustomerResults(false);
    setSaveResult(null);
    setCreatedToken(null);
    setEditingLink(null);
    setShowForm(true);
  }

  function openEditForm(link: PaymentLink) {
    setForm({
      usuarioId: link.usuarioId ? String(link.usuarioId) : '',
      planId: link.planId ? String(link.planId) : '',
      descripcion: link.descripcion ?? '',
      monto: String(link.monto ?? ''),
      moneda: link.moneda ?? 'MXN',
      compradorEmail: link.compradorEmail ?? '',
      compradorNombre: link.compradorNombre ?? '',
      expiresDate: toDateInputValue(link.expiresAt),
      // Keep automatic item generation on edit to avoid sending stale prices.
      useCustomItems: false,
      items: Array.isArray(link.items) && link.items.length > 0 ? link.items : [{ name: '', price: 0, quantity: 1 }],
    });
    setEditingLink(link);
    const selectedUser = link.usuarioId ? usuarios.find((u) => u.id === link.usuarioId) : null;
    setCustomerQuery(selectedUser ? `${selectedUser.nombre} - ${selectedUser.email}` : '');
    setShowCustomerResults(false);
    setSaveResult(null);
    setCreatedToken(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setCustomerQuery('');
    setShowCustomerResults(false);
    setSaveResult(null);
    setCreatedToken(null);
    setEditingLink(null);
  }

  function selectCustomer(user: AdminUser) {
    setForm((prev) => ({
      ...prev,
      usuarioId: String(user.id),
      compradorEmail: user.email,
      compradorNombre: user.nombre,
    }));
    setCustomerQuery(`${user.nombre} - ${user.email}`);
    setShowCustomerResults(false);
  }

  function clearSelectedCustomer() {
    setForm((prev) => ({ ...prev, usuarioId: '' }));
    setCustomerQuery('');
    setShowCustomerResults(false);
  }

  function openDatePicker() {
    const input = expiresInputRef.current;
    if (!input) return;
    if (typeof (input as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function') {
      (input as HTMLInputElement & { showPicker: () => void }).showPicker();
      return;
    }
    input.focus();
    input.click();
  }

  function setItem(idx: number, field: keyof EcartPayItem, value: string | number) {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: field === 'name' ? value : Number(value) };
      return { ...prev, items };
    });
  }

  async function handleSave() {
    if (!form.monto || Number(form.monto) <= 0) {
      setSaveResult({ ok: false, msg: 'El monto debe ser mayor a 0.' });
      return;
    }
    if (!form.compradorEmail.trim()) {
      setSaveResult({ ok: false, msg: 'El email del comprador es obligatorio.' });
      return;
    }

    setSaving(true);
    setSaveResult(null);
    try {
      const payload: Parameters<typeof createPaymentLink>[1] = {
        monto: Number(form.monto),
        moneda: form.moneda,
        compradorEmail: form.compradorEmail.trim().toLowerCase(),
      };
      if (form.usuarioId) payload.usuarioId = Number(form.usuarioId);
      if (form.planId) payload.planId = Number(form.planId);
      if (form.descripcion) payload.descripcion = form.descripcion;
      if (form.compradorNombre) payload.compradorNombre = form.compradorNombre;
      if (form.expiresDate) payload.expiresAt = `${form.expiresDate}T23:59:59`;
      if (form.useCustomItems) payload.items = form.items.filter((i) => i.name.trim());

      if (editingLink) {
        if (!form.expiresDate) {
          (payload as Parameters<typeof updatePaymentLink>[2]).expiresAt = null;
        }
        await updatePaymentLink(token, editingLink.id, payload);
        setSaveResult({ ok: true, msg: 'Link de pago actualizado correctamente.' });
      } else {
        const link = await createPaymentLink(token, payload);
        setCreatedToken(link.token);
        setSaveResult({ ok: true, msg: 'Link de pago creado exitosamente.' });
      }
      await loadData();
    } catch (err) {
      setSaveResult({ ok: false, msg: err instanceof Error ? err.message : 'Error al guardar link' });
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(link: PaymentLink) {
    if (!confirm(`¿Cancelar el link de pago #${link.id}?`)) return;
    try {
      await cancelPaymentLink(token, link.id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar');
    }
  }

  async function handleDelete(link: PaymentLink) {
    if (!['pending', 'cancelled', 'expired'].includes(link.estado)) {
      alert('Solo se pueden eliminar links cancelados o sin pagar.');
      return;
    }
    if (!confirm(`¿Eliminar permanentemente el link de pago #${link.id}? Esta acción no se puede deshacer.`)) return;
    try {
      await deletePaymentLink(token, link.id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar link');
    }
  }

  const payUrl = (tkn: string) =>
    typeof window !== 'undefined'
      ? `${window.location.origin}/pagar/${tkn}`
      : `/pagar/${tkn}`;

  const totalVentas = ventas.reduce((s, v) => s + Number(v.monto), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pagos y Ventas</h1>
          <p className="mt-1 text-sm text-white/40">
            Genera links de pago con EcartPay y consulta el historial de ventas.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={openForm}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#F58634] text-black hover:bg-[#e5762a] transition-all"
          >
            <Plus size={16} />
            Nuevo Link
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Links Activos',   value: links.filter((l) => l.estado === 'pending').length, icon: <Link2 size={16} className="text-amber-400" /> },
          { label: 'Links Pagados',   value: links.filter((l) => l.estado === 'paid').length,    icon: <CheckCircle2 size={16} className="text-emerald-400" /> },
          { label: 'Total Ventas',    value: ventas.length,                                       icon: <ShoppingBag size={16} className="text-[#F58634]" /> },
          { label: 'Ingresos Totales', value: `$${totalVentas.toLocaleString('es-MX')}`, icon: <DollarSign size={16} className="text-blue-400" /> },
        ].map((s) => (
          <div key={s.label} className="bg-[#031c38] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg">{s.icon}</div>
            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest">{s.label}</p>
              <p className="text-lg font-bold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <section className="bg-[#031c38] border border-[#F58634]/20 rounded-2xl p-4 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-bold text-white">{editingLink ? `Editar Link #${editingLink.id}` : 'Nuevo Link de Pago'}</h2>
            <button type="button" onClick={closeForm} className="text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {createdToken && !editingLink ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={15} />
                {saveResult?.msg}
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-widest mb-2">URL de pago generada</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-black/30 border border-white/10 rounded-xl px-4 py-3">
                  <code className="flex-1 text-sm text-white/70 break-all">{payUrl(createdToken)}</code>
                  <CopyButton text={payUrl(createdToken)} />
                </div>
              </div>
              <button type="button" onClick={closeForm} className="text-sm text-white/40 hover:text-white">
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Vincular con cliente (opcional)</label>
                  <div className="relative">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        value={customerQuery}
                        onChange={(e) => {
                          const next = e.target.value;
                          setCustomerQuery(next);
                          setShowCustomerResults(true);
                          if (!next.trim()) {
                            setForm((p) => ({ ...p, usuarioId: '' }));
                          }
                        }}
                        onFocus={() => setShowCustomerResults(true)}
                        placeholder="Buscar cliente por nombre o correo..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-24 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/30"
                      />
                      <button
                        type="button"
                        onClick={clearSelectedCustomer}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/35 hover:text-white transition-colors"
                      >
                        Limpiar
                      </button>
                    </div>

                    {showCustomerResults && (
                      <div className="absolute z-20 mt-2 w-full max-h-56 overflow-auto rounded-xl border border-white/10 bg-[#031c38] shadow-2xl">
                        <button
                          type="button"
                          onClick={clearSelectedCustomer}
                          className="w-full text-left px-3 py-2.5 text-sm text-white/60 hover:bg-white/5"
                        >
                          No vincular (captura manual)
                        </button>
                        {filteredUsuarios.map((usr) => (
                          <button
                            key={usr.id}
                            type="button"
                            onClick={() => selectCustomer(usr)}
                            className="w-full text-left px-3 py-2.5 hover:bg-white/5"
                          >
                            <p className="text-sm text-white">{usr.nombre}</p>
                            <p className="text-xs text-white/35">{usr.email}</p>
                          </button>
                        ))}
                        {filteredUsuarios.length === 0 && (
                          <p className="px-3 py-2.5 text-sm text-white/35">Sin coincidencias.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Plan (opcional)</label>
                  <select
                    value={form.planId}
                    onChange={(e) => {
                      const plan = planes.find((p) => String(p.id) === e.target.value);
                      setForm((prev) => ({
                        ...prev,
                        planId: e.target.value,
                        monto: plan ? String(plan.precio) : prev.monto,
                        moneda: plan ? plan.moneda : prev.moneda,
                      }));
                    }}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#F58634] appearance-none"
                  >
                    <option value="">— Sin plan —</option>
                    {planes.filter((p) => p.activo).map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} — {Number(p.precio).toLocaleString('es-MX', { style: 'currency', currency: p.moneda })}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Descripción</label>
                  <input type="text" value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción breve" className={inputBase} />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Monto</label>
                  <input type="number" min="0" step="0.01" value={form.monto} onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value }))} placeholder="0.00" className={inputBase} />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Moneda</label>
                  <select value={form.moneda} onChange={(e) => setForm((p) => ({ ...p, moneda: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#F58634] appearance-none">
                    <option value="MXN">MXN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Email del comprador (obligatorio)</label>
                  <input
                    type="email"
                    value={form.compradorEmail}
                    onChange={(e) => setForm((p) => ({ ...p, compradorEmail: e.target.value, ...(p.usuarioId ? { usuarioId: '' } : {}) }))}
                    placeholder="cliente@empresa.com"
                    className={inputBase}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Nombre del comprador (opcional)</label>
                  <input
                    type="text"
                    value={form.compradorNombre}
                    onChange={(e) => setForm((p) => ({ ...p, compradorNombre: e.target.value, ...(p.usuarioId ? { usuarioId: '' } : {}) }))}
                    placeholder="Nombre completo"
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-white/40 mb-1.5">Fecha de expiración (opcional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={expiresInputRef}
                      type="date"
                      value={form.expiresDate}
                      onChange={(e) => setForm((p) => ({ ...p, expiresDate: e.target.value }))}
                      className={`${inputBase} flex-1`}
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      type="button"
                      onClick={openDatePicker}
                      className="px-3 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-colors"
                      aria-label="Abrir calendario"
                    >
                      <Calendar size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {saveResult && !saveResult.ok && (
                <div className="flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle size={15} /> {saveResult.msg}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-white/5">
                <button type="button" onClick={closeForm} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white/50 border border-white/10 hover:text-white hover:border-white/20 transition-all">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#F58634] text-black hover:bg-[#e5762a] disabled:opacity-60 transition-all"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
                  {saving ? 'Guardando…' : editingLink ? 'Guardar Cambios' : 'Crear Link'}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* Tabs */}
      <div className="overflow-x-auto border-b border-white/10">
        <div className="flex gap-1 min-w-max">
          {(['links', 'ventas'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 sm:px-5 py-2.5 text-sm font-semibold capitalize border-b-2 -mb-px transition-all whitespace-nowrap ${
                tab === t
                  ? 'border-[#F58634] text-[#F58634]'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              {t === 'links' ? 'Links de Pago' : 'Historial de Ventas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/30 py-8">
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-400">{error}</div>
      ) : tab === 'links' ? (
        /* Links table */
        links.length === 0 ? (
          <p className="text-sm text-white/30 py-6">No hay links creados aún.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#031c38]">
            <table className="w-full min-w-220 text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-left text-[11px] uppercase tracking-widest text-white/25">
                  <th className="px-5 py-3">Token</th>
                  <th className="px-5 py-3">Descripción</th>
                  <th className="px-5 py-3">Monto</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Comprador</th>
                  <th className="px-5 py-3">Creado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <code className="text-[11px] text-white/50">{link.token.slice(0, 12)}…</code>
                        <CopyButton text={payUrl(link.token)} />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-white/60 max-w-40 truncate">{link.descripcion ?? '—'}</td>
                    <td className="px-5 py-3 font-semibold text-white whitespace-nowrap">
                      {Number(link.monto).toLocaleString('es-MX', { style: 'currency', currency: link.moneda })}
                    </td>
                    <td className="px-5 py-3"><EstadoBadge estado={link.estado} /></td>
                    <td className="px-5 py-3 text-white/40 max-w-40 truncate">
                      {link.compradorEmail ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-white/30 whitespace-nowrap">
                      {new Date(link.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-5 py-3">
                      {['pending', 'cancelled', 'expired'].includes(link.estado) && (
                        <div className="flex items-center gap-3">
                          {link.estado === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditForm(link)}
                                className="flex items-center gap-1 text-xs text-white/25 hover:text-[#F58634] transition-colors"
                              >
                                <Pencil size={13} /> Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancel(link)}
                                className="flex items-center gap-1 text-xs text-white/25 hover:text-red-400 transition-colors"
                              >
                                <Ban size={13} /> Cancelar
                              </button>
                            </>
                          )}
                          {['pending', 'cancelled', 'expired'].includes(link.estado) && (
                            <button
                              type="button"
                              onClick={() => handleDelete(link)}
                              className="flex items-center gap-1 text-xs text-white/25 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} /> Eliminar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Ventas table */
        ventas.length === 0 ? (
          <p className="text-sm text-white/30 py-6">No hay ventas registradas aún.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#031c38]">
            <table className="w-full min-w-190 text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-left text-[11px] uppercase tracking-widest text-white/25">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Comprador</th>
                  <th className="px-5 py-3">Monto</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Orden EcartPay</th>
                  <th className="px-5 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3 text-white/30">{venta.id}</td>
                    <td className="px-5 py-3">
                      <p className="text-white/70">{venta.compradorEmail}</p>
                      {venta.compradorNombre && <p className="text-xs text-white/30">{venta.compradorNombre}</p>}
                    </td>
                    <td className="px-5 py-3 font-semibold text-white whitespace-nowrap">
                      {Number(venta.monto).toLocaleString('es-MX', { style: 'currency', currency: venta.moneda })}
                    </td>
                    <td className="px-5 py-3"><EstadoBadge estado={venta.estado} /></td>
                    <td className="px-5 py-3 text-white/30 font-mono text-[11px]">{venta.ecartpayOrderId ?? '—'}</td>
                    <td className="px-5 py-3 text-white/30 whitespace-nowrap">
                      {new Date(venta.createdAt).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
