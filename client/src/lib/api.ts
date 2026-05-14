// En el servidor (Server Components) usamos la URL interna para evitar loops a través de Cloudflare.
// En el cliente (browser) usamos la URL pública relativa que pasa por el proxy de Next.js.
const API_BASE_URL =
  typeof window === "undefined"
    ? `${process.env.NEXT_INTERNAL_API_URL ?? "http://localhost:4000"}/api/v1`
    : "/api/v1";

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
    apellido?: string | null;
    telefono?: string | null;
    empresa?: string | null;
    email: string;
    rol: "admin" | "editor" | "cliente";
    activo: boolean;
  };
};

export type ClientAuthUser = {
  id: number;
  nombre: string;
  apellido?: string | null;
  telefono?: string | null;
  empresa?: string | null;
  email: string;
  rol: "cliente";
  activo: boolean;
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

export type SubscriberSyncProvider = "local" | "mailrelay" | "mailchimp";

export type SubscriberSyncStatus = {
  activeProvider: SubscriberSyncProvider;
  enabledAccounts: {
    mailrelay: boolean;
    mailchimp: boolean;
  };
  providerReady: boolean;
  autoSyncEnabled: boolean;
  hourlyBatchSize: number;
  pending: {
    mailrelay: number;
    mailchimp: number;
    activeProvider: number;
  };
};

export type SubscriberSyncRunResult = {
  provider: Exclude<SubscriberSyncProvider, "local">;
  source: "manual" | "auto";
  processed: number;
  synced: number;
  failed: number;
  remaining: number;
  errors: Array<{
    email: string;
    reason: string;
  }>;
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

export async function registerClient(payload: {
  nombre: string;
  apellido: string;
  empresa: string;
  email: string;
  password: string;
  telefono?: string;
  aceptaTerminos: boolean;
}): Promise<AuthLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/client/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<AuthLoginResponse>(response);
}

export async function loginClient(email: string, password: string): Promise<AuthLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/client/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return parseResponse<AuthLoginResponse>(response);
}

export async function getClientMe(token: string): Promise<ClientAuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    cache: "no-store",
    headers: authHeaders(token),
  });

  return parseResponse<ClientAuthUser>(response);
}

export async function updateClientMe(
  token: string,
  payload: {
    nombre?: string | null;
    apellido?: string | null;
    telefono?: string;
    empresa?: string;
    password?: string;
  }
): Promise<ClientAuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<ClientAuthUser>(response);
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

export function getClientTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const raw = document.cookie
    .split("; ")
    .find((item) => item.startsWith("indumex_client_token="));

  return raw ? decodeURIComponent(raw.split("=")[1]) : null;
}

export function clearClientSession(): void {
  if (typeof document !== "undefined") {
    document.cookie = "indumex_client_token=; Max-Age=0; Path=/; SameSite=Lax";
    document.cookie = "indumex_client_user=; Max-Age=0; Path=/; SameSite=Lax";
  }
}

export type ConfigMap = Record<string, string | null>;

export type PublicProvider = {
  id: number;
  name: string;
  slug: string;
  logo: string;
  tier: 'premium' | 'verified' | 'basic';
  shortDescription: string;
  about: string;
  sectors: string[];
  certifications: string[];
  socialNetworks: {
    nombre: string;
    url: string;
  }[];
  city: string;
  state: string;
  country: string;
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  isActive: boolean;
  usuarioId?: number | null;
};

export type ProveedorSuscripcionPlanPublic = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  moneda: string;
  periodicidad: "mensual" | "bimestral" | "trimestral" | "semestral" | "anual";
  beneficios: string[];
  status: "verificado" | "patrocinado";
  activo: boolean;
};

export type ProveedorSuscripcionActual = {
  id: number;
  usuarioId: number;
  planId: number;
  estado: "activa" | "pausada" | "cancelada" | "vencida";
  fechaInicio: string;
  fechaVencimiento: string;
  autoRenovacionCancelada?: boolean;
  plan?: ProveedorSuscripcionPlanPublic;
  ultimoLinkPago?: {
    id: number;
    token: string;
    estado: string;
    monto: number;
  } | null;
};

