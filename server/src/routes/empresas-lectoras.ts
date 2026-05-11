import { Router } from "express";
import empresaLectoraController from "../controllers/empresaLectoraController";
import { requireAdminRole, requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Pública
router.get("/empresas-lectoras", (req, res) => empresaLectoraController.list(req, res));

// Admin
router.get("/empresas-lectoras/admin", requireAuth, requireAdminRole, (req, res) =>
  empresaLectoraController.listAdmin(req, res)
);
router.get("/empresas-lectoras/:id", requireAuth, requireAdminRole, (req, res) =>
  empresaLectoraController.getById(req, res)
);
router.post("/empresas-lectoras", requireAuth, requireAdminRole, (req, res) =>
  empresaLectoraController.create(req, res)
);
router.put("/empresas-lectoras/:id", requireAuth, requireAdminRole, (req, res) =>
  empresaLectoraController.update(req, res)
);
router.delete("/empresas-lectoras/:id", requireAuth, requireAdminRole, (req, res) =>
  empresaLectoraController.delete(req, res)
);

export default router;
