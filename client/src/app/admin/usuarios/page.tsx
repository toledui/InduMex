'use client';

import { useEffect, useState } from 'react';
import {
  createUser,
  deleteUser,
  getAuthTokenFromCookie,
  getUsers,
  type AdminUser,
  updateUser,
} from '@/lib/api';
import { Pencil, Plus, Trash2, UserCog } from 'lucide-react';

const PROTECTED_ADMIN_EMAIL = 'contacto@indumex.blog';

type UserForm = {
  nombre: string;
  email: string;
  password: string;
  rol: 'admin' | 'editor';
  activo: boolean;
};

const emptyForm: UserForm = {
  nombre: '',
  email: '',
  password: '',
  rol: 'editor',
  activo: true,
};

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isIndumexRoot =
    currentUserEmail.toLowerCase() === PROTECTED_ADMIN_EMAIL;

  async function fetchUsers() {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('Sesión inválida. Inicia sesión de nuevo.');
      return;
    }

    try {
      setLoading(true);
      const data = await getUsers(token);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();

    const userCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('indumex_admin_user='));

    if (userCookie) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userCookie.split('=')[1])) as {
          email?: string;
        };
        setCurrentUserEmail(parsedUser.email || '');
      } catch {
        setCurrentUserEmail('');
      }
    }
  }, []);

  function canManageUser(target: AdminUser): boolean {
    if (target.email.toLowerCase() === PROTECTED_ADMIN_EMAIL && !isIndumexRoot) {
      return false;
    }
    return true;
  }

  function onFieldChange<K extends keyof UserForm>(field: K, value: UserForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(user: AdminUser) {
    if (!canManageUser(user)) {
      setError('Solo contacto@indumex.blog puede modificar este usuario protegido.');
      return;
    }

    setEditingId(user.id);
    setForm({
      nombre: user.nombre,
      email: user.email,
      password: '',
      rol: user.rol,
      activo: user.activo,
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
        const editingUser = users.find((item) => item.id === editingId);
        if (editingUser && !canManageUser(editingUser)) {
          setError('Solo contacto@indumex.blog puede modificar este usuario protegido.');
          setLoading(false);
          return;
        }

        await updateUser(token, editingId, {
          nombre: form.nombre,
          email: form.email,
          password: form.password || undefined,
          rol: form.rol,
          activo: form.activo,
        });
        setMessage('Usuario actualizado correctamente.');
      } else {
        if (!form.password) {
          setError('La contraseña es obligatoria para crear usuarios.');
          setLoading(false);
          return;
        }
        await createUser(token, {
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          rol: form.rol,
        });
        setMessage('Usuario creado correctamente.');
      }

      resetForm();
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el usuario.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(user: AdminUser) {
    const token = getAuthTokenFromCookie();
    if (!token) {
      setError('Sesión inválida. Inicia sesión de nuevo.');
      return;
    }

    if (!canManageUser(user)) {
      setError('Solo contacto@indumex.blog puede eliminar este usuario protegido.');
      return;
    }

    const confirmed = window.confirm('¿Deseas eliminar este usuario?');
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteUser(token, user.id);
      setMessage('Usuario eliminado correctamente.');
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Usuarios de Plataforma</h1>
        <p className="text-sm text-white/45 mt-1">CRUD para gestión de accesos administrativos.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <article className="rounded-2xl border border-white/10 bg-[#021325] p-5">
          <h2 className="text-sm uppercase tracking-widest text-white/55 font-semibold">
            {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              value={form.nombre}
              onChange={(e) => onFieldChange('nombre', e.target.value)}
              placeholder="Nombre completo"
              required
              className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/30"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              placeholder="correo@indumex.blog"
              required
              className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]/30"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => onFieldChange('password', e.target.value)}
              placeholder={editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/30"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={form.rol}
                onChange={(e) => onFieldChange('rol', e.target.value as 'admin' | 'editor')}
                className="px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-[#004AAD]"
              >
                <option value="editor" className="bg-[#021e3a]">Editor</option>
                <option value="admin" className="bg-[#021e3a]">Admin</option>
              </select>
              <select
                value={String(form.activo)}
                onChange={(e) => onFieldChange('activo', e.target.value === 'true')}
                className="px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-[#004AAD]"
              >
                <option value="true" className="bg-[#021e3a]">Activo</option>
                <option value="false" className="bg-[#021e3a]">Inactivo</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-[#F58634] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#e17729] disabled:opacity-60"
              >
                <Plus size={14} />
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/80 hover:text-white"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#021325] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-sm uppercase tracking-widest text-white/55 font-semibold">Listado de usuarios</h2>
            <span className="text-xs text-white/40">{users.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-sm">
              <thead className="text-white/40 border-b border-white/10">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Nombre</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Rol</th>
                  <th className="text-left px-5 py-3 font-medium">Estado</th>
                  <th className="text-right px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 last:border-none">
                    <td className="px-5 py-3 text-white">{user.nombre}</td>
                    <td className="px-5 py-3 text-white/70">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-full border border-white/15 px-2 py-0.5 text-xs text-white/80">
                        {user.rol}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          user.activo
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      {canManageUser(user) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(user)}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 hover:text-white"
                          >
                            <Pencil size={12} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 px-2.5 py-1.5 text-xs text-red-300 hover:text-red-200"
                          >
                            <Trash2 size={12} />
                            Eliminar
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex items-center rounded-lg border border-[#F58634]/35 px-2.5 py-1.5 text-xs text-[#F58634]">
                          Usuario protegido
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-white/35">
                      <div className="inline-flex items-center gap-2">
                        <UserCog size={14} />
                        Sin usuarios registrados
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      {(error || message) && (
        <div
          className={`text-sm rounded-xl px-4 py-3 border ${
            error
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          {error || message}
        </div>
      )}
    </section>
  );
}
