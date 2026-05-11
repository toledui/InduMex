'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Share2, Bookmark, Volume2, Maximize, Activity, Cpu, ArrowUpRight, Play } from 'lucide-react';

const issueData = {
  metadata: {
    issueNumber: '01',
    month: 'Mayo',
    year: '2026',
    theme: 'AUTO/MATION',
  },
  cover: {
    headline: 'CÓDIGO',
    headlinePart2: 'MÁQUINA',
    subheadline:
      'La IA generativa y la robótica avanzada reescriben las reglas de la manufactura en México.',
    image:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000',
    author: 'Roberto Silva',
  },
  article: {
    title: 'El Despertar de los Gemelos Digitales',
    intro:
      'La adopción tecnológica ya no es un diferenciador, es un requisito de supervivencia biológica para las empresas.',
    dataPoint: '35%',
    dataContext:
      'Incremento en eficiencia operativa en las líneas de ensamble tras la adopción de modelos predictivos.',
    quote:
      'No estamos reemplazando al operador; estamos elevando su intelecto a supervisor de algoritmos.',
    quoteAuthor: 'Dra. Elena Rosas, Directora de Innovación',
    image1:
      'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&q=80&w=1200',
    image2:
      'https://images.unsplash.com/photo-1531604250646-2f0e818c4f06?auto=format&fit=crop&q=80&w=1200',
  },
  news: [
    {
      id: 1,
      category: 'Nearshoring',
      title: 'Querétaro consolida su hub logístico automatizado',
      excerpt:
        'Nuevas inversiones en el corredor industrial de El Marqués integran sistemas 3PL impulsados por agentes de IA.',
      date: '10 MAY',
    },
    {
      id: 2,
      category: 'Robótica',
      title: 'Nuevos protocolos de soldadura colaborativa',
      excerpt:
        'La integración de celdas KUKA y Yaskawa con visión artificial reduce los tiempos de ciclo en un 22% en la industria automotriz.',
      date: '08 MAY',
    },
    {
      id: 3,
      category: 'Sistemas Core',
      title: 'La muerte del ERP monolítico tradicional',
      excerpt:
        'Empresas B2B migran hacia arquitecturas modulares y conexiones Headless para escalar sus ventas digitales.',
      date: '05 MAY',
    },
  ],
};

