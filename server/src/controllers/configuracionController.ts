import { Request, Response } from "express";
import * as service from "../services/configuracionService";
import { failure, success } from "../utils/response";
import { sendSmtpTestEmail, type SmtpTestResult } from "../utils/mailer";

export async function getConfig(req: Request, res: Response): Promise<void> {
  try {
    const data = await service.getAll();
    success(res, data);
  } catch (err) {
    failure(res, "Error al obtener configuración", 500);
  }
}

export async function updateConfig(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const entries = Object.entries(body).map(([clave, valor]) => ({
      clave,
      valor: valor != null ? String(valor) : null,
    }));

    if (!entries.length) {
      failure(res, "No se proporcionaron claves para actualizar", 400);
      return;
    }

    const data = await service.updateMany(entries);
    success(res, data);
  } catch (err) {
    failure(res, "Error al guardar configuración", 500);
  }
}

export async function testSmtp(req: Request, res: Response): Promise<void> {
  try {
    const { to } = req.body as { to?: string };
    const recipient = to?.trim().toLowerCase();

    if (!recipient) {
      failure(res, "El correo destino es obligatorio", 422);
      return;
    }

    const testResult = await sendSmtpTestEmail(recipient);
    success(res, {
      message: `Correo de prueba enviado a ${recipient}`,
      messageId: testResult.messageId,
      accepted: testResult.accepted,
      smtp: `${testResult.host}:${testResult.port} (secure: ${testResult.secure})`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al probar SMTP";
    failure(res, message, 400);
  }
}
