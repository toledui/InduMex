import { randomBytes } from "crypto";
import { Router, Request, Response } from "express";
import { Op } from "sequelize";
import MarketplacePlan, {
  MarketplacePeriodicidad,
  MarketplaceVisibilidadNivel,
} from "../models/MarketplacePlan";
import MarketplaceSuscripcion from "../models/MarketplaceSuscripcion";
import MarketplacePerfil from "../models/MarketplacePerfil";
import MarketplaceCategoria from "../models/MarketplaceCategoria";
import MarketplaceProducto from "../models/MarketplaceProducto";
import MarketplaceProductoCampoPersonalizado from "../models/MarketplaceProductoCampoPersonalizado";
import Proveedor from "../models/Proveedor";
import PaymentLink from "../models/PaymentLink";
import Usuario from "../models/Usuario";
import { requireAuth, requireAdminRole } from "../middleware/authMiddleware";
import { failure, success } from "../utils/response";
import { sendMail } from "../utils/mailer";

const router = Router();

const AUTO_RENEWAL_CANCELLED_TYPE = "auto_renovacion_cancelada";

function normalizeNotifications(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
}

function hasAutoRenewalCancelled(raw: unknown): boolean {
  return normalizeNotifications(raw).some(
    (item) => typeof item.type === "string" && item.type === AUTO_RENEWAL_CANCELLED_TYPE
  );
}

function withoutAutoRenewalCancelled(raw: unknown): Array<Record<string, unknown>> {
  return normalizeNotifications(raw).filter(
    (item) => !(typeof item.type === "string" && item.type === AUTO_RENEWAL_CANCELLED_TYPE)
  );
}

function withAutoRenewalCancelled(raw: unknown): Array<Record<string, unknown>> {
  const base = withoutAutoRenewalCancelled(raw);
  base.push({
    type: AUTO_RENEWAL_CANCELLED_TYPE,
    at: new Date().toISOString(),
    source: "cliente",
  });
  return base;
}

function serializeMarketplaceSubscription(suscripcion: MarketplaceSuscripcion) {
  const plain = suscripcion.get({ plain: true }) as MarketplaceSuscripcion & {
    [key: string]: unknown;
  };

  return {
    ...plain,
    autoRenovacionCancelada: hasAutoRenewalCancelled(plain.notificacionesPendientes),
  };
}

const FEATURE_CATALOG = [
  "destacado_home",
  "destacado_categoria",
  "prioridad_listado",
  "productos_ilimitados",
  "badge_verificado",
  "estadisticas_basicas",
  "campos_personalizados",
  "importacion_csv",
] as const;

function getPeriodMonths(periodicidad: MarketplacePeriodicidad): number {
  const map = {
    mensual: 1,
    bimestral: 2,
    trimestral: 3,
    semestral: 6,
    anual: 12,
  } as const;

  return map[periodicidad] ?? 1;
}

function sanitizeCaracteristicas(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const allowed = new Set<string>(FEATURE_CATALOG);
  return raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && allowed.has(item));
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 170);
}

function sanitizeStringArray(raw: unknown): string[] {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePlainObject(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return {};

    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  return raw as Record<string, unknown>;
}

function sanitizeCustomFields(
  raw: unknown
): Array<{ clave: string; valor: string }> {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      return sanitizeCustomFields(JSON.parse(trimmed));
    } catch {
      return [];
    }
  }

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { clave?: unknown; valor?: unknown };
      const clave = typeof row.clave === "string" ? row.clave.trim() : "";
      const valor = typeof row.valor === "string" ? row.valor.trim() : "";
      if (!clave || !valor) return null;
      return { clave: clave.slice(0, 120), valor };
    })
    .filter((item): item is { clave: string; valor: string } => Boolean(item));
}

function getVisibilityRank(nivel?: MarketplaceVisibilidadNivel | null): number {
  if (nivel === "alta") return 2;
  if (nivel === "media") return 1;
  return 0;
}

function getPlainObjectMetadata(raw: unknown): Record<string, unknown> {
  return parsePlainObject(raw);
}

function sanitizeContactValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeSocialNetworks(raw: unknown): Array<{ nombre: string; url: string }> {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { nombre?: unknown; url?: unknown };
      const nombre = typeof row.nombre === "string" ? row.nombre.trim() : "";
      const url = typeof row.url === "string" ? row.url.trim() : "";
      if (!nombre || !url) return null;
      return { nombre: nombre.slice(0, 120), url: url.slice(0, 500) };
    })
    .filter((item): item is { nombre: string; url: string } => Boolean(item));
}

async function generateUniqueCategorySlug(
  usuarioId: number,
  baseName: string,
  excludeId?: number
): Promise<string> {
  const base = slugify(baseName) || `categoria-${usuarioId}`;
  let candidate = base;
  let attempt = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const whereClause: { usuarioId: number; slug: string; id?: { [Op.ne]: number } } = {
      usuarioId,
      slug: candidate,
    };
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const exists = await MarketplaceCategoria.findOne({ where: whereClause });
    if (!exists) return candidate;
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
}

async function generateUniqueProductSlug(
  usuarioId: number,
  baseName: string,
  excludeId?: number
): Promise<string> {
  const base = slugify(baseName) || `producto-${usuarioId}`;
  let candidate = base;
  let attempt = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const whereClause: { usuarioId: number; slug: string; id?: { [Op.ne]: number } } = {
      usuarioId,
      slug: candidate,
    };
    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const exists = await MarketplaceProducto.findOne({ where: whereClause });
    if (!exists) return candidate;
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
}

