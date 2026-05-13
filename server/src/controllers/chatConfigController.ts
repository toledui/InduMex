import { Request, Response } from "express";
import ChatConfig from "../models/ChatConfig";
import { failure, success } from "../utils/response";

export async function getChatConfig(
  req: Request,
  res: Response
): Promise<void> {
  try {
    let config = await ChatConfig.findByPk(1);

    // Si no existe, crear una configuración por defecto
    if (!config) {
      config = await ChatConfig.create({
        id: 1,
        n8nWebhookUrl: null,
        isActive: false,
      });
    }

    success(res, config);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    failure(res, `Error al obtener configuración del chat: ${message}`, 500);
  }
}

export async function updateChatConfig(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { n8nWebhookUrl, isActive } = req.body as {
      n8nWebhookUrl?: string;
      isActive?: boolean;
    };

    // Validar que al menos haya un campo
    if (
      (n8nWebhookUrl === undefined || n8nWebhookUrl === null) &&
      isActive === undefined
    ) {
      failure(res, "Debes proporcionar n8nWebhookUrl o isActive", 400);
      return;
    }

    let config = await ChatConfig.findByPk(1);

    if (!config) {
      config = await ChatConfig.create({
        id: 1,
        n8nWebhookUrl: n8nWebhookUrl || null,
        isActive: isActive ?? false,
      });
    } else {
      if (n8nWebhookUrl !== undefined && n8nWebhookUrl !== null) {
        config.n8nWebhookUrl = n8nWebhookUrl;
      }
      if (isActive !== undefined) {
        config.isActive = isActive;
      }
      await config.save();
    }

    success(res, config);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    failure(res, `Error al actualizar configuración del chat: ${message}`, 500);
  }
}
