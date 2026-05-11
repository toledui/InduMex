import { Router, Request, Response } from "express";
import { Op } from "sequelize";
import ProveedorSuscripcionPlan from "../models/ProveedorSuscripcionPlan";
import ProveedorSuscripcion from "../models/ProveedorSuscripcion";
import PaymentLink from "../models/PaymentLink";
import Usuario from "../models/Usuario";
import { success, failure } from "../utils/response";
import { requireAuth, requireAdminRole } from "../middleware/authMiddleware";
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

function serializeSubscription(suscripcion: ProveedorSuscripcion) {
  const plain = suscripcion.get({ plain: true }) as ProveedorSuscripcion & {
    [key: string]: unknown;
  };

  return {
    ...plain,
    autoRenovacionCancelada: hasAutoRenewalCancelled(plain.notificacionesPendientes),
  };
}

function getPeriodMonths(periodicidad: "mensual" | "bimestral" | "trimestral" | "semestral" | "anual"): number {
  const map = {
    mensual: 1,
    bimestral: 2,
    trimestral: 3,
    semestral: 6,
    anual: 12,
  } as const;
  return map[periodicidad] ?? 1;
}

// ─── Admin: Planes de Suscripción ─────────────────────────────────────────────

// GET /admin/proveedor-suscripcion-planes
router.get(
  "/admin/proveedor-suscripcion-planes",
  requireAuth,
  requireAdminRole,
  async (_req: Request, res: Response) => {
    try {
      const planes = await ProveedorSuscripcionPlan.findAll({
        order: [["status", "ASC"], ["precio", "ASC"]],
      });
      success(res, planes);
    } catch {
      failure(res, "Error al obtener planes de suscripción", 500);
    }
  }
);

// GET /admin/proveedor-suscripcion-planes/:id
router.get(
  "/admin/proveedor-suscripcion-planes/:id",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return failure(res, "ID inválido", 400);
      }
      const plan = await ProveedorSuscripcionPlan.findByPk(id);
      if (!plan) return failure(res, "Plan no encontrado", 404);
      success(res, plan);
    } catch {
      failure(res, "Error al obtener plan", 500);
    }
  }
);

// POST /admin/proveedor-suscripcion-planes
router.post(
  "/admin/proveedor-suscripcion-planes",
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
        beneficios,
        status,
        activo,
      } = req.body as {
        nombre: string;
        descripcion?: string;
        precio: number;
        moneda?: string;
        periodicidad?: "mensual" | "bimestral" | "trimestral" | "semestral" | "anual";
        beneficios?: string[];
        status: "verificado" | "patrocinado";
        activo?: boolean;
      };

      if (!nombre || precio == null || !status) {
        return failure(
          res,
          "nombre, precio y status son obligatorios",
          400
        );
      }

      const plan = await ProveedorSuscripcionPlan.create({
        nombre,
        descripcion: descripcion ?? null,
        precio,
        moneda: moneda ?? "MXN",
        periodicidad: periodicidad ?? "mensual",
        beneficios: beneficios ?? [],
        status,
        activo: activo ?? true,
      });

      success(res, plan, 201);
    } catch (err) {
      if ((err as any)?.name === "SequelizeUniqueConstraintError") {
        return failure(res, "Ya existe un plan con ese nombre", 409);
      }
      failure(res, "Error al crear plan", 500);
    }
  }
);

// PUT /admin/proveedor-suscripcion-planes/:id
router.put(
  "/admin/proveedor-suscripcion-planes/:id",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return failure(res, "ID inválido", 400);
      }

      const plan = await ProveedorSuscripcionPlan.findByPk(id);
      if (!plan) return failure(res, "Plan no encontrado", 404);

      const {
        nombre,
        descripcion,
        precio,
        moneda,
        periodicidad,
        beneficios,
        status,
        activo,
      } = req.body as Partial<{
        nombre: string;
        descripcion: string;
        precio: number;
        moneda: string;
        periodicidad: "mensual" | "bimestral" | "trimestral" | "semestral" | "anual";
        beneficios: string[];
        status: "verificado" | "patrocinado";
        activo: boolean;
      }>;

      await plan.update({
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precio !== undefined && { precio }),
        ...(moneda !== undefined && { moneda }),
        ...(periodicidad !== undefined && { periodicidad }),
        ...(beneficios !== undefined && { beneficios }),
        ...(status !== undefined && { status }),
        ...(activo !== undefined && { activo }),
      });

      success(res, plan);
    } catch (err) {
      if ((err as any)?.name === "SequelizeUniqueConstraintError") {
        return failure(res, "Ya existe un plan con ese nombre", 409);
      }
      failure(res, "Error al actualizar plan", 500);
    }
  }
);

