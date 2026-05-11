import EmpresaLectora, { IEmpresaLectora } from "../models/EmpresaLectora";

class EmpresaLectoraRepository {
  async findAllActive(): Promise<EmpresaLectora[]> {
    return EmpresaLectora.findAll({
      where: { activa: true },
      order: [["orden", "ASC"]],
    });
  }

  async findAllIncludingInactive(): Promise<EmpresaLectora[]> {
    return EmpresaLectora.findAll({
      order: [["orden", "ASC"]],
    });
  }

  async findById(id: number): Promise<EmpresaLectora | null> {
    return EmpresaLectora.findByPk(id);
  }

  async findByName(nombre: string): Promise<EmpresaLectora | null> {
    return EmpresaLectora.findOne({ where: { nombre } });
  }

  async getMaxOrden(): Promise<number> {
    const max = await EmpresaLectora.max<number, EmpresaLectora>("orden");
    return (max as number) ?? 0;
  }

  async create(data: IEmpresaLectora): Promise<EmpresaLectora> {
    return EmpresaLectora.create(data);
  }

  async update(id: number, data: Partial<IEmpresaLectora>): Promise<EmpresaLectora | null> {
    const empresa = await EmpresaLectora.findByPk(id);
    if (!empresa) return null;
    return empresa.update(data);
  }

  async delete(id: number): Promise<boolean> {
    const rows = await EmpresaLectora.destroy({ where: { id } });
    return rows > 0;
  }
}

export default new EmpresaLectoraRepository();