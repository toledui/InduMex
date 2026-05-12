'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, KeyRound, Save } from 'lucide-react';
import { resetPassword } from '@/lib/api';

export default function RestablecerPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError('Token de recuperación inválido o ausente.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('La confirmación no coincide con la contraseña.');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(token, password);
      setMessage(result.message);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen grid place-items-center px-5 py-12 bg-[radial-gradient(circle_at_20%_20%,rgba(245,134,52,0.12),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(0,74,173,0.2),transparent_35%),#010b17]">
      <div className="w-full max-w-md border border-white/10 bg-[#021325]/90 backdrop-blur-xl rounded-2xl p-8">
        <h1 className="text-xl font-bold text-white">Restablecer Contraseña</h1>
        <p className="mt-1 text-sm text-white/40">Define una nueva contraseña para tu cuenta administrativa.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-white/45 font-semibold">Nueva contraseña</span>
            <div className="mt-1.5 relative">
              <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/40"
                placeholder="********"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-widest text-white/45 font-semibold">Confirmar contraseña</span>
            <div className="mt-1.5 relative">
              <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]/40"
                placeholder="********"
              />
            </div>
          </label>

          {message && (
            <p className="text-sm text-emerald-400 border border-emerald-500/25 bg-emerald-500/10 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-400 border border-red-500/25 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#F58634] text-black text-sm font-bold hover:bg-[#e17729] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <Save size={14} />
            {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
          </button>
        </form>

        <Link href="/admin/login" className="mt-5 inline-flex items-center gap-2 text-xs text-white/50 hover:text-white">
          <ArrowLeft size={13} />
          Volver al inicio de sesión
        </Link>
      </div>
    </section>
  );
}
