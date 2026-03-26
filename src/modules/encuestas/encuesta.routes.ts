import { Router } from "express";
import {
  crearEncuesta,
  listarEncuestas,
  obtenerEncuestaPorId,
  listarEncuestasPublicas,
} from "./encuesta.controller";

import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

/**
 * @swagger
 * /api/encuestas/publicas:
 *   get:
 *     summary: Listar encuestas públicas activas
 *     tags: [Encuestas]
 */
router.get("/publicas", listarEncuestasPublicas);

/**
 * @swagger
 * /api/encuestas:
 *   post:
 *     summary: Crear encuesta
 *     tags: [Encuestas]
 */
router.post("/", verifyToken, authorizeRoles("pedagogico"), crearEncuesta);

/**
 * @swagger
 * /api/encuestas:
 *   get:
 *     summary: Listar encuestas
 *     tags: [Encuestas]
 */
router.get("/", verifyToken, listarEncuestas);

/**
 * @swagger
 * /api/encuestas/{id}:
 *   get:
 *     summary: Obtener encuesta por ID
 *     tags: [Encuestas]
 */
router.get("/:id", verifyToken, obtenerEncuestaPorId);

export default router;