import { Router } from "express";
import suscriptoresController from "../controllers/suscriptoresController";
import { requireAdminRole, requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.post("/subscribers", (req, res) => suscriptoresController.subscribe(req, res));
router.post("/subscribers/unsubscribe", (req, res) => suscriptoresController.unsubscribe(req, res));
router.get("/subscribers", requireAuth, requireAdminRole, (req, res) =>
  suscriptoresController.list(req, res)
);
router.get("/subscribers/sync/status", requireAuth, requireAdminRole, (req, res) =>
  suscriptoresController.syncStatus(req, res)
);
router.post("/subscribers/sync/run", requireAuth, requireAdminRole, (req, res) =>
  suscriptoresController.runSync(req, res)
);
router.post("/subscribers/sync/auto", requireAuth, requireAdminRole, (req, res) =>
  suscriptoresController.toggleAutoSync(req, res)
);

export default router;
