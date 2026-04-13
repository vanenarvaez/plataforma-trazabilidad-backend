import { Router } from "express";
import {
  getInstituciones,
  getInstitucionById,
  createInstitucion,
  updateInstitucion,
  obtenerDetalleInstitucion,
  toggleInstitucion,
  deleteInstitucion,
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
  authorizeRoles("admin", "director", "pedagogico"),
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
  authorizeRoles("admin", "director", "pedagogico"),
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
  authorizeRoles("admin", "director", "pedagogico"),
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
  authorizeRoles("admin", "director", "pedagogico"),
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
  authorizeRoles("admin", "director", "pedagogico"),
  updateInstitucion
);

/**
 * @swagger
 * /api/instituciones/{id}/toggle:
 *   patch:
 *     summary: Activar o inactivar institución
 *     tags: [Instituciones]
 */
router.patch(
  "/:id/toggle",
  verifyToken,
  authorizeRoles("admin", "director", "pedagogico"),
  toggleInstitucion
);

/**
 * @swagger
 * /api/instituciones/{id}:
 *   delete:
 *     summary: Eliminar institución
 *     tags: [Instituciones]
 */
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  deleteInstitucion
);

export default router;