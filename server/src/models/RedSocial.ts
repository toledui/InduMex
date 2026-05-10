import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

export interface IRedSocial {
  id?: number;
  nombre: string;
  url: string;
  icono?: string;
  orden: number;
  activa: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class RedSocial extends Model<IRedSocial> implements IRedSocial {
  public id?: number;
  public nombre!: string;
  public url!: string;
  public icono?: string;
  public orden!: number;
  public activa!: boolean;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

RedSocial.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Nombre de la red social (Twitter, LinkedIn, Facebook, etc.)",
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: "URL del perfil o página de la red social",
    },
    icono: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Nombre del icono (lucide-react icon name)",
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Orden de visualización en el footer",
    },
    activa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "Si la red social está activa o no",
    },
  },
  {
    sequelize,
    tableName: "redes_sociales",
    timestamps: true,
    underscored: true,
  }
);

export default RedSocial;
