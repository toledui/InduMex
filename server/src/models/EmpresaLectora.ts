import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

export interface IEmpresaLectora {
  id?: number;
  nombre: string;
  abreviatura: string;
  orden: number;
  activa: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class EmpresaLectora extends Model<IEmpresaLectora> implements IEmpresaLectora {
  public id?: number;
  public nombre!: string;
  public abreviatura!: string;
  public orden!: number;
  public activa!: boolean;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

EmpresaLectora.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },
    abreviatura: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    activa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "empresas_lectoras",
    timestamps: true,
    underscored: true,
  }
);

export default EmpresaLectora;