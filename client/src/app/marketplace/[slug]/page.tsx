'use client';

import { use, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle,
  FileText,
  Globe,
  Lock,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Shield,
} from 'lucide-react';
import {
  getClientMe,
  getClientTokenFromCookie,
  getMarketplaceCatalog,
  type MarketplaceCatalogProducto,
} from '@/lib/api';

type MarketplaceProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type QuoteFormState = {
  nombre: string;
  email: string;
  empresa: string;
  mensaje: string;
};

const fallbackUser = {
  nombre: 'Juan Perez',
  email: 'juan@empresa.com',
  empresa: 'Manufacturas XYZ',
};

function formatMoney(value: number, currency: string): string {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  });
}

function formatSpecValue(value: unknown): string {
  if (value == null) return '-';
  if (Array.isArray(value)) return value.map((item) => formatSpecValue(item)).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function renderTextWithNoFollowLinks(text: string): ReactNode {
  const urlPattern = /(https?:\/\/[^\s"<>]+|www\.[^\s"<>]+)/gi;
  const matches = [...text.matchAll(urlPattern)];

  if (matches.length === 0) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    const matchedValue = match[0] ?? '';
    const start = match.index ?? 0;
    const end = start + matchedValue.length;

    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }

    const trimmedUrl = matchedValue.replace(/[),.;!?]+$/, '');
    const trailing = matchedValue.slice(trimmedUrl.length);
    const href = trimmedUrl.startsWith('www.') ? `https://${trimmedUrl}` : trimmedUrl;

    parts.push(
      <a
        key={`spec-link-${index}-${trimmedUrl}`}
        href={href}
        target="_blank"
        rel="nofollow noopener noreferrer"
        className="text-[#9cc3ff] underline underline-offset-2 hover:text-[#d6e6ff]"
      >
        {trimmedUrl}
      </a>
    );

    if (trailing) {
      parts.push(trailing);
    }

    cursor = end;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <>{parts}</>;
}

