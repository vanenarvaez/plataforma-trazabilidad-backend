import { Router } from "express";
import {
  registrarAsistencia,
  listarAsistencias,
  obtenerAsistenciasPorProyectoCurso,
} from "./asistencia.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

/**
 * @swagger
 * /api/asistencias:
 *   get:
 *     summary: Listar asistencias
 *     tags: [Asistencias]
 *     responses:
 *       200:
 *         description: Lista de asistencias obtenida correctamente
 */
router.get("/", verifyToken, authorizeRoles("formador"), listarAsistencias);

/**
 * @swagger
 * /api/asistencias/{proyectoCursoId}:
 *   get:
 *     summary: Obtener asistencias por proyectoCursoId
 *     tags: [Asistencias]
 *     parameters:
 *       - in: path
 *         name: proyectoCursoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Asistencias consultadas correctamente
 */
router.get(
  "/:proyectoCursoId",
  verifyToken,
  authorizeRoles("formador"),
  obtenerAsistenciasPorProyectoCurso
);

/**
 * @swagger
 * /api/asistencias:
 *   post:
 *     summary: Registrar asistencia
 *     tags: [Asistencias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proyectoCursoId
 *               - docenteId
 *               - moduloNumero
 *               - asistio
 *             properties:
 *               proyectoCursoId:
 *                 type: string
 *                 example: 69b5b8386bfeef5068a0a40
 *               docenteId:
 *                 type: string
 *                 example: 69b8a62d1dd930e5778a7916
 *               moduloNumero:
 *                 type: number
 *                 example: 1
 *               asistio:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Asistencia registrada correctamente
 *       400:
 *         description: Ya existe un registro para ese docente en ese módulo
 */
router.post("/", verifyToken, authorizeRoles("formador"), registrarAsistencia);

export default router;