export type MarketplacePlanPublic = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  moneda: string;
  periodicidad: "mensual" | "bimestral" | "trimestral" | "semestral" | "anual";
  caracteristicas: string[];
  maxProductos: number;
  maxProductosDestacados: number;
  nivelVisibilidad: "base" | "media" | "alta";
  activo: boolean;
};

export type MarketplaceSuscripcionActual = {
  id: number;
  usuarioId: number;
  planId: number;
  estado: "activa" | "pausada" | "cancelada" | "vencida";
  fechaInicio: string;
  fechaVencimiento: string;
  autoRenovacionCancelada?: boolean;
  plan?: MarketplacePlanPublic;
  ultimoLinkPago?: {
    id: number;
    token: string;
    estado: string;
    monto: number;
    expiresAt?: string | null;
  } | null;
};

export type MarketplacePerfil = {
  id: number;
  usuarioId: number;
  habilitado: boolean;
  maxProductosOverride: number | null;
  vigenciaHasta: string | null;
  notasAdmin: string | null;
};

export type MarketplaceCategoria = {
  id: number;
  usuarioId: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceProductoCampo = {
  id?: number;
  clave: string;
  valor: string;
};

export type MarketplaceProducto = {
  id: number;
  usuarioId: number;
  categoriaId: number;
  sku: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  moneda: string;
  stock: number;
  destacado: boolean;
  estado: 'borrador' | 'publicado' | 'archivado';
  imagenes: string[];
  metadata: Record<string, unknown>;
  categoria: {
    id: number;
    nombre: string;
    slug: string;
  } | null;
  camposPersonalizados: MarketplaceProductoCampo[];
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceCatalogCategoria = {
  id: number;
  nombre: string;
  slug: string;
};

export type MarketplaceCatalogSeller = {
  usuarioId: number;
  nombre: string;
  apellido: string | null;
  empresa: string | null;
  nivelVisibilidad: 'base' | 'media' | 'alta';
  planNombre: string;
  logo: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  socialNetworks: Array<{ nombre: string; url: string }>;
};

export type MarketplaceCatalogProducto = {
  id: number;
  usuarioId: number;
  categoriaId: number;
  sku: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  moneda: string;
  stock: number;
  destacado: boolean;
  estado: 'publicado';
  imagenes: string[];
  metadata: Record<string, unknown>;
  categoria: MarketplaceCatalogCategoria | null;
  vendedor: MarketplaceCatalogSeller | null;
  camposPersonalizados: MarketplaceProductoCampo[];
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceCatalogResponse = {
  productos: MarketplaceCatalogProducto[];
  categorias: MarketplaceCatalogCategoria[];
};

export type AdminProviderInput = {
  name: string;
  slug?: string;
  logo?: string;
  tier?: 'premium' | 'verified' | 'basic';
  shortDescription?: string;
  about?: string;
  sectors?: string[];
  certifications?: string[];
  socialNetworks?: {
    nombre: string;
    url: string;
  }[];
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  isActive?: boolean;
  usuarioEmail?: string;
};

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

export async function testSmtpConfig(
  token: string,
  payload: { to: string }
): Promise<{ message: string; messageId?: string; accepted?: string[]; smtp?: string }> {
  const response = await fetch(`${API_BASE_URL}/config/test-smtp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<{ message: string; messageId?: string; accepted?: string[]; smtp?: string }>(response);
}

export async function getPublicProviders(): Promise<PublicProvider[]> {
  const response = await fetch(`${API_BASE_URL}/proveedores`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Error al obtener proveedores');
  }

  const payload = (await response.json()) as ApiResponse<PublicProvider[]>;
  if (!payload.success || !payload.data) {
    throw new Error(payload.error ?? 'Error al obtener proveedores');
  }

  return payload.data;
}

export async function getMyProviderProfile(token: string): Promise<PublicProvider | null> {
  const response = await fetch(`${API_BASE_URL}/proveedores/mi-perfil`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  const payload = (await response.json()) as ApiResponse<PublicProvider | null>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? "Error al obtener perfil de proveedor");
  }

  return payload.data;
}

export async function getProviderSubscriptionPlans(): Promise<ProveedorSuscripcionPlanPublic[]> {
  const response = await fetch(`${API_BASE_URL}/clientes/proveedor-suscripcion-planes/activos`, {
    cache: "no-store",
  });

  return parseResponse<ProveedorSuscripcionPlanPublic[]>(response);
}

export async function getMyProviderSubscription(token: string): Promise<ProveedorSuscripcionActual | null> {
  const response = await fetch(`${API_BASE_URL}/clientes/proveedor-suscripcion/actual`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  const payload = (await response.json()) as ApiResponse<ProveedorSuscripcionActual | null>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? "Error al obtener suscripción actual");
  }

  return payload.data;
}

export async function createMyProviderSubscription(
  token: string,
  planId: number
): Promise<{ suscripcion: ProveedorSuscripcionActual; paymentLink: { id: number; token: string } }> {
  const response = await fetch(`${API_BASE_URL}/clientes/proveedor-suscripcion/crear`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ planId }),
  });

  return parseResponse<{ suscripcion: ProveedorSuscripcionActual; paymentLink: { id: number; token: string } }>(response);
}

export async function cancelMyProviderSubscriptionRenewal(token: string): Promise<ProveedorSuscripcionActual> {
  const response = await fetch(`${API_BASE_URL}/clientes/proveedor-suscripcion/cancelar-renovacion`, {
    method: "PATCH",
    headers: authHeaders(token),
  });

  return parseResponse<ProveedorSuscripcionActual>(response);
}

export async function getMarketplacePlans(): Promise<MarketplacePlanPublic[]> {
  const response = await fetch(`${API_BASE_URL}/clientes/marketplace-planes/activos`, {
    cache: "no-store",
  });

  return parseResponse<MarketplacePlanPublic[]>(response);
}

export async function getMarketplaceCatalog(): Promise<MarketplaceCatalogResponse> {
  const response = await fetch(`${API_BASE_URL}/marketplace/catalogo`, {
    cache: "no-store",
  });

  return parseResponse<MarketplaceCatalogResponse>(response);
}

export async function getMyMarketplaceSubscription(token: string): Promise<MarketplaceSuscripcionActual | null> {
  const response = await fetch(`${API_BASE_URL}/clientes/marketplace-suscripcion/actual`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  const payload = (await response.json()) as ApiResponse<MarketplaceSuscripcionActual | null>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? "Error al obtener suscripción de marketplace");
  }

  return payload.data;
}

export async function createMyMarketplaceSubscription(
  token: string,
  planId: number
): Promise<{ suscripcion: MarketplaceSuscripcionActual; paymentLink: { id: number; token: string } }> {
  const response = await fetch(`${API_BASE_URL}/clientes/marketplace-suscripcion/crear`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ planId }),
  });

  return parseResponse<{ suscripcion: MarketplaceSuscripcionActual; paymentLink: { id: number; token: string } }>(response);
}

export async function cancelMyMarketplaceSubscriptionRenewal(token: string): Promise<MarketplaceSuscripcionActual> {
  const response = await fetch(`${API_BASE_URL}/clientes/marketplace-suscripcion/cancelar-renovacion`, {
    method: "PATCH",
    headers: authHeaders(token),
  });

  return parseResponse<MarketplaceSuscripcionActual>(response);
}

export async function getMyMarketplacePerfil(token: string): Promise<MarketplacePerfil | null> {
  const response = await fetch(`${API_BASE_URL}/clientes/marketplace-perfil`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  const payload = (await response.json()) as ApiResponse<MarketplacePerfil | null>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? "Error al obtener perfil de marketplace");
  }

  return payload.data;
}

export async function getMyMarketplaceCategorias(token: string): Promise<MarketplaceCategoria[]> {
  const response = await fetch(`${API_BASE_URL}/clientes/marketplace-categorias`, {
    cache: 'no-store',
    headers: authHeaders(token),
  });

  return parseResponse<MarketplaceCategoria[]>(response);
}

export async function createMyMarketplaceCategoria(
  token: string,
  payload: { nombre: string; descripcion?: string | null; activa?: boolean }
): Promise<MarketplaceCategoria> {
  const response = await fetch(`${API_BASE_URL}/clientes/marketplace-categorias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<MarketplaceCategoria>(response);
}

export async function deleteMyMarketplaceCategoria(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/clientes/marketplace-categorias/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  await parseResponse<{ deleted: boolean }>(response);
}

export async function getMyMarketplaceProductos(token: string): Promise<MarketplaceProducto[]> {
  const response = await fetch(`${API_BASE_URL}/clientes/marketplace-productos`, {
    cache: 'no-store',
    headers: authHeaders(token),
  });

  return parseResponse<MarketplaceProducto[]>(response);
}

export async function createMyMarketplaceProducto(
  token: string,
  payload: {
    categoriaId: number;
    sku: string;
    nombre: string;
    descripcion?: string | null;
    precio: number;
    moneda?: string;
    stock?: number;
    destacado?: boolean;
    estado?: 'borrador' | 'publicado' | 'archivado';
    imagenes?: string[];
    metadata?: Record<string, unknown>;
    camposPersonalizados?: MarketplaceProductoCampo[];
  }
): Promise<MarketplaceProducto> {
  const response = await fetch(`${API_BASE_URL}/clientes/marketplace-productos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<MarketplaceProducto>(response);
}

export async function updateMyMarketplaceProducto(
  token: string,
  id: number,
  payload: Partial<{
    categoriaId: number;
    sku: string;
    nombre: string;
    descripcion: string | null;
    precio: number;
    moneda: string;
    stock: number;
    destacado: boolean;
    estado: 'borrador' | 'publicado' | 'archivado';
    imagenes: string[];
    metadata: Record<string, unknown>;
    camposPersonalizados: MarketplaceProductoCampo[];
  }>
): Promise<MarketplaceProducto> {
  const response = await fetch(`${API_BASE_URL}/clientes/marketplace-productos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<MarketplaceProducto>(response);
}

export async function deleteMyMarketplaceProducto(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/clientes/marketplace-productos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  await parseResponse<{ deleted: boolean }>(response);
}

export async function getMarketplaceFeatureCatalog(token: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/admin/marketplace/feature-catalog`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  return parseResponse<string[]>(response);
}

export async function getAdminMarketplacePlans(token: string): Promise<MarketplacePlanPublic[]> {
  const response = await fetch(`${API_BASE_URL}/admin/marketplace/planes`, {
    cache: "no-store",
    headers: authHeaders(token),
  });

  return parseResponse<MarketplacePlanPublic[]>(response);
}

export async function createAdminMarketplacePlan(
  token: string,
  payload: Omit<MarketplacePlanPublic, "id">
): Promise<MarketplacePlanPublic> {
  const response = await fetch(`${API_BASE_URL}/admin/marketplace/planes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<MarketplacePlanPublic>(response);
}

export async function updateAdminMarketplacePlan(
  token: string,
  id: number,
  payload: Partial<Omit<MarketplacePlanPublic, "id">>
): Promise<MarketplacePlanPublic> {
  const response = await fetch(`${API_BASE_URL}/admin/marketplace/planes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<MarketplacePlanPublic>(response);
}

export async function deleteAdminMarketplacePlan(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/marketplace/planes/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  await parseResponse<{ deleted: boolean }>(response);
}

export async function createMyProviderProfile(
  token: string,
  payload: Omit<PublicProvider, "id" | "tier" | "slug" | "isActive">
): Promise<PublicProvider> {
  const response = await fetch(`${API_BASE_URL}/proveedores/mi-perfil`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<PublicProvider>(response);
}

export async function updateMyProviderProfile(
  token: string,
  payload: Partial<Omit<PublicProvider, "id" | "tier" | "slug">>
): Promise<PublicProvider> {
  const response = await fetch(`${API_BASE_URL}/proveedores/mi-perfil`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<PublicProvider>(response);
}

export async function getAdminProviders(token: string): Promise<PublicProvider[]> {
  const response = await fetch(`${API_BASE_URL}/proveedores/admin`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener proveedores del admin');
  }

  const payload = (await response.json()) as ApiResponse<PublicProvider[]>;
  if (!payload.success || !payload.data) {
    throw new Error(payload.error ?? 'Error al obtener proveedores del admin');
  }

  return payload.data;
}

export async function createAdminProvider(token: string, payload: AdminProviderInput): Promise<PublicProvider> {
  const response = await fetch(`${API_BASE_URL}/proveedores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<PublicProvider>(response);
}

export async function updateAdminProvider(
  token: string,
  id: number,
  payload: AdminProviderInput
): Promise<PublicProvider> {
  const response = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<PublicProvider>(response);
}

export async function uploadProviderLogo(token: string, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('logo', file);

  const response = await fetch(`${API_BASE_URL}/proveedores/upload-logo`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });

  return parseResponse<{ url: string }>(response);
}

export async function toggleProviderActive(token: string, id: number, isActive: boolean): Promise<PublicProvider> {
  const response = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify({ isActive }),
  });

  return parseResponse<PublicProvider>(response);
}

export async function deleteAdminProvider(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/proveedores/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  await parseResponse<{ deleted: boolean }>(response);
}

export async function vincularUsuarioAProveedor(
  token: string,
  providerId: number,
  email: string
): Promise<{ linked?: boolean; unlinked?: boolean; usuarioId?: number }> {
  const response = await fetch(`${API_BASE_URL}/proveedores/${providerId}/vincular-usuario`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ email }),
  });
  return parseResponse<{ linked?: boolean; unlinked?: boolean; usuarioId?: number }>(response);
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

export async function submitContact(payload: {
  nombre: string;
  email: string;
  telefono?: string;
  asunto: string;
  mensaje: string;
}): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<{ message: string }>(response);
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

export async function getSubscriberSyncStatus(token: string): Promise<SubscriberSyncStatus> {
  const response = await fetch(`${API_BASE_URL}/subscribers/sync/status`, {
    method: "GET",
    cache: "no-store",
    headers: {
      ...authHeaders(token),
    },
  });

  return parseResponse<SubscriberSyncStatus>(response);
}

export async function runSubscriberSync(
  token: string,
  payload?: {
    provider?: "mailrelay" | "mailchimp" | "active";
    limit?: number;
  }
): Promise<SubscriberSyncRunResult> {
  const response = await fetch(`${API_BASE_URL}/subscribers/sync/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload ?? {}),
  });

  return parseResponse<SubscriberSyncRunResult>(response);
}

export async function setSubscriberAutoSync(
  token: string,
  payload: {
    enabled: boolean;
    batchSize?: number;
  }
): Promise<SubscriberSyncStatus> {
  const response = await fetch(`${API_BASE_URL}/subscribers/sync/auto`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<SubscriberSyncStatus>(response);
}

// ─── EcartPay Types ──────────────────────────────────────────────────────────

export type EcartPayItem = {
  name: string;
  price: number;
  quantity: number;
};

export type MediaKitPlan = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  moneda: string;
  items: EcartPayItem[];
  features: string[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaymentLink = {
  id: number;
  token: string;
  planId: number | null;
  usuarioId: number | null;
  descripcion: string | null;
  monto: number;
  moneda: string;
  items: EcartPayItem[];
  estado: "pending" | "paid" | "expired" | "cancelled";
  compradorEmail: string | null;
  compradorNombre: string | null;
  ecartpayOrderId: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Venta = {
  id: number;
  paymentLinkId: number | null;
  planId: number | null;
  usuarioId: number | null;
  compradorEmail: string;
  compradorNombre: string | null;
  compradorTelefono: string | null;
  monto: number;
  moneda: string;
  ecartpayOrderId: string | null;
  ecartpayPayload: object | null;
  estado: "completed" | "refunded";
  createdAt: string;
  updatedAt: string;
};

export type ClientVenta = Venta;
export type ClientPaymentLink = PaymentLink;

export type PublicPayLink = {
  token: string;
  usuarioId: number | null;
  descripcion: string | null;
  monto: number;
  moneda: string;
  items: EcartPayItem[];
  compradorEmail: string | null;
  compradorNombre: string | null;
  expiresAt: string | null;
  estado: string;
  checkoutLink?: string | null;
  ecartpay?: { publicId: string; sandbox: boolean; authorizationToken: string | null };
};

// ─── Media Kit Planes ────────────────────────────────────────────────────────

export async function getPublicMediaKitPlanes(): Promise<MediaKitPlan[]> {
  const response = await fetch(`${API_BASE_URL}/media-kit/planes/public`, {
    cache: "no-store",
  });
  return parseResponse<MediaKitPlan[]>(response);
}

export async function getMediaKitPlanes(token: string): Promise<MediaKitPlan[]> {
  const response = await fetch(`${API_BASE_URL}/admin/media-kit/planes`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  return parseResponse<MediaKitPlan[]>(response);
}

export async function createMediaKitPlan(
  token: string,
  payload: Omit<MediaKitPlan, "id" | "createdAt" | "updatedAt">
): Promise<MediaKitPlan> {
  const response = await fetch(`${API_BASE_URL}/admin/media-kit/planes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  return parseResponse<MediaKitPlan>(response);
}

export async function updateMediaKitPlan(
  token: string,
  id: number,
  payload: Partial<Omit<MediaKitPlan, "id" | "createdAt" | "updatedAt">>
): Promise<MediaKitPlan> {
  const response = await fetch(`${API_BASE_URL}/admin/media-kit/planes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  return parseResponse<MediaKitPlan>(response);
}

export async function deleteMediaKitPlan(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/media-kit/planes/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  await parseResponse<unknown>(response);
}

// ─── Payment Links ───────────────────────────────────────────────────────────

export async function getPaymentLinks(token: string): Promise<PaymentLink[]> {
  const response = await fetch(`${API_BASE_URL}/admin/pagos/links`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  return parseResponse<PaymentLink[]>(response);
}

export async function createPaymentLink(
  token: string,
  payload: {
    planId?: number;
    usuarioId?: number;
    descripcion?: string;
    monto: number;
    moneda?: string;
    items?: EcartPayItem[];
    compradorEmail?: string;
    compradorNombre?: string;
    expiresAt?: string;
  }
): Promise<PaymentLink> {
  const response = await fetch(`${API_BASE_URL}/admin/pagos/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  return parseResponse<PaymentLink>(response);
}

export async function updatePaymentLink(
  token: string,
  id: number,
  payload: {
    planId?: number;
    usuarioId?: number;
    descripcion?: string;
    monto?: number;
    moneda?: string;
    items?: EcartPayItem[];
    compradorEmail?: string;
    compradorNombre?: string;
    expiresAt?: string | null;
  }
): Promise<PaymentLink> {
  const response = await fetch(`${API_BASE_URL}/admin/pagos/links/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  return parseResponse<PaymentLink>(response);
}

export async function cancelPaymentLink(token: string, id: number): Promise<PaymentLink> {
  const response = await fetch(`${API_BASE_URL}/admin/pagos/links/${id}/cancel`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  return parseResponse<PaymentLink>(response);
}

export async function deletePaymentLink(token: string, id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/pagos/links/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  await parseResponse<unknown>(response);
}

export async function validateStripeCredentials(token: string): Promise<{
  sandbox: boolean;
  hasPublicId: boolean;
  hasSecretKey: boolean;
  tokenGenerated: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/admin/pagos/stripe/validate`, {
    method: "GET",
    cache: "no-store",
    headers: authHeaders(token),
  });
  return parseResponse<{
    sandbox: boolean;
    hasPublicId: boolean;
    hasSecretKey: boolean;
    tokenGenerated: boolean;
  }>(response);
}

// ─── Ventas ──────────────────────────────────────────────────────────────────

export async function getVentas(token: string): Promise<Venta[]> {
  const response = await fetch(`${API_BASE_URL}/admin/pagos/ventas`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  return parseResponse<Venta[]>(response);
}

// ─── Public Pay Page ─────────────────────────────────────────────────────────

export async function getPublicPayLink(token: string): Promise<PublicPayLink> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_BASE_URL}/pay/${token}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    return parseResponse<PublicPayLink>(response);
  } finally {
    clearTimeout(timeout);
  }
}

export async function completePayment(
  token: string,
  payload: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    orderId?: string;
    payload?: object;
  },
  clientToken?: string
): Promise<{ venta: Venta }> {
  const response = await fetch(`${API_BASE_URL}/pay/${token}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(clientToken),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ venta: Venta }>(response);
}

export async function getMyPayments(token: string): Promise<ClientVenta[]> {
  const response = await fetch(`${API_BASE_URL}/clientes/pagos`, {
    method: "GET",
    cache: "no-store",
    headers: authHeaders(token),
  });

  return parseResponse<ClientVenta[]>(response);
}

export async function getMyPaymentLinks(token: string): Promise<ClientPaymentLink[]> {
  const response = await fetch(`${API_BASE_URL}/clientes/pagos/links`, {
    method: "GET",
    cache: "no-store",
    headers: authHeaders(token),
  });

  return parseResponse<ClientPaymentLink[]>(response);
}

export async function downloadMyPaymentReceipt(token: string, ventaId: number): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/clientes/pagos/${ventaId}/recibo`, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    let errorMessage = `Error al descargar recibo (${response.status})`;
    try {
      const payload = (await response.json()) as ApiResponse<unknown>;
      if (payload.error) {
        errorMessage = payload.error;
      }
    } catch {
      // no-op
    }
    throw new Error(errorMessage);
  }

  return response.blob();
}

