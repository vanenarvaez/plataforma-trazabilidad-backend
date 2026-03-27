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

router.get(
  "/",
  verifyToken,
  authorizeRoles("pedagogico", "formador", "director"),
  listarCursos
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("pedagogico", "formador", "director"),
  obtenerCursoPorId
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("pedagogico", "director"),
  crearCurso
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("pedagogico", "director"),
  actualizarCurso
);

export default router;