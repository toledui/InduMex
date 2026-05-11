import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/database";
import Usuario from "./Usuario";

class MarketplaceCategoria extends Model<
  InferAttributes<MarketplaceCategoria>,
  InferCreationAttributes<MarketplaceCategoria>
> {
  declare id: CreationOptional<number>;
  declare usuarioId: ForeignKey<Usuario["id"]>;
  declare nombre: string;
  declare slug: string;
  declare descripcion: CreationOptional<string | null>;
  declare activa: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

MarketplaceCategoria.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "usuario_id",
      references: {
        model: Usuario,
        key: "id",
      },
    },
    nombre: {
      type: DataTypes.STRING(140),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    activa: {
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
    tableName: "marketplace_categorias",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["usuario_id"] },
      { fields: ["usuario_id", "slug"], unique: true },
    ],
  }
);

MarketplaceCategoria.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

export default MarketplaceCategoria;
