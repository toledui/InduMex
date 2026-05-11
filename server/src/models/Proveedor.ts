import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  CreationOptional,
} from "sequelize";
import sequelize from "../config/database";

class Proveedor extends Model<
  InferAttributes<Proveedor>,
  InferCreationAttributes<Proveedor>
> {
  declare id: CreationOptional<number>;
  declare usuarioId: CreationOptional<number | null>;
  declare nombre: string;
  declare empresa: string;
  declare name: string;
  declare slug: string;
  declare logo: string;
  declare tier: "premium" | "verified" | "basic";
  declare shortDescription: string;
  declare about: string;
  declare sector: string;
  declare sectors: string[];
  declare certifications: string[];
  declare socialNetworks: Array<{ nombre: string; url: string }>;
  declare city: string;
  declare state: string;
  declare country: string;
  declare website: string;
  declare email: string;
  declare phone: string;
  declare whatsapp: string;
  declare isActive: boolean;
}

Proveedor.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      unique: true,
      field: "usuario_id",
    },
    nombre: {
      type: DataTypes.STRING(180),
      allowNull: false,
      field: "nombre",
    },
    empresa: {
      type: DataTypes.STRING(180),
      allowNull: false,
      field: "empresa",
    },
    name: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: "",
    },
    tier: {
      type: DataTypes.ENUM("premium", "verified", "basic"),
      allowNull: false,
      defaultValue: "basic",
    },
    shortDescription: {
      type: DataTypes.STRING(280),
      allowNull: false,
      defaultValue: "",
    },
    sector: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "General",
      field: "sector",
    },
    about: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sectors: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    certifications: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    socialNetworks: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: "social_networks",
    },
    city: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(120),
      allowNull: false,
      defaultValue: "México",
    },
    website: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    whatsapp: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "proveedores",
    timestamps: true,
  }
);

export default Proveedor;
