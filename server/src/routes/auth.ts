import { Router } from "express";
import authController from "../controllers/authController";

const router = Router();

router.post("/auth/login", (req, res) => authController.login(req, res));
router.post("/auth/forgot-password", (req, res) =>
  authController.forgotPassword(req, res)
);
router.post("/auth/reset-password", (req, res) =>
  authController.resetPassword(req, res)
);

export default router;
