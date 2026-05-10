import bcrypt from "bcryptjs";
import usuarioRepository from "../repositories/usuarioRepository";
import { verifyAuthToken } from "../utils/jwt";
import { signAuthToken } from "../utils/jwt";

function sanitizeUsuario(usuario: {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "editor";
  activo: boolean;
}) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
  };
}

class AuthService {
  async login(email: string, password: string): Promise<{
    token: string;
    usuario: ReturnType<typeof sanitizeUsuario>;
  }> {
    const usuario = await usuarioRepository.findByEmail(email);

    if (!usuario || !usuario.activo) {
      throw new Error("Credenciales inválidas.");
    }

    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordOk) {
      throw new Error("Credenciales inválidas.");
    }

    const token = signAuthToken({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    return {
      token,
      usuario: sanitizeUsuario(usuario),
    };
  }

  async forgotPassword(email: string): Promise<{ resetToken: string | null }> {
    const usuario = await usuarioRepository.findByEmail(email);

    // Always return success to avoid exposing existing accounts.
    if (!usuario) {
      return { resetToken: null };
    }

    const resetToken = signAuthToken({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    return { resetToken };
  }

  async verifyResetToken(token: string): Promise<{
    sub: number;
    email: string;
    rol: "admin" | "editor";
  }> {
    return verifyAuthToken(token);
  }
}

export default new AuthService();
