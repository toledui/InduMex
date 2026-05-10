const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export type AdminUser = {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "editor";
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthLoginResponse = {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    rol: "admin" | "editor";
    activo: boolean;
  };
};

export type Subscriber = {
  id: number;
  nombre: string | null;
  telefono: string | null;
  email: string;
  empresa: string | null;
  cargo: string | null;
  origen: string;
  estatus: "activo" | "baja" | "rebotado";
  proveedorPreferido: "local" | "mailrelay" | "mailchimp";
  syncMailrelay: "pendiente" | "sincronizado" | "error" | "omitido";
  syncMailchimp: "pendiente" | "sincronizado" | "error" | "omitido";
  notas: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error || `API request failed with status ${response.status}`);
  }

  return payload.data;
}

export async function apiGet<T>(path: string): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function authHeaders(token?: string): HeadersInit {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export async function loginAdmin(email: string, password: string): Promise<AuthLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return parseResponse<AuthLoginResponse>(response);
}

export async function requestPasswordReset(email: string): Promise<{ resetToken: string | null; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  return parseResponse<{ resetToken: string | null; message: string }>(response);
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });

  return parseResponse<{ message: string }>(response);
}

export async function getUsers(token: string): Promise<AdminUser[]> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "GET",
    cache: "no-store",
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<AdminUser[]>(response);
}

export async function createUser(
  token: string,
  payload: {
    nombre: string;
    email: string;
    password: string;
    rol: "admin" | "editor";
  }
): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<AdminUser>(response);
}

export async function updateUser(
  token: string,
  userId: number,
  payload: {
    nombre?: string;
    email?: string;
    password?: string;
    rol?: "admin" | "editor";
    activo?: boolean;
  }
): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<AdminUser>(response);
}

export async function deleteUser(token: string, userId: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<{ message: string }>(response);
}

export function getAuthTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const raw = document.cookie
    .split("; ")
    .find((item) => item.startsWith("indumex_admin_token="));

  return raw ? decodeURIComponent(raw.split("=")[1]) : null;
}

export function clearAdminSession(): void {
  if (typeof document !== "undefined") {
    document.cookie = "indumex_admin_token=; Max-Age=0; Path=/; SameSite=Lax";
    document.cookie = "indumex_admin_user=; Max-Age=0; Path=/; SameSite=Lax";
  }
}

export type ConfigMap = Record<string, string | null>;

export async function getConfig(): Promise<ConfigMap> {
  const response = await fetch(`${API_BASE_URL}/config`, { cache: "no-store" });
  if (!response.ok) throw new Error("Error al obtener configuración");
  const payload = (await response.json()) as ApiResponse<ConfigMap>;
  if (!payload.success || !payload.data) throw new Error(payload.error ?? "Error");
  return payload.data;
}

export async function updateConfig(token: string, data: ConfigMap): Promise<ConfigMap> {
  const response = await fetch(`${API_BASE_URL}/config`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as ApiResponse<ConfigMap>;
  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error ?? "Error al guardar configuración");
  }
  return payload.data;
}

export async function subscribeNewsletter(payload: {
  email: string;
  nombre?: string;
  telefono?: string;
  empresa?: string;
  cargo?: string;
  origen?: string;
  metadata?: Record<string, unknown>;
}): Promise<Subscriber> {
  const response = await fetch(`${API_BASE_URL}/subscribers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<Subscriber>(response);
}

export async function getSubscribers(token: string, emailQuery?: string): Promise<Subscriber[]> {
  const params = new URLSearchParams();
  if (emailQuery?.trim()) {
    params.set("email", emailQuery.trim());
  }

  const query = params.toString();
  const response = await fetch(`${API_BASE_URL}/subscribers${query ? `?${query}` : ""}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<Subscriber[]>(response);
}

export type CreatePostPayload = {
  title: string;
  content: string;
  excerpt?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  status?: 'draft' | 'publish';
};

export type PostResponse = {
  id: number;
  slug: string;
  title: string;
  status: string;
  link: string;
};

export type WpTaxonomy = {
  id: number;
  name: string;
  slug: string;
  count: number;
};

/**
 * Crea un nuevo post en WordPress
 */
export async function createPost(token: string, payload: CreatePostPayload): Promise<PostResponse> {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<PostResponse>(response);
}

/**
 * Actualiza un post en WordPress
 */
export async function updatePost(token: string, postId: number, payload: Partial<CreatePostPayload>): Promise<PostResponse> {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<PostResponse>(response);
}

/**
 * Elimina un post de WordPress
 */
export async function deletePost(token: string, postId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    method: "DELETE",
    headers: {
      ...authHeaders(token),
    },
  });

  if (!response.ok) {
    throw new Error("Error al eliminar el post");
  }
}

