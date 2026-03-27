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

router.get(
  "/",
  verifyToken,
  authorizeRoles("pedagogico", "formador", "director"),
  listarDocentes
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("pedagogico", "formador", "director"),
  obtenerDocentePorId
);

router.put("/:id", verifyToken, authorizeRoles("pedagogico"), actualizarDocente);

router.post("/", verifyToken, authorizeRoles("pedagogico"), crearDocente);

export default router;