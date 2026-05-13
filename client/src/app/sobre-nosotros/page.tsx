import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Heart, ShieldCheck, Target, TrendingUp, Users, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | InduMex 2.0 - Inteligencia Industrial',
  description:
    'Conoce la misión de InduMex: conectar la oferta y demanda técnica de la manufactura en México, impulsando la transformación digital y apoyando causas sociales.',
  alternates: {
    canonical: 'https://indumex.blog/sobre-nosotros',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'Sobre Nosotros | InduMex 2.0',
    description:
      'Transformando la industria manufacturera en México a través de inteligencia B2B, automatización y un fuerte compromiso social.',
    url: 'https://indumex.blog/sobre-nosotros',
    siteName: 'InduMex',
    locale: 'es_MX',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200',
        width: 1200,
        height: 630,
        alt: 'Equipo y misión de InduMex',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre Nosotros | InduMex 2.0',
    description:
      'Transformando la industria manufacturera en México a través de inteligencia B2B y compromiso social.',
    images: ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200'],
  },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{children}</h2>;
}

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#021325] text-slate-200 selection:bg-[#F58634] selection:text-white">
      <section className="relative overflow-hidden border-b border-white/5 pt-40 pb-20">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #004AAD 0%, transparent 50%)' }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-300 px-6 text-center">
          <span className="mb-6 block text-xs font-bold uppercase tracking-[0.3em] text-[#F58634]">
            Nuestra Misión
          </span>
          <h1 className="mb-8 text-4xl font-black uppercase leading-tight tracking-tighter text-white md:text-6xl lg:text-7xl">
            Conectando el <br />
            <span className="bg-linear-to-r from-[#004AAD] to-[#F58634] bg-clip-text text-transparent">
              Músculo Industrial
            </span>{' '}
            <br />
            de México.
          </h1>
          <p className="mx-auto max-w-3xl text-lg font-light leading-relaxed text-gray-400 md:text-xl">
            No somos solo una revista. Somos el ecosistema digital diseñado para que la industria 4.0,
            la manufactura y los proveedores técnicos hagan negocios sin fricción.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-300 px-6 py-24">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionTitle>El Manifiesto B2B</SectionTitle>
            <div className="mb-8 mt-6 h-1 w-12 bg-[#F58634]" />
            <div className="space-y-6 text-lg leading-relaxed text-gray-300">
              <p>
                La industria mexicana está experimentando una evolución sin precedentes impulsada por
                el nearshoring y la automatización. Sin embargo, encontrar al proveedor adecuado o
                justificar una inversión técnica sigue siendo un proceso lento, analógico y burocrático.
              </p>
              <p>
                <strong className="text-white">InduMex nace para destruir esa latencia.</strong>{' '}
                Creemos que la información técnica de alto valor debe ser accesible, los proveedores
                verificados deben estar a un clic de distancia, y las decisiones de ingeniería deben
                respaldarse con datos financieros claros.
              </p>
              <p>
                Filtramos el ruido comercial para entregar{' '}
                <strong className="text-white">inteligencia pura</strong> a directores de planta,
                ingenieros y gerentes de compras.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10">
              <div className="absolute inset-0 z-10 bg-linear-to-tr from-[#004AAD]/40 to-transparent mix-blend-overlay" />
              <Image
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000"
                alt="Ingeniería y Tecnología Industrial"
                fill
                priority
                className="object-cover grayscale transition-all duration-700 hover:scale-105 hover:grayscale-0"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            <div className="absolute -bottom-8 -left-8 hidden rounded-xl border border-white/10 bg-[#031c38] p-6 shadow-2xl md:block">
              <TrendingUp className="mb-3 h-8 w-8 text-[#F58634]" />
              <p className="text-lg font-bold leading-tight text-white">
                Impulsando el
                <br />
                ROI Técnico
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-white/5 bg-[#031c38] py-24">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[#004AAD]/5 blur-[120px]" aria-hidden />
        <div className="relative z-10 mx-auto max-w-250 px-6 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10">
            <Heart className="h-10 w-10 text-rose-500" />
          </div>
          <h2 className="mb-6 text-3xl font-black uppercase tracking-tighter text-white md:text-5xl">
            Propósito Más Allá del B2B
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl font-light leading-relaxed text-gray-300">
            Transformar la industria significa cuidar el futuro de quienes la heredarán. En InduMex
            tenemos un compromiso inquebrantable con nuestra sociedad.
          </p>
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-black/50 p-8 backdrop-blur-sm md:p-12">
            <p className="text-2xl font-light leading-snug text-white">
              Destinamos el <strong className="font-bold text-[#F58634]">5% de todos nuestros ingresos comerciales</strong>{' '}
              a fundaciones que otorgan tratamiento médico especializado a niños con cáncer en México.
            </p>
            <p className="mt-6 text-sm font-bold uppercase tracking-widest text-gray-500">
              Cada patrocinio y suscripción ayuda a salvar vidas.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-300 px-6 py-24">
        <div className="mb-16 text-center">
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.3em] text-[#004AAD]">
            Liderazgo
          </span>
          <SectionTitle>Quienes construyen la Inteligencia</SectionTitle>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          <div className="group rounded-2xl border border-white/10 bg-[#031c38] p-8 transition-colors hover:border-[#F58634]/50">
            <div className="mb-6 flex items-center gap-6">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#031c38]">
                <Image
                  src="https://secure.gravatar.com/avatar/81439413f57c3375c6b028e24801ca5b37faf654444df83a49c3221d8f515806?s=200&d=mm&r=g"
                  alt="Luis Toledo"
                  width={200}
                  height={200}
                  className="h-full w-full object-cover grayscale transition-all group-hover:grayscale-0"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Luis Toledo</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#F58634]">
                  Director de Tecnología y Estrategia
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Desarrollador full-stack y estratega de marketing digital especializado en el sector B2B.
              Aporta una visión que fusiona arquitectura de software de alto rendimiento con estrategias
              de captación de leads industriales para la manufactura en el Bajío y a nivel nacional.
            </p>
          </div>

          <div className="group rounded-2xl border border-white/10 bg-[#031c38] p-8 transition-colors hover:border-[#004AAD]/50">
            <div className="mb-6 flex items-center gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#031c38]">
                <Users className="h-8 w-8 text-[#004AAD]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Red de Especialistas</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#004AAD]">
                  Ingenieros y Consultores
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Nuestros análisis sectoriales y guías financieras no están escritos por redactores
              genéricos. Colaboramos con ingenieros de automatización, directores financieros y expertos
              en logística que viven el día a día en el piso de producción.
            </p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-linear-to-br from-[#004AAD] to-[#002255] py-20">
        <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden style={{ backgroundImage: 'radial-gradient(circle at 80% 80%, #ffffff 0%, transparent 40%)' }} />
        <div className="relative z-10 mx-auto max-w-200 px-6 text-center">
          <Zap className="mx-auto mb-6 h-12 w-12 text-[#F58634]" />
          <h2 className="mb-6 text-3xl font-black uppercase tracking-tighter text-white md:text-4xl">
            Únete a la Evolución Industrial
          </h2>
          <p className="mb-10 text-lg font-light text-white/80">
            Ya sea que busques posicionar tu maquinaria en nuestro Directorio B2B, o quieras recibir
            nuestra inteligencia de mercado mensual.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/media-kit"
              className="w-full rounded-lg bg-[#F58634] px-8 py-4 text-center text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-white sm:w-auto"
            >
              Anúnciate con Nosotros
            </Link>
            <Link
              href="/contacto"
              className="w-full rounded-lg border-2 border-white/30 px-8 py-4 text-center text-xs font-bold uppercase tracking-widest text-white transition-colors hover:border-white hover:bg-white/10 sm:w-auto"
            >
              Contactar al Equipo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}