import { Router, Request, Response } from "express";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";
import { Op } from "sequelize";
import PDFDocument from "pdfkit";
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

async function getClipConfig(): Promise<{
  apiKey: string;
  secretKey: string;
  sandbox: boolean;
}> {
  const rows = await Configuracion.findAll({
    where: {
      clave: ["clip_api_key", "clip_secret_key", "clip_sandbox"],
    },
  });
  const map = Object.fromEntries(rows.map((r) => [r.clave, r.valor ?? ""]));
  return {
    apiKey: map["clip_api_key"] ?? "",
    secretKey: map["clip_secret_key"] ?? "",
    sandbox: map["clip_sandbox"] === "true",
  };
}

async function getClipWebhookSecret(): Promise<string> {
  const row = await Configuracion.findOne({
    where: { clave: "clip_webhook_secret" },
  });
  return row?.valor ?? "";
}

async function createClipAuthorizationToken(config: {
  apiKey: string;
  secretKey: string;
  sandbox: boolean;
}): Promise<string | null> {
  if (!config.apiKey || !config.secretKey) {
    return null;
  }

  // Clip usa autenticación Basic base64(api_key:secret_key).
  const basic = Buffer.from(`${config.apiKey}:${config.secretKey}`).toString("base64");
  return `Basic ${basic}`;
}

async function createClipCheckout(
  authToken: string,
  paymentLink: PaymentLink,
  config: {
    sandbox: boolean;
    customer?: { name?: string | null; email?: string | null; phone?: string | null };
  }
): Promise<{ checkoutLink: string; checkoutId: string } | { error: string } | null> {
  if (!authToken) {
    return null;
  }

  // Sandbox usa endpoint dev, producción usa el endpoint estándar
  const endpoint = config.sandbox
    ? "https://dev-api.payclip.com/v2/checkout"
    : "https://api.payclip.com/v2/checkout";

  // Construir URL pública de webhook y redirecciones
  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";
  const frontendBaseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:3000";
  const webhookUrl = `${apiBaseUrl}/webhooks/clip-checkout?link_id=${paymentLink.id}`;
  const payPageUrl = `${frontendBaseUrl}/pagar/${paymentLink.token}`;

  // Construir customer_info dentro de metadata (según docs de Clip)
  const customerInfo: Record<string, string | number> = {};
  if (config.customer?.name) customerInfo.name = config.customer.name;
  if (config.customer?.email) customerInfo.email = config.customer.email;
  if (config.customer?.phone) {
    const digits = config.customer.phone.replace(/\D/g, "").slice(-10);
    if (digits.length >= 8) customerInfo.phone = Number(digits);
  }

  const requestBody: Record<string, unknown> = {
    amount: Number(paymentLink.monto),
    currency: paymentLink.moneda,
    purchase_description: (paymentLink.descripcion?.trim() || "Pago InduMex").slice(0, 255),
    redirection_url: {
      success: `${payPageUrl}?clip=success`,
      error: `${payPageUrl}?clip=error`,
      default: payPageUrl,
    },
    override_settings: {
      locale: "es-MX",
      tip_enabled: false,
    },
    metadata: {
      external_reference: String(paymentLink.id),
      payment_token: paymentLink.token,
      ...(Object.keys(customerInfo).length > 0 ? { customer_info: customerInfo } : {}),
    },
    // Clip acepta webhook_url en el body
    webhook_url: webhookUrl,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "Authorization": authToken,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let detail = "";
      try {
        detail = await response.text();
      } catch {
        detail = "";
      }
      const reason =
        response.status === 401
          ? "Credenciales Clip inválidas o sin permiso para checkout"
          : `Clip respondió ${response.status}`;
      const composed = detail ? `${reason}: ${detail}` : reason;
      console.error(`[Clip Checkout] ${composed}`);
      return { error: composed };
    }

    const data = (await response.json()) as Record<string, unknown>;
    const checkoutLink =
      (typeof data.payment_request_url === "string" && data.payment_request_url) ||
      (typeof data.link === "string" && data.link) ||
      (typeof data.url === "string" && data.url) ||
      (typeof data.checkout_url === "string" && data.checkout_url) ||
      null;
    const checkoutId =
      (typeof data.payment_request_id === "string" && data.payment_request_id) ||
      (typeof data.id === "string" && data.id) ||
      null;

    if (!checkoutLink || !checkoutId) {
      console.error("[Clip Checkout] Missing link or id in response", data);
      return { error: "Clip no devolvió checkout URL o ID" };
    }

    return { checkoutLink, checkoutId };
  } catch (err) {
    console.error("[Clip Checkout] Error:", err);
    return { error: err instanceof Error ? err.message : "Error desconocido al crear checkout en Clip" };
  } finally {
    clearTimeout(timeout);
  }
}

