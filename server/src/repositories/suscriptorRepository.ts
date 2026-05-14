import { Op } from "sequelize";
import Suscriptor, { ProveedorPreferido, SuscriptorStatus, SyncStatus } from "../models/Suscriptor";

export type CreateSuscriptorInput = {
  nombre?: string | null;
  telefono?: string | null;
  email: string;
  empresa?: string | null;
  cargo?: string | null;
  origen?: string;
  estatus?: SuscriptorStatus;
  proveedorPreferido?: ProveedorPreferido;
  syncMailrelay?: SyncStatus;
  syncMailchimp?: SyncStatus;
  notas?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateSuscriptorInput = Omit<CreateSuscriptorInput, "email">;

class SuscriptorRepository {
  async findAll(): Promise<Suscriptor[]> {
    return Suscriptor.findAll({ order: [["createdAt", "DESC"]] });
  }

  private getSyncField(provider: "mailrelay" | "mailchimp"): "syncMailrelay" | "syncMailchimp" {
    return provider === "mailrelay" ? "syncMailrelay" : "syncMailchimp";
  }

  async findByEmail(email: string): Promise<Suscriptor | null> {
    return Suscriptor.findOne({ where: { email } });
  }

  async create(payload: CreateSuscriptorInput): Promise<Suscriptor> {
    return Suscriptor.create(payload);
  }

  async update(id: number, payload: UpdateSuscriptorInput): Promise<Suscriptor | null> {
    const suscriptor = await Suscriptor.findByPk(id);
    if (!suscriptor) {
      return null;
    }

    await suscriptor.update(payload);
    return suscriptor;
  }

  async markUnsubscribed(email: string): Promise<boolean> {
    const updated = await Suscriptor.update(
      { estatus: "baja" },
      { where: { email } }
    );
    return updated[0] > 0;
  }

  async searchByEmail(query: string): Promise<Suscriptor[]> {
    return Suscriptor.findAll({
      where: {
        email: {
          [Op.like]: `%${query}%`,
        },
      },
      order: [["createdAt", "DESC"]],
    });
  }

  async findPendingForProvider(
    provider: "mailrelay" | "mailchimp",
    limit: number
  ): Promise<Suscriptor[]> {
    const syncField = this.getSyncField(provider);
    return Suscriptor.findAll({
      where: {
        estatus: "activo",
        [syncField]: {
          [Op.in]: ["pendiente", "error"],
        },
      },
      order: [["createdAt", "ASC"]],
      limit,
    });
  }

  async countPendingForProvider(provider: "mailrelay" | "mailchimp"): Promise<number> {
    const syncField = this.getSyncField(provider);
    return Suscriptor.count({
      where: {
        estatus: "activo",
        [syncField]: {
          [Op.in]: ["pendiente", "error"],
        },
      },
    });
  }

  async updateSyncStatus(
    id: number,
    provider: "mailrelay" | "mailchimp",
    status: SyncStatus,
    notas?: string | null
  ): Promise<void> {
    const syncField = this.getSyncField(provider);
    const payload: Record<string, unknown> = {
      proveedorPreferido: provider,
      notas: notas ?? null,
    };

    payload[syncField] = status;

    await Suscriptor.update(payload, {
      where: { id },
    });
  }
}

export default new SuscriptorRepository();
