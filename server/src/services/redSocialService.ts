import RedSocial, { IRedSocial } from "../models/RedSocial";
import redSocialRepository from "../repositories/redSocialRepository";

class RedSocialService {
  /**
   * Obtener todas las redes sociales activas (para frontend)
   */
  async getAllActive(): Promise<RedSocial[]> {
    return redSocialRepository.findAll();
  }

  /**
   * Obtener todas las redes (incluidas inactivas) - para admin
   */
  async getAll(): Promise<RedSocial[]> {
    return redSocialRepository.findAllIncludingInactive();
  }

  /**
   * Obtener una red por ID
   */
  async getById(id: number): Promise<RedSocial | null> {
    return redSocialRepository.findById(id);
  }

  /**
   * Crear una nueva red social
   * @throws Error si el nombre ya existe
   */
  async create(data: {
    nombre: string;
    url: string;
    icono?: string;
    activa?: boolean;
  }): Promise<RedSocial> {
    // Validar que el nombre no esté duplicado
    const existing = await redSocialRepository.findByName(data.nombre);
    if (existing) {
      throw new Error(`Ya existe una red social con el nombre "${data.nombre}"`);
    }

    // Validar URL
    if (!data.url.match(/^https?:\/\//)) {
      throw new Error("La URL debe comenzar con http:// o https://");
    }

    // Obtener el siguiente orden
    const maxOrden = await redSocialRepository.getMaxOrden();

    return redSocialRepository.create({
      nombre: data.nombre.trim(),
      url: data.url.trim(),
      icono: data.icono?.trim(),
      activa: data.activa !== false,
      orden: maxOrden + 1,
    });
  }

  /**
   * Actualizar una red social
   */
  async update(
    id: number,
    data: {
      nombre?: string;
      url?: string;
      icono?: string;
      orden?: number;
      activa?: boolean;
    }
  ): Promise<RedSocial | null> {
    const existing = await redSocialRepository.findById(id);
    if (!existing) {
      throw new Error("Red social no encontrada");
    }

    // Si cambió el nombre, validar duplicados
    if (data.nombre && data.nombre !== existing.nombre) {
      const duplicate = await redSocialRepository.findByName(data.nombre);
      if (duplicate) {
        throw new Error(`Ya existe una red social con el nombre "${data.nombre}"`);
      }
    }

    // Validar URL si se proporciona
    if (data.url && !data.url.match(/^https?:\/\//)) {
      throw new Error("La URL debe comenzar con http:// o https://");
    }

    const updateData: Partial<IRedSocial> = {};
    if (data.nombre) updateData.nombre = data.nombre.trim();
    if (data.url) updateData.url = data.url.trim();
    if (data.icono !== undefined) updateData.icono = data.icono?.trim();
    if (data.orden !== undefined) updateData.orden = data.orden;
    if (data.activa !== undefined) updateData.activa = data.activa;

    return redSocialRepository.update(id, updateData);
  }

  /**
   * Eliminar una red social
   */
  async delete(id: number): Promise<void> {
    const existing = await redSocialRepository.findById(id);
    if (!existing) {
      throw new Error("Red social no encontrada");
    }

    const deleted = await redSocialRepository.delete(id);
    if (!deleted) {
      throw new Error("No se pudo eliminar la red social");
    }
  }

  /**
   * Reordenar redes sociales
   */
  async reorder(order: { id: number; orden: number }[]): Promise<void> {
    for (const item of order) {
      await redSocialRepository.update(item.id, { orden: item.orden });
    }
  }
}

export default new RedSocialService();
