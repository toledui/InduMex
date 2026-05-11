import bcrypt from "bcryptjs";
import usuarioRepository from "../repositories/usuarioRepository";

const PROTECTED_ADMIN_EMAIL = "contacto@indumex.blog";

export type UsuarioOutput = {
  id: number;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  empresa: string | null;
  email: string;
  rol: "admin" | "editor" | "cliente";
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toOutput(usuario: {
  id: number;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  empresa: string | null;
  email: string;
  rol: "admin" | "editor" | "cliente";
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UsuarioOutput {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    telefono: usuario.telefono,
    empresa: usuario.empresa,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
  };
}

class UsuarioService {
  private isProtectedAdmin(email: string): boolean {
    return email.toLowerCase() === PROTECTED_ADMIN_EMAIL;
  }

  async list(): Promise<UsuarioOutput[]> {
    const usuarios = await usuarioRepository.findAll();
    return usuarios.map((item) => toOutput(item));
  }

  async getById(id: number): Promise<UsuarioOutput> {
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) {
      throw new Error("Usuario no encontrado.");
    }
    return toOutput(usuario);
  }

  async create(payload: {
    nombre: string;
    apellido?: string;
    telefono?: string;
    empresa?: string;
    email: string;
    password: string;
    rol?: "admin" | "editor" | "cliente";
  }): Promise<UsuarioOutput> {
    const existing = await usuarioRepository.findByEmail(payload.email);
    if (existing) {
      throw new Error("Ya existe un usuario con ese email.");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const usuario = await usuarioRepository.create({
      nombre: payload.nombre,
      apellido: payload.apellido?.trim() || null,
      telefono: payload.telefono?.trim() || null,
      empresa: payload.empresa?.trim() || null,
      email: payload.email,
      passwordHash,
      rol: payload.rol || "cliente",
    });

    return toOutput(usuario);
  }

  async update(
    id: number,
    payload: {
      nombre?: string;
      apellido?: string;
      telefono?: string;
      empresa?: string;
      email?: string;
      password?: string;
      rol?: "admin" | "editor" | "cliente";
      activo?: boolean;
    },
    actorEmail: string
  ): Promise<UsuarioOutput> {
    const currentUsuario = await usuarioRepository.findById(id);
    if (!currentUsuario) {
      throw new Error("Usuario no encontrado.");
    }

    if (
      this.isProtectedAdmin(currentUsuario.email) &&
      !this.isProtectedAdmin(actorEmail.toLowerCase())
    ) {
      throw new Error(
        "Acceso restringido: solo contacto@indumex.blog puede modificar este usuario."
      );
    }

    if (payload.email) {
      const existing = await usuarioRepository.findByEmail(payload.email);
      if (existing && existing.id !== id) {
        throw new Error("Ya existe un usuario con ese email.");
      }
    }

    let passwordHash: string | undefined;
    if (payload.password) {
      passwordHash = await bcrypt.hash(payload.password, 10);
    }

    const usuario = await usuarioRepository.update(id, {
      nombre: payload.nombre,
      apellido: payload.apellido,
      telefono: payload.telefono,
      empresa: payload.empresa,
      email: payload.email,
      rol: payload.rol,
      activo: payload.activo,
      passwordHash,
    });

    if (!usuario) {
      throw new Error("Usuario no encontrado.");
    }

    return toOutput(usuario);
  }

  async remove(id: number, actorEmail: string): Promise<void> {
    const currentUsuario = await usuarioRepository.findById(id);
    if (!currentUsuario) {
      throw new Error("Usuario no encontrado.");
    }

    if (
      this.isProtectedAdmin(currentUsuario.email) &&
      !this.isProtectedAdmin(actorEmail.toLowerCase())
    ) {
      throw new Error(
        "Acceso restringido: solo contacto@indumex.blog puede eliminar este usuario."
      );
    }

    const deleted = await usuarioRepository.delete(id);
    if (!deleted) {
      throw new Error("Usuario no encontrado.");
    }
  }
}

export default new UsuarioService();