async function getMarketplaceAccessContext(usuarioId: number) {
  const perfil = await MarketplacePerfil.findOne({ where: { usuarioId } });
  const suscripcion = await MarketplaceSuscripcion.findOne({
    where: {
      usuarioId,
      estado: { [Op.in]: ["activa", "pausada"] },
    },
    include: [{ model: MarketplacePlan, as: "plan" }],
  });

  const plan = (suscripcion as unknown as { plan?: MarketplacePlan | null })?.plan ?? null;
  const vigenteHasta = perfil?.vigenciaHasta ? new Date(perfil.vigenciaHasta) : null;
  const hasActiveAccess =
    Boolean(perfil?.habilitado) &&
    Boolean(suscripcion) &&
    (!vigenteHasta || vigenteHasta >= new Date());

  return {
    perfil,
    suscripcion,
    plan,
    hasActiveAccess,
    maxProductos:
      perfil?.maxProductosOverride ??
      plan?.maxProductos ??
      0,
    maxProductosDestacados: plan?.maxProductosDestacados ?? 0,
    hasUnlimitedProducts: Boolean(plan?.caracteristicas?.includes("productos_ilimitados")),
  };
}

async function mapProductsForResponse(productos: MarketplaceProducto[]) {
  const productIds = productos.map((item) => item.id);
  const customFields = productIds.length
    ? await MarketplaceProductoCampoPersonalizado.findAll({
        where: { productoId: productIds },
        order: [["createdAt", "ASC"]],
      })
    : [];

  const fieldsByProduct = new Map<number, Array<{ id: number; clave: string; valor: string }>>();
  for (const field of customFields) {
    const row = fieldsByProduct.get(field.productoId) ?? [];
    row.push({ id: field.id, clave: field.clave, valor: field.valor });
    fieldsByProduct.set(field.productoId, row);
  }

  return productos.map((producto) => {
    const plain = producto.get({ plain: true }) as MarketplaceProducto & {
      categoria?: MarketplaceCategoria;
    };
    return {
      id: plain.id,
      usuarioId: plain.usuarioId,
      categoriaId: plain.categoriaId,
      sku: plain.sku,
      nombre: plain.nombre,
      slug: plain.slug,
      descripcion: plain.descripcion,
      precio: Number(plain.precio),
      moneda: plain.moneda,
      stock: plain.stock,
      destacado: plain.destacado,
      estado: plain.estado,
      imagenes: sanitizeStringArray(plain.imagenes),
      metadata: getPlainObjectMetadata(plain.metadata),
      categoria: plain.categoria
        ? {
            id: plain.categoria.id,
            nombre: plain.categoria.nombre,
            slug: plain.categoria.slug,
          }
        : null,
      camposPersonalizados: fieldsByProduct.get(plain.id) ?? [],
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  });
}

async function mapPublicMarketplaceProducts(
  productos: MarketplaceProducto[],
  sellersByUserId: Map<number, {
    nivelVisibilidad: MarketplaceVisibilidadNivel;
    planNombre: string;
    usuarioNombre: string;
    usuarioApellido: string | null;
    empresa: string | null;
    logo: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    socialNetworks: Array<{ nombre: string; url: string }>;
  }>
) {
  const productIds = productos.map((item) => item.id);
  const customFields = productIds.length
    ? await MarketplaceProductoCampoPersonalizado.findAll({
        where: { productoId: productIds },
        order: [["createdAt", "ASC"]],
      })
    : [];

  const fieldsByProduct = new Map<number, Array<{ id: number; clave: string; valor: string }>>();
  for (const field of customFields) {
    const row = fieldsByProduct.get(field.productoId) ?? [];
    row.push({ id: field.id, clave: field.clave, valor: field.valor });
    fieldsByProduct.set(field.productoId, row);
  }

  const mapped = productos.map((producto) => {
    const plain = producto.get({ plain: true }) as MarketplaceProducto & {
      categoria?: MarketplaceCategoria;
      usuario?: Usuario;
    };
    const seller = sellersByUserId.get(plain.usuarioId) ?? null;

    return {
      id: plain.id,
      usuarioId: plain.usuarioId,
      categoriaId: plain.categoriaId,
      sku: plain.sku,
      nombre: plain.nombre,
      slug: plain.slug,
      descripcion: plain.descripcion,
      precio: Number(plain.precio),
      moneda: plain.moneda,
      stock: plain.stock,
      destacado: plain.destacado,
      estado: plain.estado,
      imagenes: sanitizeStringArray(plain.imagenes),
      metadata: getPlainObjectMetadata(plain.metadata),
      categoria: plain.categoria
        ? {
            id: plain.categoria.id,
            nombre: plain.categoria.nombre,
            slug: plain.categoria.slug,
          }
        : null,
      vendedor: seller
        ? {
            usuarioId: plain.usuarioId,
            nombre: seller.usuarioNombre,
            apellido: seller.usuarioApellido,
            empresa: seller.empresa,
            nivelVisibilidad: seller.nivelVisibilidad,
            planNombre: seller.planNombre,
            logo: seller.logo,
            website: seller.website,
            email: seller.email,
            phone: seller.phone,
            whatsapp: seller.whatsapp,
            socialNetworks: seller.socialNetworks,
          }
        : plain.usuario
          ? {
              usuarioId: plain.usuarioId,
              nombre: plain.usuario.nombre,
              apellido: plain.usuario.apellido ?? null,
              empresa: plain.usuario.empresa ?? null,
              nivelVisibilidad: "base" as MarketplaceVisibilidadNivel,
              planNombre: "Marketplace",
              logo: null,
              website: null,
              email: sanitizeContactValue(plain.usuario.email),
              phone: null,
              whatsapp: null,
              socialNetworks: [],
            }
          : null,
      camposPersonalizados: fieldsByProduct.get(plain.id) ?? [],
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  });

  mapped.sort((a, b) => {
    if (a.destacado !== b.destacado) return Number(b.destacado) - Number(a.destacado);

    const visibilityA = getVisibilityRank(a.vendedor?.nivelVisibilidad ?? null);
    const visibilityB = getVisibilityRank(b.vendedor?.nivelVisibilidad ?? null);
    if (visibilityA !== visibilityB) return visibilityB - visibilityA;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return mapped;
}

// GET /marketplace/catalogo
router.get("/marketplace/catalogo", async (_req: Request, res: Response) => {
  try {
    const now = new Date();

    const perfilesActivos = await MarketplacePerfil.findAll({
      where: {
        habilitado: true,
        [Op.or]: [{ vigenciaHasta: null }, { vigenciaHasta: { [Op.gte]: now } }],
      },
      include: [
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "nombre", "apellido", "empresa", "email"],
        },
      ],
    });

    const perfilesPorUsuarioId = new Map<number, (typeof perfilesActivos)[number]>();
    perfilesActivos.forEach((perfil) => {
      perfilesPorUsuarioId.set(perfil.usuarioId, perfil);
    });

    const suscripcionesActivas = await MarketplaceSuscripcion.findAll({
      where: {
        usuarioId: { [Op.in]: [...perfilesPorUsuarioId.keys()] },
        estado: { [Op.in]: ["activa", "pausada"] },
        fechaVencimiento: { [Op.gte]: now },
      },
      include: [
        {
          model: MarketplacePlan,
          as: "plan",
          attributes: ["id", "nombre", "nivelVisibilidad"],
        },
      ],
    });

    const sellersByUserId = new Map<number, {
      nivelVisibilidad: MarketplaceVisibilidadNivel;
      planNombre: string;
      usuarioNombre: string;
      usuarioApellido: string | null;
      empresa: string | null;
      logo: string | null;
      website: string | null;
      email: string | null;
      phone: string | null;
      whatsapp: string | null;
      socialNetworks: Array<{ nombre: string; url: string }>;
    }>();

    const providerProfiles = await Proveedor.findAll({
      where: {
        usuarioId: { [Op.in]: [...perfilesPorUsuarioId.keys()] },
        isActive: true,
      },
      attributes: ["usuarioId", "name", "logo", "website", "email", "phone", "whatsapp", "socialNetworks"],
    });

    const providerByUserId = new Map<number, {
      nombre: string | null;
      empresa: string | null;
      logo: string | null;
      website: string | null;
      email: string | null;
      phone: string | null;
      whatsapp: string | null;
      socialNetworks: Array<{ nombre: string; url: string }>;
    }>();

    providerProfiles.forEach((provider) => {
      if (!provider.usuarioId) return;

      providerByUserId.set(provider.usuarioId, {
        nombre: sanitizeContactValue(provider.name),
        empresa: sanitizeContactValue(provider.name),
        logo: sanitizeContactValue(provider.logo),
        website: sanitizeContactValue(provider.website),
        email: sanitizeContactValue(provider.email),
        phone: sanitizeContactValue(provider.phone),
        whatsapp: sanitizeContactValue(provider.whatsapp),
        socialNetworks: sanitizeSocialNetworks(provider.socialNetworks),
      });
    });

    suscripcionesActivas.forEach((suscripcion) => {
      const perfil = perfilesPorUsuarioId.get(suscripcion.usuarioId);
      const usuario = (perfil as unknown as { usuario?: Usuario | null })?.usuario ?? null;
      const plan = (suscripcion as unknown as { plan?: MarketplacePlan | null })?.plan ?? null;

      if (!perfil || !usuario || !plan) return;

      const provider = providerByUserId.get(suscripcion.usuarioId);

      sellersByUserId.set(suscripcion.usuarioId, {
        nivelVisibilidad: plan.nivelVisibilidad,
        planNombre: plan.nombre,
        usuarioNombre: provider?.nombre ?? usuario.nombre,
        usuarioApellido: usuario.apellido ?? null,
        empresa: provider?.empresa ?? usuario.empresa ?? null,
        logo: provider?.logo ?? null,
        website: provider?.website ?? null,
        email: provider?.email ?? sanitizeContactValue(usuario.email),
        phone: provider?.phone ?? null,
        whatsapp: provider?.whatsapp ?? null,
        socialNetworks: provider?.socialNetworks ?? [],
      });
    });

    const sellerIds = [...sellersByUserId.keys()];
    if (sellerIds.length === 0) {
      return success(res, { productos: [], categorias: [] });
    }

    const productos = await MarketplaceProducto.findAll({
      where: {
        usuarioId: { [Op.in]: sellerIds },
        estado: "publicado",
      },
      include: [
        {
          model: MarketplaceCategoria,
          as: "categoria",
          attributes: ["id", "nombre", "slug"],
        },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "nombre", "apellido", "empresa", "email"],
        },
      ],
      order: [["destacado", "DESC"], ["createdAt", "DESC"]],
    });

    const productosPublicos = await mapPublicMarketplaceProducts(productos, sellersByUserId);
    const categoriasMap = new Map<number, { id: number; nombre: string; slug: string }>();

    productosPublicos.forEach((producto) => {
      if (producto.categoria) {
        categoriasMap.set(producto.categoria.id, producto.categoria);
      }
    });

    success(res, {
      productos: productosPublicos,
      categorias: [...categoriasMap.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    });
  } catch {
    failure(res, "Error al obtener catálogo público de marketplace", 500);
  }
});

// GET /admin/marketplace/feature-catalog
router.get(
  "/admin/marketplace/feature-catalog",
  requireAuth,
  requireAdminRole,
  async (_req: Request, res: Response) => {
    success(res, FEATURE_CATALOG);
  }
);

// GET /admin/marketplace/planes
router.get(
  "/admin/marketplace/planes",
  requireAuth,
  requireAdminRole,
  async (_req: Request, res: Response) => {
    try {
      const planes = await MarketplacePlan.findAll({
        order: [["precio", "ASC"]],
      });

      success(res, planes);
    } catch {
      failure(res, "Error al obtener planes de marketplace", 500);
    }
  }
);

// POST /admin/marketplace/planes
router.post(
  "/admin/marketplace/planes",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const {
        nombre,
        descripcion,
        precio,
        moneda,
        periodicidad,
        caracteristicas,
        maxProductos,
        maxProductosDestacados,
        nivelVisibilidad,
        activo,
      } = req.body as {
        nombre: string;
        descripcion?: string | null;
        precio: number;
        moneda?: string;
        periodicidad?: MarketplacePeriodicidad;
        caracteristicas?: string[];
        maxProductos?: number;
        maxProductosDestacados?: number;
        nivelVisibilidad?: MarketplaceVisibilidadNivel;
        activo?: boolean;
      };

      if (!nombre?.trim()) {
        return failure(res, "nombre es obligatorio", 400);
      }

      if (Number(precio) <= 0) {
        return failure(res, "precio debe ser mayor a 0", 400);
      }

      const plan = await MarketplacePlan.create({
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        precio: Number(precio),
        moneda: moneda || "MXN",
        periodicidad: periodicidad || "mensual",
        caracteristicas: sanitizeCaracteristicas(caracteristicas || []),
        maxProductos: Number.isFinite(maxProductos) ? Number(maxProductos) : 20,
        maxProductosDestacados: Number.isFinite(maxProductosDestacados)
          ? Number(maxProductosDestacados)
          : 0,
        nivelVisibilidad: nivelVisibilidad || "base",
        activo: activo ?? true,
      });

      success(res, plan, 201);
    } catch (err) {
      if ((err as Error)?.name === "SequelizeUniqueConstraintError") {
        return failure(res, "Ya existe un plan con ese nombre", 409);
      }
      failure(res, "Error al crear plan de marketplace", 500);
    }
  }
);

