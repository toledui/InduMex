'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { requestPasswordReset } from '@/lib/api';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message);
      setToken(result.resetToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen grid place-items-center px-5 py-12 bg-[radial-gradient(circle_at_20%_20%,rgba(245,134,52,0.12),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(0,74,173,0.2),transparent_35%),#050505]">
      <div className="w-full max-w-md border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl rounded-2xl p-8">
        <h1 className="text-xl font-bold text-white">Recuperar Contraseña</h1>
        <p className="mt-1 text-sm text-white/40">Ingresa tu email para generar un enlace de restablecimiento.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-white/45 font-semibold">Email</span>
            <div className="mt-1.5 relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]/40"
                placeholder="contacto@indumex.blog"
              />
            </div>
          </label>

          {message && (
            <div className="text-sm text-emerald-400 border border-emerald-500/25 bg-emerald-500/10 rounded-lg px-3 py-2">
              <p>{message}</p>
              {token && (
                <Link href={`/admin/restablecer?token=${encodeURIComponent(token)}`} className="underline mt-1 inline-block">
                  Continuar con restablecimiento
                </Link>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 border border-red-500/25 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl border border-white/15 text-white text-sm font-semibold hover:border-white/30 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            <Send size={14} />
            {loading ? 'Enviando...' : 'Enviar enlace'}
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
