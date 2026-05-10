import { Request, Response } from "express";
import suscriptorService from "../services/suscriptorService";
import { failure, success } from "../utils/response";

class SuscriptoresController {
  async list(req: Request, res: Response): Promise<Response> {
    try {
      const emailQuery = typeof req.query.email === "string" ? req.query.email : undefined;
      const data = await suscriptorService.list(emailQuery);
      return success(res, data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al listar suscriptores.";
      return failure(res, message, 500);
    }
  }

  async subscribe(req: Request, res: Response): Promise<Response> {
    try {
      const { email, nombre, telefono, empresa, cargo, origen, metadata } = req.body as {
        email?: string;
        nombre?: string;
        telefono?: string;
        empresa?: string;
        cargo?: string;
        origen?: string;
        metadata?: Record<string, unknown>;
      };

      if (!email) {
        return failure(res, "El correo electrónico es obligatorio.", 422);
      }

      const data = await suscriptorService.subscribe({
        email,
        nombre,
        telefono,
        empresa,
        cargo,
        origen,
        metadata,
      });

      return success(res, data, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al registrar suscriptor.";
      return failure(res, message, 400);
    }
  }

  async unsubscribe(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body as { email?: string };

      if (!email) {
        return failure(res, "El correo electrónico es obligatorio.", 422);
      }

      await suscriptorService.unsubscribe(email);
      return success(res, { message: "Suscripción cancelada correctamente." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cancelar suscripción.";
      const status = message === "No se encontró el suscriptor." ? 404 : 400;
      return failure(res, message, status);
    }
  }
}

export default new SuscriptoresController();
