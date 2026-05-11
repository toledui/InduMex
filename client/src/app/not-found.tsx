import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-4 pb-16 pt-32 text-center sm:px-6 sm:pt-36 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F58634]">Error 404</p>
      <h1 className="mt-3 font-['Rubik'] text-4xl font-black text-white sm:text-5xl">
        Pagina no encontrada
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
        La ruta que intentas visitar no existe o fue movida.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-full bg-[#F58634] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-black transition-colors hover:bg-[#e5762a]"
      >
        Volver al inicio
      </Link>
    </main>
  );
}