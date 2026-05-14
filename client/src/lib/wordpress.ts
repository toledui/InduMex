import { unstable_cache } from "next/cache";

const WORDPRESS_GRAPHQL_URL_FALLBACK =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  process.env.WORDPRESS_API_URL ||
  "http://localhost/graphql";

// Compatibilidad para imports existentes; la URL efectiva ahora se resuelve desde configuración en BD.
const WORDPRESS_GRAPHQL_URL = WORDPRESS_GRAPHQL_URL_FALLBACK;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/**
 * Obtiene la URL de WordPress desde la BD (configuración dinámica).
 * Se cachea 60 segundos para evitar una query a la BD en cada petición.
 * Si la BD no tiene valor o la petición falla, usa el .env como respaldo.
 */
const getWordPressUrl = unstable_cache(
  async (): Promise<string> => {
    try {
      const res = await fetch(`${API_BASE_URL}/config`, { cache: "no-store" });
      if (!res.ok) return WORDPRESS_GRAPHQL_URL_FALLBACK;
      const json = (await res.json()) as {
        success: boolean;
        data: Record<string, string | null> | null;
      };
      const url = json?.data?.wordpress_api_url;
      return url && url.trim() ? url.trim() : WORDPRESS_GRAPHQL_URL_FALLBACK;
    } catch {
      return WORDPRESS_GRAPHQL_URL_FALLBACK;
    }
  },
  ["wordpress-config-url"],
  { revalidate: 60, tags: ["wordpress-config"] }
);

const getWordPressRevalidate = unstable_cache(
  async (): Promise<number> => {
    try {
      const res = await fetch(`${API_BASE_URL}/config`, { cache: "no-store" });
      if (!res.ok) return WORDPRESS_REVALIDATE_SECONDS;
      const json = (await res.json()) as {
        success: boolean;
        data: Record<string, string | null> | null;
      };
      const raw = json?.data?.wordpress_revalidate;
      const parsed = raw ? parseInt(raw, 10) : NaN;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : WORDPRESS_REVALIDATE_SECONDS;
    } catch {
      return WORDPRESS_REVALIDATE_SECONDS;
    }
  },
  ["wordpress-config-revalidate"],
  { revalidate: 60, tags: ["wordpress-config"] }
);

const WORDPRESS_REVALIDATE_SECONDS = 60;

const WORDPRESS_CACHE_TAGS = {
  all: "wordpress",
  posts: "wordpress-posts",
  categories: "wordpress-categories",
} as const;

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type WordPressFetchOptions = {
  revalidate?: number | false;
  tags?: string[];
};

export const GET_ALL_POSTS = `
  query GetAllPosts($first: Int = 12) {
    posts(first: $first) {
      nodes {
        id
        title
        slug
        date
        uri
        categories {
          nodes {
            name
            slug
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
      }
    }
  }
`;

const GET_ALL_POSTS_WITH_SEO = `
  query GetAllPostsWithSeo($first: Int = 12) {
    posts(first: $first) {
      nodes {
        id
        title
        slug
        date
        uri
        seo {
          primaryCategory {
            node {
              name
              slug
            }
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
      }
    }
  }
`;

export const GET_POST_BY_SLUG = `
  query GetPostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      title
      slug
      date
      content
      excerpt
      uri
      modified
      author {
        node {
          name
          avatar {
            url
          }
        }
      }
      categories {
        nodes {
          name
          slug
        }
      }
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
    }
  }
`;

const GET_POST_BY_SLUG_WITH_SEO = `
  query GetPostBySlugWithSeo($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      title
      slug
      date
      content
      excerpt
      uri
      modified
      author {
        node {
          name
          avatar {
            url
          }
        }
      }
      seo {
        title
        metaDesc
        canonical
        opengraphTitle
        opengraphDescription
      }
      categories {
        nodes {
          name
          slug
        }
      }
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
    }
  }
`;

const GET_POST_BY_SLUG_WITH_SEO_AND_RANKMATH = `
  query GetPostBySlugWithSeoAndRankMath($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      title
      slug
      date
      content
      excerpt
      uri
      modified
      author {
        node {
          name
          avatar {
            url
          }
        }
      }
      seo {
        title
        metaDesc
        canonical
        opengraphTitle
        opengraphDescription
        primaryCategory {
          node {
            name
            slug
          }
        }
      }
      rankMath {
        title
        description
      }
      categories {
        nodes {
          name
          slug
        }
      }
      featuredImage {
        node {
          sourceUrl
          altText
          mediaDetails {
            width
            height
          }
        }
      }
    }
  }
`;

