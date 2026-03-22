import { Router } from "express";
import {
  getInstituciones,
  getInstitucionById,
  createInstitucion,
  updateInstitucion,
} from "./instituciones.controller";
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
 * /api/instituciones/{id}:
 *   get:
 *     summary: Consultar institución por id
 *     tags: [Instituciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Id de la institución
 *     responses:
 *       200:
 *         description: Institución encontrada correctamente
 *       404:
 *         description: Institución no encontrada
 */
router.get("/:id", verifyToken, authorizeRoles("director"), getInstitucionById);

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
 *                 example: 69b0d201860abd4c841905ff
 *     responses:
 *       201:
 *         description: Institución creada correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: El proyecto asociado no existe
 */
router.post("/", verifyToken, authorizeRoles("director"), createInstitucion);

/**
 * @swagger
 * /api/instituciones/{id}:
 *   put:
 *     summary: Actualizar institución
 *     tags: [Instituciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Id de la institución
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               codigoDane:
 *                 type: string
 *               departamento:
 *                 type: string
 *               municipio:
 *                 type: string
 *               zona:
 *                 type: string
 *                 enum: [urbana, rural]
 *               sector:
 *                 type: string
 *                 enum: [oficial, privado]
 *               proyectoId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Institución actualizada correctamente
 *       404:
 *         description: Institución no encontrada o proyecto no existe
 */
router.put("/:id", verifyToken, authorizeRoles("director"), updateInstitucion);

export default router;