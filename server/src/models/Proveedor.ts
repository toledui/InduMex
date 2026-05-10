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
  declare nombre: string;
  declare empresa: string;
  declare email: string;
  declare sector: string;
}

Proveedor.init(
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
    empresa: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    sector: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "proveedores",
    timestamps: true,
  }
);

export default Proveedor;
