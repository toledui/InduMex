import { Request, Response } from "express";
import authService from "../services/authService";
import usuarioService from "../services/usuarioService";
import { failure, success } from "../utils/response";

class AuthController {
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        return failure(res, "Email y contraseña son obligatorios.", 422);
      }

      const data = await authService.login(email, password);
      return success(res, data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al iniciar sesión.";
      return failure(res, message, 401);
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body as { email?: string };

      if (!email) {
        return failure(res, "Email es obligatorio.", 422);
      }

      const data = await authService.forgotPassword(email);
      return success(
        res,
        {
          ...data,
          message:
            "Si el correo existe, se ha generado un enlace de recuperación.",
        },
        200
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al solicitar recuperación.";
      return failure(res, message, 500);
    }
  }

  async registerClient(req: Request, res: Response): Promise<Response> {
    try {
      const { nombre, apellido, empresa, email, password, telefono, aceptaTerminos } = req.body as {
        nombre?: string;
        apellido?: string;
        empresa?: string;
        email?: string;
        password?: string;
        telefono?: string;
        aceptaTerminos?: boolean;
      };

      if (!nombre || !apellido || !empresa || !email || !password) {
        return failure(res, "Nombre, apellido, empresa, email y contraseña son obligatorios.", 422);
      }

      const data = await authService.registerClient({
        nombre,
        apellido,
        empresa,
        email,
        password,
        telefono,
        aceptaTerminos,
      });

      return success(res, data, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear la cuenta.";
      return failure(res, message, 400);
    }
  }

  async loginClient(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        return failure(res, "Email y contraseña son obligatorios.", 422);
      }

      const data = await authService.loginClient(email, password);
      return success(res, data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al iniciar sesión.";
      return failure(res, message, 401);
    }
  }

  async me(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.auth?.userId) {
        return failure(res, "No autorizado.", 401);
      }

      const data = await authService.getCurrentUser(req.auth.userId);
      return success(res, data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo obtener el perfil.";
      return failure(res, message, 400);
    }
  }

  async updateMe(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.auth?.userId) {
        return failure(res, "No autorizado.", 401);
      }

      const { nombre, apellido, telefono, empresa, password } = req.body as {
        nombre?: string;
        apellido?: string;
        telefono?: string;
        empresa?: string;
        password?: string;
      };

      const data = await authService.updateCurrentUser(req.auth.userId, {
        nombre,
        apellido,
        telefono,
        empresa,
        password,
      });

      return success(res, data, 200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar el perfil.";
      return failure(res, message, 400);
    }
  }

  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { token, password } = req.body as {
        token?: string;
        password?: string;
      };

      if (!token || !password) {
        return failure(res, "Token y nueva contraseña son obligatorios.", 422);
      }

      const payload = await authService.verifyResetToken(token);
      await usuarioService.update(payload.sub, { password }, payload.email);

      return success(res, { message: "Contraseña actualizada correctamente." }, 200);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo restablecer la contraseña.";
      return failure(res, message, 400);
    }
  }
}

export default new AuthController();