export async function createMediaKitPayment(
  token: string,
  planId: number,
  userData: {
    email: string;
    nombre?: string;
    apellido?: string;
  }
): Promise<{ paymentLink: PaymentLink; checkoutLink?: string }> {
  const response = await fetch(`${API_BASE_URL}/clientes/pagos/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({
      planId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    }),
  });
  
  const data = await parseResponse<PaymentLink & { checkoutLink?: string; paymentUrl?: string }>(response);
  return { 
    paymentLink: data,
    checkoutLink: data.checkoutLink || data.paymentUrl,
  };
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

// ── Empresas Lectoras (Carrusel de marcas) ──────────────────────

export type EmpresaLectora = {
  id: number;
  nombre: string;
  abreviatura: string;
  orden: number;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getReaderCompanies(): Promise<EmpresaLectora[]> {
  const response = await fetch(`${API_BASE_URL}/empresas-lectoras`, {
    cache: "no-store",
  });
  return parseResponse<EmpresaLectora[]>(response);
}

export async function getReaderCompaniesAdmin(token: string): Promise<EmpresaLectora[]> {
  const response = await fetch(`${API_BASE_URL}/empresas-lectoras/admin`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  return parseResponse<EmpresaLectora[]>(response);
}

export async function createReaderCompany(
  token: string,
  payload: Omit<EmpresaLectora, "id" | "createdAt" | "updatedAt">
): Promise<EmpresaLectora> {
  const response = await fetch(`${API_BASE_URL}/empresas-lectoras`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  return parseResponse<EmpresaLectora>(response);
}

export async function updateReaderCompany(
  token: string,
  id: number,
  payload: Partial<Omit<EmpresaLectora, "id" | "createdAt" | "updatedAt">>
): Promise<EmpresaLectora> {
  const response = await fetch(`${API_BASE_URL}/empresas-lectoras/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  return parseResponse<EmpresaLectora>(response);
}

export async function deleteReaderCompany(token: string, id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/empresas-lectoras/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
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
  try {
    const response = await fetch(`${API_BASE_URL}/ads?zona=${zona}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as ApiResponse<Anuncio[]>;
    return payload.data ?? [];
  } catch {
    return [];
  }
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
