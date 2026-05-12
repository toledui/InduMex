import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import Proveedor from "../models/Proveedor";
import Usuario from "../models/Usuario";
import { success, failure } from "../utils/response";
import { requireAuth, requireAdminRole } from "../middleware/authMiddleware";
import suscriptorService from "../services/suscriptorService";

const router = Router();
const uploadDir = path.resolve(__dirname, "..", "..", "uploads", "providers");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase() || ".png";
    const safeBase = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

    cb(null, `${safeBase || "logo"}-${Date.now()}${extension}`);
  },
});

const uploadLogo = multer({
  storage,
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpeg|jpg|webp|svg\+xml)$/i.test(file.mimetype)) {
      cb(new Error("Solo se permiten archivos PNG, JPG, WebP o SVG."));
      return;
    }
    cb(null, true);
  },
});

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function pickPrimarySector(sectors: unknown, fallback = 'General'): string {
  const values = toArray(sectors);
  return values[0] ?? fallback;
}

function normalizeSocialNetworks(value: unknown): Array<{ nombre: string; url: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const nombre = typeof record.nombre === 'string' ? record.nombre.trim() : '';
      const url = typeof record.url === 'string' ? record.url.trim() : '';

      if (!nombre || !url) return null;
      const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      return { nombre, url: normalizedUrl };
    })
    .filter((item): item is { nombre: string; url: string } => Boolean(item));
}

function normalizeProveedor(proveedor: Proveedor) {
  const raw = proveedor.get({ plain: true }) as Record<string, unknown>;

  return {
    id: raw.id,
      nombre: (raw.nombre ?? raw.name ?? raw.empresa ?? "") as string,
    empresa: (raw.empresa ?? raw.name ?? raw.nombre ?? "") as string,
    name: (raw.name ?? raw.nombre ?? raw.empresa ?? "") as string,
    slug: (raw.slug ?? "") as string,
    logo: (raw.logo ?? "") as string,
    tier: (raw.tier ?? "basic") as "premium" | "verified" | "basic",
    shortDescription: (raw.shortDescription ?? "") as string,
    sector: (raw.sector ?? pickPrimarySector(raw.sectors, "General")) as string,
    about: (raw.about ?? "") as string,
    sectors: toArray(raw.sectors ?? raw.sector),
    certifications: toArray(raw.certifications),
    socialNetworks: normalizeSocialNetworks(raw.socialNetworks ?? raw.social_networks),
    city: (raw.city ?? "") as string,
    state: (raw.state ?? "") as string,
    country: (raw.country ?? "México") as string,
    website: (raw.website ?? "") as string,
    email: (raw.email ?? "") as string,
    phone: (raw.phone ?? "") as string,
    whatsapp: (raw.whatsapp ?? raw.phone ?? "") as string,
    isActive: Boolean(raw.isActive ?? raw.activo ?? true),
    usuarioId: (raw.usuarioId ?? raw.usuario_id ?? null) as number | null,
  };
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

async function generateUniqueSlug(baseName: string, userId: number): Promise<string> {
  const base = slugify(baseName) || `proveedor-${userId}`;
  let candidate = base;
  let attempt = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await Proveedor.findOne({ where: { slug: candidate } });
    if (!exists) return candidate;
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
}

router.get("/proveedores", async (_req, res) => {
  try {
    const proveedores = await Proveedor.findAll({
      where: { isActive: true },
      order: [
        [
          Proveedor.sequelize!.literal(
            "CASE tier WHEN 'premium' THEN 0 WHEN 'verified' THEN 1 ELSE 2 END"
          ),
          "ASC",
        ],
        ["name", "ASC"],
        ["id", "ASC"],
      ],
    });

    return success(res, proveedores.map(normalizeProveedor));
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    return failure(res, "Error interno del servidor", 500);
  }
});

router.get("/proveedores/admin", requireAuth, requireAdminRole, async (_req, res) => {
  try {
    const proveedores = await Proveedor.findAll({
      order: [["tier", "DESC"], ["id", "ASC"]],
    });

    return success(res, proveedores.map(normalizeProveedor));
  } catch (error) {
    console.error("Error al obtener proveedores para admin:", error);
    return failure(res, "Error interno del servidor", 500);
  }
});

router.post("/proveedores/upload-logo", requireAuth, (req, res) => {
  uploadLogo.single("logo")(req, res, (error: unknown) => {
    if (error) {
      const message =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "El logo no puede pesar mas de 1 MB."
          : error instanceof Error
            ? error.message
            : "No se pudo subir el logo.";
      return failure(res, message, 400);
    }

    const file = (req as typeof req & { file?: Express.Multer.File }).file;
    if (!file) {
      return failure(res, "Debes seleccionar un archivo.", 422);
    }

    const host = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      url: `${host}/uploads/providers/${file.filename}`,
    }, 201);
  });
});

