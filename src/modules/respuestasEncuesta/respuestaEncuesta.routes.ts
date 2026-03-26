import { Router } from "express";
import {
  registrarRespuestaEncuesta,
  listarRespuestasPorDocente,
  listarRespuestasPorDocumento,
  registrarRespuestaEncuestaPublica,
  resumenEncuestasPorProyecto,
} from "./respuestaEncuesta.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

/**
 * @swagger
 * /api/respuestas-encuesta/publico:
 *   post:
 *     summary: Registrar respuestas públicas de encuesta
 *     tags: [RespuestasEncuesta]
 */
router.post("/publico", registrarRespuestaEncuestaPublica);

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
 * /api/respuestas-encuesta/documento/{numeroDocumento}:
 *   get:
 *     summary: Listar respuestas de encuesta por número de documento
 *     tags: [RespuestasEncuesta]
 */
router.get("/documento/:numeroDocumento", listarRespuestasPorDocumento);

/**
 * @swagger
 * /api/respuestas-encuesta/proyecto/{proyectoId}:
 *   get:
 *     summary: Resumen de respuestas de encuestas por proyecto
 *     tags: [RespuestasEncuesta]
 */
router.get(
  "/proyecto/:proyectoId",
  verifyToken,
  authorizeRoles("admin", "pedagogico", "director"),
  resumenEncuestasPorProyecto
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