function buildClipCheckoutUrl(checkoutId: string): string {
  return `https://checkout.clip.mx/pay/${encodeURIComponent(checkoutId)}`;
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

  return "Checkout Clip";
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

// GET /admin/pagos/clip/validate
router.get(
  "/admin/pagos/clip/validate",
  requireAuth,
  requireAdminRole,
  async (_req: Request, res: Response) => {
    try {
      const config = await getClipConfig();
      const token = await createClipAuthorizationToken(config);

      if (!config.apiKey || !config.secretKey) {
        return failure(
          res,
          "Faltan credenciales de Clip (api_key o secret_key)",
          400
        );
      }

      if (!token) {
        return failure(
          res,
          "No fue posible generar el token de autorización con las credenciales actuales",
          400
        );
      }

      success(res, {
        sandbox: config.sandbox,
        hasPublicId: Boolean(config.apiKey),
        hasSecretKey: Boolean(config.secretKey),
        tokenGenerated: true,
      });
    } catch {
      failure(res, "Error al validar credenciales de Clip", 500);
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

      // Create Clip checkout link
      const clipConfig = await getClipConfig();
      const authToken = await createClipAuthorizationToken(clipConfig);
      if (authToken) {
        const checkoutResult = await createClipCheckout(authToken, link, {
          sandbox: clipConfig.sandbox,
        });
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
          console.warn(`[Clip Checkout] Link admin ${link.id}: ${checkoutResult.error}`);
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

    const { apiKey, secretKey, sandbox } = await getClipConfig();

    // Always try to generate a fresh checkout link. If Clip is unavailable,
    // fallback to previous id-based URL when available.
    let checkoutLink = link.ecartpayCheckoutId
      ? buildClipCheckoutUrl(link.ecartpayCheckoutId)
      : null;

    const authToken = await createClipAuthorizationToken({
      apiKey,
      secretKey,
      sandbox,
    });
    if (authToken) {
      let clipError: string | null = null;
      const checkoutResult = await createClipCheckout(authToken, link, {
        sandbox,
        customer: { email: compradorEmail, phone: compradorTelefono },
      });
      if (checkoutResult && "checkoutLink" in checkoutResult) {
        await link.update({
          ecartpayCheckoutId: checkoutResult.checkoutId,
        });
        checkoutLink = checkoutResult.checkoutLink;
      } else if (checkoutResult && "error" in checkoutResult) {
        clipError = checkoutResult.error;
      }

      if (!checkoutLink) {
        return failure(
          res,
          `No fue posible generar el enlace de checkout con Clip. ${clipError ?? "Verifica credenciales y configuración de URLs públicas."}`,
          502
        );
      }
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

    // Create Clip checkout link
    const clipConfig = await getClipConfig();
    const authToken = await createClipAuthorizationToken(clipConfig);
    if (authToken) {
      const checkoutResult = await createClipCheckout(authToken, link, {
        sandbox: clipConfig.sandbox,
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
        console.warn(`[Clip Checkout] Link cliente ${link.id}: ${checkoutResult.error}`);
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

// ─── Webhook Clip ──────────────────────────────────────────────────────────────

// POST /webhooks/clip
// Clip can send generic payment notifications here.
router.post("/webhooks/clip", async (req: Request, res: Response) => {
  try {
    // Load webhook secret from DB configuration
    const webhookSecret = await getClipWebhookSecret();
    const incomingSecret =
      (req.headers["x-clip-signature"] as string | undefined) ||
      (req.headers["x-signature"] as string | undefined) ||
      (req.headers["x-ecartpay-secret"] as string | undefined);

    if (webhookSecret && incomingSecret !== webhookSecret) {
      return failure(res, "Unauthorized", 401);
    }

    // The payload structure depends on Clip's webhook spec.
    // We store it and update the matching sale if we can correlate.
    const payload = req.body as {
      order_id?: string;
      status?: string;
      [key: string]: unknown;
    };

    if (payload.order_id) {
      const venta = await Venta.findOne({
        where: { ecartpayOrderId: payload.order_id },
      });
      if (venta) {
        await venta.update({ ecartpayPayload: payload });
      }
    }

    res.status(200).json({ received: true });
  } catch {
    failure(res, "Webhook error", 500);
  }
});

async function processClipCheckoutWebhook(req: Request, res: Response): Promise<Response | void> {
  try {
    const linkId = req.query.link_id as string | undefined;
    if (!linkId) {
      return failure(res, "link_id is required", 400);
    }

    // Load webhook secret from DB configuration
    const webhookSecret = await getClipWebhookSecret();
    const incomingSecret =
      (req.headers["x-clip-signature"] as string | undefined) ||
      (req.headers["x-signature"] as string | undefined) ||
      (req.headers["x-ecartpay-secret"] as string | undefined);

    // Validate webhook secret if configured
    if (webhookSecret && incomingSecret !== webhookSecret) {
      console.warn(`[Webhook] Secret mismatch for link ${linkId}`);
      // Still accept it but log the warning - some environments may omit header
    }

    const payload = req.body as {
      status?: string;
      order_id?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      [key: string]: unknown;
    };

    // Find the payment link
    const link = await PaymentLink.findByPk(Number(linkId));
    if (!link) {
      return failure(res, "Link not found", 404);
    }

    // If already paid, just acknowledge
    if (link.estado === "paid") {
      return res.status(200).json({ received: true, alreadyPaid: true });
    }

    // Update payment link status
    const customerEmail = payload.email || link.compradorEmail || "";
    const customerName = payload.first_name
      ? `${payload.first_name} ${payload.last_name || ""}`.trim()
      : link.compradorNombre || "";

    await link.update({
      estado: "paid",
      compradorEmail: customerEmail || link.compradorEmail,
      compradorNombre: customerName || link.compradorNombre,
      ecartpayOrderId: payload.order_id || null,
    });

    // Create the sale record
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
      compradorEmail: customerEmail,
      compradorNombre: customerName || link.compradorNombre,
      monto: link.monto,
      moneda: link.moneda,
      ecartpayOrderId: payload.order_id || null,
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

    // Send notification email to admins
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
          <p><strong>Orden ID EcartPay:</strong> ${payload.order_id || "N/A"}</p>
          ${link.planId ? `<p><strong>Media Kit Plan ID:</strong> ${link.planId}</p>` : ""}
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `,
      });
    }

    res.status(200).json({ received: true, ventaId: venta.id });
  } catch (err) {
    console.error("[Webhook] Clip checkout error:", err);
    return failure(res, "Webhook error", 500);
  }
}

// POST /webhooks/clip-checkout
router.post("/webhooks/clip-checkout", processClipCheckoutWebhook);

// Legacy compatibility route
router.post("/webhooks/ecartpay-checkout", processClipCheckoutWebhook);

export default router;
