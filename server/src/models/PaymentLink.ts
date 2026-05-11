import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/database";
import { EcartPayItem } from "./MediaKitPlan";

export type PaymentLinkEstado = "pending" | "paid" | "expired" | "cancelled";

class PaymentLink extends Model<
  InferAttributes<PaymentLink>,
  InferCreationAttributes<PaymentLink>
> {
  declare id: CreationOptional<number>;
  declare token: string;
  declare planId: CreationOptional<ForeignKey<number> | null>;
  declare usuarioId: CreationOptional<ForeignKey<number> | null>;
  declare descripcion: CreationOptional<string | null>;
  declare monto: number;
  declare moneda: CreationOptional<string>;
  declare items: EcartPayItem[];
  declare estado: CreationOptional<PaymentLinkEstado>;
  declare compradorEmail: CreationOptional<string | null>;
  declare compradorNombre: CreationOptional<string | null>;
  declare ecartpayOrderId: CreationOptional<string | null>;
  declare ecartpayCheckoutId: CreationOptional<string | null>;
  declare expiresAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

PaymentLink.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
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
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    estado: {
      type: DataTypes.ENUM("pending", "paid", "expired", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    compradorEmail: {
      type: DataTypes.STRING(180),
      allowNull: true,
      field: "comprador_email",
    },
    compradorNombre: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "comprador_nombre",
    },
    ecartpayOrderId: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "ecartpay_order_id",
    },
    ecartpayCheckoutId: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "ecartpay_checkout_id",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "expires_at",
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
    tableName: "payment_links",
    underscored: true,
    timestamps: true,
  }
);

export default PaymentLink;
