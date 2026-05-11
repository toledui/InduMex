import { Request, Response } from "express";
import empresaLectoraService from "../services/empresaLectoraService";
import { failure, success } from "../utils/response";

class EmpresaLectoraController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const empresas = await empresaLectoraService.getAllActive();
      success(res, empresas, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al obtener empresas");
    }
  }

  async listAdmin(req: Request, res: Response): Promise<void> {
    try {
      const empresas = await empresaLectoraService.getAllAdmin();
      success(res, empresas, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al obtener empresas");
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        failure(res, "ID inválido", 400);
        return;
      }

      const empresa = await empresaLectoraService.getById(Number(id));
      success(res, empresa, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Empresa no encontrada", 404);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, abreviatura, activa, orden } = req.body;

      if (!nombre || typeof nombre !== "string") {
        failure(res, "El campo 'nombre' es requerido", 400);
        return;
      }

      if (!abreviatura || typeof abreviatura !== "string") {
        failure(res, "El campo 'abreviatura' es requerido", 400);
        return;
      }

      const empresa = await empresaLectoraService.create({
        nombre,
        abreviatura,
        activa: activa !== false,
        orden: typeof orden === "number" ? orden : undefined,
      });

      success(res, empresa, 201);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al crear empresa", 400);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        failure(res, "ID inválido", 400);
        return;
      }

      const { nombre, abreviatura, activa, orden } = req.body;

      const empresa = await empresaLectoraService.update(Number(id), {
        nombre,
        abreviatura,
        activa,
        orden,
      });

      success(res, empresa, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al actualizar empresa", 400);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        failure(res, "ID inválido", 400);
        return;
      }

      await empresaLectoraService.delete(Number(id));
      success(res, { message: "Empresa eliminada correctamente" }, 200);
    } catch (error) {
      failure(res, error instanceof Error ? error.message : "Error al eliminar empresa", 400);
    }
  }
}

export default new EmpresaLectoraController();
