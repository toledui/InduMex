'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { loginAdmin } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await loginAdmin(email, password);
      document.cookie = `indumex_admin_token=${encodeURIComponent(result.token)}; Max-Age=${60 * 60 * 8}; Path=/; SameSite=Lax`;
      document.cookie = `indumex_admin_user=${encodeURIComponent(JSON.stringify(result.usuario))}; Max-Age=${60 * 60 * 8}; Path=/; SameSite=Lax`;
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen grid place-items-center px-5 py-12 bg-[radial-gradient(circle_at_20%_20%,rgba(245,134,52,0.12),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(0,74,173,0.2),transparent_35%),#050505]">
      <div className="w-full max-w-md border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl rounded-2xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-3 mb-7">
          <Image src="/images/Indumex_logo.png" alt="InduMex" width={38} height={38} />
          <div>
            <p className="text-xs tracking-[0.22em] uppercase text-[#F58634] font-semibold">InduMex</p>
            <h1 className="text-lg font-bold text-white">Acceso Administrativo</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <label className="block">
            <span className="text-xs uppercase tracking-widest text-white/45 font-semibold">Contraseña</span>
            <div className="mt-1.5 relative">
              <LockKeyhole size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
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

          {error && (
            <p className="text-sm text-red-400 border border-red-500/25 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-2.5 rounded-xl bg-[#F58634] text-black text-sm font-bold hover:bg-[#e17729] transition-colors disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-white/45">
          <Link href="/admin/recuperar" className="hover:text-white transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck size={13} />
            Entorno protegido
          </span>
        </div>
      </div>
    </section>
  );
}
