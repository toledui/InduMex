import { Router, Request, Response } from "express";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";
import { Op } from "sequelize";
import PDFDocument from "pdfkit";
const Stripe = require("stripe");
import MediaKitPlan from "../models/MediaKitPlan";
import PaymentLink from "../models/PaymentLink";
import Venta from "../models/Venta";
import Configuracion from "../models/Configuracion";
import Usuario from "../models/Usuario";
import Proveedor from "../models/Proveedor";
import ProveedorSuscripcion from "../models/ProveedorSuscripcion";
import ProveedorSuscripcionPlan from "../models/ProveedorSuscripcionPlan";
import MarketplaceSuscripcion from "../models/MarketplaceSuscripcion";
import MarketplacePlan from "../models/MarketplacePlan";
import MarketplacePerfil from "../models/MarketplacePerfil";
import { success, failure } from "../utils/response";
import { requireAuth, requireAdminRole } from "../middleware/authMiddleware";
import { verifyAuthToken } from "../utils/jwt";
import { sendMail, getPaymentNotificationEmails } from "../utils/mailer";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateToken(): string {
  return randomBytes(24).toString("hex");
}

async function getStripeConfig(): Promise<{
  secretKey: string;
  webhookSecret: string;
}> {
  const rows = await Configuracion.findAll({
    where: {
      clave: ["stripe_secret_key", "stripe_webhook_secret"],
    },
  });
  const map = Object.fromEntries(rows.map((r) => [r.clave, r.valor ?? ""]));
  return {
    secretKey: map["stripe_secret_key"] ?? process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret:
      map["stripe_webhook_secret"] ?? process.env.STRIPE_WEBHOOK_SECRET ?? "",
  };
}

async function getStripeClient(): Promise<any | null> {
  const config = await getStripeConfig();
  if (!config.secretKey) {
    return null;
  }

  return new Stripe(config.secretKey);
}

async function createStripeCheckout(
  stripe: any,
  paymentLink: PaymentLink,
  config: {
    customer?: { name?: string | null; email?: string | null; phone?: string | null };
  }
): Promise<{ checkoutLink: string; checkoutId: string } | { error: string } | null> {
  const frontendBaseUrl =
    process.env.FRONTEND_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_FRONTEND_URL ??
    "http://localhost:3000";
  const payPageUrl = `${frontendBaseUrl}/pagar/${paymentLink.token}`;

  const normalizedCurrency = (paymentLink.moneda || "MXN").toLowerCase();
  const paymentMethodTypes =
    normalizedCurrency === "mxn" ? ["card", "oxxo"] : ["card"];
  const items = normalizeItems(paymentLink.items);
  const lineItems =
    items.length > 0
      ? items.map((item) => ({
          quantity: Number(item.quantity || 1),
          price_data: {
            currency: normalizedCurrency,
            unit_amount: Math.max(1, Math.round(Number(item.price || 0) * 100)),
            product_data: {
              name: item.name || "Item",
            },
          },
        }))
      : [
          {
            quantity: 1,
            price_data: {
              currency: normalizedCurrency,
              unit_amount: Math.max(1, Math.round(Number(paymentLink.monto) * 100)),
              product_data: {
                name: (paymentLink.descripcion?.trim() || "Pago InduMex").slice(0, 255),
              },
            },
          },
        ];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: paymentMethodTypes,
      line_items: lineItems,
      customer_email: config.customer?.email ?? undefined,
      locale: "es",
      phone_number_collection: {
        enabled: true,
      },
      payment_method_options:
        normalizedCurrency === "mxn"
          ? {
              oxxo: {
                expires_after_days: 3,
              },
            }
          : undefined,
      metadata: {
        payment_link_id: String(paymentLink.id),
        payment_token: paymentLink.token,
        ...(config.customer?.name ? { customer_name: config.customer.name } : {}),
        ...(config.customer?.phone ? { customer_phone: config.customer.phone } : {}),
      },
      success_url: `${payPageUrl}?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${payPageUrl}?stripe=cancel`,
      payment_intent_data: {
        metadata: {
          payment_link_id: String(paymentLink.id),
          payment_token: paymentLink.token,
        },
      },
      after_expiration: {
        recovery: {
          enabled: true,
        },
      },
    });

    const checkoutLink = session.url ?? null;
    const checkoutId = session.id ?? null;

    if (!checkoutLink || !checkoutId) {
      console.error("[Stripe Checkout] Missing checkout URL or session id");
      return { error: "Stripe no devolvió URL o session id" };
    }

    return { checkoutLink, checkoutId };
  } catch (err) {
    console.error("[Stripe Checkout] Error:", err);
    return {
      error: err instanceof Error ? err.message : "Error desconocido al crear checkout en Stripe",
    };
  }
}

