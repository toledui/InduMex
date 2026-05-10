import { Router } from "express";
import suscriptoresController from "../controllers/suscriptoresController";
import { requireAdminRole, requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.post("/subscribers", (req, res) => suscriptoresController.subscribe(req, res));
router.post("/subscribers/unsubscribe", (req, res) => suscriptoresController.unsubscribe(req, res));
router.get("/subscribers", requireAuth, requireAdminRole, (req, res) =>
  suscriptoresController.list(req, res)
);

export default router;
