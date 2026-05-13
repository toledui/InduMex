import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { connectToDatabase } from "./config/database";
import authRoutes from "./routes/auth";
import configuracionRoutes from "./routes/configuracion";
import chatConfigRoutes from "./routes/chat-config";
import proveedoresRoutes from "./routes/proveedores";
import suscriptoresRoutes from "./routes/suscriptores";
import usuariosRoutes from "./routes/usuarios";
import postsRoutes from "./routes/posts";
import redSocialesRoutes from "./routes/redes-sociales";
import anunciosRoutes from "./routes/anuncios";
import contactRoutes from "./routes/contact";
import empresasLectorasRoutes from "./routes/empresas-lectoras";
import pagosRoutes from "./routes/pagos";
import proveedorSuscripcionesRoutes from "./routes/proveedorSuscripciones";
import marketplaceRoutes from "./routes/marketplace";
// Importar modelos para sincronización
import "./models/RedSocial";
import "./models/Anuncio";
import "./models/EmpresaLectora";
import "./models/MediaKitPlan";
import "./models/PaymentLink";
import "./models/Venta";
import "./models/ProveedorSuscripcionPlan";
import "./models/ProveedorSuscripcion";
import "./models/MarketplacePlan";
import "./models/MarketplaceSuscripcion";
import "./models/MarketplacePerfil";
import "./models/MarketplaceCategoria";
import "./models/MarketplaceProducto";
import "./models/MarketplaceProductoCampoPersonalizado";
import "./models/ChatConfig";
import { procesarRenovacionesAutomaticas } from "./services/suscripcionRenovacionService";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);
app.use(
  express.json({
    verify(req, _res, buf) {
      (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  })
);
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

app.use("/api/v1", proveedoresRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", usuariosRoutes);
app.use("/api/v1", configuracionRoutes);
app.use("/api/v1", chatConfigRoutes);
app.use("/api/v1", suscriptoresRoutes);
app.use("/api/v1", postsRoutes);
app.use("/api/v1", redSocialesRoutes);
app.use("/api/v1/ads", anunciosRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1", empresasLectorasRoutes);
app.use("/api/v1", pagosRoutes);
app.use("/api/v1", proveedorSuscripcionesRoutes);
app.use("/api/v1", marketplaceRoutes);

async function startServer(): Promise<void> {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    // Ejecutar tareas de renovación automática
    // Primero ejecutamos inmediatamente para verificaciones
    await procesarRenovacionesAutomaticas();

    // Luego cada 24 horas (86400000 ms)
    setInterval(procesarRenovacionesAutomaticas, 24 * 60 * 60 * 1000);
    console.log("[Suscripciones] Renovación automática configurada cada 24 horas");
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error);
    process.exit(1);
  }
}

startServer();
