import { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../utils/jwt";
import { failure } from "../utils/response";

declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      userId: number;
      email: string;
      rol: "admin" | "editor" | "cliente";
    };
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): Response | void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return failure(res, "No autorizado.", 401);
  }

  try {
    const payload = verifyAuthToken(token);
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
    next();
  } catch (_error) {
    return failure(res, "Sesión inválida o expirada.", 401);
  }
}

export function requireAdminRole(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  if (!req.auth || req.auth.rol !== "admin") {
    return failure(res, "Acceso restringido para administradores.", 403);
  }
  next();
}
