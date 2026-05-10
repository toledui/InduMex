import anuncioRepository from "../repositories/anuncioRepository";
import Anuncio, { IAnuncio, AdZona } from "../models/Anuncio";

const VALID_ZONAS: AdZona[] = ["hero-slider", "editorial-grid", "post-in-content", "post-sidebar"];

class AnuncioService {
  async getByZona(zona: string): Promise<Anuncio[]> {
    if (!VALID_ZONAS.includes(zona as AdZona)) {
      throw new Error(`Zona inválida: ${zona}. Zonas válidas: ${VALID_ZONAS.join(", ")}`);
    }
    return anuncioRepository.findByZona(zona as AdZona);
  }

  async getAllAdmin(): Promise<Anuncio[]> {
    return anuncioRepository.findAllIncludingInactive();
  }

  async getById(id: number): Promise<Anuncio> {
    const anuncio = await anuncioRepository.findById(id);
    if (!anuncio) throw new Error(`Anuncio con ID ${id} no encontrado`);
    return anuncio;
  }

  async create(data: Omit<IAnuncio, "id">): Promise<Anuncio> {
    if (!data.titulo?.trim()) throw new Error("El título es requerido");
    if (!data.descripcion?.trim()) throw new Error("La descripción es requerida");
    if (!data.cta_texto?.trim()) throw new Error("El texto del CTA es requerido");
    if (!data.cta_url?.trim()) throw new Error("La URL del CTA es requerida");
    if (!VALID_ZONAS.includes(data.zona)) {
      throw new Error(`Zona inválida: ${data.zona}`);
    }

    if (data.acento && !/^#[0-9A-Fa-f]{6}$/.test(data.acento)) {
      throw new Error("El color de acento debe ser un valor hex válido (ej: #F58634)");
    }

    const maxOrden = await anuncioRepository.getMaxOrden(data.zona);
    const orden = data.orden !== undefined ? data.orden : maxOrden + 1;

    return anuncioRepository.create({ ...data, orden });
  }

  async update(id: number, data: Partial<IAnuncio>): Promise<Anuncio> {
    await this.getById(id);

    if (data.zona && !VALID_ZONAS.includes(data.zona)) {
      throw new Error(`Zona inválida: ${data.zona}`);
    }

    if (data.acento && !/^#[0-9A-Fa-f]{6}$/.test(data.acento)) {
      throw new Error("El color de acento debe ser un valor hex válido (ej: #F58634)");
    }

    const updated = await anuncioRepository.update(id, data);
    if (!updated) throw new Error("Error al actualizar el anuncio");
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.getById(id);
    const deleted = await anuncioRepository.delete(id);
    if (!deleted) throw new Error("Error al eliminar el anuncio");
  }
}

export default new AnuncioService();
