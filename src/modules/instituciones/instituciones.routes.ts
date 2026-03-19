import { Router } from "express";
import { getInstituciones, createInstitucion } from "./instituciones.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

/**
 * @swagger
 * /api/instituciones:
 *   get:
 *     summary: Listar instituciones
 *     tags: [Instituciones]
 *     responses:
 *       200:
 *         description: Lista de instituciones obtenida correctamente
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso no autorizado para este rol
 */
router.get("/", verifyToken, authorizeRoles("director"), getInstituciones);

/**
 * @swagger
 * /api/instituciones:
 *   post:
 *     summary: Crear institución
 *     tags: [Instituciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - proyectoId
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Institución Educativa San José
 *               codigoDane:
 *                 type: string
 *                 example: 123456000001
 *               departamento:
 *                 type: string
 *                 example: Antioquia
 *               municipio:
 *                 type: string
 *                 example: Medellín
 *               zona:
 *                 type: string
 *                 enum: [urbana, rural]
 *                 example: urbana
 *               sector:
 *                 type: string
 *                 enum: [oficial, privado]
 *                 example: oficial
 *               proyectoId:
 *                 type: string
 *                 example: 69bd02d1860abd4c841905ff
 *     responses:
 *       201:
 *         description: Institución creada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token no proporcionado o inválido
 *       403:
 *         description: Acceso no autorizado para este rol
 */
router.post("/", verifyToken, authorizeRoles("director"), createInstitucion);

export default router;