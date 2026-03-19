import { Router } from "express";
import {
  asignarCursoAProyecto,
  obtenerCursosPorProyecto,
} from "./proyectoCurso.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

/**
 * @swagger
 * /api/proyecto-cursos:
 *   post:
 *     summary: Asignar curso a un proyecto
 *     tags: [ProyectoCursos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proyectoId
 *               - cursoId
 *             properties:
 *               proyectoId:
 *                 type: string
 *                 example: 69b0d201860abd4c841905ff
 *               cursoId:
 *                 type: string
 *                 example: 69b8f0000000000000000001
 *     responses:
 *       201:
 *         description: Curso asignado al proyecto correctamente
 *       400:
 *         description: El curso ya está asignado a este proyecto
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles("pedagogico"),
  asignarCursoAProyecto
);

/**
 * @swagger
 * /api/proyecto-cursos/{proyectoId}:
 *   get:
 *     summary: Obtener cursos asignados a un proyecto
 *     tags: [ProyectoCursos]
 *     parameters:
 *       - in: path
 *         name: proyectoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Id del proyecto
 *     responses:
 *       200:
 *         description: Cursos asociados al proyecto
 */
router.get(
  "/:proyectoId",
  verifyToken,
  authorizeRoles("pedagogico"),
  obtenerCursosPorProyecto
);

export default router;