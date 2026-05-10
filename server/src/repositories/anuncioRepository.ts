import Anuncio, { IAnuncio, AdZona } from "../models/Anuncio";

class AnuncioRepository {
  async findByZona(zona: AdZona): Promise<Anuncio[]> {
    return Anuncio.findAll({
      where: { zona, activo: true },
      order: [["orden", "ASC"]],
    });
  }

  async findAllIncludingInactive(): Promise<Anuncio[]> {
    return Anuncio.findAll({
      order: [
        ["zona", "ASC"],
        ["orden", "ASC"],
      ],
    });
  }

  async findById(id: number): Promise<Anuncio | null> {
    return Anuncio.findByPk(id);
  }

  async create(data: IAnuncio): Promise<Anuncio> {
    return Anuncio.create(data);
  }

  async update(id: number, data: Partial<IAnuncio>): Promise<Anuncio | null> {
    const anuncio = await Anuncio.findByPk(id);
    if (!anuncio) return null;
    return anuncio.update(data);
  }

  async delete(id: number): Promise<boolean> {
    const anuncio = await Anuncio.findByPk(id);
    if (!anuncio) return false;
    await anuncio.destroy();
    return true;
  }

  async getMaxOrden(zona: AdZona): Promise<number> {
    const max = await Anuncio.max<number, Anuncio>("orden", { where: { zona } });
    return (max as number) ?? 0;
  }
}

export default new AnuncioRepository();
