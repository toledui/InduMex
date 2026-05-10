import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/database";

type SuscriptorStatus = "activo" | "baja" | "rebotado";
type ProveedorPreferido = "local" | "mailrelay" | "mailchimp";
type SyncStatus = "pendiente" | "sincronizado" | "error" | "omitido";

class Suscriptor extends Model<
  InferAttributes<Suscriptor, { omit: "createdAt" | "updatedAt" }>,
  InferCreationAttributes<Suscriptor, { omit: "createdAt" | "updatedAt" }>
> {
  declare id: CreationOptional<number>;
  declare nombre: CreationOptional<string | null>;
  declare telefono: CreationOptional<string | null>;
  declare email: string;
  declare empresa: CreationOptional<string | null>;
  declare cargo: CreationOptional<string | null>;
  declare origen: CreationOptional<string>;
  declare estatus: CreationOptional<SuscriptorStatus>;
  declare proveedorPreferido: CreationOptional<ProveedorPreferido>;
  declare syncMailrelay: CreationOptional<SyncStatus>;
  declare syncMailchimp: CreationOptional<SyncStatus>;
  declare notas: CreationOptional<string | null>;
  declare metadata: CreationOptional<Record<string, unknown> | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Suscriptor.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(140),
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },
    empresa: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    cargo: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    origen: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "newsletter_footer",
    },
    estatus: {
      type: DataTypes.ENUM("activo", "baja", "rebotado"),
      allowNull: false,
      defaultValue: "activo",
    },
    proveedorPreferido: {
      type: DataTypes.ENUM("local", "mailrelay", "mailchimp"),
      allowNull: false,
      defaultValue: "local",
      field: "proveedor_preferido",
    },
    syncMailrelay: {
      type: DataTypes.ENUM("pendiente", "sincronizado", "error", "omitido"),
      allowNull: false,
      defaultValue: "pendiente",
      field: "sync_mailrelay",
    },
    syncMailchimp: {
      type: DataTypes.ENUM("pendiente", "sincronizado", "error", "omitido"),
      allowNull: false,
      defaultValue: "pendiente",
      field: "sync_mailchimp",
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "suscriptores",
    underscored: true,
    timestamps: true,
  }
);

export type { SuscriptorStatus, ProveedorPreferido, SyncStatus };
export default Suscriptor;
