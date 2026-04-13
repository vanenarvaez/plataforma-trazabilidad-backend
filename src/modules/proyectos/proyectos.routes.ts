import { Router } from "express";
import {
  getProyectos,
  getProyectoById,
  createProyecto,
  updateProyecto,
  obtenerDetalleProyecto,
} from "./proyectos.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";
import { deleteProyecto } from "./proyectos.controller";

const router = Router();

router.get(
  "/",
  verifyToken,
  authorizeRoles("director", "pedagogico", "formador", "comercial", "admin"),
  getProyectos
);

router.get(
  "/:id/detalle",
  verifyToken,
  authorizeRoles("director", "pedagogico", "formador", "admin"),
  obtenerDetalleProyecto
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("director", "pedagogico", "formador", "admin"),
  getProyectoById
);

router.post("/", verifyToken, authorizeRoles("director", "admin"), createProyecto);

router.put("/:id", verifyToken, authorizeRoles("director", "admin"), updateProyecto);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  deleteProyecto
);

export default router;