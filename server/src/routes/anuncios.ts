import { Router } from "express";
import anuncioController from "../controllers/anuncioController";
import { requireAuth, requireAdminRole } from "../middleware/authMiddleware";

const router = Router();

// Rutas específicas ANTES de /:id para evitar conflictos de Express
router.get("/admin", requireAuth, requireAdminRole, (req, res) => anuncioController.listAdmin(req, res));

// Pública: obtener anuncios activos por zona (?zona=hero-slider)
router.get("/", (req, res) => anuncioController.listByZona(req, res));

// CRUD protegido
router.get("/:id", requireAuth, requireAdminRole, (req, res) => anuncioController.getById(req, res));
router.post("/", requireAuth, requireAdminRole, (req, res) => anuncioController.create(req, res));
router.put("/:id", requireAuth, requireAdminRole, (req, res) => anuncioController.update(req, res));
router.delete("/:id", requireAuth, requireAdminRole, (req, res) => anuncioController.delete(req, res));

export default router;
