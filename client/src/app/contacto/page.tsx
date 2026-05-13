import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MapPin, ExternalLink, Megaphone, Link2 } from 'lucide-react';
import { getSocialNetworks, SocialNetwork } from '@/lib/api';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contáctanos | InduMex — Industria, Innovación y Precisión',
  description:
    'Ponte en contacto con el equipo de InduMex. Escríbenos por correo o llena el formulario. También puedes anunciarte con nosotros y llegar a miles de profesionales del sector industrial.',
  openGraph: {
    title: 'Contáctanos | InduMex',
    description:
      'Ponte en contacto con el equipo de InduMex. Escríbenos o llena el formulario y te respondemos pronto.',
    url: 'https://indumex.blog/contacto',
    siteName: 'InduMex',
    locale: 'es_MX',
    type: 'website',
    images: [
      {
        url: 'https://indumex.blog/images/indumex-image.jpg',
        width: 1200,
        height: 630,
        alt: 'InduMex - Plataforma Industrial B2B',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contáctanos | InduMex',
    description:
      'Ponte en contacto con el equipo de InduMex. Escríbenos o llena el formulario y te respondemos pronto.',
    images: ['https://indumex.blog/images/indumex-image.jpg'],
  },
  alternates: {
    canonical: 'https://indumex.blog/contacto',
  },
};

// lucide-react v1.14+ no incluye iconos de marcas — se usa Link2 como fallback genérico
const GenericSocialIcon = Link2;

export default async function ContactoPage() {
  let socialNetworks: SocialNetwork[] = [];

  try {
    socialNetworks = await getSocialNetworks();
  } catch {
    // Si falla, la página sigue funcionando sin redes sociales
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contáctanos — InduMex',
            url: 'https://indumex.blog/contacto',
            description: 'Formulario de contacto y canales de comunicación de InduMex.',
            mainEntity: {
              '@type': 'Organization',
              name: 'InduMex',
              url: 'https://indumex.blog',
              email: 'contacto@indumex.blog',
            },
          }),
        }}
      />

      <div className="min-h-screen bg-[#010b17]">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-white/10">
          {/* Grid pattern */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          {/* Blue accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ background: '#004AAD' }}
          />

          <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F58634] mb-4">
              <span className="w-6 h-px bg-[#F58634]" />
              Contacto
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Contáctanos
            </h1>
            <p className="text-lg text-white/50 max-w-2xl leading-relaxed">
              Si deseas ponerte en contacto con InduMex puedes hacerlo a través de correo electrónico{' '}
              <a
                href="mailto:contacto@indumex.blog"
                className="text-[#F58634] hover:underline font-semibold"
              >
                contacto@indumex.blog
              </a>{' '}
              o llenando el siguiente formulario. Estamos aquí para atenderte y resolver todas tus dudas.
            </p>
          </div>
        </section>

        {/* ── Main content ── */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Left column — info + social */}
            <aside className="lg:col-span-2 space-y-8">
              {/* Contact info card */}
              <div className="bg-[#021325] border border-white/10 rounded-2xl p-8 space-y-6">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Información de Contacto
                </h2>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#004AAD]/10 border border-[#004AAD]/20 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-[#004AAD]" />
                    </span>
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-0.5">Correo</p>
                      <a
                        href="mailto:contacto@indumex.blog"
                        className="text-sm text-white hover:text-[#F58634] transition-colors"
                      >
                        contacto@indumex.blog
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#004AAD]/10 border border-[#004AAD]/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-[#004AAD]" />
                    </span>
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-0.5">Ubicación</p>
                      <p className="text-sm text-white">México</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Advertise CTA card */}
              <div className="bg-[#021325] border border-[#F58634]/20 rounded-2xl p-8 space-y-4 relative overflow-hidden">
                <div aria-hidden className="pointer-events-none absolute -bottom-8 -right-8 opacity-5">
                  <Megaphone className="w-32 h-32 text-[#F58634]" />
                </div>
                <div className="flex items-center gap-3 relative z-10">
                  <span className="w-8 h-8 rounded-lg bg-[#F58634]/10 border border-[#F58634]/20 flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-[#F58634]" />
                  </span>
                  <h2 className="text-base font-bold text-white">Anúnciate con nosotros</h2>
                </div>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  También puedes anunciarte con nosotros. Consulta todos los detalles de nuestros planes y
                  diferentes formas de llegar a miles de profesionales del sector industrial.
                </p>
                <Link
                  href="/media-kits"
                  className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#F58634] text-black hover:bg-[#e5762a] active:scale-[0.98] transition-all duration-150"
                >
                  Ver planes de publicidad
                  <ExternalLink size={14} />
                </Link>
              </div>

              {/* Social networks */}
              {socialNetworks.length > 0 && (
                <div className="bg-[#021325] border border-white/10 rounded-2xl p-8 space-y-4">
                  <h2 className="text-base font-bold text-white tracking-tight">Síguenos</h2>
                  <div className="flex flex-wrap gap-3">
                    {socialNetworks.map((social) => (
                        <a
                          key={social.id}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={social.nombre}
                          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#F58634]/40 hover:bg-[#F58634]/5 transition-all duration-200"
                          aria-label={`Ir a ${social.nombre}`}
                        >
                          <GenericSocialIcon className="w-4 h-4 text-white/60 group-hover:text-[#F58634] transition-colors" />
                          <span className="text-xs font-semibold text-white/60 group-hover:text-white transition-colors">
                            {social.nombre}
                          </span>
                        </a>
                      ))}
                  </div>
                </div>
              )}
            </aside>

            {/* Right column — form */}
            <div className="lg:col-span-3">
              <div className="bg-[#021325] border border-white/10 rounded-2xl p-8">
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white tracking-tight mb-1">
                    Envíanos un mensaje
                  </h2>
                  <p className="text-sm text-white/40">
                    Todos los campos marcados con <span className="text-[#F58634]">*</span> son obligatorios.
                  </p>
                </div>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
