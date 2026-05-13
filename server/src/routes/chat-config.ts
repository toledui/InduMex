import { Router } from "express";
import { getChatConfig, updateChatConfig } from "../controllers/chatConfigController";
import { requireAdminRole, requireAuth } from "../middleware/authMiddleware";

const router = Router();

// GET público: el frontend lo usa para verificar si el chat está activo
router.get("/chat-config", getChatConfig);

// PUT protegido: solo admins pueden actualizar la configuración del chat
router.put("/chat-config", requireAuth, requireAdminRole, updateChatConfig);

export default router;
