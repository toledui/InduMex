import { Router } from "express";
import redSocialController from "../controllers/redSocialController";
import { requireAuth, requireAdminRole } from "../middleware/authMiddleware";

const router = Router();

// ── Rutas públicas ──────────────────────────────────────
// GET /api/v1/social-networks - Obtener todas las redes activas (para footer)
router.get("/social-networks", (req, res) => redSocialController.list(req, res));

// ── Rutas protegidas (admin) ────────────────────────────

// Rutas especiales antes de las parametrizadas
router.get("/social-networks/admin", requireAuth, requireAdminRole, (req, res) =>
  redSocialController.listAdmin(req, res)
);

router.post("/social-networks/reorder", requireAuth, requireAdminRole, (req, res) =>
  redSocialController.reorder(req, res)
);

// GET /api/v1/social-networks/:id - Obtener una por ID
router.get("/social-networks/:id", requireAuth, requireAdminRole, (req, res) =>
  redSocialController.getById(req, res)
);

// POST /api/v1/social-networks - Crear nueva
router.post("/social-networks", requireAuth, requireAdminRole, (req, res) =>
  redSocialController.create(req, res)
);

// PUT /api/v1/social-networks/:id - Actualizar
router.put("/social-networks/:id", requireAuth, requireAdminRole, (req, res) =>
  redSocialController.update(req, res)
);

// DELETE /api/v1/social-networks/:id - Eliminar
router.delete("/social-networks/:id", requireAuth, requireAdminRole, (req, res) =>
  redSocialController.delete(req, res)
);

export default router;
