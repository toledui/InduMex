import { Router } from "express";
import { getConfig, updateConfig, testSmtp } from "../controllers/configuracionController";
import { requireAdminRole, requireAuth } from "../middleware/authMiddleware";

const router = Router();

// GET público: el frontend (Next.js server-side) lo usa para leer wordpress_api_url sin token
router.get("/config", getConfig);

// PUT protegido: solo admins autenticados pueden modificar la configuración
router.put("/config", requireAuth, requireAdminRole, updateConfig);
router.post("/config/test-smtp", requireAuth, requireAdminRole, testSmtp);

export default router;
