import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Globe2, MapPin, Mail, Phone, MessageCircle, ShieldCheck, Award } from 'lucide-react';
import { getPublicProviders } from '@/lib/api';
import { isImageLogo, sanitizeRichText, stripHtml } from '@/lib/provider-sectors';

async function getProviderBySlug(slug: string) {
  try {
    const providers = await getPublicProviders();
    return providers.find((item) => item.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);

  return {
    title: provider ? `${provider.name} | Directorio B2B | InduMex` : 'Proveedor | Directorio B2B | InduMex',
    description: provider?.shortDescription ?? 'Perfil de proveedor industrial dentro del Directorio B2B de InduMex.',
  };
}

export default async function ProviderDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);

  if (!provider) {
    notFound();
  }

  const isPremium = provider.tier === 'premium';
  const isVerified = provider.tier === 'verified';
  const aboutHtml = sanitizeRichText(provider.about);

  return (
    <div className="min-h-screen bg-[#021325] text-white">
      <section className="mx-auto max-w-6xl px-6 pt-32 pb-16">
        <Link href="/directorio" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-white/45 hover:text-[#F58634]">
          <ArrowLeft className="h-4 w-4" /> Volver al directorio
        </Link>

        <div className={`mt-6 rounded-3xl border p-8 ${isPremium ? 'border-[#F58634]/30 bg-[#031c38] shadow-[0_0_0_1px_rgba(245,134,52,0.08)]' : 'border-white/10 bg-[#031c38]'}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-2xl font-black ${isPremium ? 'bg-[#F58634]/10 text-[#F58634]' : 'bg-white/5 text-white/70'}`}>
                {isImageLogo(provider.logo) ? (
                  <img src={provider.logo} alt={provider.name} className="h-full w-full object-contain p-2" />
                ) : (
                  provider.logo
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight">{provider.name}</h1>
                  {isPremium && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F58634]/30 bg-[#F58634]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F58634]">
                      <Award className="h-3.5 w-3.5" /> Patrocinador
                    </span>
                  )}
                  {isVerified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#004AAD]/30 bg-[#004AAD]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#004AAD]">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                  {!isPremium && !isVerified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                      Basic
                    </span>
                  )}
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">{provider.shortDescription || stripHtml(provider.about)}</p>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-white/60">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#F58634]" />{provider.city}, {provider.state}, {provider.country}</div>
              <div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-[#004AAD]" /><a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:text-white">{provider.website.replace(/^https?:\/\//, '')}</a></div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-white/35">Acerca de la empresa</p>
              <div
                className="prose prose-invert max-w-none text-sm leading-relaxed text-white/75 prose-p:text-white/75 prose-li:text-white/75 prose-strong:text-white"
                dangerouslySetInnerHTML={{ __html: aboutHtml }}
              />

              <p className="mb-3 mt-8 text-xs font-bold uppercase tracking-[0.25em] text-white/35">Sectores</p>
              <div className="flex flex-wrap gap-2">
                {provider.sectors.map((sector) => (
                  <span key={sector} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65">{sector}</span>
                ))}
              </div>

              <p className="mb-3 mt-8 text-xs font-bold uppercase tracking-[0.25em] text-white/35">Certificaciones</p>
              <div className="flex flex-wrap gap-2">
                {provider.certifications.map((certification) => (
                  <span key={certification} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">{certification}</span>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-white/35">Contacto directo</p>
              <div className="space-y-3 text-sm text-white/60">
                <a href={`mailto:${provider.email}`} className="flex items-center gap-2 hover:text-white">
                  <Mail className="h-4 w-4 text-[#F58634]" /> {provider.email}
                </a>
                <a href={`tel:${provider.phone}`} className="flex items-center gap-2 hover:text-white">
                  <Phone className="h-4 w-4 text-[#004AAD]" /> {provider.phone}
                </a>
                <a href={`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white">
                  <MessageCircle className="h-4 w-4 text-[#F58634]" /> WhatsApp
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
