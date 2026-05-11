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
import MarketplaceCategoria from "./MarketplaceCategoria";

class MarketplaceProducto extends Model<
  InferAttributes<MarketplaceProducto>,
  InferCreationAttributes<MarketplaceProducto>
> {
  declare id: CreationOptional<number>;
  declare usuarioId: ForeignKey<Usuario["id"]>;
  declare categoriaId: ForeignKey<MarketplaceCategoria["id"]>;
  declare sku: string;
  declare nombre: string;
  declare slug: string;
  declare descripcion: CreationOptional<string | null>;
  declare precio: number;
  declare moneda: CreationOptional<string>;
  declare stock: CreationOptional<number>;
  declare destacado: CreationOptional<boolean>;
  declare estado: CreationOptional<"borrador" | "publicado" | "archivado">;
  declare imagenes: CreationOptional<string[]>;
  declare metadata: CreationOptional<Record<string, unknown>>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

MarketplaceProducto.init(
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
    categoriaId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "categoria_id",
      references: {
        model: MarketplaceCategoria,
        key: "id",
      },
    },
    sku: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(220),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    precio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    moneda: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "MXN",
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    destacado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    estado: {
      type: DataTypes.ENUM("borrador", "publicado", "archivado"),
      allowNull: false,
      defaultValue: "borrador",
    },
    imagenes: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
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
    tableName: "marketplace_productos",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["usuario_id"] },
      { fields: ["categoria_id"] },
      { fields: ["estado"] },
      { fields: ["usuario_id", "sku"], unique: true },
      { fields: ["usuario_id", "slug"], unique: true },
    ],
  }
);

MarketplaceProducto.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });
MarketplaceProducto.belongsTo(MarketplaceCategoria, { foreignKey: "categoriaId", as: "categoria" });

export default MarketplaceProducto;
