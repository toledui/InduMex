import type { Anuncio } from "@/lib/api";
import AdZoneSlider from "@/components/AdZoneSlider";

interface AdBannerProps {
  ads?: Anuncio[];
  className?: string;
}

export default function AdBanner({ ads = [], className = "" }: AdBannerProps) {
  return <AdZoneSlider ads={ads} zona="editorial-grid" className={`min-h-70 md:min-h-0 ${className}`} />;
}