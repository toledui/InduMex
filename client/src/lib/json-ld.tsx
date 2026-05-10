type ArticleSchemaProps = {
  title: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  url: string;
};

export function ArticleJsonLd({
  title,
  description,
  image,
  datePublished,
  dateModified,
  author = "InduMex 2.0",
  url,
}: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: image ? [image] : undefined,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Organization",
      name: author,
    },
    url,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type BreadcrumbSchemaProps = {
  items: Array<{
    name: string;
    url: string;
  }>;
};

export function BreadcrumbJsonLd({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type OrganizationSchemaProps = {
  name?: string;
  url: string;
  logo?: string;
  description?: string;
};

export function OrganizationJsonLd({
  name = "InduMex 2.0",
  url,
  logo,
  description,
}: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    description,
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type WebSiteSchemaProps = {
  name?: string;
  url: string;
  description?: string;
};

export function WebSiteJsonLd({
  name = "InduMex 2.0",
  url,
  description,
}: WebSiteSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    description,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
