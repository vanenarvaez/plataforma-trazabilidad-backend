import { Router } from "express";
import {
  getProyectos,
  getProyectoById,
  createProyecto,
  updateProyecto,
} from "./proyectos.controller";
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
 * /api/proyectos/{id}:
 *   get:
 *     summary: Consultar proyecto por id
 *     tags: [Proyectos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Id del proyecto
 *     responses:
 *       200:
 *         description: Proyecto encontrado correctamente
 *       404:
 *         description: Proyecto no encontrado
 */
router.get("/:id", verifyToken, authorizeRoles("director"), getProyectoById);

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

/**
 * @swagger
 * /api/proyectos/{id}:
 *   put:
 *     summary: Actualizar proyecto
 *     tags: [Proyectos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Id del proyecto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               fuenteFinanciacion:
 *                 type: string
 *               cliente:
 *                 type: string
 *               fechaInicio:
 *                 type: string
 *                 format: date
 *               fechaFin:
 *                 type: string
 *                 format: date
 *               estado:
 *                 type: string
 *                 enum: [planeacion, ejecucion, finalizado]
 *               cantidadMunicipios:
 *                 type: number
 *               cantidadIE:
 *                 type: number
 *               cantidadSedes:
 *                 type: number
 *               cantidadDocentes:
 *                 type: number
 *               cantidadEstudiantes:
 *                 type: number
 *     responses:
 *       200:
 *         description: Proyecto actualizado correctamente
 *       404:
 *         description: Proyecto no encontrado
 */
router.put("/:id", verifyToken, authorizeRoles("director"), updateProyecto);

export default router;