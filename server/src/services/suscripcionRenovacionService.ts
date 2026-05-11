import { Op } from "sequelize";
import ProveedorSuscripcion from "../models/ProveedorSuscripcion";
import ProveedorSuscripcionPlan from "../models/ProveedorSuscripcionPlan";
import MarketplaceSuscripcion from "../models/MarketplaceSuscripcion";
import MarketplacePlan from "../models/MarketplacePlan";
import PaymentLink from "../models/PaymentLink";
import Usuario from "../models/Usuario";
import { sendMail } from "../utils/mailer";

const DAYS_BEFORE_EXPIRY = 3; // Generar links 3 días antes
const GRACE_PERIOD_DAYS = 3; // Período de gracia de 3 días
const AUTO_RENEWAL_CANCELLED_TYPE = "auto_renovacion_cancelada";

function hasAutoRenewalCancelled(raw: unknown): boolean {
  if (!Array.isArray(raw)) return false;

  return raw.some(
    (item) =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as { type?: unknown }).type === "string" &&
      (item as { type: string }).type === AUTO_RENEWAL_CANCELLED_TYPE
  );
}

/**
 * Obtiene todas las suscripciones que deben generar links de renovación próximamente
 */
export async function getSuscripcionesParaRenovacion() {
  const hoy = new Date();
  const fechaLimite = new Date(hoy);
  fechaLimite.setDate(fechaLimite.getDate() + DAYS_BEFORE_EXPIRY);

  const subscriptions = await ProveedorSuscripcion.findAll({
    where: {
      estado: { [Op.in]: ["activa", "pausada"] },
      fechaVencimiento: {
        [Op.lte]: fechaLimite,
        [Op.gte]: hoy,
      },
      proximoLinkPagoGeneradoEn: null,
    },
    include: [
      { model: Usuario, attributes: ["id", "nombre", "email"] },
      { model: ProveedorSuscripcionPlan, as: "plan" },
    ],
  });

  return subscriptions.filter(
    (suscripcion) => !hasAutoRenewalCancelled(suscripcion.notificacionesPendientes)
  );
}

/**
 * Genera un link de pago de renovación para una suscripción
 */
