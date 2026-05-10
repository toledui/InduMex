import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectToDatabase } from "./config/database";
import authRoutes from "./routes/auth";
import configuracionRoutes from "./routes/configuracion";
import proveedoresRoutes from "./routes/proveedores";
import suscriptoresRoutes from "./routes/suscriptores";
import usuariosRoutes from "./routes/usuarios";
import postsRoutes from "./routes/posts";
import redSocialesRoutes from "./routes/redes-sociales";
import anunciosRoutes from "./routes/anuncios";
import contactRoutes from "./routes/contact";
// Importar modelos para sincronización
import "./models/RedSocial";
import "./models/Anuncio";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.json());

app.use("/api/v1", proveedoresRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", usuariosRoutes);
app.use("/api/v1", configuracionRoutes);
app.use("/api/v1", suscriptoresRoutes);
app.use("/api/v1", postsRoutes);
app.use("/api/v1", redSocialesRoutes);
app.use("/api/v1/ads", anunciosRoutes);
app.use("/api/v1/contact", contactRoutes);

async function startServer(): Promise<void> {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error);
    process.exit(1);
  }
}

startServer();
