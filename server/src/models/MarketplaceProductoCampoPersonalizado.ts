import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/database";
import MarketplaceProducto from "./MarketplaceProducto";

class MarketplaceProductoCampoPersonalizado extends Model<
  InferAttributes<MarketplaceProductoCampoPersonalizado>,
  InferCreationAttributes<MarketplaceProductoCampoPersonalizado>
> {
  declare id: CreationOptional<number>;
  declare productoId: ForeignKey<MarketplaceProducto["id"]>;
  declare clave: string;
  declare valor: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

MarketplaceProductoCampoPersonalizado.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    productoId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "producto_id",
      references: {
        model: MarketplaceProducto,
        key: "id",
      },
    },
    clave: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    valor: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    tableName: "marketplace_producto_campos_personalizados",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["producto_id"] }, { fields: ["producto_id", "clave"] }],
  }
);

MarketplaceProductoCampoPersonalizado.belongsTo(MarketplaceProducto, {
  foreignKey: "productoId",
  as: "producto",
});

export default MarketplaceProductoCampoPersonalizado;
