import { Router } from "express";
import {
  crearDocente,
  listarDocentes,
  obtenerDocentePorId,
  actualizarDocente,
  obtenerFichaDocente,
  toggleDocente,
  deleteDocente,
} from "./docentes.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "pedagogico", "formador", "director"),
  listarDocentes
);

router.get(
  "/:id/ficha",
  verifyToken,
  authorizeRoles("admin", "pedagogico", "formador", "director"),
  obtenerFichaDocente
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "pedagogico", "formador", "director"),
  obtenerDocentePorId
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "pedagogico", "director"),
  actualizarDocente
);

router.patch(
  "/:id/toggle",
  verifyToken,
  authorizeRoles("admin", "pedagogico", "director"),
  toggleDocente
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  deleteDocente
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "pedagogico", "director"),
  crearDocente
);

export default router;