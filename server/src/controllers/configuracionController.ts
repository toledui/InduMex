import { Request, Response } from "express";
import * as service from "../services/configuracionService";
import { failure, success } from "../utils/response";

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
