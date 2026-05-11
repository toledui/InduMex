import { Router } from "express";
import authController from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.post("/auth/login", (req, res) => authController.login(req, res));
router.post("/auth/client/register", (req, res) => authController.registerClient(req, res));
router.post("/auth/client/login", (req, res) => authController.loginClient(req, res));
router.post("/auth/forgot-password", (req, res) =>
  authController.forgotPassword(req, res)
);
router.post("/auth/reset-password", (req, res) =>
  authController.resetPassword(req, res)
);
router.get("/auth/me", requireAuth, (req, res) => authController.me(req, res));
router.put("/auth/me", requireAuth, (req, res) => authController.updateMe(req, res));

export default router;
