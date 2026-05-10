import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/database";

class Usuario extends Model<
  InferAttributes<Usuario, { omit: "createdAt" | "updatedAt" }>,
  InferCreationAttributes<Usuario, { omit: "createdAt" | "updatedAt" }>
> {
  declare id: CreationOptional<number>;
  declare nombre: string;
  declare email: string;
  declare passwordHash: string;
  declare rol: CreationOptional<"admin" | "editor">;
  declare activo: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Usuario.init(
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
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
    },
    rol: {
      type: DataTypes.ENUM("admin", "editor"),
      allowNull: false,
      defaultValue: "editor",
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "usuarios",
    underscored: true,
    timestamps: true,
  }
);

export default Usuario;