function normalizeItems(
  raw: unknown
): { name: string; price: number; quantity: number }[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const row = item as { name?: unknown; price?: unknown; quantity?: unknown };
        return {
          name:
            typeof row.name === "string" && row.name.trim().length > 0
              ? row.name
              : "Item",
          price: Number(row.price ?? 0),
          quantity: Number(row.quantity ?? 1) || 1,
        };
      });
  }

  if (typeof raw === "string") {
    try {
      return normalizeItems(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  return [];
}

function parseExpiresAt(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function getOptionalAuthFromRequest(req: Request):
  | { userId: number; email: string; rol: "admin" | "editor" | "cliente" }
  | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyAuthToken(token);
    return {
      userId: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
  } catch {
    return null;
  }
}

function formatCurrency(value: number, currency: string): string {
  return value.toLocaleString("es-MX", {
    style: "currency",
    currency,
  });
}

function getReceiptLogoPath(): string | null {
  const candidates = [
    path.resolve(__dirname, "../../../client/public/images/Indumex_logo.png"),
    path.resolve(__dirname, "../../../client/public/images/indumex-logo.svg"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function getPayloadObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function extractPaymentMethodLabel(payload: unknown): string {
  const payloadObject = getPayloadObject(payload);
  const paymentMethod = getPayloadObject(payloadObject?.payment_method);
  const card = getPayloadObject(paymentMethod?.card);

  const methodType = typeof paymentMethod?.type === "string" ? paymentMethod.type : null;
  const methodId = typeof paymentMethod?.id === "string" ? paymentMethod.id : null;
  const issuer = typeof card?.issuer === "string" ? card.issuer : null;
  const lastDigits = typeof card?.last_digits === "string" ? card.last_digits : null;

  if (methodType === "credit_card" || methodType === "debit_card") {
    const cardLabel = methodType === "credit_card" ? "Tarjeta de credito" : "Tarjeta de debito";
    const network = methodId ? ` ${methodId.toUpperCase()}` : "";
    const issuerLabel = issuer ? ` · ${issuer}` : "";
    const digitsLabel = lastDigits ? ` · Terminacion ${lastDigits}` : "";
    return `${cardLabel}${network}${issuerLabel}${digitsLabel}`;
  }

  if (methodId) {
    return `Metodo ${methodId.toUpperCase()}`;
  }

  return "Checkout Stripe";
}

function formatReceiptStatus(status: string): string {
  if (status === "completed") return "Completado";
  if (status === "refunded") return "Reembolsado";
  return status;
}

async function syncProviderSubscriptionAfterPayment(params: {
  link: PaymentLink;
  usuarioId: number | null;
  buyerEmail: string;
  buyerName?: string | null;
}) {
  const { link, usuarioId, buyerEmail, buyerName } = params;

  if (!usuarioId) return;

  const suscripcion = await ProveedorSuscripcion.findOne({
    where: {
      ultimoLinkPagoId: link.id,
    },
    include: [{ model: ProveedorSuscripcionPlan, as: "plan" }],
  });

  if (!suscripcion) return;

  const plan = (suscripcion as unknown as { plan?: ProveedorSuscripcionPlan }).plan;
  if (!plan) return;

  const periodMonths =
    plan.periodicidad === "anual"
      ? 12
      : plan.periodicidad === "semestral"
      ? 6
      : plan.periodicidad === "trimestral"
      ? 3
      : plan.periodicidad === "bimestral"
      ? 2
      : 1;

  const now = new Date();
  const nextExpiry = new Date(now);
  nextExpiry.setMonth(nextExpiry.getMonth() + periodMonths);

  await suscripcion.update({
    estado: "activa",
    fechaInicio: now,
    fechaVencimiento: nextExpiry,
    periodoGraciaVencimentoEn: null,
    proximoLinkPagoGeneradoEn: null,
  });

  const targetTier = plan.status === "patrocinado" ? "premium" : "verified";

  const provider = await Proveedor.findOne({ where: { usuarioId } });
  if (provider && provider.tier !== targetTier) {
    await provider.update({ tier: targetTier });
  }

  const amountLabel = Number(plan.precio).toLocaleString("es-MX", {
    style: "currency",
    currency: plan.moneda || "MXN",
  });

  if (!buyerEmail) {
    return;
  }

  await sendMail({
    to: [buyerEmail],
    subject: `Suscripción activada: ${plan.nombre} - InduMex`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8f9fa; padding: 24px;">
        <div style="background: #004AAD; padding: 20px 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: #fff; font-size: 20px;">Tu plan ya está activo</h1>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
          <p>Hola ${buyerName ?? ""},</p>
          <p>Confirmamos tu pago y activamos tu plan de proveedor.</p>
          <ul>
            <li><strong>Plan:</strong> ${plan.nombre}</li>
            <li><strong>Tier:</strong> ${targetTier === "premium" ? "Patrocinado" : "Verificado"}</li>
            <li><strong>Monto:</strong> ${amountLabel}</li>
            <li><strong>Vigencia hasta:</strong> ${nextExpiry.toLocaleDateString("es-MX")}</li>
          </ul>
          <p>Tu perfil en el directorio ya fue actualizado con este nivel.</p>
        </div>
      </div>
    `,
    text: `Plan activado: ${plan.nombre}. Tier: ${targetTier}. Vigente hasta ${nextExpiry.toLocaleDateString("es-MX")}.`,
  });
}

async function syncMarketplaceSubscriptionAfterPayment(params: {
  link: PaymentLink;
  usuarioId: number | null;
  buyerEmail: string;
  buyerName?: string | null;
}) {
  const { link, usuarioId, buyerEmail, buyerName } = params;

  if (!usuarioId) return;

  const suscripcion = await MarketplaceSuscripcion.findOne({
    where: {
      ultimoLinkPagoId: link.id,
    },
    include: [{ model: MarketplacePlan, as: "plan" }],
  });

  if (!suscripcion) return;

  const plan = (suscripcion as unknown as { plan?: MarketplacePlan }).plan;
  if (!plan) return;

  const periodMonths =
    plan.periodicidad === "anual"
      ? 12
      : plan.periodicidad === "semestral"
      ? 6
      : plan.periodicidad === "trimestral"
      ? 3
      : plan.periodicidad === "bimestral"
      ? 2
      : 1;

  const now = new Date();
  const nextExpiry = new Date(now);
  nextExpiry.setMonth(nextExpiry.getMonth() + periodMonths);

  await suscripcion.update({
    estado: "activa",
    fechaInicio: now,
    fechaVencimiento: nextExpiry,
    periodoGraciaVencimientoEn: null,
    proximoLinkPagoGeneradoEn: null,
  });

  const [perfil] = await MarketplacePerfil.findOrCreate({
    where: { usuarioId },
    defaults: { usuarioId, habilitado: true },
  });

  await perfil.update({
    habilitado: true,
    vigenciaHasta: nextExpiry,
    ...(perfil.maxProductosOverride == null && { maxProductosOverride: plan.maxProductos }),
  });

  if (!buyerEmail) {
    return;
  }

  const amountLabel = Number(plan.precio).toLocaleString("es-MX", {
    style: "currency",
    currency: plan.moneda || "MXN",
  });

  await sendMail({
    to: [buyerEmail],
    subject: `Marketplace activado: ${plan.nombre} - InduMex`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8f9fa; padding: 24px;">
        <div style="background: #004AAD; padding: 20px 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: #fff; font-size: 20px;">Tu perfil de marketplace está activo</h1>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
          <p>Hola ${buyerName ?? ""},</p>
          <p>Confirmamos tu pago y activamos tu acceso al administrador de marketplace.</p>
          <ul>
            <li><strong>Plan:</strong> ${plan.nombre}</li>
            <li><strong>Monto:</strong> ${amountLabel}</li>
            <li><strong>Vigencia hasta:</strong> ${nextExpiry.toLocaleDateString("es-MX")}</li>
            <li><strong>Límite de productos base:</strong> ${plan.maxProductos}</li>
          </ul>
        </div>
      </div>
    `,
    text: `Marketplace activado: ${plan.nombre}. Vigente hasta ${nextExpiry.toLocaleDateString("es-MX")}.`,
  });
}

async function buildReceiptPdfBuffer(venta: Venta): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      const paymentLink = venta.paymentLinkId
        ? await PaymentLink.findByPk(venta.paymentLinkId)
        : null;
      const logoPath = getReceiptLogoPath();
      const issueDate = new Date(venta.createdAt ?? new Date());
      const amountLabel = formatCurrency(Number(venta.monto), venta.moneda);
      const description =
        paymentLink?.descripcion?.trim() ||
        (typeof getPayloadObject(venta.ecartpayPayload)?.description === "string"
          ? String(getPayloadObject(venta.ecartpayPayload)?.description)
          : "Pago de servicios / plataforma");
      const paymentMethod = extractPaymentMethodLabel(venta.ecartpayPayload);
      const statusLabel = formatReceiptStatus(venta.estado);
      const dateLabel = issueDate.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const timeLabel = issueDate.toLocaleTimeString("es-MX", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
      const pageWidth = doc.page.width;          // 595 pt (A4)
      const startX = 60;
      const contentWidth = pageWidth - 120;      // 475 pt
      const colGap = 20;
      const leftColW = 215;
      const rightColW = contentWidth - leftColW - colGap; // 240 pt
      const rightBlockX = startX + leftColW + colGap;     // 295 pt → ends at 535

      doc.rect(0, 0, pageWidth, doc.page.height).fill("#ffffff");

      if (logoPath && logoPath.toLowerCase().endsWith(".png")) {
        doc.image(logoPath, startX, 42, { width: 150 });
      } else {
        doc
          .font("Helvetica-Bold")
          .fontSize(28)
          .fillColor("#004AAD")
          .text("Indu", startX, 56, { continued: true })
          .fillColor("#F58634")
          .text("Mex");
      }

      doc
        .strokeColor("#e2e8f0")
        .lineWidth(2)
        .moveTo(startX, 118)
        .lineTo(pageWidth - startX, 118)
        .stroke();

      const metaX = rightBlockX;
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#64748b")
        .text("RECIBO DE PAGO", metaX, 42, {
          width: rightColW,
          align: "right",
        });
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor("#0a0a0a")
        .text(`REC-${venta.id}`, metaX, 62, {
          width: rightColW,
          align: "right",
        });

      const badgeWidth = 116;
      const badgeX = pageWidth - startX - badgeWidth;
      doc.roundedRect(badgeX, 96, badgeWidth, 22, 11).fill("#dcfce7");
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#166534")
        .text(statusLabel, badgeX, 103, {
          width: badgeWidth,
          align: "center",
        });

      const sectionY = 158;

      // ── Left column: buyer info ──────────────────────────────
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#64748b")
        .text("DATOS DEL COMPRADOR", startX, sectionY, { width: leftColW });
      doc
        .strokeColor("#F58634")
        .lineWidth(1)
        .moveTo(startX, sectionY + 16)
        .lineTo(startX + 145, sectionY + 16)
        .stroke();
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#0a0a0a")
        .text(venta.compradorNombre ?? "No especificado", startX, sectionY + 28, {
          width: leftColW,
        });
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#0a0a0a")
        .text(venta.compradorEmail, startX, sectionY + 50, { width: leftColW });
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#64748b")
        .text(`Tel: ${venta.compradorTelefono ?? "No especificado"}`, startX, sectionY + 72, {
          width: leftColW,
        });

      // ── Right column: transaction details ────────────────────
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#64748b")
        .text("DETALLES DE LA TRANSACCION", rightBlockX, sectionY, { width: rightColW });
      doc
        .strokeColor("#F58634")
        .lineWidth(1)
        .moveTo(rightBlockX, sectionY + 16)
        .lineTo(rightBlockX + 175, sectionY + 16)
        .stroke();
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#0a0a0a")
        .text(`Fecha: ${dateLabel}`, rightBlockX, sectionY + 28, { width: rightColW });
      doc.text(`Hora: ${timeLabel}`, rightBlockX, sectionY + 50, { width: rightColW });
      doc
        .fontSize(10)
        .text(`Referencia: ${venta.ecartpayOrderId ?? "No disponible"}`, rightBlockX, sectionY + 72, {
          width: rightColW,
        });

      const summaryY = 302;
      doc.roundedRect(startX, summaryY, contentWidth, 180, 16).fill("#f8fafc");
      doc.roundedRect(startX, summaryY, contentWidth, 180, 16).stroke("#e2e8f0");

      const summaryLabelX = startX + 24;
      const summaryValueX = startX + 220;
      const summaryLabelW = 190;
      const summaryValueW = contentWidth - 220 - 24; // ~231

      doc
        .font("Helvetica")
        .fontSize(13)
        .fillColor("#64748b")
        .text("Descripcion", summaryLabelX, summaryY + 30, { width: summaryLabelW });
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#0a0a0a")
        .text(description, summaryValueX, summaryY + 30, {
          width: summaryValueW,
          align: "right",
        });

      doc
        .font("Helvetica")
        .fontSize(13)
        .fillColor("#64748b")
        .text("Metodo de pago", summaryLabelX, summaryY + 62, { width: summaryLabelW });
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#0a0a0a")
        .text(paymentMethod, summaryValueX, summaryY + 62, {
          width: summaryValueW,
          align: "right",
        });

      doc
        .strokeColor("#e2e8f0")
        .lineWidth(2)
        .moveTo(startX + 28, summaryY + 112)
        .lineTo(pageWidth - startX - 28, summaryY + 112)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("#0a0a0a")
        .text("Monto pagado", summaryLabelX, summaryY + 128, { width: summaryLabelW });
      doc
        .font("Helvetica-Bold")
        .fontSize(26)
        .fillColor("#0a0a0a")
        .text(amountLabel, summaryValueX, summaryY + 120, {
          width: summaryValueW,
          align: "right",
        });
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#64748b")
        .text(venta.moneda, summaryValueX, summaryY + 152, {
          width: summaryValueW,
          align: "right",
        });

      const noteY = 520;
      doc.roundedRect(startX, noteY, contentWidth, 74, 8).fill("#fff7ed");
      doc.rect(startX, noteY, 4, 74).fill("#F58634");
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#9a3412")
        .text("Aviso Importante:", startX + 20, noteY + 14, { width: contentWidth - 40 });
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#9a3412")
        .text(
          "Este recibo es únicamente un comprobante de transacción digital y no constituye un comprobante fiscal CFDI 4.0. Si requieres una factura deducible, solicita tu CFDI por los canales oficiales de InduMex dentro del mes en curso.",
          startX + 20,
          noteY + 30,
          { width: contentWidth - 40 }
        );

      const footerY = 650;
      doc
        .strokeColor("#e2e8f0")
        .lineWidth(1)
        .moveTo(startX, footerY)
        .lineTo(pageWidth - startX, footerY)
        .stroke();
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#64748b")
        .text("© 2026 INDUMEX MEDIA SA DE CV. Todos los derechos reservados.", startX, footerY + 20, {
          width: contentWidth,
          align: "center",
        });
      doc
        .text("¿Tienes dudas sobre este cargo? Contáctanos en contacto@indumex.blog", startX, footerY + 36, {
          width: contentWidth,
          align: "center",
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ─── Media Kit Planes ──────────────────────────────────────────────────────────

// GET /media-kit/planes/public
router.get(
  "/media-kit/planes/public",
  async (_req: Request, res: Response) => {
    try {
      const planes = await MediaKitPlan.findAll({
        where: { activo: true },
        order: [["id", "ASC"]],
      });
      success(res, planes);
    } catch {
      failure(res, "Error al obtener planes públicos", 500);
    }
  }
);

// GET /admin/media-kit/planes
router.get(
  "/admin/media-kit/planes",
  requireAuth,
  requireAdminRole,
  async (_req: Request, res: Response) => {
    try {
      const planes = await MediaKitPlan.findAll({ order: [["id", "ASC"]] });
      success(res, planes);
    } catch {
      failure(res, "Error al obtener planes", 500);
    }
  }
);

// GET /admin/media-kit/planes/:id
router.get(
  "/admin/media-kit/planes/:id",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return failure(res, "ID inválido", 400);
      const plan = await MediaKitPlan.findByPk(id);
      if (!plan) return failure(res, "Plan no encontrado", 404);
      success(res, plan);
    } catch {
      failure(res, "Error al obtener plan", 500);
    }
  }
);

// POST /admin/media-kit/planes
router.post(
  "/admin/media-kit/planes",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const { nombre, descripcion, precio, moneda, items, features, activo } =
        req.body as {
          nombre: string;
          descripcion?: string;
          precio: number;
          moneda?: string;
          items?: { name: string; price: number; quantity: number }[];
          features?: string[];
          activo?: boolean;
        };

      if (!nombre || precio == null) {
        return failure(res, "nombre y precio son obligatorios", 400);
      }

      const plan = await MediaKitPlan.create({
        nombre,
        descripcion: descripcion ?? null,
        precio,
        moneda: moneda ?? "MXN",
        items: items ?? [],
        features: features ?? [],
        activo: activo ?? true,
      });

      success(res, plan, 201);
    } catch {
      failure(res, "Error al crear plan", 500);
    }
  }
);

// PUT /admin/media-kit/planes/:id
router.put(
  "/admin/media-kit/planes/:id",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return failure(res, "ID inválido", 400);
      const plan = await MediaKitPlan.findByPk(id);
      if (!plan) return failure(res, "Plan no encontrado", 404);

      const { nombre, descripcion, precio, moneda, items, features, activo } =
        req.body as Partial<{
          nombre: string;
          descripcion: string;
          precio: number;
          moneda: string;
          items: { name: string; price: number; quantity: number }[];
          features: string[];
          activo: boolean;
        }>;

      await plan.update({
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precio !== undefined && { precio }),
        ...(moneda !== undefined && { moneda }),
        ...(items !== undefined && { items }),
        ...(features !== undefined && { features }),
        ...(activo !== undefined && { activo }),
      });

      success(res, plan);
    } catch {
      failure(res, "Error al actualizar plan", 500);
    }
  }
);

// DELETE /admin/media-kit/planes/:id
router.delete(
  "/admin/media-kit/planes/:id",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return failure(res, "ID inválido", 400);
      const plan = await MediaKitPlan.findByPk(id);
      if (!plan) return failure(res, "Plan no encontrado", 404);
      await plan.destroy();
      success(res, { deleted: true });
    } catch {
      failure(res, "Error al eliminar plan", 500);
    }
  }
);

