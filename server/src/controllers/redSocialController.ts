import { Request, Response } from "express";
import redSocialService from "../services/redSocialService";
import { success, failure } from "../utils/response";

class RedSocialController {
  /**
   * GET /api/v1/social-networks
   * Obtener todas las redes sociales activas (público)
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const redes = await redSocialService.getAllActive();
      success(res, redes, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al obtener redes sociales");
    }
  }

  /**
   * GET /api/v1/social-networks/admin
   * Obtener todas las redes (incluidas inactivas) - para admin
   */
  async listAdmin(req: Request, res: Response): Promise<void> {
    try {
      const redes = await redSocialService.getAll();
      success(res, redes, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al obtener redes sociales");
    }
  }

  /**
   * GET /api/v1/social-networks/:id
   * Obtener una red social por ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        failure(res, "ID inválido", 400);
        return;
      }

      const red = await redSocialService.getById(Number(id));
      if (!red) {
        failure(res, "Red social no encontrada", 404);
        return;
      }

      success(res, red, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al obtener la red social");
    }
  }

  /**
   * POST /api/v1/social-networks
   * Crear una nueva red social
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, url, icono, activa } = req.body;

      if (!nombre || typeof nombre !== "string") {
        failure(res, "El campo 'nombre' es requerido", 400);
        return;
      }
      if (!url || typeof url !== "string") {
        failure(res, "El campo 'url' es requerido", 400);
        return;
      }

      const red = await redSocialService.create({
        nombre,
        url,
        icono,
        activa: activa !== false,
      });

      success(res, red, 201);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al crear la red social", 400);
    }
  }

  /**
   * PUT /api/v1/social-networks/:id
   * Actualizar una red social
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nombre, url, icono, orden, activa } = req.body;

      if (!id || isNaN(Number(id))) {
        failure(res, "ID inválido", 400);
        return;
      }

      const red = await redSocialService.update(Number(id), {
        nombre,
        url,
        icono,
        orden,
        activa,
      });

      if (!red) {
        failure(res, "Red social no encontrada", 404);
        return;
      }

      success(res, red, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al actualizar la red social", 400);
    }
  }

  /**
   * DELETE /api/v1/social-networks/:id
   * Eliminar una red social
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        failure(res, "ID inválido", 400);
        return;
      }

      await redSocialService.delete(Number(id));
      success(res, null, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al eliminar la red social", 400);
    }
  }

  /**
   * POST /api/v1/social-networks/reorder
   * Reordenar redes sociales
   */
  async reorder(req: Request, res: Response): Promise<void> {
    try {
      const { order } = req.body;

      if (!Array.isArray(order)) {
        failure(res, "El campo 'order' debe ser un array", 400);
        return;
      }

      await redSocialService.reorder(order);
      success(res, null, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al reordenar las redes sociales", 400);
    }
  }
}

export default new RedSocialController();
