import jwt from "jsonwebtoken";
import { JwtPayload as JwtLibPayload, Secret, SignOptions } from "jsonwebtoken";
import { JwtPayload } from "../types/api";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "indumex-dev-secret";
const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "8h";

export function signAuthToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyAuthToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded === "string") {
    throw new Error("Token inválido.");
  }

  const payload = decoded as JwtLibPayload & {
    sub?: number | string;
    email?: string;
    rol?: "admin" | "editor";
  };

  if (!payload.sub || !payload.email || !payload.rol) {
    throw new Error("Token inválido.");
  }

  return {
    sub: Number(payload.sub),
    email: payload.email,
    rol: payload.rol,
  };
}