// ─── Payment Links ─────────────────────────────────────────────────────────────

// GET /admin/pagos/links
router.get(
  "/admin/pagos/links",
  requireAuth,
  requireAdminRole,
  async (_req: Request, res: Response) => {
    try {
      await PaymentLink.update(
        { estado: "cancelled" },
        {
          where: {
            estado: "pending",
            expiresAt: { [Op.lte]: new Date() },
          },
        }
      );

      const links = await PaymentLink.findAll({
        order: [["createdAt", "DESC"]],
      });
      success(res, links);
    } catch {
      failure(res, "Error al obtener links de pago", 500);
    }
  }
);

// GET /admin/pagos/stripe/validate
router.get(
  "/admin/pagos/stripe/validate",
  requireAuth,
  requireAdminRole,
  async (_req: Request, res: Response) => {
    try {
      const config = await getStripeConfig();
      const stripe = await getStripeClient();

      if (!config.secretKey) {
        return failure(
          res,
          "Faltan credenciales de Stripe (secret key)",
          400
        );
      }

      if (!stripe) {
        return failure(
          res,
          "No fue posible inicializar Stripe con las credenciales actuales",
          400
        );
      }

      success(res, {
        sandbox: false,
        hasPublicId: false,
        hasSecretKey: Boolean(config.secretKey),
        tokenGenerated: true,
      });
    } catch {
      failure(res, "Error al validar credenciales de Stripe", 500);
    }
  }
);

