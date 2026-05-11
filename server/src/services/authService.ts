import bcrypt from "bcryptjs";
import suscriptorService from "./suscriptorService";
import usuarioRepository from "../repositories/usuarioRepository";
import { verifyAuthToken } from "../utils/jwt";
import { signAuthToken } from "../utils/jwt";

function sanitizeUsuario(usuario: {
  id: number;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  empresa: string | null;
  email: string;
  rol: "admin" | "editor" | "cliente";
  activo: boolean;
}) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    telefono: usuario.telefono,
    empresa: usuario.empresa,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
  };
}

function fullName(nombre: string, apellido?: string | null): string {
  return [nombre.trim(), (apellido || "").trim()].filter(Boolean).join(" ");
}

class AuthService {
  private async loginByRole(
    email: string,
    password: string,
    allowedRoles: Array<"admin" | "editor" | "cliente">
  ): Promise<{
    token: string;
    usuario: ReturnType<typeof sanitizeUsuario>;
  }> {
    const usuario = await usuarioRepository.findByEmail(email);

    if (!usuario || !usuario.activo) {
      throw new Error("Credenciales inválidas.");
    }

    if (!allowedRoles.includes(usuario.rol)) {
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

  async login(email: string, password: string): Promise<{
    token: string;
    usuario: ReturnType<typeof sanitizeUsuario>;
  }> {
    return this.loginByRole(email, password, ["admin", "editor"]);
  }

  async loginClient(email: string, password: string): Promise<{
    token: string;
    usuario: ReturnType<typeof sanitizeUsuario>;
  }> {
    return this.loginByRole(email, password, ["cliente"]);
  }

  async registerClient(payload: {
    nombre: string;
    apellido: string;
    empresa: string;
    email: string;
    password: string;
    telefono?: string;
    aceptaTerminos?: boolean;
  }): Promise<{
    token: string;
    usuario: ReturnType<typeof sanitizeUsuario>;
  }> {
    if (!payload.aceptaTerminos) {
      throw new Error("Debes aceptar los términos y condiciones para crear tu cuenta.");
    }

    const normalizedEmail = payload.email.trim().toLowerCase();
    const existing = await usuarioRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error("Ya existe una cuenta con ese correo.");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const usuario = await usuarioRepository.create({
      nombre: payload.nombre.trim(),
      apellido: payload.apellido.trim(),
      telefono: payload.telefono?.trim() || null,
      empresa: payload.empresa.trim(),
      aceptaTerminos: true,
      aceptaTerminosAt: new Date(),
      email: normalizedEmail,
      passwordHash,
      rol: "cliente",
    });

    await suscriptorService.subscribe({
      email: normalizedEmail,
      nombre: fullName(payload.nombre, payload.apellido),
      telefono: payload.telefono?.trim() ?? undefined,
      empresa: payload.empresa?.trim() ?? undefined,
      origen: "registro_cuenta",
      metadata: {
        source: "client_account_signup",
        userId: usuario.id,
      },
    });

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

  async getCurrentUser(userId: number): Promise<ReturnType<typeof sanitizeUsuario>> {
    const usuario = await usuarioRepository.findById(userId);
    if (!usuario || !usuario.activo) {
      throw new Error("Usuario no encontrado.");
    }
    return sanitizeUsuario(usuario);
  }

  async updateCurrentUser(
    userId: number,
    payload: { nombre?: string; apellido?: string; telefono?: string; empresa?: string; password?: string }
  ): Promise<ReturnType<typeof sanitizeUsuario>> {
    const usuario = await usuarioRepository.findById(userId);
    if (!usuario || !usuario.activo) {
      throw new Error("Usuario no encontrado.");
    }

    const nextPayload: {
      nombre?: string;
      apellido?: string | null;
      telefono?: string | null;
      empresa?: string | null;
      passwordHash?: string;
    } = {};

    if (payload.nombre !== undefined) {
      nextPayload.nombre = payload.nombre.trim();
    }

    if (payload.telefono !== undefined) {
      nextPayload.telefono = payload.telefono.trim() || null;
    }

    if (payload.apellido !== undefined) {
      nextPayload.apellido = payload.apellido.trim() || null;
    }

    if (payload.empresa !== undefined) {
      nextPayload.empresa = payload.empresa.trim() || null;
    }

    if (payload.password) {
      nextPayload.passwordHash = await bcrypt.hash(payload.password, 10);
    }

    const updated = await usuarioRepository.update(userId, nextPayload);
    if (!updated) {
      throw new Error("No se pudo actualizar el perfil.");
    }

    await suscriptorService.subscribe({
      email: updated.email,
      nombre: fullName(updated.nombre, updated.apellido),
      telefono: updated.telefono ?? undefined,
      empresa: updated.empresa ?? undefined,
      origen: "perfil_cliente",
      metadata: {
        source: "client_profile_update",
        userId: updated.id,
      },
    });

    return sanitizeUsuario(updated);
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
    rol: "admin" | "editor" | "cliente";
  }> {
    return verifyAuthToken(token);
  }
}

export default new AuthService();
