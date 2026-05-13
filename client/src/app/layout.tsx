import type { Metadata } from "next";
import SiteChrome from "@/components/SiteChrome";
import ChatWidget from "@/components/ChatWidget";
import "./globals.css";

export const metadata: Metadata = {
  title: "InduMex 2.0 | Revista Digital Industrial",
  description:
    "Plataforma B2B de inteligencia industrial. Análisis técnico, directorio de proveedores y marketplace para la manufactura mexicana.",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png" },
    ],
    other: [
      { rel: "manifest", url: "/favicon/site.webmanifest" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <meta name="theme-color" content="#004AAD" />
      </head>
      <body className="min-h-full bg-[#021325] text-slate-200 font-['Space_Grotesk'] selection:bg-[#F58634] selection:text-white overflow-x-hidden">
        <SiteChrome>{children}</SiteChrome>
        <ChatWidget />
      </body>
    </html>
  );
}