// Legacy alias used by current admin UI
router.get(
  "/admin/pagos/clip/validate",
  requireAuth,
  requireAdminRole,
  async (_req: Request, res: Response) => {
    try {
      const config = await getStripeConfig();
      const stripe = await getStripeClient();

      if (!config.secretKey) {
        return failure(
          res,
          "Faltan credenciales de Stripe (secret key)",
          400
        );
      }

      if (!stripe) {
        return failure(
          res,
          "No fue posible inicializar Stripe con las credenciales actuales",
          400
        );
      }

      success(res, {
        sandbox: false,
        hasPublicId: false,
        hasSecretKey: Boolean(config.secretKey),
        tokenGenerated: true,
      });
    } catch {
      failure(res, "Error al validar credenciales de Stripe", 500);
    }
  }
);

// POST /admin/pagos/links
router.post(
  "/admin/pagos/links",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const {
        planId,
        usuarioId,
        descripcion,
        monto,
        moneda,
        items,
        compradorEmail,
        compradorNombre,
        expiresAt,
      } = req.body as {
        planId?: number;
        usuarioId?: number;
        descripcion?: string;
        monto: number;
        moneda?: string;
        items?: { name: string; price: number; quantity: number }[];
        compradorEmail?: string;
        compradorNombre?: string;
        expiresAt?: string;
      };

      if (monto == null || monto <= 0) {
        return failure(res, "monto debe ser mayor a 0", 400);
      }

      const parsedExpiresAt =
        expiresAt !== undefined ? parseExpiresAt(expiresAt) : null;
      if (expiresAt !== undefined && !parsedExpiresAt) {
        return failure(res, "Fecha de expiración inválida", 400);
      }

      const normalizedEmail = compradorEmail?.trim().toLowerCase();
      if (!normalizedEmail) {
        return failure(res, "compradorEmail es obligatorio", 400);
      }

      // If a plan is specified, pull its data when needed
      let resolvedPlan: MediaKitPlan | null = null;
      let resolvedItems = items ?? [];
      let resolvedMoneda = moneda ?? "MXN";
      if (planId) {
        resolvedPlan = await MediaKitPlan.findByPk(planId);
        if (resolvedPlan && resolvedItems.length === 0) {
          resolvedItems = resolvedPlan.items;
          resolvedMoneda = resolvedPlan.moneda;
        }
      }

      const resolvedDescripcion =
        descripcion?.trim() ||
        resolvedPlan?.nombre ||
        "Pago InduMex";

      // If items still empty, create a generic one
      if (resolvedItems.length === 0) {
        resolvedItems = [
          {
            name: resolvedDescripcion,
            price: Number(monto),
            quantity: 1,
          },
        ];
      }

      const link = await PaymentLink.create({
        token: generateToken(),
        planId: planId ?? null,
        usuarioId: usuarioId ?? null,
        descripcion: resolvedDescripcion,
        monto: Number(monto),
        moneda: resolvedMoneda,
        items: resolvedItems,
        estado: "pending",
        compradorEmail: normalizedEmail,
        compradorNombre: compradorNombre ?? null,
        ecartpayOrderId: null,
        ecartpayCheckoutId: null,
        expiresAt: parsedExpiresAt,
      });

      // Create Stripe checkout link
      const stripe = await getStripeClient();
      if (stripe) {
        const checkoutResult = await createStripeCheckout(stripe, link, {});
        if (checkoutResult && "checkoutLink" in checkoutResult) {
          await link.update({
            ecartpayCheckoutId: checkoutResult.checkoutId,
          });
          // Return the checkout link instead of the internal token
          return success(
            res,
            {
              ...link.toJSON(),
              checkoutLink: checkoutResult.checkoutLink,
              paymentUrl: checkoutResult.checkoutLink,
            },
            201
          );
        } else if (checkoutResult && "error" in checkoutResult) {
          console.warn(`[Stripe Checkout] Link admin ${link.id}: ${checkoutResult.error}`);
        }
      }

      success(res, link, 201);
    } catch {
      failure(res, "Error al crear link de pago", 500);
    }
  }
);

