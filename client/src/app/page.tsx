import type { Metadata } from "next";
import { getAllPosts, getPostsByCategory, type WordPressPostCard } from "@/lib/wordpress";
import { getAdsByZona, getMarketplaceCatalog, type MarketplaceCatalogProducto } from "@/lib/api";
import HeroSection from "@/components/HeroSection";
import TickerNews from "@/components/TickerNews";
import TrustBanner from "@/components/TrustBanner";
import PremiumAdSlider from "@/components/PremiumAdSlider";
import ProviderSearchWidget from "@/components/ProviderSearchWidget";
import EditorialGrid from "@/components/EditorialGrid";
import MarketplaceTeaser from "@/components/MarketplaceTeaser";
import TrainingTeaser from "@/components/TrainingTeaser";
import MediaKitTeaser from "@/components/MediaKitTeaser";
import NewsletterCapture from "@/components/NewsletterCapture";
import CTASection from "@/components/CTASection";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
} from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "InduMex 2.0 | Revista Digital Industrial",
  description:
    "Plataforma B2B de inteligencia industrial. Análisis técnico, directorio de proveedores y marketplace para la manufactura mexicana.",
  openGraph: {
    title: "InduMex 2.0 - Revista Digital Industrial",
    description:
      "Descubre reportajes a fondo, análisis de datos y entrevistas con los líderes que mueven la industria de México.",
    type: "website",
    url: "https://indumex.blog",
    siteName: "InduMex 2.0",
    images: [
      {
        url: "https://indumex.blog/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "InduMex 2.0",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InduMex 2.0",
    description: "Revista digital para la industria mexicana",
  },
};

export default async function Home() {
  let posts: WordPressPostCard[] = [];
  let marketplaceProducts: MarketplaceCatalogProducto[] = [];
  let trainingPosts: WordPressPostCard[] = [];
  let error: string = "";

  try {
    posts = await getAllPosts(12);
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "No se pudo consultar WordPress en este momento.";
    console.error("Error fetching posts:", err);
  }

  // Fetch en paralelo para no bloquear el render
  const [marketplaceCatalogRes, trainingPosts2, editorialAds] = await Promise.allSettled([
    getMarketplaceCatalog(),
    getPostsByCategory("capacitacion", 4),
    getAdsByZona("editorial-grid"),
  ]);

  if (marketplaceCatalogRes.status === 'fulfilled') {
    marketplaceProducts = [...marketplaceCatalogRes.value.productos]
      .sort((a, b) => Number(b.destacado) - Number(a.destacado))
      .slice(0, 8);
  }

  if (trainingPosts2.status === 'fulfilled') {
    trainingPosts = trainingPosts2.value;
  }

  const editorialAdsResolved = editorialAds.status === 'fulfilled' ? editorialAds.value : [];

  const hero = posts[0];
  const gridPosts = posts.slice(1, 6);

  return (
    <>
      <OrganizationJsonLd
        name="InduMex 2.0"
        url="https://indumex.blog"
        description="Revista digital técnica para la industria mexicana. Plataforma B2B de inteligencia industrial."
      />
      <WebSiteJsonLd
        name="InduMex 2.0"
        url="https://indumex.blog"
        description="Plataforma editorial de alto rendimiento conectada a WordPress por WPGraphQL"
      />

      {/* Hero Section */}
      {hero && <HeroSection post={hero} />}

      {/* Ticker de noticias */}
      <TickerNews />

      {/* Franja de Confianza B2B */}
      <TrustBanner />

      {/* Sponsor Showcase */}
      <PremiumAdSlider />

      {/* Provider Search Widget */}
      <ProviderSearchWidget />

      {/* Error Display */}
      {error && (
        <section className="max-w-400 mx-auto px-6 py-12">
          <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-6 text-sm text-red-200">
            <strong>Error:</strong> {error}
          </div>
        </section>
      )}

      {/* Editorial Grid */}
      {gridPosts.length > 0 && <EditorialGrid posts={gridPosts} editorialAds={editorialAdsResolved} />}

      {/* Marketplace Industrial */}
      <MarketplaceTeaser products={marketplaceProducts} />

      {/* Capacitación y Formación Directiva */}
      <TrainingTeaser posts={trainingPosts} />

      {/* Media Kits Publicitarios */}
      <MediaKitTeaser />

      {/* CTA Section */}
      <CTASection />
    </>
  );
}
