import { Request, Response } from "express";
import usuarioService from "../services/usuarioService";
import { failure, success } from "../utils/response";

function toId(idParam: string | string[]): number {
  const raw = Array.isArray(idParam) ? idParam[0] : idParam;
  const id = Number(raw);
  if (Number.isNaN(id) || id <= 0) {
    throw new Error("ID inválido.");
  }
  return id;
}

class UsuariosController {
  async list(_req: Request, res: Response): Promise<Response> {
    try {
      const usuarios = await usuarioService.list();
      return success(res, usuarios);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al listar usuarios.";
      return failure(res, message, 500);
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const id = toId(req.params.id);
      const usuario = await usuarioService.getById(id);
      return success(res, usuario);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al obtener usuario.";
      return failure(res, message, 404);
    }
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { nombre, email, password, rol } = req.body as {
        nombre?: string;
        telefono?: string;
        email?: string;
        password?: string;
        rol?: "admin" | "editor" | "cliente";
      };

      if (!nombre || !email || !password) {
        return failure(res, "Nombre, email y contraseña son obligatorios.", 422);
      }

      const usuario = await usuarioService.create({
        nombre,
        telefono: req.body.telefono,
        email,
        password,
        rol,
      });

      return success(res, usuario, 201);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al crear usuario.";
      return failure(res, message, 400);
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const id = toId(req.params.id);
      const actorEmail = req.auth?.email;
      const { nombre, telefono, email, password, rol, activo } = req.body as {
        nombre?: string;
        telefono?: string;
        email?: string;
        password?: string;
        rol?: "admin" | "editor" | "cliente";
        activo?: boolean;
      };

      if (!actorEmail) {
        return failure(res, "No autorizado.", 401);
      }

      const usuario = await usuarioService.update(id, {
        nombre,
        telefono,
        email,
        password,
        rol,
        activo,
      }, actorEmail);

      return success(res, usuario);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al actualizar usuario.";
      const status =
        message === "Usuario no encontrado."
          ? 404
          : message.startsWith("Acceso restringido")
            ? 403
            : 400;
      return failure(res, message, status);
    }
  }

  async remove(req: Request, res: Response): Promise<Response> {
    try {
      const id = toId(req.params.id);
      const actorEmail = req.auth?.email;

      if (!actorEmail) {
        return failure(res, "No autorizado.", 401);
      }

      await usuarioService.remove(id, actorEmail);
      return success(res, { message: "Usuario eliminado correctamente." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al eliminar usuario.";
      const status =
        message === "Usuario no encontrado."
          ? 404
          : message.startsWith("Acceso restringido")
            ? 403
            : 400;
      return failure(res, message, status);
    }
  }
}

export default new UsuariosController();
