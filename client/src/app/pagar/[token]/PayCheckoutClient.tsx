'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getClientTokenFromCookie, type PublicPayLink } from '@/lib/api';
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';

// Extend window with EcartPay SDK
declare global {
  interface Window {
    Pay: {
      Checkout: {
        create: (opts: EcartPayCheckoutOptions) => Promise<EcartPayResult>;
      };
    };
  }
}

interface EcartPayCheckoutOptions {
  publicID: string;
  order: {
    currency: string;
    items: { name: string; price: number; quantity: number }[];
    email?: string;
    first_name?: string;
  };
  customer?: { email?: string; first_name?: string; last_name?: string; phone?: string };
}

interface EcartPayResult {
  order_id?: string;
  status?: string;
  customer?: { email?: string; first_name?: string; last_name?: string; phone?: string };
  [key: string]: unknown;
}

interface Props {
  link: PublicPayLink;
  linkToken: string;
}

function normalizeItems(raw: unknown): { name: string; price: number; quantity: number }[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const row = item as { name?: unknown; price?: unknown; quantity?: unknown };
        return {
          name: typeof row.name === 'string' && row.name.trim() ? row.name : 'Item',
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

export default function PayCheckoutClient({ link, linkToken }: Props) {
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingReturn, setProcessingReturn] = useState(false);
  const clipReturnHandled = useRef(false);
  const items = normalizeItems((link as { items?: unknown }).items);
  const clientToken = getClientTokenFromCookie() ?? undefined;
  const checkoutUrl = link.checkoutLink ?? null;
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!checkoutUrl) {
      setError('No fue posible generar el enlace de checkout con Stripe. Solicita un nuevo link al administrador.');
    }
  }, [checkoutUrl]);

  useEffect(() => {
    const stripeStatus = searchParams.get('stripe');
    if (!stripeStatus) return;

    if (stripeStatus === 'cancel' || stripeStatus === 'error') {
      setError('Stripe devolvió el pago con error o cancelación. Intenta nuevamente.');
      return;
    }

    if (stripeStatus !== 'success' || success || clipReturnHandled.current) {
      return;
    }

    clipReturnHandled.current = true;
    setProcessingReturn(true);
    setError(null);

    // Stripe confirms final payment status via webhook.
    // For async methods (e.g. OXXO), success return means checkout completed,
    // not necessarily that funds are already settled.
    setPending(true);
    setProcessingReturn(false);
  }, [linkToken, searchParams, success]);

  // Force return to site after successful completion, even if provider modal stays open.
  useEffect(() => {
    if (!success || typeof window === 'undefined') return;

    const destination = clientToken ? '/mi-cuenta?pago=exitoso' : '/?pago=exitoso';
    const timer = window.setTimeout(() => {
      window.location.href = destination;
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [success, clientToken]);

  async function handlePay() {
    if (checkoutUrl) {
      setPaying(true);
      window.location.href = checkoutUrl;
      return;
    }
    setError('No hay checkout disponible para este link. Solicita uno nuevo al administrador.');
  }

  if (success) {
    return (
      <div className="max-w-md w-full bg-[#031c38] border border-emerald-500/20 rounded-2xl p-8 text-center space-y-4">
        <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
        <h1 className="text-xl font-bold text-white">¡Pago exitoso!</h1>
        <p className="text-sm text-white/50">
          Tu pago ha sido procesado correctamente. En breve recibirás un correo de confirmación.
        </p>
        <p className="text-xs text-white/30">Redirigiendo a InduMex...</p>
        <p className="text-xs text-white/20">Puedes cerrar esta ventana.</p>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="max-w-md w-full bg-[#031c38] border border-[#004AAD]/30 rounded-2xl p-8 text-center space-y-4">
        <ShieldCheck size={48} className="mx-auto text-[#004AAD]" />
        <h1 className="text-xl font-bold text-white">Pago en proceso de confirmación</h1>
        <p className="text-sm text-white/60">
          Stripe enviará la confirmación por webhook automáticamente.
          Si pagaste con OXXO u otro método fuera de línea, puede tardar en reflejarse.
        </p>
        <p className="text-xs text-white/35">
          Puedes cerrar esta ventana y revisar tu estado más tarde en tu cuenta.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-md w-full space-y-5">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <span className="text-[#004AAD] font-black text-2xl tracking-tight">Indu</span>
          <span className="text-[#F58634] font-black text-2xl tracking-tight">Mex</span>
          <p className="text-xs text-white/25 uppercase tracking-widest mt-1">Pago Seguro</p>
        </div>

        {/* Order summary */}
        <section className="bg-[#031c38] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Resumen del pedido</h2>
          </div>
          <div className="px-6 py-4 space-y-3">
            {items.length > 0 ? (
              items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-white/70">
                    {item.name}
                    {item.quantity > 1 && <span className="text-white/30 ml-1">×{item.quantity}</span>}
                  </span>
                  <span className="text-white font-semibold">
                    {Number(item.price * item.quantity).toLocaleString('es-MX', { style: 'currency', currency: link.moneda })}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">{link.descripcion ?? 'Compra'}</span>
                <span className="text-white font-semibold">
                  {Number(link.monto).toLocaleString('es-MX', { style: 'currency', currency: link.moneda })}
                </span>
              </div>
            )}
          </div>
          <div className="px-6 py-4 bg-white/5 flex items-center justify-between border-t border-white/5">
            <span className="text-sm font-bold text-white">Total</span>
            <span className="text-lg font-black text-[#F58634]">
              {Number(link.monto).toLocaleString('es-MX', { style: 'currency', currency: link.moneda })}
              <span className="text-xs text-white/30 ml-1 font-normal">{link.moneda}</span>
            </span>
          </div>
        </section>

        {/* Link metadata */}
        <section className="bg-[#031c38] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Datos del link</h2>
          </div>
          <div className="px-6 py-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/35">Correo registrado</span>
              <span className="text-white/75 text-right break-all">{link.compradorEmail ?? 'No especificado'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/35">Nombre registrado</span>
              <span className="text-white/75 text-right">{link.compradorNombre ?? 'No especificado'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/35">Cliente vinculado</span>
              <span className="text-white/75 text-right">{link.usuarioId ? `#${link.usuarioId}` : 'Sin vincular'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-white/35">Caduca el</span>
              <span className="text-white/75 text-right">
                {link.expiresAt
                  ? new Date(link.expiresAt).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Sin fecha de caducidad'}
              </span>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {/* Pay button */}
        <button
          type="button"
          onClick={handlePay}
          disabled={processingReturn || paying || !checkoutUrl}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-black bg-[#F58634] text-black hover:bg-[#e5762a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#F58634]/20"
        >
          {processingReturn ? (
            <><Loader2 size={20} className="animate-spin" /> Confirmando pago…</>
          ) : paying ? (
            <><Loader2 size={20} className="animate-spin" /> Abriendo checkout…</>
          ) : checkoutUrl ? (
            <><CreditCard size={20} /> Continuar al checkout seguro</>
          ) : (
            <><AlertCircle size={20} /> Checkout no disponible</>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-white/20">
          <ShieldCheck size={13} />
          Pago seguro · Encriptado SSL · Procesado por Clip
        </div>
      </div>
    </>
  );
}
