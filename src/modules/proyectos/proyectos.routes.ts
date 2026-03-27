import { Router } from "express";
import {
  getProyectos,
  getProyectoById,
  createProyecto,
  updateProyecto,
} from "./proyectos.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

router.get(
  "/",
  verifyToken,
  authorizeRoles("director", "pedagogico", "formador"),
  getProyectos
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("director", "pedagogico", "formador"),
  getProyectoById
);

router.post("/", verifyToken, authorizeRoles("director"), createProyecto);

router.put("/:id", verifyToken, authorizeRoles("director"), updateProyecto);

export default router;