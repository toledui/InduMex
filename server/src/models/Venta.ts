import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/database";

export type VentaEstado = "completed" | "refunded";

class Venta extends Model<
  InferAttributes<Venta>,
  InferCreationAttributes<Venta>
> {
  declare id: CreationOptional<number>;
  declare paymentLinkId: CreationOptional<ForeignKey<number> | null>;
  declare planId: CreationOptional<ForeignKey<number> | null>;
  declare usuarioId: CreationOptional<ForeignKey<number> | null>;
  declare compradorEmail: string;
  declare compradorNombre: CreationOptional<string | null>;
  declare compradorTelefono: CreationOptional<string | null>;
  declare monto: number;
  declare moneda: CreationOptional<string>;
  declare ecartpayOrderId: CreationOptional<string | null>;
  declare ecartpayPayload: CreationOptional<object | null>;
  declare estado: CreationOptional<VentaEstado>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Venta.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    paymentLinkId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "payment_link_id",
    },
    planId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "plan_id",
    },
    usuarioId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "usuario_id",
    },
    compradorEmail: {
      type: DataTypes.STRING(180),
      allowNull: false,
      field: "comprador_email",
    },
    compradorNombre: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "comprador_nombre",
    },
    compradorTelefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "comprador_telefono",
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    moneda: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "MXN",
    },
    ecartpayOrderId: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "ecartpay_order_id",
    },
    ecartpayPayload: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "ecartpay_payload",
    },
    estado: {
      type: DataTypes.ENUM("completed", "refunded"),
      allowNull: false,
      defaultValue: "completed",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "ventas",
    underscored: true,
    timestamps: true,
  }
);

export default Venta;
