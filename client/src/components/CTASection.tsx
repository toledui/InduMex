"use client";

export default function CTASection() {
  return (
    <section className="py-16 md:py-24 lg:py-32 relative border-t border-white/5 bg-[#004AAD] text-white overflow-hidden group cursor-pointer">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000"
          alt="Revista"
          className="w-full h-full object-cover opacity-10 group-hover:opacity-30 group-hover:scale-105 transition-all duration-[2s] mix-blend-overlay"
        />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        <div className="max-w-3xl">
          <span className="text-white/60 text-xs font-bold uppercase tracking-[0.3em] mb-6 block">
            Experiencia Inmersiva
          </span>
          <h2 className="font-['Space_Grotesk'] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tight leading-[0.9] mb-6 md:mb-8">
            Lee la Edición
            <br />
            Mensual
          </h2>
          <p className="text-base sm:text-xl text-white/80 font-light border-l-2 border-[#F58634] pl-4 sm:pl-6">
            Descubre reportajes a fondo, análisis de datos y entrevistas con los
            líderes que mueven la industria de México. Diseño 100% interactivo.
          </p>
        </div>

        <div className="flex-shrink-0">
          <div className="w-40 h-40 rounded-full border-2 border-white flex flex-col items-center justify-center group-hover:bg-white group-hover:text-[#004AAD] transition-colors duration-500">
            <span className="text-xs uppercase tracking-widest font-bold mb-2">
              Abrir
            </span>
            <span className="font-['Space_Grotesk'] text-2xl font-bold">Nº 45</span>
          </div>
        </div>
      </div>
    </section>
  );
}
