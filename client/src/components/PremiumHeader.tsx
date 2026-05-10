import Link from "next/link";
import Image from "next/image";
export default function PremiumHeader() {
  return (
    <header
      className="fixed top-0 w-full z-50 border-b border-white/5"
      style={{ backdropFilter: "blur(20px)", backgroundColor: "rgba(10,10,10,0.85)" }}
      role="banner"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center shrink-0 hover:opacity-80 transition-opacity"
          aria-label="InduMex — Revista Industrial"
        >
          <Image
            src="/images/indumex-logo.svg"
            alt="InduMex"
            width={156}
            height={36}
            priority
            className="h-8 w-auto"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex gap-10 text-xs uppercase tracking-[0.2em] font-semibold text-white">
          {[
            { label: "Revista", href: "#" },
            { label: "Blog", href: "/blog" },
            { label: "Directorio B2B", href: "#" },
            { label: "Marketplace", href: "#" },
            { label: "Eventos", href: "#" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="hover:text-[#F58634] transition-colors relative group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#F58634] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </nav>

        {/* CTA Button */}
        <Link
          href="/#newsletter"
          className="text-xs uppercase tracking-widest font-bold border border-white/30 px-5 py-2 rounded-full text-white hover:bg-[#F58634] hover:border-[#F58634] hover:text-black transition-colors"
        >
          Suscribirse
        </Link>
      </div>
    </header>
  );
}
