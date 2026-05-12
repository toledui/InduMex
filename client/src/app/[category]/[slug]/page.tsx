import type { Metadata } from "next";
import Script from "next/script";
import PostPremiumClient from "@/components/PostPremiumClient";
import { notFound } from "next/navigation";
import {
  getPostBySlug,
  getAllPosts,
  getPrimaryCategory,
} from "@/lib/wordpress";
import { getAdsByZona } from "@/lib/api";
import {
  ArticleJsonLd,
  BreadcrumbJsonLd,
} from "@/lib/json-ld";

type PostPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug, category } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Articulo no encontrado | InduMex 2.0",
      description: "El articulo solicitado no existe o fue removido.",
    };
  }

  // Extraer datos de Rank Math si están disponibles, sino del seo objeto
  const seoTitle = post.seo?.title || post.rankMath?.title || post.title;
  const seoDescription =
    post.seo?.metaDesc ||
    post.rankMath?.description ||
    post.excerpt?.replace(/<[^>]+>/g, "") ||
    "Análisis técnico industrial en InduMex 2.0";

  const DEFAULT_OG_IMAGE = "https://indumex.blog/images/indumex-image.jpg";
  const image = post.featuredImage?.node?.sourceUrl || DEFAULT_OG_IMAGE;
  const url = `https://indumex.blog/${category}/${slug}`;
  const authorName = post.author?.node?.name || "InduMex Editorial";
  
  // Extractar etiquetas de categorías para Open Graph
  const tagNames = post.categories?.nodes?.map((cat) => cat.name) || [];

  // Calcular tiempo de lectura
  const readingWords = post.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(readingWords / 220));
  const readTimeLabel = `${readingMinutes} min`;

  return {
    title: seoTitle,
    description: seoDescription,
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
    alternates: {
      canonical: post.seo?.canonical || url,
    },
    openGraph: {
      title: post.seo?.opengraphTitle || seoTitle,
      description: post.seo?.opengraphDescription || seoDescription,
      type: "article",
      url,
      siteName: "InduMex",
      locale: "es_MX",
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
      publishedTime: post.date,
      modifiedTime: post.modified,
      authors: [authorName],
      tags: tagNames,
      section: post.categories?.nodes?.[0]?.name || "Industrial",
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [image],
      creator: "@indumexblog",
    },
    other: {
      "article:section": post.categories?.nodes?.[0]?.name || "Industrial",
      "twitter:label1": "Escrito por",
      "twitter:data1": authorName,
      "twitter:label2": "Tiempo de lectura",
      "twitter:data2": readTimeLabel,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { category, slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const primaryCategory = getPrimaryCategory(post);
  const image = post.featuredImage?.node;
  const publishedAt = new Date(post.date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const postUrl = `https://indumex.blog/${category}/${slug}`;
  const authorName = post.author?.node?.name || "InduMex Editorial";
  const authorAvatar = post.author?.node?.avatar?.url;

  // Construcción del Schema @graph (Rank Math style)
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://indumex.blog/#organization",
        name: "InduMex",
        url: "https://indumex.blog",
        logo: {
          "@type": "ImageObject",
          url: "https://indumex.blog/logo.png",
          width: 250,
          height: 60,
        },
        sameAs: [
          "https://www.linkedin.com/company/indumex",
          "https://www.instagram.com/indumexblog",
          "https://www.facebook.com/indumexblog",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "Customer Support",
          telephone: "+52-800-XXX-XXXX",
          email: "contacto@indumex.blog",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://indumex.blog/#website",
        url: "https://indumex.blog",
        name: "InduMex",
        description: "Plataforma de análisis técnico e inteligencia industrial",
        publisher: {
          "@id": "https://indumex.blog/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://indumex.blog/search?q={search_term_string}",
          },
          query_input: "required name=search_term_string",
        },
      },
      {
        "@type": "Person",
        "@id": `https://indumex.blog/#author-${authorName.replace(/\s+/g, "-").toLowerCase()}`,
        name: authorName,
        image: authorAvatar ? { "@type": "ImageObject", url: authorAvatar } : undefined,
        jobTitle: "Consejo Editorial",
      },
      {
        "@type": "BlogPosting",
        "@id": `${postUrl}#article`,
        headline: post.title,
        description: post.excerpt?.replace(/<[^>]+>/g, "") || post.title,
        image: image?.sourceUrl
          ? {
              "@type": "ImageObject",
              url: image.sourceUrl,
              width: image.mediaDetails?.width || 1200,
              height: image.mediaDetails?.height || 630,
            }
          : undefined,
        datePublished: post.date,
        dateModified: post.modified || post.date,
        author: {
          "@id": `https://indumex.blog/#author-${authorName.replace(/\s+/g, "-").toLowerCase()}`,
        },
        publisher: {
          "@id": "https://indumex.blog/#organization",
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": postUrl,
        },
        articleSection: post.categories?.nodes?.[0]?.name || "Industrial",
        keywords: post.categories?.nodes?.map((cat) => cat.name).join(", ") || "industrial",
      },
    ],
  };

  const breadcrumbs = [
    { name: "Inicio", url: "https://indumex.blog" },
    { name: primaryCategory?.name || category, url: `https://indumex.blog/${category}` },
    { name: post.title, url: postUrl },
  ];

  return (
    <>
      {/* Google Analytics 4 */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-BXMEX2G88E"
        strategy="afterInteractive"
      />
      <Script id="ga4-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-BXMEX2G88E', {
            'page_path': '${postUrl}',
            'page_title': '${post.title.replace(/'/g, "\\'")}',
            'anonymize_ip': true
          });
        `}
      </Script>

      {/* Advanced JSON-LD Schema (@graph) */}
      <Script
        id="schema-graph"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaGraph),
        }}
      />

      {/* Breadcrumb JSON-LD */}
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt?.replace(/<[^>]+>/g, "") || post.title}
        image={image?.sourceUrl}
        datePublished={post.date}
        dateModified={post.modified}
        author={authorName}
        url={postUrl}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />

      {/* Render Post Content */}
      <PostPremiumServerBridge
        post={post}
        category={category}
        categoryName={primaryCategory?.name || category}
        publishedAt={publishedAt}
      />
    </>
  );
}

async function PostPremiumServerBridge({
  post,
  category,
  categoryName,
  publishedAt,
}: {
  post: NonNullable<Awaited<ReturnType<typeof getPostBySlug>>>;
  category: string;
  categoryName: string;
  publishedAt: string;
}) {
  const readingWords = post.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(readingWords / 220));
  const readTime = `${readingMinutes} MIN LECTURA`;

  const [recommendedPosts, adsInContent, adsSidebar] = await Promise.all([
    getAllPosts(10).then((items) => items.filter((item) => item.slug !== post.slug).slice(0, 3)).catch(() => []),
    getAdsByZona("post-in-content"),
    getAdsByZona("post-sidebar"),
  ]);

  return (
    <PostPremiumClient
      post={post}
      categorySlug={category}
      categoryName={categoryName}
      readTime={readTime}
      publishedLabel={publishedAt.toUpperCase()}
      recommendedPosts={recommendedPosts}
      adsInContent={adsInContent}
      adsSidebar={adsSidebar}
    />
  );
}
