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
import ProveedorSuscripcionPlan from "./ProveedorSuscripcionPlan";
import PaymentLink from "./PaymentLink";

class ProveedorSuscripcion extends Model<
  InferAttributes<ProveedorSuscripcion>,
  InferCreationAttributes<ProveedorSuscripcion>
> {
  declare id: CreationOptional<number>;
  declare usuarioId: ForeignKey<Usuario["id"]>;
  declare planId: ForeignKey<ProveedorSuscripcionPlan["id"]>;
  declare estado: CreationOptional<"activa" | "pausada" | "cancelada" | "vencida">;
  declare fechaInicio: Date;
  declare fechaVencimiento: Date;
  declare proximoLinkPagoGeneradoEn: CreationOptional<Date | null>;
  declare ultimoLinkPagoId: CreationOptional<ForeignKey<PaymentLink["id"]> | null>;
  declare periodoGraciaVencimentoEn: CreationOptional<Date | null>;
  declare notificacionesPendientes: CreationOptional<object[]>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ProveedorSuscripcion.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: Usuario,
        key: "id",
      },
      field: "usuario_id",
    },
    planId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: ProveedorSuscripcionPlan,
        key: "id",
      },
      field: "plan_id",
    },
    estado: {
      type: DataTypes.ENUM("activa", "pausada", "cancelada", "vencida"),
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
      references: {
        model: PaymentLink,
        key: "id",
      },
      field: "ultimo_link_pago_id",
    },
    periodoGraciaVencimentoEn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "periodo_gracia_vencimiento_en",
    },
    notificacionesPendientes: {
      type: DataTypes.JSON,
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
    tableName: "proveedor_suscripciones",
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

ProveedorSuscripcion.belongsTo(Usuario, { foreignKey: "usuarioId", as: "usuario" });
ProveedorSuscripcion.belongsTo(ProveedorSuscripcionPlan, { foreignKey: "planId", as: "plan" });
ProveedorSuscripcion.belongsTo(PaymentLink, {
  foreignKey: "ultimoLinkPagoId",
  as: "ultimoLinkPago",
});

export default ProveedorSuscripcion;
