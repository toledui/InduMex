import RedSocial, { IRedSocial } from "../models/RedSocial";

class RedSocialRepository {
  /**
   * Obtener todas las redes sociales ordenadas
   */
  async findAll(): Promise<RedSocial[]> {
    return RedSocial.findAll({
      where: { activa: true },
      order: [["orden", "ASC"]],
    });
  }

  /**
   * Obtener todas las redes (incluidas inactivas) - para admin
   */
  async findAllIncludingInactive(): Promise<RedSocial[]> {
    return RedSocial.findAll({
      order: [["orden", "ASC"]],
    });
  }

  /**
   * Obtener una red social por ID
   */
  async findById(id: number): Promise<RedSocial | null> {
    return RedSocial.findByPk(id);
  }

  /**
   * Obtener una red social por nombre
   */
  async findByName(nombre: string): Promise<RedSocial | null> {
    return RedSocial.findOne({
      where: { nombre },
    });
  }

  /**
   * Crear una nueva red social
   */
  async create(data: IRedSocial): Promise<RedSocial> {
    return RedSocial.create(data);
  }

  /**
   * Actualizar una red social
   */
  async update(id: number, data: Partial<IRedSocial>): Promise<RedSocial | null> {
    const redSocial = await RedSocial.findByPk(id);
    if (!redSocial) return null;
    return redSocial.update(data);
  }

  /**
   * Eliminar una red social
   */
  async delete(id: number): Promise<boolean> {
    const result = await RedSocial.destroy({
      where: { id },
    });
    return result > 0;
  }

  /**
   * Obtener el máximo orden
   */
  async getMaxOrden(): Promise<number> {
    const result = await RedSocial.max("orden");
    return result ? (result as number) : 0;
  }
}

export default new RedSocialRepository();
