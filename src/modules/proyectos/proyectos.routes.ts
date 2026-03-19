import { Router } from "express";
import { getProyectos, createProyecto } from "./proyectos.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

/**
 * @swagger
 * /api/proyectos:
 *   get:
 *     summary: Listar proyectos
 *     tags: [Proyectos]
 *     responses:
 *       200:
 *         description: Lista de proyectos obtenida correctamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso no autorizado para este rol
 */
router.get("/", verifyToken, authorizeRoles("director"), getProyectos);

/**
 * @swagger
 * /api/proyectos:
 *   post:
 *     summary: Crear proyecto
 *     tags: [Proyectos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Proyecto Apropiación Digital 2026
 *               fuenteFinanciacion:
 *                 type: string
 *                 example: Obras por Impuestos
 *               cliente:
 *                 type: string
 *                 example: Alcaldía de Medellín
 *               fechaInicio:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-10
 *               fechaFin:
 *                 type: string
 *                 format: date
 *                 example: 2026-12-15
 *               estado:
 *                 type: string
 *                 enum: [planeacion, ejecucion, finalizado]
 *                 example: planeacion
 *               cantidadMunicipios:
 *                 type: number
 *                 example: 5
 *               cantidadIE:
 *                 type: number
 *                 example: 12
 *               cantidadSedes:
 *                 type: number
 *                 example: 20
 *               cantidadDocentes:
 *                 type: number
 *                 example: 300
 *               cantidadEstudiantes:
 *                 type: number
 *                 example: 4500
 *     responses:
 *       201:
 *         description: Proyecto creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso no autorizado para este rol
 */
router.post("/", verifyToken, authorizeRoles("director"), createProyecto);

export default router;