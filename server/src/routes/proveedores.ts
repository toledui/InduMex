import { Router } from "express";
import Proveedor from "../models/Proveedor";

const router = Router();

router.get("/proveedores", async (_req, res) => {
  try {
    const proveedores = await Proveedor.findAll({ order: [["id", "ASC"]] });
    res.status(200).json(proveedores);
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
