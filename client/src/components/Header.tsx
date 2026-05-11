import Link from "next/link";
import { Factory, Newspaper, CreditCard } from "lucide-react";
import { getCategories } from "@/lib/wordpress";

export default async function Header() {
  let categories: Array<{ id: string; name: string; slug: string; uri: string }> = [];

  try {
    categories = await getCategories(8);
  } catch {
    categories = [];
  }

  return (
    <header className="border-b border-[var(--indumex-primary)]/20 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="group inline-flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--indumex-primary)] text-white">
              <Factory className="h-5 w-5" />
            </span>
            <span className="font-heading text-2xl font-black tracking-tight text-[var(--indumex-primary)]">
              InduMex 2.0
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <p className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <Newspaper className="h-4 w-4 text-[var(--indumex-accent)]" />
              Revista tecnica industrial
            </p>
            <Link
              href="/media-kits"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[var(--indumex-accent)] hover:bg-[#e5762a] transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Media Kits</span>
            </Link>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Categorias principales">
          {categories.length === 0 ? (
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
              Sin categorias disponibles
            </span>
          ) : (
            categories.map((category) => (
              <Link
                key={category.id}
                href={`/${category.slug}`}
                className="rounded-full border border-[var(--indumex-primary)]/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--indumex-primary)] transition-colors hover:bg-[var(--indumex-primary)] hover:text-white"
              >
                {category.name}
              </Link>
            ))
          )}
        </nav>
      </div>
    </header>
  );
}