export const GET_CATEGORIES = `
  query GetCategories($first: Int = 12) {
    categories(first: $first) {
      nodes {
        id
        name
        slug
        uri
        parent {
          node {
            id
            slug
          }
        }
      }
    }
  }
`;

const GET_CATEGORIES_PAGE = `
  query GetCategoriesPage($first: Int = 50, $after: String) {
    categories(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        name
        slug
        uri
        parent {
          node {
            id
            slug
          }
        }
      }
    }
  }
`;

const GET_POSTS_PAGE = `
  query GetPostsPage($first: Int = 50, $after: String) {
    posts(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        slug
        date
        uri
        categories {
          nodes {
            name
            slug
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
      }
    }
  }
`;

export async function wordpressFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: WordPressFetchOptions
): Promise<T> {
  const [wordpressUrl, revalidateSeconds] = await Promise.all([
    getWordPressUrl(),
    getWordPressRevalidate(),
  ]);

  const cacheTags = Array.from(
    new Set([WORDPRESS_CACHE_TAGS.all, ...(options?.tags || [])])
  );

  const response = await fetch(wordpressUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next:
      options?.revalidate === false
        ? { tags: cacheTags }
        : {
            revalidate: options?.revalidate ?? revalidateSeconds,
            tags: cacheTags,
          },
  });

  if (!response.ok) {
    throw new Error(`WordPress request failed with status ${response.status}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message || "WordPress GraphQL error");
  }

  if (!json.data) {
    throw new Error("WordPress GraphQL response has no data");
  }

  return json.data;
}

type Category = {
  name: string;
  slug: string;
};

type FeaturedImage = {
  sourceUrl: string;
  altText?: string | null;
  mediaDetails?: {
    width?: number | null;
    height?: number | null;
  } | null;
};

type PostAuthor = {
  node?: {
    name?: string | null;
    avatar?: {
      url?: string | null;
    } | null;
  } | null;
};

export type WordPressPostCard = {
  id: string;
  title: string;
  slug: string;
  date: string;
  uri?: string;
  categories?: { nodes: Category[] };
  seo?: {
    primaryCategory?: {
      node?: Category;
    };
  };
  featuredImage?: {
    node?: FeaturedImage | null;
  };
};

export type WordPressPostDetail = {
  id: string;
  title: string;
  slug: string;
  date: string;
  content: string;
  excerpt?: string;
  uri?: string;
  modified?: string;
  author?: PostAuthor;
  categories?: { nodes: Category[] };
  seo?: {
    title?: string;
    metaDesc?: string;
    canonical?: string;
    opengraphTitle?: string;
    opengraphDescription?: string;
    primaryCategory?: {
      node?: Category;
    };
  };
  rankMath?: {
    title?: string;
    description?: string;
  };
  featuredImage?: {
    node?: FeaturedImage | null;
  };
};

export type WordPressCategory = {
  id: string;
  name: string;
  slug: string;
  uri: string;
  parent?: {
    node?: {
      id: string;
      slug: string;
    } | null;
  } | null;
};

export async function getAllPosts(first = 12): Promise<WordPressPostCard[]> {
  try {
    const withSeo = await wordpressFetch<{ posts: { nodes: WordPressPostCard[] } }>(
      GET_ALL_POSTS_WITH_SEO,
      { first },
      { tags: [WORDPRESS_CACHE_TAGS.posts] }
    );
    return withSeo.posts.nodes;
  } catch {
    const fallback = await wordpressFetch<{ posts: { nodes: WordPressPostCard[] } }>(
      GET_ALL_POSTS,
      { first },
      { tags: [WORDPRESS_CACHE_TAGS.posts] }
    );
    return fallback.posts.nodes;
  }
}

export async function getAllPostsUnlimited(
  firstPerPage = 50,
  maxPages = 50
): Promise<WordPressPostCard[]> {
  let after: string | null = null;
  const allPosts: WordPressPostCard[] = [];
  type PostsPageResult = {
    posts: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor?: string | null;
      };
      nodes: WordPressPostCard[];
    };
  };

  for (let page = 0; page < maxPages; page++) {
    const pageResult: PostsPageResult = await wordpressFetch<PostsPageResult>(
      GET_POSTS_PAGE,
      { first: firstPerPage, after },
      { tags: [WORDPRESS_CACHE_TAGS.posts] }
    );

    allPosts.push(...pageResult.posts.nodes);

    if (!pageResult.posts.pageInfo.hasNextPage) {
      break;
    }

    after = pageResult.posts.pageInfo.endCursor || null;
    if (!after) {
      break;
    }
  }

  const deduped = new Map<string, WordPressPostCard>();
  for (const post of allPosts) {
    deduped.set(post.id, post);
  }

  return Array.from(deduped.values());
}

export async function getPostBySlug(
  slug: string
): Promise<WordPressPostDetail | null> {
  const cacheTags = [WORDPRESS_CACHE_TAGS.posts, `wordpress-post:${slug}`];

  try {
    const withRankMath = await wordpressFetch<{ post: WordPressPostDetail | null }>(
      GET_POST_BY_SLUG_WITH_SEO_AND_RANKMATH,
      { slug },
      { tags: cacheTags }
    );
    return withRankMath.post;
  } catch {
    try {
      const withSeo = await wordpressFetch<{ post: WordPressPostDetail | null }>(
        GET_POST_BY_SLUG_WITH_SEO,
        { slug },
        { tags: cacheTags }
      );
      return withSeo.post;
    } catch {
      try {
        const fallback = await wordpressFetch<{ post: WordPressPostDetail | null }>(
          GET_POST_BY_SLUG,
          { slug },
          { tags: cacheTags }
        );
        return fallback.post;
      } catch {
        return null;
      }
    }
  }
}

export async function getCategories(
  first = 12
): Promise<WordPressCategory[]> {
  try {
    const data = await wordpressFetch<{ categories: { nodes: WordPressCategory[] } }>(
      GET_CATEGORIES,
      { first },
      { tags: [WORDPRESS_CACHE_TAGS.categories] }
    );
    return data.categories.nodes;
  } catch {
    return [];
  }
}

export async function getAllCategoriesUnlimited(
  firstPerPage = 50,
  maxPages = 50
): Promise<WordPressCategory[]> {
  let after: string | null = null;
  const allCategories: WordPressCategory[] = [];
  type CategoriesPageResult = {
    categories: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor?: string | null;
      };
      nodes: WordPressCategory[];
    };
  };

  for (let page = 0; page < maxPages; page++) {
    const data: CategoriesPageResult = await wordpressFetch<CategoriesPageResult>(
      GET_CATEGORIES_PAGE,
      { first: firstPerPage, after },
      { tags: [WORDPRESS_CACHE_TAGS.categories] }
    );

    allCategories.push(...data.categories.nodes);

    if (!data.categories.pageInfo.hasNextPage) {
      break;
    }

    after = data.categories.pageInfo.endCursor || null;
    if (!after) {
      break;
    }
  }

  const deduped = new Map<string, WordPressCategory>();
  for (const category of allCategories) {
    deduped.set(category.id, category);
  }

  return Array.from(deduped.values());
}

const GET_POSTS_BY_CATEGORY = `
  query GetPostsByCategory($categorySlug: String!, $first: Int = 6) {
    posts(first: $first, where: { categoryName: $categorySlug }) {
      nodes {
        id
        title
        slug
        date
        uri
        excerpt
        categories {
          nodes {
            name
            slug
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
            }
          }
        }
      }
    }
  }
`;

export async function getPostsByCategory(
  categorySlug: string,
  first = 6
): Promise<WordPressPostCard[]> {
  try {
    const data = await wordpressFetch<{ posts: { nodes: WordPressPostCard[] } }>(
      GET_POSTS_BY_CATEGORY,
      { categorySlug, first },
      { tags: [WORDPRESS_CACHE_TAGS.posts, `wordpress-category:${categorySlug}`] }
    );
    return data.posts.nodes;
  } catch {
    return [];
  }
}

export function getPrimaryCategory(post: WordPressPostCard | WordPressPostDetail):
  | Category
  | undefined {
  return post.seo?.primaryCategory?.node || post.categories?.nodes?.[0];
}

export { WORDPRESS_CACHE_TAGS, WORDPRESS_GRAPHQL_URL, WORDPRESS_REVALIDATE_SECONDS };
