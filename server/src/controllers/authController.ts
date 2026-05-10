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
