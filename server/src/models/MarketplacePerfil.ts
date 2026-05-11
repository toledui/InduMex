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

class MarketplacePerfil extends Model<
  InferAttributes<MarketplacePerfil>,
  InferCreationAttributes<MarketplacePerfil>
> {
  declare id: CreationOptional<number>;
  declare usuarioId: ForeignKey<Usuario["id"]>;
  declare habilitado: CreationOptional<boolean>;
  declare maxProductosOverride: CreationOptional<number | null>;
  declare vigenciaHasta: CreationOptional<Date | null>;
  declare notasAdmin: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

MarketplacePerfil.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      field: "usuario_id",
      references: {
        model: Usuario,
        key: "id",
      },
    },
    habilitado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    maxProductosOverride: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "max_productos_override",
    },
    vigenciaHasta: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "vigencia_hasta",
    },
    notasAdmin: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "notas_admin",
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
    tableName: "marketplace_perfiles",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["usuario_id"] }, { fields: ["habilitado"] }],
  }
);

MarketplacePerfil.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });

export default MarketplacePerfil;
