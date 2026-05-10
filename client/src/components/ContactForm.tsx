'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { submitContact } from '@/lib/api';

const inputBase =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-200 focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/30';

const labelBase = 'block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5';

export default function ContactForm() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    asunto: '',
    mensaje: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      await submitContact({
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono || undefined,
        asunto: form.asunto,
        mensaje: form.mensaje,
      });
      setStatus('success');
      setForm({ nombre: '', email: '', telefono: '', asunto: '', mensaje: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Error al enviar el mensaje. Intenta de nuevo.');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">¡Mensaje enviado!</h3>
          <p className="text-white/50 text-sm max-w-xs">
            Recibimos tu mensaje. En breve nos pondremos en contacto contigo.
          </p>
        </div>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-[#F58634] hover:underline"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="nombre" className={labelBase}>
            Nombre <span className="text-[#F58634]">*</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Tu nombre completo"
            required
            className={inputBase}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelBase}>
            Correo electrónico <span className="text-[#F58634]">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="tu@empresa.com"
            required
            className={inputBase}
          />
        </div>
      </div>

      <div>
        <label htmlFor="telefono" className={labelBase}>
          Número de celular
        </label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          value={form.telefono}
          onChange={handleChange}
          placeholder="+52 (55) 0000-0000"
          className={inputBase}
        />
      </div>

      <div>
        <label htmlFor="asunto" className={labelBase}>
          Asunto <span className="text-[#F58634]">*</span>
        </label>
        <input
          id="asunto"
          name="asunto"
          type="text"
          value={form.asunto}
          onChange={handleChange}
          placeholder="¿En qué podemos ayudarte?"
          required
          className={inputBase}
        />
      </div>

      <div>
        <label htmlFor="mensaje" className={labelBase}>
          Mensaje <span className="text-[#F58634]">*</span>
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          value={form.mensaje}
          onChange={handleChange}
          placeholder="Describe tu consulta con el mayor detalle posible…"
          required
          rows={5}
          className={`${inputBase} resize-none`}
        />
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/20 text-red-400">
          <AlertCircle size={15} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-[#F58634] text-black hover:bg-[#e5762a] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Send size={16} />
              Enviar mensaje
            </>
          )}
        </button>
      </div>
    </form>
  );
}
