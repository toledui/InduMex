import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/database";

export interface EcartPayItem {
  name: string;
  price: number;
  quantity: number;
}

class MediaKitPlan extends Model<
  InferAttributes<MediaKitPlan>,
  InferCreationAttributes<MediaKitPlan>
> {
  declare id: CreationOptional<number>;
  declare nombre: string;
  declare descripcion: CreationOptional<string | null>;
  declare precio: number;
  declare precioDescuento: CreationOptional<number | null>;
  declare porcentajeDescuento: CreationOptional<number | null>;
  declare moneda: CreationOptional<string>;
  declare items: EcartPayItem[];
  declare features: string[];
  declare activo: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

MediaKitPlan.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    precioDescuento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "precio_descuento",
    },
    porcentajeDescuento: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "porcentaje_descuento",
    },
    moneda: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "MXN",
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    features: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "media_kit_planes",
    underscored: true,
    timestamps: true,
  }
);

export default MediaKitPlan;
