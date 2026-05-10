import suscriptorRepository from "../repositories/suscriptorRepository";

export type SuscriptorOutput = {
  id: number;
  nombre: string | null;
  telefono: string | null;
  email: string;
  empresa: string | null;
  cargo: string | null;
  origen: string;
  estatus: "activo" | "baja" | "rebotado";
  proveedorPreferido: "local" | "mailrelay" | "mailchimp";
  syncMailrelay: "pendiente" | "sincronizado" | "error" | "omitido";
  syncMailchimp: "pendiente" | "sincronizado" | "error" | "omitido";
  notas: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toOutput(suscriptor: {
  id: number;
  nombre: string | null;
  telefono: string | null;
  email: string;
  empresa: string | null;
  cargo: string | null;
  origen: string;
  estatus: "activo" | "baja" | "rebotado";
  proveedorPreferido: "local" | "mailrelay" | "mailchimp";
  syncMailrelay: "pendiente" | "sincronizado" | "error" | "omitido";
  syncMailchimp: "pendiente" | "sincronizado" | "error" | "omitido";
  notas: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}): SuscriptorOutput {
  return {
    id: suscriptor.id,
    nombre: suscriptor.nombre,
    telefono: suscriptor.telefono,
    email: suscriptor.email,
    empresa: suscriptor.empresa,
    cargo: suscriptor.cargo,
    origen: suscriptor.origen,
    estatus: suscriptor.estatus,
    proveedorPreferido: suscriptor.proveedorPreferido,
    syncMailrelay: suscriptor.syncMailrelay,
    syncMailchimp: suscriptor.syncMailchimp,
    notas: suscriptor.notas,
    metadata: suscriptor.metadata,
    createdAt: suscriptor.createdAt,
    updatedAt: suscriptor.updatedAt,
  };
}

class SuscriptorService {
  async list(emailQuery?: string): Promise<SuscriptorOutput[]> {
    const rows = emailQuery?.trim()
      ? await suscriptorRepository.searchByEmail(emailQuery.trim())
      : await suscriptorRepository.findAll();

    return rows.map((row) => toOutput(row));
  }

  async subscribe(payload: {
    email: string;
    nombre?: string;
    telefono?: string;
    empresa?: string;
    cargo?: string;
    origen?: string;
    metadata?: Record<string, unknown>;
  }): Promise<SuscriptorOutput> {
    const normalizedEmail = normalizeEmail(payload.email);

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      throw new Error("Correo electrónico inválido.");
    }

    const existing = await suscriptorRepository.findByEmail(normalizedEmail);
    if (!existing) {
      const created = await suscriptorRepository.create({
        email: normalizedEmail,
        nombre: payload.nombre?.trim() || null,
        telefono: payload.telefono?.trim() || null,
        empresa: payload.empresa?.trim() || null,
        cargo: payload.cargo?.trim() || null,
        origen: payload.origen?.trim() || "newsletter_footer",
        estatus: "activo",
        proveedorPreferido: "local",
        syncMailrelay: "pendiente",
        syncMailchimp: "pendiente",
        metadata: payload.metadata || null,
      });
      return toOutput(created);
    }

    const updated = await suscriptorRepository.update(existing.id, {
      nombre: payload.nombre?.trim() || existing.nombre,
      telefono: payload.telefono?.trim() || existing.telefono,
      empresa: payload.empresa?.trim() || existing.empresa,
      cargo: payload.cargo?.trim() || existing.cargo,
      origen: payload.origen?.trim() || existing.origen,
      estatus: "activo",
      syncMailrelay: existing.syncMailrelay === "sincronizado" ? "sincronizado" : "pendiente",
      syncMailchimp: existing.syncMailchimp === "sincronizado" ? "sincronizado" : "pendiente",
      metadata: payload.metadata || existing.metadata,
    });

    if (!updated) {
      throw new Error("No se pudo actualizar el suscriptor.");
    }

    return toOutput(updated);
  }

  async unsubscribe(email: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      throw new Error("Correo electrónico inválido.");
    }

    const updated = await suscriptorRepository.markUnsubscribed(normalizedEmail);
    if (!updated) {
      throw new Error("No se encontró el suscriptor.");
    }
  }
}

export default new SuscriptorService();