export async function generarLinkRenovacion(suscripcion: any) {
  try {
    const plan = suscripcion.plan;
    const usuario = suscripcion.usuario;

    if (!plan || !usuario) {
      console.error(
        `[Renovación] Suscripción ${suscripcion.id} sin plan o usuario asociado`
      );
      return null;
    }

    // Crear link de pago
    const paymentLink = await PaymentLink.create({
      token: require("crypto").randomBytes(24).toString("hex"),
      descripcion: `Renovación: ${plan.nombre}`,
      monto: Number(plan.precio),
      moneda: plan.moneda,
      items: [
        {
          name: `${plan.nombre} - Renovación`,
          price: Number(plan.precio),
          quantity: 1,
        },
      ],
      estado: "pending",
      compradorEmail: usuario.email,
      compradorNombre: usuario.nombre ?? null,
      usuarioId: usuario.id,
    });

    // Actualizar suscripción con el link generado
    await suscripcion.update({
      proximoLinkPagoGeneradoEn: new Date(),
      ultimoLinkPagoId: paymentLink.id,
    });

    // Enviar notificación al usuario
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:3000";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8f9fa; padding: 24px;">
        <div style="background: #004AAD; padding: 20px 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: #fff; font-size: 20px;">Recordatorio de Renovación</h1>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
          <p>¡Hola ${usuario.nombre}!</p>
          <p>Tu suscripción de proveedor vence el <strong>${suscripcion.fechaVencimiento.toLocaleDateString(
            "es-MX"
          )}</strong></p>
          <p><strong>Para renovar tu suscripción:</strong></p>
          <ul>
            <li>Plan: ${plan.nombre}</li>
            <li>Precio: $${plan.precio.toLocaleString("es-MX")}</li>
            <li>Período: Mensual</li>
          </ul>
          <p style="margin: 20px 0;">
            <a href="${frontendBaseUrl}/pagar/${paymentLink.token}" 
               style="background: #F58634; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Renovar Ahora
            </a>
          </p>
          <p style="color: #64748b; font-size: 12px;">
            Si no renuevas en los próximos 3 días después del vencimiento, tu suscripción entrará en un período de gracia. 
            Después de 3 días más, se marcará como vencida.
          </p>
        </div>
      </div>
    `;

    await sendMail({
      to: [usuario.email],
      subject: "Recordatorio: Renovación de Suscripción - InduMex",
      html,
      text: `Tu suscripción vence el ${suscripcion.fechaVencimiento.toLocaleDateString(
        "es-MX"
      )}. Renuévala en ${frontendBaseUrl}/pagar/${paymentLink.token}`,
    });

    console.log(`[Renovación] Link generado para suscripción ${suscripcion.id}`);
    return paymentLink;
  } catch (err) {
    console.error(
      `[Renovación] Error generando link para suscripción ${suscripcion.id}:`,
      err
    );
    return null;
  }
}

/**
 * Actualiza el estado de suscripciones vencidas y aplica período de gracia
 */
export async function procesarSuscripcionesVencidas() {
  try {
    const ahora = new Date();

    // Suscripciones que vencieron sin renovación: pasan a período de gracia
    const porVencer = await ProveedorSuscripcion.findAll({
      where: {
        estado: "activa",
        fechaVencimiento: {
          [Op.lte]: ahora,
        },
        periodoGraciaVencimentoEn: null,
      },
    });

    for (const suscripcion of porVencer) {
      const periodoGraciaStat = new Date(suscripcion.fechaVencimiento);
      periodoGraciaStat.setDate(periodoGraciaStat.getDate() + GRACE_PERIOD_DAYS);

      await suscripcion.update({
        periodoGraciaVencimentoEn: periodoGraciaStat,
      });

      console.log(
        `[Renovación] Suscripción ${suscripcion.id} en período de gracia hasta ${periodoGraciaStat.toISOString()}`
      );
    }

    // Suscripciones cuyo período de gracia venció: marcar como vencidas
    const porMarcarVencidas = await ProveedorSuscripcion.findAll({
      where: {
        estado: "activa",
        periodoGraciaVencimentoEn: {
          [Op.lte]: ahora,
        },
      },
    });

    for (const suscripcion of porMarcarVencidas) {
      await suscripcion.update({ estado: "vencida" });
      console.log(`[Renovación] Suscripción ${suscripcion.id} marcada como vencida`);
    }
  } catch (err) {
    console.error("[Renovación] Error procesando suscripciones vencidas:", err);
  }
}

/**
 * Obtiene suscripciones de marketplace que requieren link de renovación
 */
export async function getMarketplaceSuscripcionesParaRenovacion() {
  const hoy = new Date();
  const fechaLimite = new Date(hoy);
  fechaLimite.setDate(fechaLimite.getDate() + DAYS_BEFORE_EXPIRY);

  const subscriptions = await MarketplaceSuscripcion.findAll({
    where: {
      estado: { [Op.in]: ["activa", "pausada"] },
      fechaVencimiento: {
        [Op.lte]: fechaLimite,
        [Op.gte]: hoy,
      },
      proximoLinkPagoGeneradoEn: null,
    },
    include: [
      { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
      { model: MarketplacePlan, as: "plan" },
    ],
  });

  return subscriptions.filter(
    (suscripcion) => !hasAutoRenewalCancelled(suscripcion.notificacionesPendientes)
  );
}

/**
 * Genera link de pago para renovación de marketplace
 */
export async function generarLinkRenovacionMarketplace(suscripcion: any) {
  try {
    const plan = suscripcion.plan;
    const usuario = suscripcion.usuario;

    if (!plan || !usuario) {
      console.error(
        `[Renovación Marketplace] Suscripción ${suscripcion.id} sin plan o usuario asociado`
      );
      return null;
    }

    const paymentLink = await PaymentLink.create({
      token: require("crypto").randomBytes(24).toString("hex"),
      descripcion: `Renovación Marketplace: ${plan.nombre}`,
      monto: Number(plan.precio),
      moneda: plan.moneda,
      items: [
        {
          name: `${plan.nombre} - Renovación Marketplace`,
          price: Number(plan.precio),
          quantity: 1,
        },
      ],
      estado: "pending",
      compradorEmail: usuario.email,
      compradorNombre: usuario.nombre ?? null,
      usuarioId: usuario.id,
    });

    await suscripcion.update({
      proximoLinkPagoGeneradoEn: new Date(),
      ultimoLinkPagoId: paymentLink.id,
    });

    const frontendBaseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:3000";
    await sendMail({
      to: [usuario.email],
      subject: "Renovación Marketplace - InduMex",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8f9fa; padding: 24px;">
          <div style="background: #004AAD; padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: #fff; font-size: 20px;">Recordatorio de renovación Marketplace</h1>
          </div>
          <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
            <p>Hola ${usuario.nombre ?? ""},</p>
            <p>Tu suscripción de marketplace vence el <strong>${suscripcion.fechaVencimiento.toLocaleDateString(
              "es-MX"
            )}</strong>.</p>
            <p>
              <a href="${frontendBaseUrl}/pagar/${paymentLink.token}" style="background: #F58634; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Renovar ahora
              </a>
            </p>
          </div>
        </div>
      `,
      text: `Tu suscripción de marketplace vence pronto. Renueva en ${frontendBaseUrl}/pagar/${paymentLink.token}`,
    });

    return paymentLink;
  } catch (err) {
    console.error(
      `[Renovación Marketplace] Error generando link para suscripción ${suscripcion.id}:`,
      err
    );
    return null;
  }
}