// PUT /admin/pagos/links/:id
router.put(
  "/admin/pagos/links/:id",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return failure(res, "ID de link inválido", 400);
      }

      const link = await PaymentLink.findByPk(id);
      if (!link) return failure(res, "Link no encontrado", 404);
      if (link.estado !== "pending") {
        return failure(res, "Solo se pueden editar links pendientes", 400);
      }

      const {
        planId,
        usuarioId,
        descripcion,
        monto,
        moneda,
        items,
        compradorEmail,
        compradorNombre,
        expiresAt,
      } = req.body as Partial<{
        planId: number;
        usuarioId: number;
        descripcion: string;
        monto: number;
        moneda: string;
        items: { name: string; price: number; quantity: number }[];
        compradorEmail: string;
        compradorNombre: string;
        expiresAt: string | null;
      }>;

      if (monto !== undefined && Number(monto) <= 0) {
        return failure(res, "monto debe ser mayor a 0", 400);
      }

      const parsedExpiresAt =
        expiresAt !== undefined ? parseExpiresAt(expiresAt) : undefined;
      if (expiresAt !== undefined && expiresAt && !parsedExpiresAt) {
        return failure(res, "Fecha de expiración inválida", 400);
      }

      const finalEmail =
        compradorEmail !== undefined
          ? compradorEmail.trim().toLowerCase()
          : (link.compradorEmail ?? "").trim().toLowerCase();
      if (!finalEmail) {
        return failure(res, "compradorEmail es obligatorio", 400);
      }

      let resolvedItems = items !== undefined ? items : normalizeItems(link.items);
      let resolvedMoneda = moneda ?? link.moneda;
      if (planId && (!resolvedItems || resolvedItems.length === 0)) {
        const plan = await MediaKitPlan.findByPk(planId);
        if (plan) {
          resolvedItems = plan.items;
          resolvedMoneda = plan.moneda;
        }
      }

      const resolvedMonto = monto !== undefined ? Number(monto) : Number(link.monto);

      // If admin updated amount/description without explicit custom items,
      // regenerate one default item to keep request totals consistent.
      if (items === undefined && (monto !== undefined || descripcion !== undefined)) {
        resolvedItems = [
          {
            name: descripcion ?? link.descripcion ?? "Pago InduMex",
            price: resolvedMonto,
            quantity: 1,
          },
        ];
      }

      if (!resolvedItems || resolvedItems.length === 0) {
        resolvedItems = [
          {
            name: descripcion ?? link.descripcion ?? "Pago InduMex",
            price: resolvedMonto,
            quantity: 1,
          },
        ];
      }

      const shouldResetCheckout =
        descripcion !== undefined ||
        monto !== undefined ||
        moneda !== undefined ||
        items !== undefined ||
        planId !== undefined;

      await link.update({
        ...(planId !== undefined && { planId: planId || null }),
        ...(usuarioId !== undefined && { usuarioId: usuarioId || null }),
        ...(descripcion !== undefined && { descripcion: descripcion || null }),
        ...(monto !== undefined && { monto: resolvedMonto }),
        ...(resolvedMoneda !== undefined && { moneda: resolvedMoneda }),
        items: resolvedItems,
        ...(shouldResetCheckout && { ecartpayCheckoutId: null }),
        compradorEmail: finalEmail,
        ...(compradorNombre !== undefined && { compradorNombre: compradorNombre || null }),
        ...(expiresAt !== undefined && {
          expiresAt: expiresAt ? parsedExpiresAt : null,
        }),
      });

      success(res, link);
    } catch {
      failure(res, "Error al actualizar link de pago", 500);
    }
  }
);

// PATCH /admin/pagos/links/:id/cancel
router.patch(
  "/admin/pagos/links/:id/cancel",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return failure(res, "ID de link inválido", 400);
      const link = await PaymentLink.findByPk(id);
      if (!link) return failure(res, "Link no encontrado", 404);
      await link.update({ estado: "cancelled" });
      success(res, link);
    } catch {
      failure(res, "Error al cancelar link", 500);
    }
  }
);

// DELETE /admin/pagos/links/:id
router.delete(
  "/admin/pagos/links/:id",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return failure(res, "ID de link inválido", 400);
      }

      const link = await PaymentLink.findByPk(id);
      if (!link) return failure(res, "Link no encontrado", 404);

      const isDeletableState =
        link.estado === "pending" ||
        link.estado === "cancelled" ||
        link.estado === "expired";
      if (!isDeletableState) {
        return failure(
          res,
          "Solo se pueden eliminar links cancelados o sin pagar",
          400
        );
      }

      await link.destroy();
      success(res, { deleted: true });
    } catch {
      failure(res, "Error al eliminar link de pago", 500);
    }
  }
);

