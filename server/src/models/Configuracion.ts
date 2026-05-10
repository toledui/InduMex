import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/database";

class Configuracion extends Model<
  InferAttributes<Configuracion, { omit: "createdAt" | "updatedAt" }>,
  InferCreationAttributes<Configuracion, { omit: "createdAt" | "updatedAt" }>
> {
  declare clave: string;
  declare valor: string | null;
  declare descripcion: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Configuracion.init(
  {
    clave: {
      type: DataTypes.STRING(100),
      primaryKey: true,
    },
    valor: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "configuraciones",
    underscored: true,
    timestamps: true,
  }
);

export default Configuracion;
