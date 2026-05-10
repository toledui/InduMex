import Usuario from "../models/Usuario";

export type CreateUsuarioInput = {
  nombre: string;
  email: string;
  passwordHash: string;
  rol?: "admin" | "editor";
};

export type UpdateUsuarioInput = {
  nombre?: string;
  email?: string;
  passwordHash?: string;
  rol?: "admin" | "editor";
  activo?: boolean;
};

class UsuarioRepository {
  async findAll(): Promise<Usuario[]> {
    return Usuario.findAll({ order: [["id", "ASC"]] });
  }

  async findById(id: number): Promise<Usuario | null> {
    return Usuario.findByPk(id);
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return Usuario.findOne({ where: { email } });
  }

  async create(payload: CreateUsuarioInput): Promise<Usuario> {
    return Usuario.create(payload);
  }

  async update(id: number, payload: UpdateUsuarioInput): Promise<Usuario | null> {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return null;
    }

    await usuario.update(payload);
    return usuario;
  }

  async delete(id: number): Promise<boolean> {
    const deletedRows = await Usuario.destroy({ where: { id } });
    return deletedRows > 0;
  }
}

export default new UsuarioRepository();
