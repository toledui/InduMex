'use client';

import { useEffect, useState } from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  getAuthTokenFromCookie,
  getReaderCompaniesAdmin,
  createReaderCompany,
  updateReaderCompany,
  deleteReaderCompany,
  type EmpresaLectora,
} from '@/lib/api';

type ReaderCompanyForm = {
  nombre: string;
  abreviatura: string;
  orden: number;
  activa: boolean;
};

const emptyForm: ReaderCompanyForm = {
  nombre: '',
  abreviatura: '',
  orden: 0,
  activa: true,
};

export default function AdminEmpresasLectorasPage() {
  const [companies, setCompanies] = useState<EmpresaLectora[]>([]);
  const [form, setForm] = useState<ReaderCompanyForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function fetchCompanies() {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('Sesion invalida. Inicia sesion de nuevo.');
      return;
    }

    try {
      setLoading(true);
      const data = await getReaderCompaniesAdmin(token);
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las empresas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCompanies();
  }, []);

  function handleEdit(item: EmpresaLectora) {
    setEditingId(item.id);
    setForm({
      nombre: item.nombre,
      abreviatura: item.abreviatura,
      orden: item.orden,
      activa: item.activa,
    });
    setError(null);
    setMessage(null);
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
    if (!token) {
      setError('Sesion invalida.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const payload = {
        ...form,
        nombre: form.nombre.trim(),
        abreviatura: form.abreviatura.trim(),
        orden: Number(form.orden),
      };

      if (editingId !== null) {
        await updateReaderCompany(token, editingId, payload);
        setMessage('Empresa actualizada correctamente.');
      } else {
        await createReaderCompany(token, payload);
        setMessage('Empresa creada correctamente.');
      }

      setEditingId(null);
      setForm(emptyForm);
      await fetchCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar empresa.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Eliminar esta empresa del carrusel?')) return;

    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('Sesion invalida.');
      return;
    }

    try {
      await deleteReaderCompany(token, id);
      setMessage('Empresa eliminada.');
      await fetchCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar empresa.');
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Building2 className="h-7 w-7 text-[#F58634]" />
        <div>
          <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">Empresas Lectoras</h1>
          <p className="text-sm text-gray-400">Administra las marcas del carrusel de confianza del home.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</div>
      )}
      {message && (
        <div className="rounded-xl border border-green-800 bg-green-950/40 px-4 py-3 text-sm text-green-300">{message}</div>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#031c38] p-6">
        <h2 className="mb-6 text-lg font-bold text-white font-['Space_Grotesk']">
          {editingId !== null ? 'Editar Empresa' : 'Agregar Empresa'}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-gray-400">Nombre *</label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white focus:border-[#F58634] focus:outline-none"
              placeholder="Volkswagen"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-gray-400">Abreviatura *</label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white focus:border-[#F58634] focus:outline-none"
              placeholder="VW"
              value={form.abreviatura}
              onChange={(e) => setForm({ ...form, abreviatura: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-gray-400">Orden</label>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-2.5 text-sm text-white focus:border-[#F58634] focus:outline-none"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center gap-3 pt-7">
            <input
              id="activa"
              type="checkbox"
              className="h-5 w-5 rounded accent-[#F58634]"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
            />
            <label htmlFor="activa" className="text-sm text-gray-300">Empresa activa</label>
          </div>

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#F58634] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#e07b2a] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {editingId !== null ? 'Guardar cambios' : 'Crear empresa'}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-white/20 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-300 transition-colors hover:border-white/50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#031c38]">
        {loading && companies.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Cargando empresas...</div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No hay empresas registradas.</div>
        ) : (
          <ul>
            {companies.map((item, i) => (
              <li
                key={item.id}
                className={`flex items-center gap-4 p-5 ${i !== 0 ? 'border-t border-white/5' : ''}`}
              >
                <div className="flex h-10 min-w-16 items-center justify-center rounded-lg border border-white/10 bg-black/20 px-3">
                  <span className="text-sm font-bold tracking-wide text-slate-200">{item.abreviatura}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-white">{item.nombre}</h3>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">Orden: {item.orden}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        item.activa ? 'bg-green-900/50 text-green-300' : 'bg-gray-800 text-gray-500'
                      }`}
                    >
                      {item.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
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
