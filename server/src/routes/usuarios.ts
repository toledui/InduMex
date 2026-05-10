import { Router } from "express";
import usuariosController from "../controllers/usuariosController";
import { requireAdminRole, requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/users", requireAuth, requireAdminRole, (req, res) =>
  usuariosController.list(req, res)
);
router.get("/users/:id", requireAuth, requireAdminRole, (req, res) =>
  usuariosController.getById(req, res)
);
router.post("/users", requireAuth, requireAdminRole, (req, res) =>
  usuariosController.create(req, res)
);
router.put("/users/:id", requireAuth, requireAdminRole, (req, res) =>
  usuariosController.update(req, res)
);
router.delete("/users/:id", requireAuth, requireAdminRole, (req, res) =>
  usuariosController.remove(req, res)
);

export default router;