// PUT /admin/marketplace/planes/:id
router.put(
  "/admin/marketplace/planes/:id",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return failure(res, "ID inválido", 400);
      }

      const plan = await MarketplacePlan.findByPk(id);
      if (!plan) {
        return failure(res, "Plan no encontrado", 404);
      }

      const {
        nombre,
        descripcion,
        precio,
        moneda,
        periodicidad,
        caracteristicas,
        maxProductos,
        maxProductosDestacados,
        nivelVisibilidad,
        activo,
      } = req.body as Partial<{
        nombre: string;
        descripcion: string | null;
        precio: number;
        moneda: string;
        periodicidad: MarketplacePeriodicidad;
        caracteristicas: string[];
        maxProductos: number;
        maxProductosDestacados: number;
        nivelVisibilidad: MarketplaceVisibilidadNivel;
        activo: boolean;
      }>;

      await plan.update({
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
        ...(precio !== undefined && { precio: Number(precio) }),
        ...(moneda !== undefined && { moneda }),
        ...(periodicidad !== undefined && { periodicidad }),
        ...(caracteristicas !== undefined && {
          caracteristicas: sanitizeCaracteristicas(caracteristicas),
        }),
        ...(maxProductos !== undefined && { maxProductos: Number(maxProductos) }),
        ...(maxProductosDestacados !== undefined && {
          maxProductosDestacados: Number(maxProductosDestacados),
        }),
        ...(nivelVisibilidad !== undefined && { nivelVisibilidad }),
        ...(activo !== undefined && { activo }),
      });

      success(res, plan);
    } catch (err) {
      if ((err as Error)?.name === "SequelizeUniqueConstraintError") {
        return failure(res, "Ya existe un plan con ese nombre", 409);
      }
      failure(res, "Error al actualizar plan de marketplace", 500);
    }
  }
);

