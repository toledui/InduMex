import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// ==========================================
// MOCK DATA (Simulando la Base de Datos)
// ==========================================
const currentEdition = {
  issueNumber: '01',
  month: 'Mayo',
  year: '2026',
  theme: 'AUTO/MATION',
  slug: '/revista/mayo-2026',
  title: 'Código Máquina',
  description: 'La IA generativa y la robótica avanzada reescriben las reglas de la manufactura en México. Un análisis profundo sobre los Gemelos Digitales y la hiper-conectividad industrial.',
  coverImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800'
};

const pastEditions = [
  {
    id: '00', // Edición "Cero" o piloto
    issueNumber: '00',
    month: 'Abril',
    year: '2026',
    theme: 'NEARSHORING',
    slug: '#',
    coverImage: 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: '0-1',
    issueNumber: 'Beta 2',
    month: 'Marzo',
    year: '2026',
    theme: 'LOGÍSTICA 4.0',
    slug: '#',
    coverImage: 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: '0-2',
    issueNumber: 'Beta 1',
    month: 'Febrero',
    year: '2026',
    theme: 'ENERGÍA',
    slug: '#',
    coverImage: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: '0-3',
    issueNumber: 'Alpha',
    month: 'Enero',
    year: '2026',
    theme: 'SUPPLY CHAIN',
    slug: '#',
    coverImage: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600'
  }
];

// ==========================================
// SEO METADATA
// ==========================================
export const metadata: Metadata = {
  title: 'Revista InduMex | El Acervo de Inteligencia Industrial',
  description: 'Explora nuestro archivo de ediciones inmersivas. Análisis profundo, tendencias de manufactura, robótica y automatización para líderes B2B en México.',
  alternates: {
    canonical: 'https://indumex.blog/revista',
  },
  openGraph: {
    title: 'Revista InduMex | Inteligencia Editorial',
    description: 'Perspectivas y casos de estudio que dictan el futuro de la manufactura avanzada y la cadena de suministro.',
    url: 'https://indumex.blog/revista',
    siteName: 'InduMex',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revista InduMex | Inteligencia Editorial',
    description: 'Análisis profundo, tendencias de manufactura y automatización para líderes B2B.',
  }
};

export default function RevistaPage() {
  return (
    <main className="bg-[#021325] min-h-screen text-slate-200 font-['Space_Grotesk',sans-serif] selection:bg-[#F58634] selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 pt-32 pb-20 sm:pt-40 sm:pb-24">
        {/* Fondos y Ruido */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,74,173,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(245,134,52,0.1),transparent_30%)]" />
        <div className="absolute inset-0 z-0 opacity-[0.02] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        
        <div className="relative z-10 mx-auto max-w-350">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-[#F58634]">
            Publicaciones B2B
          </p>
          <h1 className="max-w-4xl font-['Syncopate'] text-4xl font-bold uppercase tracking-tighter text-white sm:text-6xl lg:text-7xl leading-[1.1]">
            Inteligencia <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#004AAD] to-[#6ea8ff]">Editorial.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-gray-400 font-light">
            Perspectivas, casos de estudio y análisis profundo que dictan el futuro de la manufactura avanzada y la cadena de suministro.
          </p>
        </div>
      </section>

      {/* 2. EDICIÓN EN CURSO (Destacada) */}
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-350">
          <div className="mb-10 flex items-center gap-4 border-b border-white/10 pb-6">
            <div className="h-2 w-2 rounded-full bg-[#F58634] animate-pulse"></div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              Edición en Curso
            </h2>
          </div>

          <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#031c38] shadow-2xl relative group">
            {/* Glow effect sutil en hover */}
            <div className="absolute inset-0 bg-linear-to-r from-[#004AAD]/0 via-[#004AAD]/5 to-[#F58634]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
              
              {/* Portada Izquierda */}
              <div className="lg:col-span-5 relative aspect-3/4 lg:aspect-auto overflow-hidden bg-black">
                <img 
                  src={currentEdition.coverImage} 
                  alt={`Portada Edición ${currentEdition.issueNumber}`} 
                  className="absolute inset-0 w-full h-full object-cover grayscale opacity-80 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#111] via-transparent to-transparent lg:bg-linear-to-r"></div>
                {/* Etiqueta flotante */}
                <div className="absolute top-6 left-6 bg-[#F58634] text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                  Nuevo
                </div>
              </div>

              {/* Información Derecha */}
              <div className="lg:col-span-7 p-10 lg:p-16 flex flex-col justify-center relative z-10">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#004AAD] border border-[#004AAD]/30 px-3 py-1 rounded-sm">
                    Edición {currentEdition.issueNumber}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                    {currentEdition.month} {currentEdition.year}
                  </span>
                </div>
                
                <h3 className="font-['Syncopate'] text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tighter text-white leading-[0.9] mb-6">
                  {currentEdition.theme}
                </h3>
                <h4 className="text-2xl text-white font-light mb-6 border-l-2 border-[#F58634] pl-4">
                  {currentEdition.title}
                </h4>
                
                <p className="text-gray-400 leading-relaxed font-light mb-12 max-w-xl text-lg">
                  {currentEdition.description}
                </p>

                <Link
                  href={currentEdition.slug}
                  className="inline-flex items-center justify-center gap-3 w-fit bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#F58634] transition-colors"
                >
                  Leer Edición Actual <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </article>
        </div>
      </section>

      {/* 3. ACERVO HISTÓRICO (Grid) */}
      <section className="px-6 py-20 border-t border-white/5 bg-[#010b17]">
        <div className="mx-auto max-w-350">
          <div className="mb-12 flex items-center justify-between border-b border-white/10 pb-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              Acervo Histórico
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-gray-500">
              Colección Protegida
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {pastEditions.map((edition) => (
              <Link href="/revista/mayo-2026" key={edition.id} className="group block">
                <article className="relative bg-[#031c38] border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 hover:border-[#004AAD]/50 hover:shadow-2xl hover:shadow-[#004AAD]/10">
                  {/* Imagen de Portada (Vertical 3/4) */}
                  <div className="relative w-full aspect-3/4 overflow-hidden bg-black">
                    <img 
                      src={edition.coverImage} 
                      alt={`Portada Edición ${edition.issueNumber}`} 
                      className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:scale-110 group-hover:grayscale-0 group-hover:opacity-90 transition-all duration-[1.5s] ease-out"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#111] via-transparent to-transparent opacity-80"></div>
                    
                    {/* Badge de Edición */}
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur border border-white/10 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm">
                      ED — {edition.issueNumber}
                    </div>
                  </div>

                  {/* Datos del pie de tarjeta */}
                  <div className="p-6 relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F58634] mb-2">
                      {edition.month} {edition.year}
                    </p>
                    <h3 className="font-['Syncopate'] text-xl font-bold uppercase tracking-tighter text-white group-hover:text-[#004AAD] transition-colors leading-tight">
                      {edition.theme}
                    </h3>
                  </div>
                </article>
              </Link>
            ))}
          </div>

        </div>
      </section>
    </main>
  );
}