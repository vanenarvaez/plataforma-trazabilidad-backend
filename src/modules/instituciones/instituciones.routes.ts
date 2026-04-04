import { Router } from "express";
import {
  getInstituciones,
  getInstitucionById,
  createInstitucion,
  updateInstitucion,
  obtenerDetalleInstitucion,
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
 */
router.get(
  "/",
  verifyToken,
  authorizeRoles("director"),
  getInstituciones
);

/**
 * @swagger
 * /api/instituciones/{id}/detalle:
 *   get:
 *     summary: Obtener detalle de institución con docentes
 *     tags: [Instituciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle de institución con docentes
 *       404:
 *         description: Institución no encontrada
 */
router.get(
  "/:id/detalle",
  verifyToken,
  authorizeRoles("director"),
  obtenerDetalleInstitucion
);

/**
 * @swagger
 * /api/instituciones/{id}:
 *   get:
 *     summary: Consultar institución por id
 *     tags: [Instituciones]
 */
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("director"),
  getInstitucionById
);

/**
 * @swagger
 * /api/instituciones:
 *   post:
 *     summary: Crear institución
 *     tags: [Instituciones]
 */
router.post(
  "/",
  verifyToken,
  authorizeRoles("director"),
  createInstitucion
);

/**
 * @swagger
 * /api/instituciones/{id}:
 *   put:
 *     summary: Actualizar institución
 *     tags: [Instituciones]
 */
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("director"),
  updateInstitucion
);

export default router;