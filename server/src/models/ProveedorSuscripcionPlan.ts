import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/database";

class ProveedorSuscripcionPlan extends Model<
  InferAttributes<ProveedorSuscripcionPlan>,
  InferCreationAttributes<ProveedorSuscripcionPlan>
> {
  declare id: CreationOptional<number>;
  declare nombre: string;
  declare descripcion: CreationOptional<string | null>;
  declare precio: number;
  declare moneda: CreationOptional<string>;
  declare periodicidad: CreationOptional<"mensual" | "bimestral" | "trimestral" | "semestral" | "anual">;
  declare beneficios: CreationOptional<string[]>;
  declare status: "verificado" | "patrocinado";
  declare activo: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ProveedorSuscripcionPlan.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
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
      defaultValue: "MXN",
    },
    periodicidad: {
      type: DataTypes.ENUM("mensual", "bimestral", "trimestral", "semestral", "anual"),
      allowNull: false,
      defaultValue: "mensual",
    },
    beneficios: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM("verificado", "patrocinado"),
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
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
    tableName: "proveedor_suscripcion_plans",
    timestamps: true,
    underscored: true,
  }
);

export default ProveedorSuscripcionPlan;
