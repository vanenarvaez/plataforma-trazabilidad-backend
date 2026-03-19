import { Router } from "express";
import {
  crearCurso,
  listarCursos,
  obtenerCursoPorId,
  actualizarCurso,
} from "./curso.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

/**
 * @swagger
 * /api/cursos:
 *   get:
 *     summary: Listar cursos
 *     tags: [Cursos]
 *     responses:
 *       200:
 *         description: Lista de cursos obtenida correctamente
 */
router.get("/", verifyToken, authorizeRoles("pedagogico"), listarCursos);

/**
 * @swagger
 * /api/cursos/{id}:
 *   get:
 *     summary: Consultar curso por id
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Curso encontrado
 *       404:
 *         description: Curso no encontrado
 */
router.get("/:id", verifyToken, authorizeRoles("pedagogico"), obtenerCursoPorId);

/**
 * @swagger
 * /api/cursos:
 *   post:
 *     summary: Crear curso
 *     tags: [Cursos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombreCurso
 *               - numeroModulos
 *               - tipoFormacion
 *               - duracionHoras
 *             properties:
 *               nombreCurso:
 *                 type: string
 *                 example: Apropiación Digital
 *               numeroModulos:
 *                 type: number
 *                 example: 5
 *               tipoFormacion:
 *                 type: string
 *                 example: virtual
 *               duracionHoras:
 *                 type: number
 *                 example: 20
 *               descripcion:
 *                 type: string
 *                 example: Curso básico de apropiación digital
 */
router.post("/", verifyToken, authorizeRoles("pedagogico"), crearCurso);

/**
 * @swagger
 * /api/cursos/{id}:
 *   put:
 *     summary: Actualizar curso
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Curso actualizado
 */
router.put("/:id", verifyToken, authorizeRoles("pedagogico"), actualizarCurso);

export default router;