export default function InduMexMagazine() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringLink, setIsHoveringLink] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setReadProgress(progress);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Space+Grotesk:wght@300;400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-[#0a0a0a] pt-24 text-slate-200 font-['Space_Grotesk',sans-serif] selection:bg-[#F58634] selection:text-white md:pt-28">
      <div
        className="fixed left-0 top-0 z-100 hidden h-8 w-8 items-center justify-center rounded-full bg-white mix-blend-difference transition-transform duration-200 ease-out lg:flex pointer-events-none"
        style={{ transform: `translate(${mousePosition.x - 16}px, ${mousePosition.y - 16}px) scale(${isHoveringLink ? 2.5 : 1})` }}
      >
        {isHoveringLink && <span className="text-[4px] font-bold uppercase tracking-widest text-black">Ver</span>}
      </div>

      <div className="fixed bottom-8 right-8 z-50 hidden items-center justify-center mix-blend-difference md:flex">
        <svg className="h-16 w-16 -rotate-90 transform">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" fill="none" className="text-gray-600 opacity-30" />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-white transition-all duration-300 ease-out"
            strokeDasharray="175.9"
            strokeDashoffset={175.9 - (175.9 * readProgress) / 100}
          />
        </svg>
        <span className="absolute text-[10px] font-bold text-white">{Math.round(readProgress)}%</span>
      </div>

      <section className="relative flex h-[120vh] w-full items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0 h-full w-full"
          style={{ transform: `scale(${1 + scrollY * 0.0005}) translateY(${scrollY * 0.2}px)` }}
        >
          <img src={issueData.cover.image} alt="Cover" className="h-full w-full object-cover opacity-50 grayscale transition-all duration-1000 hover:grayscale-0" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]" />
        </div>

        <div className="relative z-10 flex w-full flex-col items-center justify-center px-4 text-white mix-blend-overlay">
          <h1 className="whitespace-nowrap text-center font-['Syncopate'] text-[12vw] font-bold leading-[0.8] tracking-tighter uppercase" style={{ transform: `translateX(${scrollY * -0.5}px)` }}>
            {issueData.cover.headline}
          </h1>
          <h1 className="text-transparent whitespace-nowrap text-center font-['Syncopate'] text-[12vw] font-bold leading-[0.8] tracking-tighter uppercase" style={{ WebkitTextStroke: '2px white', transform: `translateX(${scrollY * 0.5}px)` }}>
            {issueData.cover.headlinePart2}
          </h1>
        </div>

        <div className="absolute bottom-32 z-20 mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-6 md:grid-cols-12">
          <div className="md:col-span-5 flex flex-col justify-end">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px w-12 bg-[#F58634]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#F58634]">Tema Central</span>
            </div>
            <p className="text-xl font-light leading-snug text-white/90 md:text-2xl">{issueData.cover.subheadline}</p>
          </div>
          <div className="md:col-span-4 md:col-start-9 flex items-end justify-end">
            <button
              onMouseEnter={() => setIsHoveringLink(true)}
              onMouseLeave={() => setIsHoveringLink(false)}
              className="flex items-center gap-4 group"
              type="button"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 transition-all duration-500 group-hover:border-white group-hover:bg-white group-hover:text-black">
                <Play className="ml-1 h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="block text-xs uppercase tracking-widest text-gray-400">Audio Artículo</span>
                <span className="block text-sm font-bold uppercase tracking-wider text-white">Escuchar (12 min)</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      <div className="relative z-20 flex overflow-hidden border-y border-[#F58634]/20 bg-[#F58634] py-12 text-black">
        <div className="animate-[marquee_20s_linear_infinite] flex items-center gap-8 font-['Syncopate'] text-4xl font-bold uppercase tracking-tighter">
          <span>{issueData.metadata.theme}</span> <span>///</span>
          <span>REVOLUCIÓN INDUSTRIAL 4.0</span> <span>///</span>
          <span>{issueData.metadata.theme}</span> <span>///</span>
          <span>INTELIGENCIA B2B</span> <span>///</span>
        </div>
      </div>

      <section className="border-b border-white/10 px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
                <h2 className="font-['Syncopate'] text-3xl font-bold uppercase tracking-tighter text-white md:text-5xl">
                  Radar <span className="bg-linear-to-r from-[#004AAD] to-[#F58634] bg-clip-text text-transparent">Industrial</span>
                </h2>
              <p className="mt-4 text-lg font-light text-gray-400">Movimientos estratégicos en la manufactura nacional.</p>
            </div>
            <button type="button" className="flex items-center gap-2 border-b border-[#F58634] pb-1 text-xs font-bold uppercase tracking-widest text-[#F58634] transition-colors hover:border-white hover:text-white">
              Ver todo el archivo <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {issueData.news.map((item) => (
              <article key={item.id} className="group cursor-pointer">
                <div className="relative mb-6 h-px w-full overflow-hidden bg-white/10 group-hover:bg-[#004AAD] transition-colors duration-500">
                  <div className="absolute left-0 top-0 h-full w-0 bg-[#F58634] transition-all duration-700 ease-out group-hover:w-full" />
                </div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-sm border border-[#F58634]/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#F58634]">{item.category}</span>
                  <span className="text-xs font-bold tracking-widest text-gray-500">{item.date}</span>
                </div>
                <h3 className="mb-3 text-xl font-bold leading-snug text-white transition-colors group-hover:text-[#F58634] font-['Space_Grotesk']">{item.title}</h3>
                <p className="mb-6 text-sm leading-relaxed font-light text-gray-400 line-clamp-3">{item.excerpt}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <div className="sticky top-32">
              <div className="mb-16">
                <span className="mb-2 block text-xs uppercase tracking-widest text-gray-500">Por</span>
                <span className="block text-lg font-bold text-white">{issueData.cover.author}</span>
                <span className="mt-1 block text-xs uppercase tracking-wider text-[#F58634]">Editor Senior</span>
              </div>

              <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#111] p-8">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#004AAD] opacity-20 blur-[50px] transition-opacity group-hover:opacity-50" />
                <Activity className="relative z-10 mb-6 h-6 w-6 text-[#F58634]" />
                <div className="relative z-10 mb-4 font-['Syncopate'] text-6xl font-bold tracking-tighter text-white">
                  {issueData.article.dataPoint}
                </div>
                <p className="relative z-10 text-sm leading-relaxed font-light text-gray-400">{issueData.article.dataContext}</p>
              </div>

              <div className="mt-12 flex gap-4">
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-black"><Share2 className="h-4 w-4" /></button>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-black"><Bookmark className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 lg:pl-8">
            <h2 className="mb-12 text-4xl font-bold leading-[1.1] tracking-tight text-white uppercase font-['Syncopate'] lg:text-5xl">
              {issueData.article.title}
            </h2>

            <div className="prose prose-invert max-w-none text-gray-300 prose-lg font-light leading-relaxed">
              <p className="mb-12 text-xl font-normal text-white md:text-2xl">
                <span className="float-left pr-4 pt-2 text-7xl font-['Syncopate'] font-bold leading-[0.8] text-[#F58634]">L</span>
                {issueData.article.intro}
              </p>

              <p className="mb-8">
                Históricamente, las fábricas operaban bajo un modelo reactivo. Una celda de soldadura fallaba, la línea se detenía, los ingenieros diagnosticaban. Hoy, el concepto de "Gemelo Digital" ha transformado ese piso de producción en un flujo de datos vivo, palpitante y predictivo.
              </p>

              <figure className="relative z-10 my-16 w-full overflow-hidden rounded-xl border border-white/10">
                <img src={issueData.article.image1} alt="Ingeniería" className="h-[60vh] w-full object-cover grayscale transition-all duration-700 hover:scale-105 hover:grayscale-0" />
                <figcaption className="mt-3 text-right text-xs uppercase tracking-widest text-gray-500">Centro de Control Inteligente</figcaption>
              </figure>

              <p className="mb-8">
                Al integrar sensores IoT con la robótica industrial, los gerentes de planta ahora "conversan" con sus líneas de ensamblaje. Pueden preguntar a sus sistemas: <em>"¿Cuál es la probabilidad de que la estación 4 requiera mantenimiento esta semana?"</em> y obtener una respuesta exacta basada en algoritmos.
              </p>

              <blockquote className="my-16 relative rounded-r-2xl border-l-4 border-[#F58634] bg-white/5 p-8">
                <Volume2 className="absolute -left-12 top-8 hidden h-6 w-6 text-gray-700 md:block" />
                <p className="mb-6 font-['Syncopate'] text-2xl font-bold leading-tight uppercase tracking-tighter text-white md:text-3xl">
                  "{issueData.article.quote}"
                </p>
                <footer className="text-sm font-bold uppercase tracking-widest text-[#F58634]">— {issueData.article.quoteAuthor}</footer>
              </blockquote>

              <p>
                El verdadero desafío no radica en la compra de hardware, sino en la reestructuración cultural y la integración de sistemas. Las empresas deben conectar sus operaciones de piso con sus sistemas de gestión (ERPs) para tener visibilidad total y en tiempo real de su rentabilidad.
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="mt-32 flex flex-col gap-12">
              <div className="group relative h-100 w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10">
                <div className="absolute inset-0 z-10 bg-[#004AAD] opacity-50 mix-blend-multiply transition-opacity group-hover:opacity-0" />
                <img src={issueData.article.image2} alt="Robotica" className="absolute inset-0 h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0" />
                <div className="absolute bottom-4 left-4 z-20">
                  <Maximize className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-[#F58634]/30 bg-[#111] p-8 transition-colors hover:border-[#F58634] cursor-pointer">
                <div className="absolute inset-0 bg-linear-to-br from-[#F58634]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="mb-4 block border-b border-gray-800 pb-2 text-[10px] uppercase tracking-widest text-gray-500">Masterclass B2B</span>
                <h4 className="mb-4 font-['Syncopate'] text-xl font-bold uppercase tracking-tighter text-white">
                  Atracción de Clientes Industriales
                </h4>
                <p className="mb-6 text-sm font-light text-gray-400">
                  Estrategias avanzadas para posicionar tu marca técnica frente a tomadores de decisión.
                </p>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F58634] transition-all group-hover:gap-4">
                  Inscribirse Ahora <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#050505] py-24 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-150 w-150 rounded-full bg-[#004AAD]/10 blur-[120px] pointer-events-none" />
        <div className="mx-auto max-w-250 px-6 relative z-10">
          <div className="mb-12 flex items-center gap-4 border-b border-white/10 pb-6">
            <Cpu className="h-8 w-8 text-[#004AAD]" />
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold uppercase tracking-widest text-white">
              Columna Tecnológica
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm md:p-12">
            <h3 className="mb-6 font-['Syncopate'] text-3xl font-bold uppercase tracking-tighter text-white">
              Sistemas Headless y la Nueva Velocidad de Ventas
            </h3>
            <p className="mb-8 text-lg font-light leading-relaxed text-gray-300">
              Mientras las plantas modernizan su piso de producción, sus departamentos de ventas siguen atrapados en portales web lentos. La adopción de arquitecturas desacopladas (Headless) conectadas directamente a sistemas ERP permite una experiencia de usuario fulminante, capturando la atención del comprador técnico en milisegundos. La velocidad del software ahora dictamina la velocidad del cierre de contratos.
            </p>
            <div className="flex items-center justify-between border-t border-white/10 pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-gray-800">
                  <img src="https://secure.gravatar.com/avatar/81439413f57c3375c6b028e24801ca5b37faf654444df83a49c3221d8f515806?s=200&d=mm&r=g" alt="Autor" className="h-full w-full object-cover grayscale" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">El Consejo Editorial</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#004AAD]">Tecnología y Estrategia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex h-screen items-center justify-center overflow-hidden border-t border-white/10 bg-[#111] text-white group cursor-pointer"
        onMouseEnter={() => setIsHoveringLink(true)}
        onMouseLeave={() => setIsHoveringLink(false)}
      >
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=2000" className="h-full w-full object-cover opacity-20 grayscale transition-all duration-[2s] group-hover:scale-105 group-hover:grayscale-0" alt="Next article" />
        </div>
        <div className="relative z-10 text-center text-white">
          <span className="mb-8 block text-sm font-bold uppercase tracking-[0.5em] text-[#F58634]">Siguiente Artículo</span>
          <h2 className="mb-8 font-['Syncopate'] text-5xl font-bold uppercase tracking-tighter group-hover:text-transparent group-hover:[-webkit-text-stroke:2px_white] transition-all duration-500 md:text-8xl">
            Hidrógeno<br />Verde
          </h2>
          <div className="inline-flex items-center gap-4 border-b-2 border-white pb-2 font-bold uppercase tracking-widest transition-colors group-hover:border-[#F58634] group-hover:text-[#F58634]">
            Comenzar lectura <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-\\[marquee_20s_linear_infinite\\] {
          animation: marquee 20s linear infinite;
        }
      `}} />
    </div>
  );
}