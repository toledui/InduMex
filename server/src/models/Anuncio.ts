import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

export type AdZona = "hero-slider" | "editorial-grid" | "post-in-content" | "post-sidebar";

export interface IAnuncio {
  id?: number;
  titulo: string;
  descripcion: string;
  cta_texto: string;
  cta_url: string;
  imagen_url?: string | null;
  zona: AdZona;
  activo: boolean;
  orden: number;
  metrica?: string | null;
  sector?: string | null;
  acento?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class Anuncio extends Model<IAnuncio> implements IAnuncio {
  public id?: number;
  public titulo!: string;
  public descripcion!: string;
  public cta_texto!: string;
  public cta_url!: string;
  public imagen_url?: string | null;
  public zona!: AdZona;
  public activo!: boolean;
  public orden!: number;
  public metrica?: string | null;
  public sector?: string | null;
  public acento?: string | null;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Anuncio.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cta_texto: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Ver más",
    },
    cta_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    imagen_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    zona: {
      type: DataTypes.ENUM("hero-slider", "editorial-grid", "post-in-content", "post-sidebar"),
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    metrica: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sector: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    acento: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: "#F58634",
    },
  },
  {
    sequelize,
    tableName: "anuncios",
    modelName: "Anuncio",
    underscored: true,
  }
);

export default Anuncio;
