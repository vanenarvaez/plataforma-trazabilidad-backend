import { Router } from "express";
import {
  asignarCursoAProyecto,
  obtenerCursosPorProyecto,
  listarRelacionesProyectoCurso,
  actualizarEstadoProyectoCurso,
} from "./proyectoCurso.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "pedagogico", "formador", "director"),
  listarRelacionesProyectoCurso
);

router.get(
  "/:proyectoId",
  verifyToken,
  authorizeRoles("admin", "pedagogico", "formador", "director"),
  obtenerCursosPorProyecto
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "pedagogico", "director"),
  asignarCursoAProyecto
);

router.patch(
  "/:id/estado",
  verifyToken,
  authorizeRoles("admin", "pedagogico", "director"),
  actualizarEstadoProyectoCurso
);

export default router;