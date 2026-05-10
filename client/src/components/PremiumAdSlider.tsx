import { getAdsByZona } from "@/lib/api";
import PremiumAdSliderClient from "@/components/PremiumAdSliderClient";

export default async function PremiumAdSlider() {
  const ads = await getAdsByZona("hero-slider");

  return <PremiumAdSliderClient ads={ads} />;
}
