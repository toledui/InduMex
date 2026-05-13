import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../config/database";

class ChatConfig extends Model<
  InferAttributes<ChatConfig, { omit: "createdAt" | "updatedAt" }>,
  InferCreationAttributes<ChatConfig, { omit: "createdAt" | "updatedAt" }>
> {
  declare id: CreationOptional<number>;
  declare n8nWebhookUrl: string | null;
  declare isActive: boolean;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ChatConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    n8nWebhookUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "n8n_webhook_url",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_active",
    },
  },
  {
    sequelize,
    tableName: "chat_configs",
    underscored: true,
    timestamps: true,
  }
);

export default ChatConfig;
