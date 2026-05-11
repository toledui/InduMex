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
  declare apellido: CreationOptional<string | null>;
  declare telefono: CreationOptional<string | null>;
  declare empresa: CreationOptional<string | null>;
  declare aceptaTerminos: CreationOptional<boolean>;
  declare aceptaTerminosAt: CreationOptional<Date | null>;
  declare email: string;
  declare passwordHash: string;
  declare rol: CreationOptional<"admin" | "editor" | "cliente">;
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
    apellido: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    empresa: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    aceptaTerminos: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "acepta_terminos",
    },
    aceptaTerminosAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "acepta_terminos_at",
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
      type: DataTypes.ENUM("admin", "editor", "cliente"),
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
