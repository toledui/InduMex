import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/database";

export type MarketplacePeriodicidad =
  | "mensual"
  | "bimestral"
  | "trimestral"
  | "semestral"
  | "anual";

export type MarketplaceVisibilidadNivel = "base" | "media" | "alta";

class MarketplacePlan extends Model<
  InferAttributes<MarketplacePlan>,
  InferCreationAttributes<MarketplacePlan>
> {
  declare id: CreationOptional<number>;
  declare nombre: string;
  declare descripcion: CreationOptional<string | null>;
  declare precio: number;
  declare moneda: CreationOptional<string>;
  declare periodicidad: CreationOptional<MarketplacePeriodicidad>;
  declare caracteristicas: CreationOptional<string[]>;
  declare maxProductos: CreationOptional<number>;
  declare maxProductosDestacados: CreationOptional<number>;
  declare nivelVisibilidad: CreationOptional<MarketplaceVisibilidadNivel>;
  declare activo: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

MarketplacePlan.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    moneda: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "MXN",
    },
    periodicidad: {
      type: DataTypes.ENUM("mensual", "bimestral", "trimestral", "semestral", "anual"),
      allowNull: false,
      defaultValue: "mensual",
    },
    caracteristicas: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    maxProductos: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 20,
      field: "max_productos",
    },
    maxProductosDestacados: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "max_productos_destacados",
    },
    nivelVisibilidad: {
      type: DataTypes.ENUM("base", "media", "alta"),
      allowNull: false,
      defaultValue: "base",
      field: "nivel_visibilidad",
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "marketplace_planes",
    timestamps: true,
    underscored: true,
  }
);

export default MarketplacePlan;
