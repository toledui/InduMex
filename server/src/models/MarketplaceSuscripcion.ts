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
import PaymentLink from "./PaymentLink";
import MarketplacePlan from "./MarketplacePlan";

class MarketplaceSuscripcion extends Model<
  InferAttributes<MarketplaceSuscripcion>,
  InferCreationAttributes<MarketplaceSuscripcion>
> {
  declare id: CreationOptional<number>;
  declare usuarioId: ForeignKey<Usuario["id"]>;
  declare planId: ForeignKey<MarketplacePlan["id"]>;
  declare estado: CreationOptional<"activa" | "pausada" | "cancelada" | "vencida">;
  declare fechaInicio: Date;
  declare fechaVencimiento: Date;
  declare proximoLinkPagoGeneradoEn: CreationOptional<Date | null>;
  declare ultimoLinkPagoId: CreationOptional<ForeignKey<PaymentLink["id"]> | null>;
  declare periodoGraciaVencimientoEn: CreationOptional<Date | null>;
  declare notificacionesPendientes: CreationOptional<object[]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

MarketplaceSuscripcion.init(
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
    planId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "plan_id",
      references: {
        model: MarketplacePlan,
        key: "id",
      },
    },
    estado: {
      type: DataTypes.ENUM("activa", "pausada", "cancelada", "vencida"),
      allowNull: false,
      defaultValue: "activa",
    },
    fechaInicio: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "fecha_inicio",
    },
    fechaVencimiento: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "fecha_vencimiento",
    },
    proximoLinkPagoGeneradoEn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "proximo_link_pago_generado_en",
    },
    ultimoLinkPagoId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "ultimo_link_pago_id",
      references: {
        model: PaymentLink,
        key: "id",
      },
    },
    periodoGraciaVencimientoEn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "periodo_gracia_vencimiento_en",
    },
    notificacionesPendientes: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: "notificaciones_pendientes",
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
    tableName: "marketplace_suscripciones",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["usuario_id"] },
      { fields: ["plan_id"] },
      { fields: ["estado"] },
      { fields: ["fecha_vencimiento"] },
    ],
  }
);

MarketplaceSuscripcion.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });
MarketplaceSuscripcion.belongsTo(MarketplacePlan, { foreignKey: "planId", as: "plan" });
MarketplaceSuscripcion.belongsTo(PaymentLink, { foreignKey: "ultimoLinkPagoId", as: "ultimoLinkPago" });

export default MarketplaceSuscripcion;
