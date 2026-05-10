"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Calendar,
  ChevronRight,
  Clock,
  Share2,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { WordPressPostCard, WordPressPostDetail } from "@/lib/wordpress";
import type { Anuncio } from "@/lib/api";
import AdZoneSlider from "@/components/AdZoneSlider";

type PostPremiumClientProps = {
  post: WordPressPostDetail;
  categorySlug: string;
  categoryName: string;
  readTime: string;
  publishedLabel: string;
  recommendedPosts: WordPressPostCard[];
  adsInContent?: Anuncio[];
  adsSidebar?: Anuncio[];
};

function stripHtml(html?: string) {
  const entityMap: Record<string, string> = {
    "&hellip;": "...",
    "&#8230;": "...",
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
    "&aacute;": "á",
    "&eacute;": "é",
    "&iacute;": "í",
    "&oacute;": "ó",
    "&uacute;": "ú",
    "&Aacute;": "Á",
    "&Eacute;": "É",
    "&Iacute;": "Í",
    "&Oacute;": "Ó",
    "&Uacute;": "Ú",
    "&ntilde;": "ñ",
    "&Ntilde;": "Ñ",
  };

  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, (entity) => entityMap[entity] || entity)
    .replace(/\[\s*\.\.\.\s*\]|\[\s*&hellip;\s*\]|\[\s*&#8230;\s*\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTags(post: WordPressPostDetail) {
  const categoryTags = post.categories?.nodes?.map((category) => category.name) || [];
  const titleWords = post.title
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((word) => word.length > 6)
    .slice(0, 2);

  return Array.from(new Set([...categoryTags, ...titleWords])).slice(0, 6);
}

export default function PostPremiumClient({
  post,
  categorySlug,
  categoryName,
  readTime,
  publishedLabel,
  recommendedPosts,
  adsInContent = [],
  adsSidebar = [],
}: PostPremiumClientProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = windowHeight > 0 ? totalScroll / windowHeight : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const excerptText = stripHtml(post.excerpt);
  const authorName = post.author?.node?.name || "InduMex Editorial";
  const authorRole = "Consejo Editorial";
  const authorAvatar = post.author?.node?.avatar?.url;
  const heroImage = post.featuredImage?.node?.sourceUrl;
  const heroAlt = post.featuredImage?.node?.altText || post.title;
  const tags = useMemo(() => extractTags(post), [post]);

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-slate-200 selection:bg-[#F58634] selection:text-white">
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-900 z-100">
        <div
          className="h-full bg-[#F58634] transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress * 100}%` }}
        ></div>
      </div>

      <div className="pt-32 pb-8 max-w-300 mx-auto px-6 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-300 font-bold">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#F58634]">{categoryName}</span>
          </div>

          <div className="flex items-center gap-6 text-[10px] uppercase tracking-widest text-gray-200 font-bold">
            <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {publishedLabel}</span>
            <span className="flex items-center gap-1.5 text-[#6ea8ff]"><Clock className="h-3 w-3" /> {readTime}</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl"
        >
          <h1 className="font-['Space_Grotesk'] text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-6">
            {post.title}
          </h1>
          {excerptText ? (
            <p className="text-xl text-slate-300 font-light leading-relaxed border-l-2 border-[#F58634] pl-6 mb-12">
              {excerptText}
            </p>
          ) : null}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="w-full h-[50vh] md:h-[65vh] relative mb-16 md:mb-24 bg-gray-900 border-y border-white/5"
      >
        <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-transparent to-transparent z-10"></div>
        {heroImage ? (
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            sizes="100vw"
            className="w-full h-full object-cover grayscale-30 opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#004AAD]/35 via-[#050505] to-[#F58634]/20" />
        )}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay z-20"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        ></div>
      </motion.div>

      <div className="max-w-300 mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 pb-32">
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-y border-white/10 mb-12 bg-white/5 px-6 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              {authorAvatar ? (
                <Image
                  src={authorAvatar}
                  alt={authorName}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full grayscale border border-white/20 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border border-white/20 bg-[#111] flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-[#F58634]" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-widest">{authorName}</p>
                <p className="text-xs text-[#F58634] uppercase tracking-widest">{authorRole}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-10 w-10 rounded-full border border-gray-700 flex items-center justify-center hover:bg-white hover:text-black transition-colors" aria-label="Guardar artículo">
                <Bookmark className="h-4 w-4" />
              </button>
              <button className="h-10 w-10 rounded-full border border-gray-700 flex items-center justify-center hover:bg-[#004AAD] hover:border-[#004AAD] hover:text-white transition-colors" aria-label="Compartir artículo">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className="prose-content max-w-none text-base text-slate-200"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <AdZoneSlider ads={adsInContent} zona="post-in-content" />

          <div className="mt-16 pt-8 border-t border-white/10">
            <h4 className="text-xs uppercase tracking-widest text-gray-300 font-bold mb-4">Etiquetas Industriales:</h4>
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <span key={tag} className="text-xs uppercase tracking-widest border border-gray-700 text-slate-300 px-4 py-2 rounded-full hover:border-white hover:text-white cursor-pointer transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 relative">
          <div className="sticky top-32 flex flex-col gap-10">
            <div className="bg-linear-to-br from-[#004AAD] to-[#002255] rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 opacity-20"><TrendingUp className="w-32 h-32 text-white" /></div>
              <h4 className="font-['Space_Grotesk'] font-bold text-white text-xl mb-4 relative z-10">Conecta con +15,000 Directivos</h4>
              <p className="text-white/80 text-sm font-light mb-6 relative z-10">Posiciona tu maquinaria, software o servicios industriales frente a los tomadores de decisión.</p>
              <button className="w-full bg-white text-[#004AAD] text-xs uppercase tracking-widest font-bold px-6 py-4 rounded-xl hover:bg-[#F58634] hover:text-white transition-all relative z-10">
                Descargar Media Kit
              </button>
            </div>

            <AdZoneSlider ads={adsSidebar} zona="post-sidebar" />

            <div>
              <h4 className="flex items-center gap-2 text-xs uppercase tracking-widest text-white font-bold mb-6 pb-2 border-b border-white/10">
                <Zap className="h-4 w-4 text-[#F58634]" /> Top Inteligencia
              </h4>
              <div className="flex flex-col gap-6">
                {recommendedPosts.map((item, index) => {
                  const itemCategory = item.categories?.nodes?.[0];
                  return (
                    <Link key={item.id} href={`/${itemCategory?.slug || categorySlug}/${item.slug}`} className="group flex gap-4 items-start">
                      <span className="text-[#004AAD] font-['Space_Grotesk'] font-bold text-xl leading-none opacity-50 group-hover:opacity-100 transition-opacity">0{index + 1}</span>
                      <div>
                        <h5 className="text-sm font-bold text-slate-200 leading-snug group-hover:text-white transition-colors mb-2">
                          {item.title}
                        </h5>
                        <p className="text-[10px] text-[#F58634] uppercase tracking-widest font-bold">{itemCategory?.name || categoryName}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