router.get("/proveedores/mi-perfil", requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const userEmail = req.auth?.email;
    if (!userId) {
      return failure(res, "No autorizado.", 401);
    }

    let provider = await Proveedor.findOne({ where: { usuarioId: userId } });
    if (!provider && userEmail) {
      const byEmail = await Proveedor.findOne({
        where: {
          email: String(userEmail).trim().toLowerCase(),
          usuarioId: null,
        },
      });
      if (byEmail) {
        await byEmail.update({ usuarioId: userId });
        provider = byEmail;
      }
    }
    return success(res, provider ? normalizeProveedor(provider) : null, 200);
  } catch (error) {
    console.error("Error al obtener perfil de proveedor del usuario:", error);
    return failure(res, "Error interno del servidor", 500);
  }
});

router.post("/proveedores/mi-perfil", requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const userEmail = req.auth?.email;

    if (!userId || !userEmail) {
      return failure(res, "No autorizado.", 401);
    }

    const existing = await Proveedor.findOne({ where: { usuarioId: userId } });
    if (existing) {
      return failure(res, "Ya tienes un perfil de proveedor. Puedes editarlo.", 409);
    }

    const existingByEmail = await Proveedor.findOne({
      where: {
        email: String(userEmail).trim().toLowerCase(),
        usuarioId: null,
      },
    });
    if (existingByEmail) {
      await existingByEmail.update({ usuarioId: userId });
      return success(res, normalizeProveedor(existingByEmail), 200);
    }

    const {
      name,
      logo,
      shortDescription,
      about,
      sectors,
      certifications,
      socialNetworks,
      city,
      state,
      country,
      website,
      phone,
      whatsapp,
    } = req.body ?? {};

    if (!name || !about || !city || !state || !website) {
      return failure(res, "Faltan campos obligatorios para crear el proveedor.", 422);
    }

    const slug = await generateUniqueSlug(String(name), userId);

    const provider = await Proveedor.create({
      usuarioId: userId,
      empresa: String(name).trim(),
      name: String(name).trim(),
      slug,
      logo: String(logo ?? "").trim(),
      tier: "basic",
      shortDescription: String(shortDescription ?? "").trim(),
      sector: pickPrimarySector(sectors, "General"),
      about: String(about).trim(),
      sectors: Array.isArray(sectors) ? sectors : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      socialNetworks: normalizeSocialNetworks(socialNetworks),
      city: String(city).trim(),
      state: String(state).trim(),
      country: String(country ?? "México").trim(),
      website: String(website).trim(),
      email: userEmail,
      phone: String(phone ?? "").trim(),
      whatsapp: String(whatsapp ?? "").trim(),
      isActive: true,
    });

    try {
      await suscriptorService.subscribe({
        email: userEmail,
        nombre: String(name).trim(),
        telefono: String(phone ?? "").trim(),
        empresa: String(name).trim(),
        cargo: "Proveedor B2B",
        origen: "perfil_proveedor_cliente",
        metadata: {
          providerId: provider.get("id"),
          providerSlug: slug,
          providerTier: "basic",
        },
      });
    } catch (syncError) {
      console.error("[Proveedor perfil] Error al sincronizar suscriptor (no bloqueante):", syncError);
    }

    return success(res, normalizeProveedor(provider), 201);
  } catch (error) {
    console.error("Error al crear perfil de proveedor de usuario:", error);
    return failure(res, error instanceof Error ? error.message : "Error interno del servidor", 500);
  }
});

