import { Router } from "express";
import {
  obtenerIndicadoresPublicos,
  obtenerIndicadoresInternosPorProyecto,
} from "./indicadores.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

/**
 * @swagger
 * /api/indicadores/publicos:
 *   get:
 *     summary: Obtener indicadores públicos consolidados
 *     tags: [Indicadores]
 */
router.get("/publicos", obtenerIndicadoresPublicos);

/**
 * @swagger
 * /api/indicadores/internos/proyecto/{proyectoId}:
 *   get:
 *     summary: Obtener indicadores internos por proyecto
 *     tags: [Indicadores]
 */
router.get(
  "/internos/proyecto/:proyectoId",
  verifyToken,
  authorizeRoles("admin", "director", "pedagogico"),
  obtenerIndicadoresInternosPorProyecto
);

export default router;