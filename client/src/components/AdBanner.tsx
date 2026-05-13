import type { Anuncio } from "@/lib/api";
import AdZoneSlider from "@/components/AdZoneSlider";

interface AdBannerProps {
  ads?: Anuncio[];
  className?: string;
  layout?: "card" | "wide";
}

export default function AdBanner({ ads = [], className = "", layout = "card" }: AdBannerProps) {
  return <AdZoneSlider ads={ads} zona="editorial-grid" layout={layout} className={`min-h-70 md:min-h-0 ${className}`} />;
}