function toSpecLabel(rawKey: string): string {
  return rawKey
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isAllowedImageUrl(url: string): boolean {
  return (
    url.startsWith('/') ||
    url.includes('indumex.blog') ||
    url.includes('secure.gravatar.com') ||
    url.includes('images.unsplash.com') ||
    url.includes('encrypted-tbn0.gstatic.com') ||
    url.includes('localhost:4000/uploads/') ||
    url.includes('127.0.0.1:4000/uploads/')
  );
}

function normalizePhoneNumber(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

function normalizeExternalUrl(raw: string): string {
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export default function MarketplaceProductDetailPage({ params }: MarketplaceProductDetailPageProps) {
  const { slug } = use(params);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(fallbackUser);
  const [product, setProduct] = useState<MarketplaceCatalogProducto | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);
  const [providerLogoFailed, setProviderLogoFailed] = useState(false);
  const [quoteForm, setQuoteForm] = useState<QuoteFormState>({
    nombre: fallbackUser.nombre,
    email: fallbackUser.email,
    empresa: fallbackUser.empresa,
    mensaje: 'Solicito precio y tiempos de entrega para el SKU: --',
  });

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const token = getClientTokenFromCookie();
      if (!token) {
        if (active) {
          setIsAuthenticated(false);
          setCurrentUser(fallbackUser);
        }
        return;
      }

      if (active) {
        setIsAuthenticated(true);
      }

      const userCookie = document.cookie
        .split(';')
        .map((item) => item.trim())
        .find((item) => item.startsWith('indumex_client_user='));

      if (userCookie && active) {
        try {
          const parsed = JSON.parse(decodeURIComponent(userCookie.split('=')[1] ?? '{}')) as {
            nombre?: string;
            email?: string;
            empresa?: string | null;
          };
          setCurrentUser({
            nombre: parsed.nombre?.trim() || fallbackUser.nombre,
            email: parsed.email?.trim() || fallbackUser.email,
            empresa: parsed.empresa?.trim() || fallbackUser.empresa,
          });
        } catch {
          // Continue with API fallback below.
        }
      }

      try {
        const me = await getClientMe(token);
        if (!active) return;
        setCurrentUser({
          nombre: me.nombre?.trim() || fallbackUser.nombre,
          email: me.email?.trim() || fallbackUser.email,
          empresa: me.empresa?.trim() || fallbackUser.empresa,
        });
      } catch {
        if (active) {
          setCurrentUser((prev) => prev ?? fallbackUser);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setLoading(true);
      setError(null);

      try {
        const catalog = await getMarketplaceCatalog();
        const found = catalog.productos.find((item) => item.slug === slug) ?? null;

        if (!active) return;

        if (!found) {
          setError('No encontramos este producto en el marketplace.');
          setProduct(null);
          return;
        }

        setProduct(found);
        const firstAllowedImage = (found.imagenes ?? []).find((img) => isAllowedImageUrl(img)) ?? '';
        setSelectedImage(firstAllowedImage);
        setQuoteForm((prev) => ({
          ...prev,
          mensaje: `Solicito precio y tiempos de entrega para el SKU: ${found.sku}`,
        }));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'No se pudo cargar el producto.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProduct();

    return () => {
      active = false;
    };
  }, [slug]);

  const imageList = useMemo(() => {
    if (!product) return [];
    return product.imagenes.filter((img) => isAllowedImageUrl(img));
  }, [product]);

  const providerContact = useMemo(() => {
    const seller = product?.vendedor;
    if (!seller) {
      return {
        logo: '',
        phone: '',
        whatsapp: '',
        email: '',
        website: '',
        socialNetworks: [] as Array<{ nombre: string; url: string }>,
      };
    }

    return {
      logo: seller.logo?.trim() ?? '',
      phone: seller.phone?.trim() ?? '',
      whatsapp: seller.whatsapp?.trim() ?? '',
      email: seller.email?.trim() ?? '',
      website: seller.website?.trim() ?? '',
      socialNetworks: Array.isArray(seller.socialNetworks)
        ? seller.socialNetworks.filter((item) => item?.nombre?.trim() && item?.url?.trim())
        : [],
    };
  }, [product]);

  const providerDisplayName = useMemo(() => {
    if (!product?.vendedor) return 'Proveedor Industrial';

    return (
      product.vendedor.empresa?.trim() ||
      [product.vendedor.nombre, product.vendedor.apellido].filter(Boolean).join(' ').trim() ||
      product.vendedor.email?.trim() ||
      'Proveedor Industrial'
    );
  }, [product]);

  useEffect(() => {
    setProviderLogoFailed(false);
  }, [providerContact.logo]);

  const specRows = useMemo(() => {
    if (!product) return [];

    const metadataRows = Object.entries(product.metadata ?? {})
      .filter(([, value]) => value !== null && String(value).trim() !== '')
      .map(([key, value]) => ({
        label: toSpecLabel(key),
        textValue: formatSpecValue(value),
      }));

    const customRows = product.camposPersonalizados.map((field) => ({
      label: toSpecLabel(field.clave),
      textValue: field.valor,
    }));

    return [...metadataRows, ...customRows];
  }, [product]);

  function simulateOpenAuthModal() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('indumex:open-auth-modal', { detail: { mode: 'login' } }));
    }

    // Simulacion de login exitoso para mostrar el estado autenticado en esta vista.
    setTimeout(() => {
      setIsAuthenticated(true);
    }, 250);
  }

  function handleWhatsAppQuote() {
    if (!product || typeof window === 'undefined' || !providerContact.whatsapp) return;

    const whatsappDigits = normalizePhoneNumber(providerContact.whatsapp);
    if (!whatsappDigits) return;

    const message = `Hola, soy ${currentUser.nombre} de ${currentUser.empresa}. Me interesa cotizar el producto ${product.nombre} (SKU: ${product.sku}). Enlace: ${window.location.href}`;
    const url = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function handlePhoneCall() {
    if (!providerContact.phone || typeof window === 'undefined') return;
    const phoneDigits = normalizePhoneNumber(providerContact.phone);
    if (!phoneDigits) return;
    window.open(`tel:${phoneDigits}`, '_self');
  }

  function openEmailQuoteModal() {
    if (!product) return;

    setQuoteSent(false);
    setQuoteForm({
      nombre: currentUser.nombre,
      email: currentUser.email,
      empresa: currentUser.empresa,
      mensaje: `Solicito precio y tiempos de entrega para el SKU: ${product.sku}`,
    });
    setIsQuoteModalOpen(true);
  }

  async function handleQuoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSendingQuote(true);
    setQuoteSent(false);

    await new Promise((resolve) => {
      setTimeout(resolve, 1200);
    });

    setSendingQuote(false);
    setQuoteSent(true);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#021325] px-4 pb-12 pt-28 text-white sm:px-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-[#021e3a] p-8">
          <p className="font-['Space_Grotesk'] text-sm text-white/70">Cargando detalle del producto...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[#021325] px-4 pb-12 pt-28 text-white sm:px-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-red-500/30 bg-red-950/20 p-8">
          <p className="font-['Space_Grotesk'] text-sm text-red-200">{error ?? 'Producto no disponible.'}</p>
          <Link
            href="/marketplace"
            className="mt-4 inline-flex rounded-lg border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/80"
          >
            Volver al marketplace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#021325] px-4 pb-12 pt-28 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <section className="space-y-6 rounded-2xl border border-white/10 bg-[#021e3a] p-5 sm:p-6">
              <header className="space-y-3">
                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
                  SKU {product.sku}
                </span>
                <h1 className="font-['Space_Grotesk'] text-3xl font-bold leading-tight text-white sm:text-4xl">
                  {product.nombre}
                </h1>
              </header>

              <div className="space-y-3">
                <div className="relative h-90 overflow-hidden rounded-xl border border-white/10 bg-black/30 sm:h-115">
                  {selectedImage ? (
                    <Image
                      src={selectedImage}
                      alt={product.nombre}
                      fill
                      sizes="(max-width: 1024px) 100vw, 70vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/40">
                      <FileText className="h-10 w-10" />
                    </div>
                  )}
                </div>

                {imageList.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {imageList.map((img) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() => setSelectedImage(img)}
                        className={`relative h-16 overflow-hidden rounded-lg border ${
                          selectedImage === img ? 'border-[#F58634]' : 'border-white/10'
                        }`}
                      >
                        <Image src={img} alt={product.nombre} fill sizes="80px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <section className="rounded-xl border border-white/10 bg-black/20">
                <div className="border-b border-white/10 px-4 py-3">
                  <h2 className="font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.2em] text-white/75">
                    Especificaciones Tecnicas
                  </h2>
                </div>
                <div>
                  {specRows.length > 0 ? (
                    specRows.map((row) => (
                      <div key={`${row.label}-${row.textValue}`} className="grid grid-cols-[minmax(120px,220px)_1fr] gap-3 border-b border-white/10 px-4 py-3 text-sm last:border-b-0">
                        <p className="font-semibold text-white/60">{row.label}</p>
                        <p className="wrap-break-word text-white/85">{renderTextWithNoFollowLinks(row.textValue)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-sm text-white/55">No hay especificaciones adicionales registradas.</div>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#004AAD]" />
                  <h2 className="font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.2em] text-white/75">
                    Descripcion
                  </h2>
                </div>
                <p className="text-sm leading-7 text-white/80">
                  {product.descripcion?.trim() || 'Producto industrial publicado para solicitud de cotizacion y seguimiento comercial.'}
                </p>
              </section>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-2xl border border-white/10 bg-[#021e3a] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Precio de referencia</p>
                <p className="mt-2 text-3xl font-black text-white">{formatMoney(product.precio, product.moneda)}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-white/65">
                  <Shield className="h-4 w-4 text-[#004AAD]" />
                  Stock disponible: <span className="font-semibold text-white">{product.stock}</span>
                </div>
              </section>

              <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#021e3a] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Proveedor</p>

                {!isAuthenticated && (
                  <>
                    <div className="pointer-events-none mt-3 rounded-xl border border-white/10 bg-black/30 p-4 blur-sm">
                      <div className="h-10 w-10 rounded-full bg-white/10" />
                      <div className="mt-3 h-3 w-3/4 rounded bg-white/10" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
                      <div className="mt-4 h-9 w-full rounded bg-white/10" />
                      <div className="mt-2 h-9 w-full rounded bg-white/10" />
                    </div>

                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 px-4 text-center backdrop-blur-sm">
                      <Lock className="h-8 w-8 text-[#F58634]" />
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-white/85">
                        Acceso restringido
                      </p>
                      <button
                        type="button"
                        onClick={simulateOpenAuthModal}
                        className="mt-4 rounded-lg bg-[#F58634] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black"
                      >
                        Iniciar Sesion para Ver Proveedor y Cotizar
                      </button>
                    </div>
                  </>
                )}

                {isAuthenticated && (
                  <div className="mt-3 space-y-4">
                    <div className="flex items-center gap-3">
                      {providerContact.logo && isAllowedImageUrl(providerContact.logo) && !providerLogoFailed ? (
                        <div className="relative h-11 w-11 overflow-hidden rounded-full border border-[#004AAD]/40 bg-black/30">
                          <img
                            src={providerContact.logo}
                            alt="Logo proveedor"
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={() => setProviderLogoFailed(true)}
                          />
                        </div>
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#004AAD]/40 bg-[#004AAD]/10 text-sm font-black text-[#9cc3ff]">
                          {providerDisplayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-['Space_Grotesk'] text-sm font-semibold text-white">
                          {providerDisplayName}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#004AAD]">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Proveedor Verificado
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {providerContact.whatsapp && (
                        <button
                          type="button"
                          onClick={handleWhatsAppQuote}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-emerald-300 hover:bg-emerald-500/10"
                        >
                          <MessageCircle className="h-4 w-4" /> Cotizar por WhatsApp
                        </button>
                      )}

                      {providerContact.phone && (
                        <button
                          type="button"
                          onClick={handlePhoneCall}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#004AAD]/40 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[#9cc3ff] hover:bg-[#004AAD]/10"
                        >
                          <Phone className="h-4 w-4" /> Llamar al Proveedor
                        </button>
                      )}

                      {providerContact.email && (
                        <button
                          type="button"
                          onClick={openEmailQuoteModal}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#F58634] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black hover:bg-[#ff9a4a]"
                        >
                          <Mail className="h-4 w-4" /> Solicitar Cotizacion por Email
                        </button>
                      )}

                      {providerContact.website && (
                        <a
                          href={normalizeExternalUrl(providerContact.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white/80 hover:bg-white/5"
                        >
                          <Globe className="h-4 w-4" /> Sitio Web
                        </a>
                      )}
                    </div>

                    {providerContact.socialNetworks.length > 0 && (
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Redes Sociales</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {providerContact.socialNetworks.map((network) => (
                            <a
                              key={`${network.nombre}-${network.url}`}
                              href={normalizeExternalUrl(network.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/75 hover:border-[#004AAD]/40 hover:text-[#9cc3ff]"
                            >
                              {network.nombre}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
      </main>

      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto mt-20 w-full max-w-xl rounded-2xl border border-white/10 bg-[#031c38] p-5">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F58634]">Solicitud de Cotizacion</p>
                <h3 className="mt-1 font-['Space_Grotesk'] text-lg font-bold text-white">Enviar mensaje al proveedor</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(false)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white/60"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="mt-4 space-y-3">
              <label className="block text-sm text-white/75">
                Nombre
                <input
                  value={quoteForm.nombre}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-white/75">
                Email
                <input
                  value={quoteForm.email}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-white/75">
                Empresa
                <input
                  value={quoteForm.empresa}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-white/75">
                Mensaje
                <textarea
                  value={quoteForm.mensaje}
                  onChange={(e) => setQuoteForm((prev) => ({ ...prev, mensaje: e.target.value }))}
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>

              <button
                type="submit"
                disabled={sendingQuote}
                className="inline-flex w-full items-center justify-center rounded-lg bg-[#F58634] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-60"
              >
                {sendingQuote ? 'Enviando...' : 'Enviar Cotizacion'}
              </button>

              {quoteSent && (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
                  Cotizacion enviada al proveedor y copiando a la administracion de InduMex
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
