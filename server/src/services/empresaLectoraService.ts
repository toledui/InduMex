import EmpresaLectora from "../models/EmpresaLectora";
import empresaLectoraRepository from "../repositories/empresaLectoraRepository";

class EmpresaLectoraService {
  async getAllActive(): Promise<EmpresaLectora[]> {
    return empresaLectoraRepository.findAllActive();
  }

  async getAllAdmin(): Promise<EmpresaLectora[]> {
    return empresaLectoraRepository.findAllIncludingInactive();
  }

  async getById(id: number): Promise<EmpresaLectora> {
    const empresa = await empresaLectoraRepository.findById(id);
    if (!empresa) throw new Error("Empresa no encontrada");
    return empresa;
  }

  async create(data: {
    nombre: string;
    abreviatura: string;
    activa?: boolean;
    orden?: number;
  }): Promise<EmpresaLectora> {
    const nombre = data.nombre.trim();
    const abreviatura = data.abreviatura.trim();

    if (!nombre) throw new Error("El nombre es requerido");
    if (!abreviatura) throw new Error("La abreviatura es requerida");

    const duplicate = await empresaLectoraRepository.findByName(nombre);
    if (duplicate) throw new Error(`Ya existe una empresa con el nombre \"${nombre}\"`);

    const maxOrden = await empresaLectoraRepository.getMaxOrden();
    const orden = data.orden !== undefined ? data.orden : maxOrden + 1;

    return empresaLectoraRepository.create({
      nombre,
      abreviatura,
      activa: data.activa !== false,
      orden,
    });
  }

  async update(
    id: number,
    data: {
      nombre?: string;
      abreviatura?: string;
      activa?: boolean;
      orden?: number;
    }
  ): Promise<EmpresaLectora> {
    const current = await this.getById(id);

    if (data.nombre && data.nombre.trim() !== current.nombre) {
      const duplicate = await empresaLectoraRepository.findByName(data.nombre.trim());
      if (duplicate) {
        throw new Error(`Ya existe una empresa con el nombre \"${data.nombre.trim()}\"`);
      }
    }

    const updated = await empresaLectoraRepository.update(id, {
      nombre: data.nombre?.trim(),
      abreviatura: data.abreviatura?.trim(),
      activa: data.activa,
      orden: data.orden,
    });

    if (!updated) throw new Error("Error al actualizar empresa");
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.getById(id);
    const deleted = await empresaLectoraRepository.delete(id);
    if (!deleted) throw new Error("No se pudo eliminar la empresa");
  }
}

export default new EmpresaLectoraService();