// ── Taxonomías WordPress ─────────────────────────────────────────

export async function getWpCategories(token: string): Promise<WpTaxonomy[]> {
  const response = await fetch(`${API_BASE_URL}/posts/categories`, {
    headers: authHeaders(token),
  });
  return parseResponse<WpTaxonomy[]>(response);
}

export async function createWpCategory(token: string, name: string): Promise<WpTaxonomy> {
  const response = await fetch(`${API_BASE_URL}/posts/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ name }),
  });
  return parseResponse<WpTaxonomy>(response);
}

export async function getWpTags(token: string): Promise<WpTaxonomy[]> {
  const response = await fetch(`${API_BASE_URL}/posts/tags`, {
    headers: authHeaders(token),
  });
  return parseResponse<WpTaxonomy[]>(response);
}

export async function createWpTag(token: string, name: string): Promise<WpTaxonomy> {
  const response = await fetch(`${API_BASE_URL}/posts/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ name }),
  });
  return parseResponse<WpTaxonomy>(response);
}

// ── Redes Sociales ──────────────────────────────────────────

export type SocialNetwork = {
  id: number;
  nombre: string;
  url: string;
  icono?: string | null;
  orden: number;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getSocialNetworks(): Promise<SocialNetwork[]> {
  const response = await fetch(`${API_BASE_URL}/social-networks`, {
    cache: "no-store",
  });
  return parseResponse<SocialNetwork[]>(response);
}

export async function getSocialNetworksAdmin(token: string): Promise<SocialNetwork[]> {
  const response = await fetch(`${API_BASE_URL}/social-networks/admin`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  return parseResponse<SocialNetwork[]>(response);
}

export async function createSocialNetwork(
  token: string,
  payload: {
    nombre: string;
    url: string;
    icono?: string;
    activa?: boolean;
  }
): Promise<SocialNetwork> {
  const response = await fetch(`${API_BASE_URL}/social-networks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  return parseResponse<SocialNetwork>(response);
}

export async function updateSocialNetwork(
  token: string,
  id: number,
  payload: {
    nombre?: string;
    url?: string;
    icono?: string;
    orden?: number;
    activa?: boolean;
  }
): Promise<SocialNetwork> {
  const response = await fetch(`${API_BASE_URL}/social-networks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  return parseResponse<SocialNetwork>(response);
}

export async function deleteSocialNetwork(token: string, id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/social-networks/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return parseResponse<{ message: string }>(response);
}

export async function reorderSocialNetworks(
  token: string,
  order: { id: number; orden: number }[]
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/social-networks/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ order }),
  });
  return parseResponse<{ message: string }>(response);
}

// ── Anuncios ──────────────────────────────────────────────────────

export type AdZona = "hero-slider" | "editorial-grid" | "post-in-content" | "post-sidebar";

export type Anuncio = {
  id: number;
  titulo: string;
  descripcion: string;
  cta_texto: string;
  cta_url: string;
  imagen_url: string | null;
  zona: AdZona;
  activo: boolean;
  orden: number;
  metrica: string | null;
  sector: string | null;
  acento: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getAdsByZona(zona: AdZona): Promise<Anuncio[]> {
  const response = await fetch(`${API_BASE_URL}/ads?zona=${zona}`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as ApiResponse<Anuncio[]>;
  return payload.data ?? [];
}

export async function getAdsAdmin(token: string): Promise<Anuncio[]> {
  const response = await fetch(`${API_BASE_URL}/ads/admin`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  return parseResponse<Anuncio[]>(response);
}

export async function createAd(
  token: string,
  payload: Omit<Anuncio, "id" | "createdAt" | "updatedAt">
): Promise<Anuncio> {
  const response = await fetch(`${API_BASE_URL}/ads`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  return parseResponse<Anuncio>(response);
}

export async function updateAd(
  token: string,
  id: number,
  payload: Partial<Omit<Anuncio, "id" | "createdAt" | "updatedAt">>
): Promise<Anuncio> {
  const response = await fetch(`${API_BASE_URL}/ads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  return parseResponse<Anuncio>(response);
}

export async function deleteAd(token: string, id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/ads/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return parseResponse<{ message: string }>(response);
}

export { API_BASE_URL };