router.put("/proveedores/mi-perfil", requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const userEmail = req.auth?.email;

    if (!userId || !userEmail) {
      return failure(res, "No autorizado.", 401);
    }

    const provider = await Proveedor.findOne({ where: { usuarioId: userId } });
    if (!provider) {
      return failure(res, "No tienes un perfil de proveedor creado.", 404);
    }

    const {
      name,
      logo,
      shortDescription,
      about,
      sectors,
      certifications,
      socialNetworks,
      city,
      state,
      country,
      website,
      phone,
      whatsapp,
      isActive,
    } = req.body ?? {};

    if (name && String(name).trim() !== provider.get("name")) {
      const slug = await generateUniqueSlug(String(name), userId);
      provider.set("empresa", String(name).trim());
      provider.set("name", String(name).trim());
      provider.set("slug", slug);
    }

    if (logo !== undefined) provider.set("logo", String(logo).trim());
    if (shortDescription !== undefined) provider.set("shortDescription", String(shortDescription).trim());
    if (about !== undefined) provider.set("about", String(about).trim());
    if (sectors !== undefined) {
      provider.set("sectors", Array.isArray(sectors) ? sectors : []);
      provider.set("sector", pickPrimarySector(sectors, String(provider.get("sector") || "General")));
    }
    if (certifications !== undefined) provider.set("certifications", Array.isArray(certifications) ? certifications : []);
    if (socialNetworks !== undefined) provider.set("socialNetworks", normalizeSocialNetworks(socialNetworks));
    if (city !== undefined) provider.set("city", String(city).trim());
    if (state !== undefined) provider.set("state", String(state).trim());
    if (country !== undefined) provider.set("country", String(country).trim() || "México");
    if (website !== undefined) provider.set("website", String(website).trim());
    if (phone !== undefined) provider.set("phone", String(phone).trim());
    if (whatsapp !== undefined) provider.set("whatsapp", String(whatsapp).trim());
    if (typeof isActive === "boolean") provider.set("isActive", isActive);

    // Siempre forzar tier basic para cuentas cliente.
    provider.set("tier", "basic");
    provider.set("email", userEmail);

    await provider.save();

    try {
      await suscriptorService.subscribe({
        email: userEmail,
        nombre: String(provider.get("name")),
        telefono: String(provider.get("phone") ?? ""),
        empresa: String(provider.get("name")),
        cargo: "Proveedor B2B",
        origen: "perfil_proveedor_cliente",
        metadata: {
          providerId: provider.get("id"),
          providerSlug: provider.get("slug"),
          providerTier: "basic",
        },
      });
    } catch (syncError) {
      console.error("[Proveedor perfil] Error al sincronizar suscriptor (no bloqueante):", syncError);
    }

    return success(res, normalizeProveedor(provider), 200);
  } catch (error) {
    console.error("Error al actualizar perfil de proveedor de usuario:", error);
    return failure(res, error instanceof Error ? error.message : "Error interno del servidor", 500);
  }
});

router.post("/proveedores", requireAuth, requireAdminRole, async (req, res) => {
  try {
    const {
      name,
      slug,
      usuarioEmail,
      logo,
      tier,
      shortDescription,
      about,
      sectors,
      certifications,
      socialNetworks,
      city,
      state,
      country,
      website,
      email,
      phone,
      whatsapp,
      isActive,
    } = req.body ?? {};

    if (!name || !slug || !about || !city || !state || !website || !email || !phone || !whatsapp) {
      return failure(res, "Faltan campos obligatorios para crear el proveedor.", 422);
    }

    let resolvedUsuarioId: number | null = null;
    if (usuarioEmail !== undefined) {
      const normalizedUsuarioEmail = String(usuarioEmail).trim().toLowerCase();
      if (normalizedUsuarioEmail) {
        const usuario = await Usuario.findOne({ where: { email: normalizedUsuarioEmail } });
        if (!usuario) {
          return failure(res, `No existe un usuario con el email \"${normalizedUsuarioEmail}\".`, 422);
        }
        resolvedUsuarioId = usuario.id;
      }
    }

    const provider = await Proveedor.create({
      usuarioId: resolvedUsuarioId,
      empresa: String(name).trim(),
      name: String(name).trim(),
      slug: String(slug).trim(),
      logo: String(logo ?? "").trim(),
      tier: tier === "premium" || tier === "verified" ? tier : "basic",
      shortDescription: String(shortDescription ?? "").trim(),
      sector: pickPrimarySector(sectors, "General"),
      about: String(about).trim(),
      sectors: Array.isArray(sectors) ? sectors : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      socialNetworks: normalizeSocialNetworks(socialNetworks),
      city: String(city).trim(),
      state: String(state).trim(),
      country: String(country ?? "México").trim(),
      website: String(website).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      whatsapp: String(whatsapp).trim(),
      isActive: Boolean(isActive ?? true),
    });

    try {
      await suscriptorService.subscribe({
        email: String(email).trim(),
        nombre: String(name).trim(),
        telefono: String(phone).trim(),
        empresa: String(name).trim(),
        cargo: "Proveedor B2B",
        origen: "directorio_b2b",
        metadata: {
          providerId: provider.get("id"),
          providerSlug: String(slug).trim(),
          providerTier: tier === "premium" || tier === "verified" ? tier : "basic",
        },
      });
    } catch (syncError) {
      await provider.destroy().catch(() => undefined);
      return failure(
        res,
        syncError instanceof Error
          ? `Proveedor no creado: error al sincronizar suscriptor (${syncError.message}).`
          : "Proveedor no creado: error al sincronizar suscriptor.",
        500
      );
    }

    return success(res, normalizeProveedor(provider), 201);
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    return failure(res, error instanceof Error ? error.message : "Error interno del servidor", 500);
  }
});