// DELETE /admin/marketplace/planes/:id
router.delete(
  "/admin/marketplace/planes/:id",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return failure(res, "ID inválido", 400);
      }

      const plan = await MarketplacePlan.findByPk(id);
      if (!plan) {
        return failure(res, "Plan no encontrado", 404);
      }

      const activas = await MarketplaceSuscripcion.count({
        where: {
          planId: id,
          estado: { [Op.in]: ["activa", "pausada"] },
        },
      });

      if (activas > 0) {
        return failure(
          res,
          "No se puede eliminar un plan con suscripciones activas. Desactívalo en su lugar.",
          409
        );
      }

      await plan.destroy();
      success(res, { deleted: true });
    } catch {
      failure(res, "Error al eliminar plan de marketplace", 500);
    }
  }
);

// GET /admin/marketplace/suscripciones
router.get(
  "/admin/marketplace/suscripciones",
  requireAuth,
  requireAdminRole,
  async (_req: Request, res: Response) => {
    try {
      const suscripciones = await MarketplaceSuscripcion.findAll({
        include: [
          { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
          { model: MarketplacePlan, as: "plan" },
        ],
        order: [["createdAt", "DESC"]],
      });

      success(res, suscripciones);
    } catch {
      failure(res, "Error al obtener suscripciones de marketplace", 500);
    }
  }
);

// GET /admin/marketplace/perfiles
router.get(
  "/admin/marketplace/perfiles",
  requireAuth,
  requireAdminRole,
  async (_req: Request, res: Response) => {
    try {
      const perfiles = await MarketplacePerfil.findAll({
        include: [{ model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] }],
        order: [["updatedAt", "DESC"]],
      });

      success(res, perfiles);
    } catch {
      failure(res, "Error al obtener perfiles de marketplace", 500);
    }
  }
);