// DELETE /admin/proveedor-suscripcion-planes/:id
router.delete(
  "/admin/proveedor-suscripcion-planes/:id",
  requireAuth,
  requireAdminRole,
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return failure(res, "ID inválido", 400);
      }

      const plan = await ProveedorSuscripcionPlan.findByPk(id);
      if (!plan) return failure(res, "Plan no encontrado", 404);

      // No permitir eliminar planes con suscripciones activas
      const activas = await ProveedorSuscripcion.count({
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
      failure(res, "Error al eliminar plan", 500);
    }
  }
);

// ─── Admin: Suscripciones de Proveedores ──────────────────────────────────────

// GET /admin/proveedor-suscripciones
router.get(
  "/admin/proveedor-suscripciones",
  requireAuth,
  requireAdminRole,
  async (_req: Request, res: Response) => {
    try {
      const suscripciones = await ProveedorSuscripcion.findAll({
        include: [
          { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
          { model: ProveedorSuscripcionPlan, as: "plan", attributes: ["nombre", "status"] },
        ],
        order: [["createdAt", "DESC"]],
      });
      success(res, suscripciones);
    } catch {
      failure(res, "Error al obtener suscripciones", 500);
    }
  }
);

// ─── Cliente: Planes y Suscripción ───────────────────────────────────────────

// GET /clientes/proveedor-suscripcion-planes/activos
router.get(
  "/clientes/proveedor-suscripcion-planes/activos",
  async (_req: Request, res: Response) => {
    try {
      const planes = await ProveedorSuscripcionPlan.findAll({
        where: { activo: true },
        order: [["status", "ASC"], ["precio", "ASC"]],
      });
      success(res, planes);
    } catch {
      failure(res, "Error al obtener planes", 500);
    }
  }
);

// GET /clientes/proveedor-suscripcion/actual
router.get(
  "/clientes/proveedor-suscripcion/actual",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!req.auth) {
        return failure(res, "No autorizado", 401);
      }

      const suscripcion = await ProveedorSuscripcion.findOne({
        where: {
          usuarioId: req.auth.userId,
          estado: { [Op.in]: ["activa", "pausada"] },
        },
        include: [
          { model: ProveedorSuscripcionPlan, as: "plan" },
          {
            model: PaymentLink,
            as: "ultimoLinkPago",
            attributes: ["id", "token", "estado", "monto"],
          },
        ],
      });

      if (!suscripcion) {
        return success(res, null);
      }

      success(res, serializeSubscription(suscripcion));
    } catch {
      failure(res, "Error al obtener suscripción", 500);
    }
  }
);

