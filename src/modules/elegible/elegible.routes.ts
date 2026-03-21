import { Router } from "express";
import { validarElegibilidad } from "./elegible.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

/**
 * @swagger
 * /api/elegibilidad/{docenteId}/{proyectoCursoId}:
 *   get:
 *     summary: Validar elegibilidad de un docente por asistencia
 *     tags: [Elegibilidad]
 *     parameters:
 *       - in: path
 *         name: docenteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: proyectoCursoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado de elegibilidad calculado correctamente
 */
router.get(
  "/:docenteId/:proyectoCursoId",
  verifyToken,
  authorizeRoles("pedagogico"),
  validarElegibilidad
);

export default router;