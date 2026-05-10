import { HeartHandshake, Twitter, Linkedin, Facebook, Instagram, Youtube, Github } from "lucide-react";
import { getSocialNetworks, SocialNetwork } from "@/lib/api";

// Mapeo de nombres de iconos a componentes
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Github,
};

export default async function Footer() {
  let socialNetworks: SocialNetwork[] = [];
  
  try {
    socialNetworks = await getSocialNetworks();
  } catch (error) {
    console.error("Error fetching social networks:", error);
    // Si hay error, el footer seguirá funcionando sin redes sociales
  }

  return (
    <footer className="mt-16 border-t border-[var(--indumex-primary)]/20 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Información principal */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--indumex-primary)]">
            InduMex 2.0 - Industria, innovacion y precision.
          </p>
          <p className="inline-flex max-w-4xl items-start gap-2 text-sm text-slate-600">
            <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-[var(--indumex-accent)]" />
            <span>
              En memoria de Aitana, mantenemos vivo el compromiso de donar y apoyar
              a ninos con cancer a traves de nuestras iniciativas y alianzas.
            </span>
          </p>
        </div>

        {/* Redes sociales */}
        {socialNetworks.length > 0 && (
          <div className="flex items-center gap-4 border-t border-slate-200 pt-6">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Síguenos:</span>
            <div className="flex flex-wrap items-center gap-3">
              {socialNetworks.map((social) => {
                const IconComponent = social.icono ? iconMap[social.icono] : null;
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.nombre}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-600 hover:bg-[var(--indumex-accent)] hover:text-white transition-all duration-200"
                    aria-label={`Ir a ${social.nombre}`}
                  >
                    {IconComponent ? (
                      <IconComponent className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{social.nombre.charAt(0)}</span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