// POST /clientes/proveedor-suscripcion/crear
router.post(
  "/clientes/proveedor-suscripcion/crear",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!req.auth) {
        return failure(res, "No autorizado", 401);
      }

      const { planId } = req.body as { planId: number };

      if (!planId) {
        return failure(res, "planId es requerido", 400);
      }

      // Verificar que el plan existe y está activo
      const plan = await ProveedorSuscripcionPlan.findByPk(planId);
      if (!plan || !plan.activo) {
        return failure(res, "Plan no encontrado o inactivo", 404);
      }

      // Verificar si tiene suscripción vigente para permitir upgrade de plan
      const suscripcionExistente = await ProveedorSuscripcion.findOne({
        where: {
          usuarioId: req.auth.userId,
          estado: { [Op.in]: ["activa", "pausada"] },
        },
        include: [
          { model: ProveedorSuscripcionPlan, as: "plan" },
          {
            model: PaymentLink,
            as: "ultimoLinkPago",
            attributes: ["id", "token", "estado", "expiresAt"],
            required: false,
          },
        ],
      });

      const ahora = new Date();
      const vencimiento = new Date(ahora);
      vencimiento.setMonth(vencimiento.getMonth() + getPeriodMonths(plan.periodicidad));

      let suscripcion: ProveedorSuscripcion;

      if (suscripcionExistente) {
        if (suscripcionExistente.planId === planId) {
          const ultimoLinkPago = (suscripcionExistente as unknown as {
            ultimoLinkPago?: PaymentLink | null;
          }).ultimoLinkPago;

          const pendingVigente =
            ultimoLinkPago?.estado === "pending" &&
            (!ultimoLinkPago.expiresAt || new Date(ultimoLinkPago.expiresAt) > ahora);

          if (pendingVigente) {
            return failure(
              res,
              "Ya tienes un link de pago pendiente para este plan. Úsalo o cancélalo antes de generar otro.",
              409
            );
          }

          const suscripcionActivaVigente =
            suscripcionExistente.estado === "activa" &&
            new Date(suscripcionExistente.fechaVencimiento) > ahora;

          if (suscripcionActivaVigente) {
            return failure(res, "Ya tienes este plan activo y vigente.", 409);
          }

          // Si el link anterior fue eliminado/caducó/canceló, regenerar link para el mismo plan.
          await suscripcionExistente.update({
            estado: "pausada",
            fechaInicio: ahora,
            fechaVencimiento: vencimiento,
            periodoGraciaVencimentoEn: null,
            proximoLinkPagoGeneradoEn: null,
            notificacionesPendientes: withoutAutoRenewalCancelled(suscripcionExistente.notificacionesPendientes),
          });
          suscripcion = suscripcionExistente;
        } else {
          await suscripcionExistente.update({
            planId,
            estado: "pausada",
            fechaInicio: ahora,
            fechaVencimiento: vencimiento,
            periodoGraciaVencimentoEn: null,
            proximoLinkPagoGeneradoEn: null,
            notificacionesPendientes: withoutAutoRenewalCancelled(suscripcionExistente.notificacionesPendientes),
          });
          suscripcion = suscripcionExistente;
        }
      } else {
        suscripcion = await ProveedorSuscripcion.create({
          usuarioId: req.auth.userId,
          planId,
          estado: "pausada",
          fechaInicio: ahora,
          fechaVencimiento: vencimiento,
          periodoGraciaVencimentoEn: null,
          notificacionesPendientes: [],
        });
      }

      // Generar link de pago automáticamente
      const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";
      const frontendBaseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:3000";

      const usuario = await Usuario.findByPk(req.auth.userId);
      if (!usuario) {
        return failure(res, "Usuario no encontrado", 404);
      }

      const paymentLink = await PaymentLink.create({
        token: require("crypto").randomBytes(24).toString("hex"),
        descripcion: `Suscripción: ${plan.nombre}`,
        monto: Number(plan.precio),
        moneda: plan.moneda,
        items: [
          {
            name: plan.nombre,
            price: Number(plan.precio),
            quantity: 1,
          },
        ],
        estado: "pending",
        compradorEmail: usuario.email,
        compradorNombre: usuario.nombre ?? null,
        usuarioId: req.auth.userId,
      });

      // Asociar link de pago a la suscripción
      await suscripcion.update({ ultimoLinkPagoId: paymentLink.id });

      // Notificar al cliente
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f8f9fa; padding: 24px;">
          <div style="background: #004AAD; padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: #fff; font-size: 20px;">Suscripción de Proveedor Creada</h1>
          </div>
          <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
            <p>¡Hola ${usuario.nombre}!</p>
            <p>Tu suscripción ${plan.nombre} está lista para activarse al confirmar pago.</p>
            <p><strong>Detalles:</strong></p>
            <ul>
              <li>Plan: ${plan.nombre}</li>
              <li>Precio: $${plan.precio.toLocaleString("es-MX")}</li>
              <li>Período: ${plan.periodicidad}</li>
              <li>Vencimiento: ${vencimiento.toLocaleDateString("es-MX")}</li>
            </ul>
            <p style="margin: 20px 0;">
              <a href="${frontendBaseUrl}/pagar/${paymentLink.token}" 
                 style="background: #F58634; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Proceder al Pago
              </a>
            </p>
            <p style="color: #64748b; font-size: 12px;">
              Tras el pago, activaremos tu tier automáticamente y te enviaremos confirmación por correo.
            </p>
          </div>
        </div>
      `;

      await sendMail({
        to: [usuario.email],
        subject: "Suscripción de Proveedor Creada - InduMex",
        html,
        text: `Tu suscripción ${plan.nombre} está lista. Accede a ${frontendBaseUrl}/pagar/${paymentLink.token} para completar el pago.`,
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
    } catch (err) {
      console.error("[Suscripción] Error:", err);
      failure(res, "Error al crear suscripción", 500);
    }
  }
);

// PATCH /clientes/proveedor-suscripcion/cancelar-renovacion
router.patch(
  "/clientes/proveedor-suscripcion/cancelar-renovacion",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!req.auth) {
        return failure(res, "No autorizado", 401);
      }

      const ahora = new Date();

      const suscripcion = await ProveedorSuscripcion.findOne({
        where: {
          usuarioId: req.auth.userId,
          estado: { [Op.in]: ["activa", "pausada"] },
          fechaVencimiento: { [Op.gte]: ahora },
        },
        include: [
          { model: ProveedorSuscripcionPlan, as: "plan" },
          {
            model: PaymentLink,
            as: "ultimoLinkPago",
            attributes: ["id", "token", "estado", "monto", "expiresAt"],
            required: false,
          },
        ],
      });

      if (!suscripcion) {
        return failure(res, "No tienes una suscripción activa para cancelar renovación.", 404);
      }

      if (hasAutoRenewalCancelled(suscripcion.notificacionesPendientes)) {
        return failure(res, "La renovación automática ya está cancelada para este plan.", 409);
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
          { model: ProveedorSuscripcionPlan, as: "plan" },
          {
            model: PaymentLink,
            as: "ultimoLinkPago",
            attributes: ["id", "token", "estado", "monto", "expiresAt"],
            required: false,
          },
        ],
      });

      success(res, serializeSubscription(suscripcion));
    } catch {
      failure(res, "Error al cancelar renovación automática", 500);
    }
  }
);

export default router;