router.put("/proveedores/:id", requireAuth, requireAdminRole, async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = Number(id);

    if (!id || Number.isNaN(providerId)) {
      return failure(res, "ID inválido.", 400);
    }

    const provider = await Proveedor.findByPk(providerId);
    if (!provider) {
      return failure(res, "Proveedor no encontrado.", 404);
    }

    const {
      name,
      slug,
      usuarioEmail,
      logo,
      tier,
      shortDescription,
      about,
      sectors,
      certifications,
      socialNetworks,
      city,
      state,
      country,
      website,
      email,
      phone,
      whatsapp,
      isActive,
    } = req.body ?? {};

    if (name !== undefined) {
      const normalizedName = String(name).trim();
      provider.set("empresa", normalizedName);
      provider.set("name", normalizedName);
      if (!slug) {
        provider.set("slug", await generateUniqueSlug(normalizedName, providerId));
      }
    }

    if (slug !== undefined && String(slug).trim()) {
      provider.set("slug", String(slug).trim());
    }

    if (logo !== undefined) provider.set("logo", String(logo).trim());
    if (tier !== undefined && (tier === "premium" || tier === "verified" || tier === "basic")) {
      provider.set("tier", tier);
    }
    if (shortDescription !== undefined) provider.set("shortDescription", String(shortDescription).trim());
    if (about !== undefined) provider.set("about", String(about).trim());
    if (sectors !== undefined) {
      provider.set("sectors", Array.isArray(sectors) ? sectors : []);
      provider.set("sector", pickPrimarySector(sectors, String(provider.get("sector") || "General")));
    }
    if (certifications !== undefined) provider.set("certifications", Array.isArray(certifications) ? certifications : []);
    if (socialNetworks !== undefined) provider.set("socialNetworks", normalizeSocialNetworks(socialNetworks));
    if (city !== undefined) provider.set("city", String(city).trim());
    if (state !== undefined) provider.set("state", String(state).trim());
    if (country !== undefined) provider.set("country", String(country).trim() || "México");
    if (website !== undefined) provider.set("website", String(website).trim());
    if (email !== undefined) provider.set("email", String(email).trim());
    if (phone !== undefined) provider.set("phone", String(phone).trim());
    if (whatsapp !== undefined) provider.set("whatsapp", String(whatsapp).trim());
    if (typeof isActive === "boolean") provider.set("isActive", isActive);

    if (usuarioEmail !== undefined) {
      const normalizedUsuarioEmail = String(usuarioEmail).trim().toLowerCase();
      if (!normalizedUsuarioEmail) {
        provider.set("usuarioId", null);
      } else {
        const usuario = await Usuario.findOne({ where: { email: normalizedUsuarioEmail } });
        if (!usuario) {
          return failure(res, `No existe un usuario con el email \"${normalizedUsuarioEmail}\".`, 422);
        }
        provider.set("usuarioId", usuario.id);
      }
    }

    await provider.save();

    return success(res, normalizeProveedor(provider), 200);
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    return failure(res, error instanceof Error ? error.message : "Error interno del servidor", 500);
  }
});

router.delete("/proveedores/:id", requireAuth, requireAdminRole, async (req, res) => {
  try {
    const providerId = Number(req.params.id);
    if (!providerId || Number.isNaN(providerId)) {
      return failure(res, "ID inválido.", 400);
    }

    const provider = await Proveedor.findByPk(providerId);
    if (!provider) {
      return failure(res, "Proveedor no encontrado.", 404);
    }

    await provider.destroy();
    return success(res, { deleted: true });
  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
    return failure(res, error instanceof Error ? error.message : "Error interno del servidor", 500);
  }
});

// PATCH /proveedores/:id/vincular-usuario — links a provider to a user account by email
router.patch("/proveedores/:id/vincular-usuario", requireAuth, requireAdminRole, async (req, res) => {
  try {
    const providerId = Number(req.params.id);
    if (!providerId || Number.isNaN(providerId)) {
      return failure(res, "ID inválido.", 400);
    }

    const provider = await Proveedor.findByPk(providerId);
    if (!provider) {
      return failure(res, "Proveedor no encontrado.", 404);
    }

    const { email } = req.body as { email?: string };

    if (!email || !email.trim()) {
      // Desvincular si se envía email vacío
      await provider.update({ usuarioId: null });
      return success(res, { unlinked: true });
    }

    const usuario = await Usuario.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!usuario) {
      return failure(res, `No existe un usuario con el email "${email.trim()}".`, 404);
    }

    await provider.update({ usuarioId: usuario.id });
    return success(res, { linked: true, usuarioId: usuario.id, usuarioEmail: email.trim().toLowerCase() });
  } catch (error) {
    console.error("Error al vincular usuario a proveedor:", error);
    return failure(res, error instanceof Error ? error.message : "Error interno del servidor", 500);
  }
});

export default router;
