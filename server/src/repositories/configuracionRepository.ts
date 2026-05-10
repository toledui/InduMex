import Configuracion from "../models/Configuracion";

export async function findAll(): Promise<Configuracion[]> {
  return Configuracion.findAll({ order: [["clave", "ASC"]] });
}

export async function findByClave(clave: string): Promise<Configuracion | null> {
  return Configuracion.findByPk(clave);
}

export async function upsert(
  clave: string,
  valor: string | null,
  descripcion?: string
): Promise<Configuracion> {
  const [instance] = await Configuracion.upsert({ clave, valor, descripcion: descripcion ?? null });
  return instance;
}

export async function upsertMany(
  entries: Array<{ clave: string; valor: string | null }>
): Promise<void> {
  for (const { clave, valor } of entries) {
    await Configuracion.upsert({ clave, valor });
  }
}
