import { Router } from "express";
import {
  crearDocente,
  listarDocentes,
  obtenerDocentePorId,
  actualizarDocente,
} from "./docentes.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

/**
 * @swagger
 * /api/docentes:
 *   get:
 *     summary: Listar docentes
 *     tags: [Docentes]
 *     responses:
 *       200:
 *         description: Lista de docentes obtenida correctamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso no autorizado para este rol
 */
router.get("/", verifyToken, authorizeRoles("pedagogico"), listarDocentes);

/**
 * @swagger
 * /api/docentes/{id}:
 *   get:
 *     summary: Consultar docente por id
 *     tags: [Docentes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Id del docente
 *     responses:
 *       200:
 *         description: Docente encontrado correctamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso no autorizado para este rol
 *       404:
 *         description: Docente no encontrado
 */
router.get("/:id", verifyToken, authorizeRoles("pedagogico"), obtenerDocentePorId);

/**
 * @swagger
 * /api/docentes/{id}:
 *   put:
 *     summary: Actualizar docente
 *     tags: [Docentes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Id del docente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipoDocumento:
 *                 type: string
 *               numeroDocumento:
 *                 type: string
 *               nombres:
 *                 type: string
 *               apellidos:
 *                 type: string
 *               email:
 *                 type: string
 *               telefono:
 *                 type: string
 *               institucionId:
 *                 type: string
 *               proyectoId:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Docente actualizado correctamente
 *       404:
 *         description: Docente no encontrado
 */
router.put("/:id", verifyToken, authorizeRoles("pedagogico"), actualizarDocente);
/**
 * @swagger
 * /api/docentes:
 *   post:
 *     summary: Registrar docente
 *     tags: [Docentes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipoDocumento
 *               - numeroDocumento
 *               - nombres
 *               - apellidos
 *               - institucionId
 *               - proyectoId
 *             properties:
 *               tipoDocumento:
 *                 type: string
 *                 example: CC
 *               numeroDocumento:
 *                 type: string
 *                 example: 1012345678
 *               nombres:
 *                 type: string
 *                 example: Ana María
 *               apellidos:
 *                 type: string
 *                 example: Gómez Pérez
 *               email:
 *                 type: string
 *                 example: ana.gomez@example.com
 *               telefono:
 *                 type: string
 *                 example: 3001234567
 *               institucionId:
 *                 type: string
 *                 example: 69b0e565975a563e7f4451b3
 *               proyectoId:
 *                 type: string
 *                 example: 69b0d201860abd4c841905ff
 *     responses:
 *       201:
 *         description: Docente registrado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso no autorizado para este rol
 */
router.post("/", verifyToken, authorizeRoles("pedagogico"), crearDocente);

export default router;