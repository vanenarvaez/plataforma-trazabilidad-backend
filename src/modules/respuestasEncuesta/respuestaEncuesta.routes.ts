import { Router } from "express";
import {
  registrarRespuestaEncuesta,
  listarRespuestasPorDocente,
} from "./respuestaEncuesta.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

/**
 * @swagger
 * /api/respuestas-encuesta:
 *   post:
 *     summary: Registrar respuestas de encuesta
 *     tags: [RespuestasEncuesta]
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles("pedagogico"),
  registrarRespuestaEncuesta
);

/**
 * @swagger
 * /api/respuestas-encuesta/{docenteId}:
 *   get:
 *     summary: Listar respuestas de encuesta por docente
 *     tags: [RespuestasEncuesta]
 */
router.get(
  "/:docenteId",
  verifyToken,
  authorizeRoles("pedagogico"),
  listarRespuestasPorDocente
);

export default router;