/**
 * Procesa estado de suscripciones marketplace vencidas y gracia
 */
export async function procesarMarketplaceSuscripcionesVencidas() {
  try {
    const ahora = new Date();

    const porVencer = await MarketplaceSuscripcion.findAll({
      where: {
        estado: "activa",
        fechaVencimiento: {
          [Op.lte]: ahora,
        },
        periodoGraciaVencimientoEn: null,
      },
    });

    for (const suscripcion of porVencer) {
      const periodoGracia = new Date(suscripcion.fechaVencimiento);
      periodoGracia.setDate(periodoGracia.getDate() + GRACE_PERIOD_DAYS);

      await suscripcion.update({
        periodoGraciaVencimientoEn: periodoGracia,
      });
    }

    const porMarcarVencidas = await MarketplaceSuscripcion.findAll({
      where: {
        estado: "activa",
        periodoGraciaVencimientoEn: {
          [Op.lte]: ahora,
        },
      },
    });

    for (const suscripcion of porMarcarVencidas) {
      await suscripcion.update({ estado: "vencida" });
    }
  } catch (err) {
    console.error("[Renovación Marketplace] Error procesando vencidas:", err);
  }
}

/**
 * Tarea principal de renovación automática
 * Se debe ejecutar una vez por día
 */
export async function procesarRenovacionesAutomaticas() {
  console.log("[Renovación] Iniciando verificación de renovaciones automáticas...");

  try {
    // Procesar suscripciones vencidas
    await procesarSuscripcionesVencidas();
    await procesarMarketplaceSuscripcionesVencidas();

    // Generar links para renovaciones próximas
    const suscripciones = await getSuscripcionesParaRenovacion();
    console.log(
      `[Renovación] Encontradas ${suscripciones.length} suscripciones para renovar`
    );

    let generados = 0;
    for (const suscripcion of suscripciones) {
      const resultado = await generarLinkRenovacion(suscripcion);
      if (resultado) generados++;
    }

    const marketplaceSuscripciones = await getMarketplaceSuscripcionesParaRenovacion();
    let marketplaceGenerados = 0;
    for (const suscripcion of marketplaceSuscripciones) {
      const resultado = await generarLinkRenovacionMarketplace(suscripcion);
      if (resultado) marketplaceGenerados++;
    }

    console.log(
      `[Renovación] Se generaron ${generados}/${suscripciones.length} links de renovación`
    );
    console.log(
      `[Renovación Marketplace] Se generaron ${marketplaceGenerados}/${marketplaceSuscripciones.length} links de renovación`
    );
  } catch (err) {
    console.error("[Renovación] Error en procesarRenovacionesAutomaticas:", err);
  }
}

export default {
  procesarRenovacionesAutomaticas,
  generarLinkRenovacion,
  getSuscripcionesParaRenovacion,
  procesarSuscripcionesVencidas,
  getMarketplaceSuscripcionesParaRenovacion,
  generarLinkRenovacionMarketplace,
  procesarMarketplaceSuscripcionesVencidas,
};