// PATCH /admin/marketplace/perfiles/:usuarioId
router.patch(
  "/admin/marketplace/perfiles/:usuarioId",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const usuarioId = Number(req.params.usuarioId);
      if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return failure(res, "usuarioId inválido", 400);
      }

      const usuario = await Usuario.findByPk(usuarioId);
      if (!usuario) {
        return failure(res, "Usuario no encontrado", 404);
      }

      const { habilitado, maxProductosOverride, vigenciaHasta, notasAdmin } = req.body as Partial<{
        habilitado: boolean;
        maxProductosOverride: number | null;
        vigenciaHasta: string | null;
        notasAdmin: string | null;
      }>;

      const [perfil] = await MarketplacePerfil.findOrCreate({
        where: { usuarioId },
        defaults: { usuarioId, habilitado: false },
      });

      await perfil.update({
        ...(habilitado !== undefined && { habilitado }),
        ...(maxProductosOverride !== undefined && { maxProductosOverride }),
        ...(vigenciaHasta !== undefined && {
          vigenciaHasta: vigenciaHasta ? new Date(vigenciaHasta) : null,
        }),
        ...(notasAdmin !== undefined && { notasAdmin: notasAdmin?.trim() || null }),
      });

      success(res, perfil);
    } catch {
      failure(res, "Error al actualizar perfil de marketplace", 500);
    }
  }
);

// GET /clientes/marketplace-planes/activos
router.get("/clientes/marketplace-planes/activos", async (_req: Request, res: Response) => {
  try {
    const planes = await MarketplacePlan.findAll({
      where: { activo: true },
      order: [["precio", "ASC"]],
    });

    success(res, planes);
  } catch {
    failure(res, "Error al obtener planes de marketplace", 500);
  }
});

// GET /clientes/marketplace-suscripcion/actual
router.get(
  "/clientes/marketplace-suscripcion/actual",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!req.auth) return failure(res, "No autorizado", 401);

      const suscripcion = await MarketplaceSuscripcion.findOne({
        where: {
          usuarioId: req.auth.userId,
          estado: { [Op.in]: ["activa", "pausada"] },
        },
        include: [
          { model: MarketplacePlan, as: "plan" },
          {
            model: PaymentLink,
            as: "ultimoLinkPago",
            attributes: ["id", "token", "estado", "monto", "expiresAt"],
          },
        ],
      });

      success(res, suscripcion ? serializeMarketplaceSubscription(suscripcion) : null);
    } catch {
      failure(res, "Error al obtener suscripción de marketplace", 500);
    }
  }
);