// ─── Public: Pay page data ─────────────────────────────────────────────────────

// GET /pay/:token  — returns link data + publicId for the frontend
router.get("/pay/:token", async (req: Request, res: Response) => {
  try {
    const link = await PaymentLink.findOne({
      where: { token: req.params.token },
    });

    if (!link) return failure(res, "Link de pago no encontrado", 404);
    if (link.estado === "paid") return failure(res, "Este link ya fue pagado", 410);
    if (link.estado === "cancelled") return failure(res, "Este link fue cancelado", 410);
    if (link.expiresAt && link.expiresAt < new Date()) {
      await link.update({ estado: "cancelled" });
      return failure(res, "Este link fue cancelado por caducidad", 410);
    }

    // Fetch buyer name from linked user if not set manually
    let compradorNombre = link.compradorNombre ?? null;
    let compradorEmail = link.compradorEmail ?? null;
    let compradorTelefono: string | null = null;
    if (link.usuarioId) {
      const usuario = await Usuario.findByPk(link.usuarioId);
      if (usuario) {
        compradorNombre = compradorNombre ?? `${usuario.get("nombre") ?? ""} ${usuario.get("apellido") ?? ""}`.trim();
        compradorEmail = compradorEmail ?? (usuario.get("email") as string ?? null);
        compradorTelefono = (usuario.get("telefono") as string ?? null);
      }
    }

    const stripe = await getStripeClient();

    // Always try to generate a fresh Stripe checkout link.
    let checkoutLink: string | null = null;

    if (stripe) {
      let stripeError: string | null = null;
      const checkoutResult = await createStripeCheckout(stripe, link, {
        customer: { email: compradorEmail, phone: compradorTelefono },
      });
      if (checkoutResult && "checkoutLink" in checkoutResult) {
        await link.update({
          ecartpayCheckoutId: checkoutResult.checkoutId,
        });
        checkoutLink = checkoutResult.checkoutLink;
      } else if (checkoutResult && "error" in checkoutResult) {
        stripeError = checkoutResult.error;
      }

      if (!checkoutLink) {
        return failure(
          res,
          `No fue posible generar el enlace de checkout con Stripe. ${stripeError ?? "Verifica credenciales y configuración de URLs públicas."}`,
          502
        );
      }
    } else {
      return failure(res, "Stripe no está configurado en este momento.", 502);
    }

    success(res, {
      token: link.token,
      usuarioId: link.usuarioId ?? null,
      descripcion: link.descripcion,
      monto: link.monto,
      moneda: link.moneda,
      items: normalizeItems(link.items),
      compradorEmail,
      compradorNombre,
      expiresAt: link.expiresAt,
      estado: link.estado,
      checkoutLink,
    });
  } catch {
    failure(res, "Error al cargar link de pago", 500);
  }
});

