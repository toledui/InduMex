import * as repo from "../repositories/configuracionRepository";

export type ConfigMap = Record<string, string | null>;

export async function getAll(): Promise<ConfigMap> {
  const rows = await repo.findAll();
  return Object.fromEntries(rows.map((r) => [r.clave, r.valor]));
}

export async function updateMany(entries: Array<{ clave: string; valor: string | null }>): Promise<ConfigMap> {
  await repo.upsertMany(entries);
  return getAll();
}
