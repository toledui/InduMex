import { Request, Response } from "express";
import anuncioService from "../services/anuncioService";
import { success, failure } from "../utils/response";

class AnuncioController {
  /**
   * GET /api/v1/ads?zona=hero-slider
   * Obtener anuncios activos de una zona (público)
   */
  async listByZona(req: Request, res: Response): Promise<void> {
    try {
      const { zona } = req.query;
      if (!zona || typeof zona !== "string") {
        failure(res, "El parámetro 'zona' es requerido", 400);
        return;
      }
      const anuncios = await anuncioService.getByZona(zona);
      success(res, anuncios, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al obtener anuncios", 400);
    }
  }

  /**
   * GET /api/v1/ads/admin
   * Obtener todos los anuncios (incluidos inactivos) - para admin
   */
  async listAdmin(req: Request, res: Response): Promise<void> {
    try {
      const anuncios = await anuncioService.getAllAdmin();
      success(res, anuncios, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al obtener anuncios");
    }
  }

  /**
   * GET /api/v1/ads/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        failure(res, "ID inválido", 400);
        return;
      }
      const anuncio = await anuncioService.getById(Number(id));
      success(res, anuncio, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al obtener el anuncio", 404);
    }
  }

  /**
   * POST /api/v1/ads
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { titulo, descripcion, cta_texto, cta_url, imagen_url, zona, activo, orden, metrica, sector, acento } = req.body;

      const anuncio = await anuncioService.create({
        titulo,
        descripcion,
        cta_texto,
        cta_url,
        imagen_url: imagen_url || null,
        zona,
        activo: activo !== false,
        orden: orden ?? undefined,
        metrica: metrica || null,
        sector: sector || null,
        acento: acento || null,
      });

      success(res, anuncio, 201);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al crear el anuncio", 400);
    }
  }

  /**
   * PUT /api/v1/ads/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        failure(res, "ID inválido", 400);
        return;
      }
      const anuncio = await anuncioService.update(Number(id), req.body);
      success(res, anuncio, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al actualizar el anuncio", 400);
    }
  }

  /**
   * DELETE /api/v1/ads/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        failure(res, "ID inválido", 400);
        return;
      }
      await anuncioService.delete(Number(id));
      success(res, { message: "Anuncio eliminado correctamente" }, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al eliminar el anuncio", 400);
    }
  }
}

export default new AnuncioController();