// POST /pay/:token/complete  — called by frontend after EcartPay resolves
router.post("/pay/:token/complete", async (req: Request, res: Response) => {
  try {
    const link = await PaymentLink.findOne({
      where: { token: req.params.token },
    });

    if (!link) return failure(res, "Link no encontrado", 404);
    if (link.estado === "paid") return success(res, { alreadyPaid: true });

    const {
      email,
      first_name,
      last_name,
      phone,
      orderId,
      payload,
    } = req.body as {
      email?: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      orderId?: string;
      payload?: object;
    };

    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      return failure(res, "email del comprador es requerido", 400);
    }

    // If checkout is completed from a logged-in customer session, bind the payment to that account.
    const authUser = getOptionalAuthFromRequest(req);
    let resolvedUsuarioId = link.usuarioId ?? null;
    if (authUser?.rol === "cliente") {
      resolvedUsuarioId = authUser.userId;
    }

    if (!resolvedUsuarioId) {
      const userByEmail = await Usuario.findOne({ where: { email: normalizedEmail } });
      if (userByEmail) {
        resolvedUsuarioId = userByEmail.id;
      }
    }

    // Mark the link as paid
    await link.update({
      estado: "paid",
      usuarioId: resolvedUsuarioId,
      compradorEmail: normalizedEmail,
      compradorNombre:
        first_name || last_name
          ? `${first_name ?? ""} ${last_name ?? ""}`.trim()
          : link.compradorNombre,
      ecartpayOrderId: orderId ?? null,
    });

    // Create the sale record
    const venta = await Venta.create({
      paymentLinkId: link.id,
      planId: link.planId ?? null,
      usuarioId: resolvedUsuarioId,
      compradorEmail: normalizedEmail,
      compradorNombre:
        first_name || last_name
          ? `${first_name ?? ""} ${last_name ?? ""}`.trim()
          : null,
      compradorTelefono: phone ?? null,
      monto: link.monto,
      moneda: link.moneda,
      ecartpayOrderId: orderId ?? null,
      ecartpayPayload: payload ?? null,
      estado: "completed",
    });

    await syncProviderSubscriptionAfterPayment({
      link,
      usuarioId: resolvedUsuarioId,
      buyerEmail: normalizedEmail,
      buyerName:
        first_name || last_name
          ? `${first_name ?? ""} ${last_name ?? ""}`.trim()
          : link.compradorNombre,
    });

    await syncMarketplaceSubscriptionAfterPayment({
      link,
      usuarioId: resolvedUsuarioId,
      buyerEmail: normalizedEmail,
      buyerName:
        first_name || last_name
          ? `${first_name ?? ""} ${last_name ?? ""}`.trim()
          : link.compradorNombre,
    });

    // Notify admins/finance in background
    void (async () => {
      try {
        const recipients = await getPaymentNotificationEmails();
        if (recipients.length === 0) return;

        const buyerName =
          first_name || last_name
            ? `${first_name ?? ""} ${last_name ?? ""}`.trim()
            : (link.compradorNombre ?? "No especificado");
        const amountLabel = Number(link.monto).toLocaleString("es-MX", {
          style: "currency",
          currency: link.moneda,
        });

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8f9fa; padding: 24px;">
            <div style="background: #004AAD; padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #fff; font-size: 20px;">Pago confirmado — InduMex</h1>
            </div>
            <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; width: 36%;">Monto</td>
                  <td style="padding: 8px 0; color: #111827; font-weight: 700;">${amountLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Comprador</td>
                  <td style="padding: 8px 0; color: #111827;">${buyerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Correo</td>
                  <td style="padding: 8px 0;"><a href="mailto:${normalizedEmail}" style="color:#F58634; text-decoration:none;">${normalizedEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Link de pago ID</td>
                  <td style="padding: 8px 0; color: #111827;">#${link.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Orden EcartPay</td>
                  <td style="padding: 8px 0; color: #111827;">${orderId ?? "No disponible"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Fecha</td>
                  <td style="padding: 8px 0; color: #111827;">${new Date().toLocaleString("es-MX")}</td>
                </tr>
              </table>
            </div>
          </div>
        `;

        await sendMail({
          to: recipients,
          subject: `[InduMex Pagos] Pago confirmado ${amountLabel}`,
          html,
          text: `Pago confirmado\nMonto: ${amountLabel}\nComprador: ${buyerName}\nCorreo: ${normalizedEmail}\nLink ID: #${link.id}\nOrden EcartPay: ${orderId ?? "N/D"}`,
        });
      } catch (err) {
        console.error("[Pagos] Error enviando notificación de pago:", err);
      }
    })();

    success(res, { venta });
  } catch {
    failure(res, "Error al registrar pago", 500);
  }
});

// ─── Cliente: historial y recibo ──────────────────────────────────────────────

// POST /clientes/pagos/links — cliente creates a payment link for themselves
router.post("/clientes/pagos/links", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return failure(res, "No autorizado.", 401);
    }

    const { planId, monto, moneda, descripcion, expiresAt } = req.body as {
      planId?: number;
      monto?: number;
      moneda?: string;
      descripcion?: string;
      expiresAt?: string;
    };

    // Resolve plan if provided
    let resolvedPlan: MediaKitPlan | null = null;
    let resolvedMonto = monto;
    let resolvedMoneda = moneda ?? "MXN";
    let resolvedItems: { name: string; price: number; quantity: number }[] = [];

    if (planId) {
      resolvedPlan = await MediaKitPlan.findByPk(planId);
      if (!resolvedPlan || !resolvedPlan.activo) {
        return failure(res, "Plan no encontrado o inactivo", 404);
      }
      resolvedMonto = resolvedMonto ?? Number(resolvedPlan.precio);
      resolvedMoneda = resolvedPlan.moneda;
      resolvedItems = resolvedPlan.items ?? [];
    }

    if (!resolvedMonto || resolvedMonto <= 0) {
      return failure(res, "monto debe ser mayor a 0", 400);
    }

    const resolvedDescripcion =
      descripcion?.trim() || resolvedPlan?.nombre || "Pago InduMex";

    if (resolvedItems.length === 0) {
      resolvedItems = [{ name: resolvedDescripcion, price: resolvedMonto, quantity: 1 }];
    }

    // Fetch buyer info from the authenticated user record
    const usuario = await Usuario.findByPk(req.auth.userId);
    const compradorEmail = req.auth.email.toLowerCase();
    const compradorNombre = usuario
      ? `${usuario.get("nombre") ?? ""} ${usuario.get("apellido") ?? ""}`.trim()
      : null;
    const compradorTelefono = usuario ? (usuario.get("telefono") as string | null) : null;

    const parsedExpiresAt = expiresAt ? parseExpiresAt(expiresAt) : null;
    if (expiresAt && !parsedExpiresAt) {
      return failure(res, "Fecha de expiración inválida", 400);
    }

    const link = await PaymentLink.create({
      token: generateToken(),
      planId: planId ?? null,
      usuarioId: req.auth.userId,
      descripcion: resolvedDescripcion,
      monto: resolvedMonto,
      moneda: resolvedMoneda,
      items: resolvedItems,
      estado: "pending",
      compradorEmail,
      compradorNombre: compradorNombre || null,
      ecartpayOrderId: null,
      ecartpayCheckoutId: null,
      expiresAt: parsedExpiresAt,
    });

    // Create Stripe checkout link
    const stripe = await getStripeClient();
    if (stripe) {
      const checkoutResult = await createStripeCheckout(stripe, link, {
        customer: { email: compradorEmail, phone: compradorTelefono },
      });
      if (checkoutResult && "checkoutLink" in checkoutResult) {
        await link.update({ ecartpayCheckoutId: checkoutResult.checkoutId });
        return success(
          res,
          {
            ...link.toJSON(),
            checkoutLink: checkoutResult.checkoutLink,
            paymentUrl: checkoutResult.checkoutLink,
          },
          201
        );
      } else if (checkoutResult && "error" in checkoutResult) {
        console.warn(`[Stripe Checkout] Link cliente ${link.id}: ${checkoutResult.error}`);
      }
    }

    success(res, link, 201);
  } catch {
    failure(res, "Error al crear link de pago", 500);
  }
});

