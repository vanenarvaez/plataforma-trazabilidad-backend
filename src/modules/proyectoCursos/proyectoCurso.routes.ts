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
  authorizeRoles("pedagogico", "formador", "director"),
  listarRelacionesProyectoCurso
);

router.get(
  "/:proyectoId",
  verifyToken,
  authorizeRoles("pedagogico", "formador", "director"),
  obtenerCursosPorProyecto
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("pedagogico", "director"),
  asignarCursoAProyecto
);

router.patch(
  "/:id/estado",
  verifyToken,
  authorizeRoles("pedagogico", "director"),
  actualizarEstadoProyectoCurso
);

export default router;