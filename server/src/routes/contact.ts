import { Router } from "express";
import contactController from "../controllers/contactController";

const router = Router();

// POST /api/v1/contact — Formulario de contacto (público)
router.post("/", (req, res) => contactController.submit(req, res));

export default router;