// GET /clientes/pagos
router.get("/clientes/pagos", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return failure(res, "No autorizado.", 401);
    }

    const ventas = await Venta.findAll({
      where: {
        [Op.or]: [
          { usuarioId: req.auth.userId },
          { compradorEmail: req.auth.email.toLowerCase() },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    success(res, ventas);
  } catch {
    failure(res, "Error al obtener historial de pagos", 500);
  }
});

// GET /clientes/pagos/links
router.get("/clientes/pagos/links", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return failure(res, "No autorizado.", 401);
    }

    await PaymentLink.update(
      { estado: "cancelled" },
      {
        where: {
          estado: "pending",
          expiresAt: { [Op.lte]: new Date() },
          [Op.or]: [
            { usuarioId: req.auth.userId },
            { compradorEmail: req.auth.email.toLowerCase() },
          ],
        },
      }
    );

    const links = await PaymentLink.findAll({
      where: {
        [Op.or]: [
          { usuarioId: req.auth.userId },
          { compradorEmail: req.auth.email.toLowerCase() },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    success(res, links);
  } catch {
    failure(res, "Error al obtener links de pago", 500);
  }
});

// GET /clientes/pagos/:id/recibo
router.get(
  "/clientes/pagos/:id/recibo",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!req.auth) {
        return failure(res, "No autorizado.", 401);
      }

      const ventaId = Number(req.params.id);
      if (!Number.isInteger(ventaId) || ventaId <= 0) {
        return failure(res, "ID de venta inválido", 400);
      }

      const venta = await Venta.findOne({
        where: {
          id: ventaId,
          [Op.or]: [
            { usuarioId: req.auth.userId },
            { compradorEmail: req.auth.email.toLowerCase() },
          ],
        },
      });

      if (!venta) {
        return failure(res, "Recibo no encontrado", 404);
      }

      const buffer = await buildReceiptPdfBuffer(venta);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="indumex-recibo-${venta.id}.pdf"`
      );
      res.status(200).send(buffer);
    } catch {
      failure(res, "Error al generar recibo PDF", 500);
    }
  }
);

// ─── Ventas (admin view) ───────────────────────────────────────────────────────

// GET /admin/pagos/ventas
router.get(
  "/admin/pagos/ventas",
  requireAuth,
  requireAdminRole,
  async (_req: Request, res: Response) => {
    try {
      const ventas = await Venta.findAll({ order: [["createdAt", "DESC"]] });
      success(res, ventas);
    } catch {
      failure(res, "Error al obtener ventas", 500);
    }
  }
);

// ─── Webhook Stripe ────────────────────────────────────────────────────────────

// POST /webhooks/stripe
// Stripe events are used as the source of truth, including async payments (e.g. OXXO).
async function processStripeWebhookEvent(req: Request, res: Response): Promise<Response | void> {
  try {
    const stripeConfig = await getStripeConfig();
    const webhookSecret = stripeConfig.webhookSecret;
    const incomingSecret =
      (req.headers["stripe-signature"] as string | undefined) ||
      (req.headers["x-signature"] as string | undefined);

    if (webhookSecret && incomingSecret && incomingSecret !== webhookSecret) {
      console.warn("[Webhook] Stripe signature mismatch");
      return failure(res, "Unauthorized", 401);
    }

    const payload = req.body as {
      id?: string;
      type?: string;
      data?: {
        object?: {
          id?: string;
          payment_intent?: string;
          payment_status?: string;
          customer_details?: {
            email?: string;
            name?: string;
            phone?: string;
          };
          receipt_email?: string;
          status?: string;
          currency?: string;
          metadata?: {
            payment_link_id?: string;
            payment_token?: string;
            customer_name?: string;
            customer_phone?: string;
          };
        };
      };
      [key: string]: unknown;
    };

    const eventType = payload.type ?? "";
    const objectData = payload.data?.object;
    const linkId = objectData?.metadata?.payment_link_id;
    const paymentToken = objectData?.metadata?.payment_token;

    let link: PaymentLink | null = null;
    if (linkId && Number.isInteger(Number(linkId))) {
      link = await PaymentLink.findByPk(Number(linkId));
    }
    if (!link && paymentToken) {
      link = await PaymentLink.findOne({ where: { token: paymentToken } });
    }

    if (!link) {
      // Ignore unrelated Stripe events.
      return res.status(200).json({ received: true, ignored: true });
    }

    const paymentStatus = objectData?.payment_status;
    const isPaidEvent =
      eventType === "checkout.session.completed" ||
      eventType === "checkout.session.async_payment_succeeded";
    const isFailedEvent =
      eventType === "checkout.session.async_payment_failed" ||
      eventType === "checkout.session.expired";

    if (isFailedEvent && link.estado === "pending") {
      await link.update({ estado: "cancelled" });
      return res.status(200).json({ received: true, status: "cancelled" });
    }

    if (!isPaidEvent || paymentStatus !== "paid") {
      return res.status(200).json({ received: true, status: "pending" });
    }

    if (link.estado === "paid") {
      const existingVenta = await Venta.findOne({
        where: { paymentLinkId: link.id, estado: "completed" },
        order: [["createdAt", "DESC"]],
      });
      return res.status(200).json({
        received: true,
        alreadyPaid: true,
        ventaId: existingVenta?.id ?? null,
      });
    }

    const customerEmail =
      payload.data?.object?.customer_details?.email ||
      payload.data?.object?.receipt_email ||
      link.compradorEmail ||
      "";
    const customerName =
      payload.data?.object?.customer_details?.name ||
      payload.data?.object?.metadata?.customer_name ||
      link.compradorNombre ||
      "";
    const orderId =
      payload.data?.object?.payment_intent ||
      payload.data?.object?.id ||
      payload.id ||
      null;
    const customerPhone =
      payload.data?.object?.customer_details?.phone ||
      payload.data?.object?.metadata?.customer_phone ||
      null;

    await link.update({
      estado: "paid",
      compradorEmail: customerEmail || link.compradorEmail,
      compradorNombre: customerName || link.compradorNombre,
      ecartpayOrderId: orderId,
    });

    let resolvedUsuarioId: number | null = link.usuarioId || null;
    if (customerEmail && !resolvedUsuarioId) {
      const userByEmail = await Usuario.findOne({
        where: { email: customerEmail },
      });
      if (userByEmail) {
        resolvedUsuarioId = userByEmail.id;
      }
    }

    const venta = await Venta.create({
      paymentLinkId: link.id,
      planId: link.planId || null,
      usuarioId: resolvedUsuarioId,
      compradorEmail: customerEmail || link.compradorEmail || "",
      compradorNombre: customerName || link.compradorNombre,
      compradorTelefono: customerPhone,
      monto: link.monto,
      moneda: link.moneda,
      ecartpayOrderId: orderId,
      ecartpayPayload: payload,
      estado: "completed",
    });

    await syncProviderSubscriptionAfterPayment({
      link,
      usuarioId: resolvedUsuarioId,
      buyerEmail: customerEmail || link.compradorEmail || "",
      buyerName: customerName || link.compradorNombre,
    });

    await syncMarketplaceSubscriptionAfterPayment({
      link,
      usuarioId: resolvedUsuarioId,
      buyerEmail: customerEmail || link.compradorEmail || "",
      buyerName: customerName || link.compradorNombre,
    });

    const adminEmails = await getPaymentNotificationEmails();
    if (adminEmails.length > 0) {
      await sendMail({
        to: adminEmails,
        subject: `[InduMex] Nuevo Pago Recibido - ${link.planId ? "Media Kit" : "Pago"}`,
        html: `
          <h2>Nuevo Pago Recibido</h2>
          <p><strong>Monto:</strong> ${formatCurrency(Number(link.monto), link.moneda)}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Nombre:</strong> ${customerName}</p>
          <p><strong>Proveedor:</strong> Stripe (${eventType})</p>
          <p><strong>Payment Intent / Session:</strong> ${orderId || "N/A"}</p>
          ${link.planId ? `<p><strong>Media Kit Plan ID:</strong> ${link.planId}</p>` : ""}
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `,
      });
    }

    res.status(200).json({ received: true, ventaId: venta.id });
  } catch (err) {
    console.error("[Webhook] Stripe event error:", err);
    return failure(res, "Webhook error", 500);
  }
}

// Primary Stripe webhook routes
router.post("/webhooks/stripe", processStripeWebhookEvent);
router.post("/webhooks/stripe-checkout", processStripeWebhookEvent);

// Legacy compatibility routes
router.post("/webhooks/clip", processStripeWebhookEvent);
router.post("/webhooks/clip-checkout", processStripeWebhookEvent);
router.post("/webhooks/ecartpay-checkout", processStripeWebhookEvent);

export default router;