// POST /clientes/marketplace-suscripcion/crear
router.post(
  "/clientes/marketplace-suscripcion/crear",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!req.auth) return failure(res, "No autorizado", 401);

      const { planId } = req.body as { planId: number };
      if (!planId) return failure(res, "planId es requerido", 400);

      const plan = await MarketplacePlan.findByPk(planId);
      if (!plan || !plan.activo) {
        return failure(res, "Plan no encontrado o inactivo", 404);
      }

      const usuario = await Usuario.findByPk(req.auth.userId);
      if (!usuario) {
        return failure(res, "Usuario no encontrado", 404);
      }

      const ahora = new Date();
      const vencimiento = new Date(ahora);
      vencimiento.setMonth(vencimiento.getMonth() + getPeriodMonths(plan.periodicidad));

      const existente = await MarketplaceSuscripcion.findOne({
        where: {
          usuarioId: req.auth.userId,
          estado: { [Op.in]: ["activa", "pausada"] },
        },
        include: [{ model: PaymentLink, as: "ultimoLinkPago" }],
      });

      let suscripcion: MarketplaceSuscripcion;
      if (existente) {
        if (existente.planId === planId) {
          const ultimo = (existente as unknown as { ultimoLinkPago?: PaymentLink | null }).ultimoLinkPago;
          const pendingVigente =
            ultimo?.estado === "pending" && (!ultimo.expiresAt || new Date(ultimo.expiresAt) > ahora);

          if (pendingVigente) {
            return failure(
              res,
              "Ya tienes un link de pago pendiente para este plan de marketplace.",
              409
            );
          }
        }

        await existente.update({
          planId,
          estado: "pausada",
          fechaInicio: ahora,
          fechaVencimiento: vencimiento,
          periodoGraciaVencimientoEn: null,
          proximoLinkPagoGeneradoEn: null,
          notificacionesPendientes: withoutAutoRenewalCancelled(existente.notificacionesPendientes),
        });
        suscripcion = existente;
      } else {
        suscripcion = await MarketplaceSuscripcion.create({
          usuarioId: req.auth.userId,
          planId,
          estado: "pausada",
          fechaInicio: ahora,
          fechaVencimiento: vencimiento,
          periodoGraciaVencimientoEn: null,
          notificacionesPendientes: [],
        });
      }

      const paymentLink = await PaymentLink.create({
        token: randomBytes(24).toString("hex"),
        descripcion: `Marketplace: ${plan.nombre}`,
        monto: Number(plan.precio),
        moneda: plan.moneda,
        items: [
          {
            name: `${plan.nombre} - Marketplace`,
            price: Number(plan.precio),
            quantity: 1,
          },
        ],
        estado: "pending",
        compradorEmail: usuario.email,
        compradorNombre: usuario.nombre ?? null,
        usuarioId: req.auth.userId,
      });

      await suscripcion.update({ ultimoLinkPagoId: paymentLink.id });

      const [perfil] = await MarketplacePerfil.findOrCreate({
        where: { usuarioId: req.auth.userId },
        defaults: { usuarioId: req.auth.userId, habilitado: false },
      });

      await perfil.update({
        habilitado: false,
      });

      const frontendBaseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:3000";

      await sendMail({
        to: [usuario.email],
        subject: "Suscripción Marketplace lista para pago - InduMex",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8f9fa; padding: 24px;">
            <div style="background: #004AAD; padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #fff; font-size: 20px;">Marketplace listo para activarse</h1>
            </div>
            <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
              <p>Hola ${usuario.nombre ?? ""},</p>
              <p>Generamos tu suscripción de marketplace. Completa el pago para activar tu perfil.</p>
              <ul>
                <li><strong>Plan:</strong> ${plan.nombre}</li>
                <li><strong>Precio:</strong> ${Number(plan.precio).toLocaleString("es-MX", {
                  style: "currency",
                  currency: plan.moneda,
                })}</li>
                <li><strong>Periodicidad:</strong> ${plan.periodicidad}</li>
              </ul>
              <p style="margin: 20px 0;">
                <a href="${frontendBaseUrl}/pagar/${paymentLink.token}" style="background: #F58634; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Pagar y activar marketplace
                </a>
              </p>
            </div>
          </div>
        `,
        text: `Tu plan de marketplace ${plan.nombre} está listo. Paga en ${frontendBaseUrl}/pagar/${paymentLink.token}`,
      });

      success(
        res,
        {
          suscripcion,
          paymentLink: {
            id: paymentLink.id,
            token: paymentLink.token,
          },
        },
        201
      );
    } catch {
      failure(res, "Error al crear suscripción de marketplace", 500);
    }
  }
);

// PATCH /clientes/marketplace-suscripcion/cancelar-renovacion
router.patch(
  "/clientes/marketplace-suscripcion/cancelar-renovacion",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!req.auth) return failure(res, "No autorizado", 401);

      const ahora = new Date();

      const suscripcion = await MarketplaceSuscripcion.findOne({
        where: {
          usuarioId: req.auth.userId,
          estado: { [Op.in]: ["activa", "pausada"] },
          fechaVencimiento: { [Op.gte]: ahora },
        },
        include: [
          { model: MarketplacePlan, as: "plan" },
          {
            model: PaymentLink,
            as: "ultimoLinkPago",
            attributes: ["id", "token", "estado", "monto", "expiresAt"],
            required: false,
          },
        ],
      });

      if (!suscripcion) {
        return failure(res, "No tienes una suscripción de marketplace activa para cancelar renovación.", 404);
      }

      if (hasAutoRenewalCancelled(suscripcion.notificacionesPendientes)) {
        return failure(res, "La renovación automática ya está cancelada para marketplace.", 409);
      }

      const ultimoLinkPago = (suscripcion as unknown as { ultimoLinkPago?: PaymentLink | null }).ultimoLinkPago;

      if (ultimoLinkPago?.estado === "pending") {
        await ultimoLinkPago.update({ estado: "cancelled" });
      }

      await suscripcion.update({
        notificacionesPendientes: withAutoRenewalCancelled(suscripcion.notificacionesPendientes),
        proximoLinkPagoGeneradoEn: new Date(),
      });

      await suscripcion.reload({
        include: [
          { model: MarketplacePlan, as: "plan" },
          {
            model: PaymentLink,
            as: "ultimoLinkPago",
            attributes: ["id", "token", "estado", "monto", "expiresAt"],
            required: false,
          },
        ],
      });

      success(res, serializeMarketplaceSubscription(suscripcion));
    } catch {
      failure(res, "Error al cancelar renovación automática de marketplace", 500);
    }
  }
);

// GET /clientes/marketplace-perfil
router.get("/clientes/marketplace-perfil", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.auth) return failure(res, "No autorizado", 401);

    const perfil = await MarketplacePerfil.findOne({
      where: { usuarioId: req.auth.userId },
    });

    success(res, perfil);
  } catch {
    failure(res, "Error al obtener perfil de marketplace", 500);
  }
});

// GET /clientes/marketplace-categorias
router.get("/clientes/marketplace-categorias", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.auth) return failure(res, "No autorizado", 401);

    const { hasActiveAccess } = await getMarketplaceAccessContext(req.auth.userId);
    if (!hasActiveAccess) {
      return failure(res, "Marketplace no habilitado para esta cuenta", 403);
    }

    const categorias = await MarketplaceCategoria.findAll({
      where: { usuarioId: req.auth.userId },
      order: [["nombre", "ASC"]],
    });

    success(res, categorias);
  } catch {
    failure(res, "Error al obtener categorías de marketplace", 500);
  }
});

// POST /clientes/marketplace-categorias
router.post("/clientes/marketplace-categorias", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.auth) return failure(res, "No autorizado", 401);

    const { hasActiveAccess } = await getMarketplaceAccessContext(req.auth.userId);
    if (!hasActiveAccess) {
      return failure(res, "Marketplace no habilitado para esta cuenta", 403);
    }

    const { nombre, descripcion, activa } = req.body as {
      nombre: string;
      descripcion?: string | null;
      activa?: boolean;
    };

    if (!nombre?.trim()) {
      return failure(res, "El nombre de la categoría es obligatorio", 400);
    }

    const categoria = await MarketplaceCategoria.create({
      usuarioId: req.auth.userId,
      nombre: nombre.trim(),
      slug: await generateUniqueCategorySlug(req.auth.userId, nombre.trim()),
      descripcion: descripcion?.trim() || null,
      activa: activa ?? true,
    });

    success(res, categoria, 201);
  } catch {
    failure(res, "Error al crear categoría de marketplace", 500);
  }
});

// DELETE /clientes/marketplace-categorias/:id
router.delete(
  "/clientes/marketplace-categorias/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!req.auth) return failure(res, "No autorizado", 401);

      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return failure(res, "ID inválido", 400);
      }

      const categoria = await MarketplaceCategoria.findOne({
        where: { id, usuarioId: req.auth.userId },
      });

      if (!categoria) {
        return failure(res, "Categoría no encontrada", 404);
      }

      const productsCount = await MarketplaceProducto.count({
        where: { categoriaId: categoria.id, usuarioId: req.auth.userId },
      });

      if (productsCount > 0) {
        return failure(
          res,
          "No puedes eliminar una categoría con productos asignados.",
          409
        );
      }

      await categoria.destroy();
      success(res, { deleted: true });
    } catch {
      failure(res, "Error al eliminar categoría", 500);
    }
  }
);

// GET /clientes/marketplace-productos
router.get("/clientes/marketplace-productos", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.auth) return failure(res, "No autorizado", 401);

    const { hasActiveAccess } = await getMarketplaceAccessContext(req.auth.userId);
    if (!hasActiveAccess) {
      return failure(res, "Marketplace no habilitado para esta cuenta", 403);
    }

    const productos = await MarketplaceProducto.findAll({
      where: { usuarioId: req.auth.userId },
      include: [{ model: MarketplaceCategoria, as: "categoria" }],
      order: [["createdAt", "DESC"]],
    });

    success(res, await mapProductsForResponse(productos));
  } catch {
    failure(res, "Error al obtener productos de marketplace", 500);
  }
});

// POST /clientes/marketplace-productos
router.post("/clientes/marketplace-productos", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.auth) return failure(res, "No autorizado", 401);

    const access = await getMarketplaceAccessContext(req.auth.userId);
    if (!access.hasActiveAccess) {
      return failure(res, "Marketplace no habilitado para esta cuenta", 403);
    }

    const {
      categoriaId,
      sku,
      nombre,
      descripcion,
      precio,
      moneda,
      stock,
      destacado,
      estado,
      imagenes,
      metadata,
      camposPersonalizados,
    } = req.body as {
      categoriaId: number;
      sku: string;
      nombre: string;
      descripcion?: string | null;
      precio: number;
      moneda?: string;
      stock?: number;
      destacado?: boolean;
      estado?: "borrador" | "publicado" | "archivado";
      imagenes?: string[];
      metadata?: Record<string, unknown>;
      camposPersonalizados?: Array<{ clave: string; valor: string }>;
    };

    if (!Number.isInteger(Number(categoriaId))) {
      return failure(res, "categoriaId es obligatorio", 400);
    }
    if (!sku?.trim()) {
      return failure(res, "sku es obligatorio", 400);
    }
    if (!nombre?.trim()) {
      return failure(res, "nombre es obligatorio", 400);
    }
    if (!Number.isFinite(Number(precio)) || Number(precio) < 0) {
      return failure(res, "precio inválido", 400);
    }

    const categoria = await MarketplaceCategoria.findOne({
      where: { id: Number(categoriaId), usuarioId: req.auth.userId, activa: true },
    });
    if (!categoria) {
      return failure(res, "La categoría seleccionada no existe o no te pertenece", 404);
    }

    const productCount = await MarketplaceProducto.count({
      where: { usuarioId: req.auth.userId },
    });
    if (!access.hasUnlimitedProducts && productCount >= access.maxProductos) {
      return failure(res, "Ya alcanzaste el límite de productos de tu plan", 409);
    }

    if (destacado) {
      const destacadosCount = await MarketplaceProducto.count({
        where: { usuarioId: req.auth.userId, destacado: true },
      });
      if (destacadosCount >= access.maxProductosDestacados) {
        return failure(res, "Ya alcanzaste el límite de productos destacados de tu plan", 409);
      }
    }

    const producto = await MarketplaceProducto.create({
      usuarioId: req.auth.userId,
      categoriaId: categoria.id,
      sku: sku.trim(),
      nombre: nombre.trim(),
      slug: await generateUniqueProductSlug(req.auth.userId, nombre.trim()),
      descripcion: descripcion?.trim() || null,
      precio: Number(precio),
      moneda: moneda || "MXN",
      stock: Number.isFinite(stock) ? Number(stock) : 0,
      destacado: Boolean(destacado),
      estado: estado || "borrador",
      imagenes: sanitizeStringArray(imagenes),
      metadata: parsePlainObject(metadata),
    });

    const sanitizedFields = sanitizeCustomFields(camposPersonalizados);
    if (sanitizedFields.length > 0) {
      await MarketplaceProductoCampoPersonalizado.bulkCreate(
        sanitizedFields.map((field) => ({
          productoId: producto.id,
          clave: field.clave,
          valor: field.valor,
        }))
      );
    }

    const created = await MarketplaceProducto.findAll({
      where: { id: producto.id },
      include: [{ model: MarketplaceCategoria, as: "categoria" }],
    });

    success(res, (await mapProductsForResponse(created))[0], 201);
  } catch (err) {
    if ((err as Error)?.name === "SequelizeUniqueConstraintError") {
      return failure(res, "SKU o slug duplicado en tu catálogo", 409);
    }
    failure(res, "Error al crear producto de marketplace", 500);
  }
});

// PUT /clientes/marketplace-productos/:id
router.put(
  "/clientes/marketplace-productos/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!req.auth) return failure(res, "No autorizado", 401);

      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return failure(res, "ID inválido", 400);
      }

      const access = await getMarketplaceAccessContext(req.auth.userId);
      if (!access.hasActiveAccess) {
        return failure(res, "Marketplace no habilitado para esta cuenta", 403);
      }

      const producto = await MarketplaceProducto.findOne({
        where: { id, usuarioId: req.auth.userId },
      });

      if (!producto) {
        return failure(res, "Producto no encontrado", 404);
      }

      const {
        categoriaId,
        sku,
        nombre,
        descripcion,
        precio,
        moneda,
        stock,
        destacado,
        estado,
        imagenes,
        metadata,
        camposPersonalizados,
      } = req.body as Partial<{
        categoriaId: number;
        sku: string;
        nombre: string;
        descripcion: string | null;
        precio: number;
        moneda: string;
        stock: number;
        destacado: boolean;
        estado: "borrador" | "publicado" | "archivado";
        imagenes: string[];
        metadata: Record<string, unknown>;
        camposPersonalizados: Array<{ clave: string; valor: string }>;
      }>;

      if (categoriaId !== undefined) {
        const categoria = await MarketplaceCategoria.findOne({
          where: { id: Number(categoriaId), usuarioId: req.auth.userId, activa: true },
        });
        if (!categoria) {
          return failure(res, "La categoría seleccionada no existe o no te pertenece", 404);
        }
        producto.categoriaId = categoria.id;
      }

      const nextDestacado = destacado ?? producto.destacado;
      if (nextDestacado && !producto.destacado) {
        const destacadosCount = await MarketplaceProducto.count({
          where: { usuarioId: req.auth.userId, destacado: true },
        });
        if (destacadosCount >= access.maxProductosDestacados) {
          return failure(res, "Ya alcanzaste el límite de productos destacados de tu plan", 409);
        }
      }

      await producto.update({
        ...(sku !== undefined && { sku: sku.trim() }),
        ...(nombre !== undefined && {
          nombre: nombre.trim(),
          slug: await generateUniqueProductSlug(req.auth.userId, nombre.trim(), producto.id),
        }),
        ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
        ...(precio !== undefined && { precio: Number(precio) }),
        ...(moneda !== undefined && { moneda }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(destacado !== undefined && { destacado }),
        ...(estado !== undefined && { estado }),
        ...(imagenes !== undefined && { imagenes: sanitizeStringArray(imagenes) }),
        ...(metadata !== undefined && { metadata: parsePlainObject(metadata) }),
      });

      if (camposPersonalizados !== undefined) {
        await MarketplaceProductoCampoPersonalizado.destroy({ where: { productoId: producto.id } });
        const sanitizedFields = sanitizeCustomFields(camposPersonalizados);
        if (sanitizedFields.length > 0) {
          await MarketplaceProductoCampoPersonalizado.bulkCreate(
            sanitizedFields.map((field) => ({
              productoId: producto.id,
              clave: field.clave,
              valor: field.valor,
            }))
          );
        }
      }

      const updated = await MarketplaceProducto.findAll({
        where: { id: producto.id },
        include: [{ model: MarketplaceCategoria, as: "categoria" }],
      });
      success(res, (await mapProductsForResponse(updated))[0]);
    } catch (err) {
      if ((err as Error)?.name === "SequelizeUniqueConstraintError") {
        return failure(res, "SKU o slug duplicado en tu catálogo", 409);
      }
      failure(res, "Error al actualizar producto", 500);
    }
  }
);

// DELETE /clientes/marketplace-productos/:id
router.delete(
  "/clientes/marketplace-productos/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!req.auth) return failure(res, "No autorizado", 401);

      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return failure(res, "ID inválido", 400);
      }

      const producto = await MarketplaceProducto.findOne({
        where: { id, usuarioId: req.auth.userId },
      });

      if (!producto) {
        return failure(res, "Producto no encontrado", 404);
      }

      await MarketplaceProductoCampoPersonalizado.destroy({ where: { productoId: producto.id } });
      await producto.destroy();
      success(res, { deleted: true });
    } catch {
      failure(res, "Error al eliminar producto", 500);
    }
  }
);

export default router;
