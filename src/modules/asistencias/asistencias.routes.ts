import { Router } from "express";
import {
  registrarAsistencia,
  listarAsistencias,
  obtenerAsistenciasPorProyectoCurso,
  obtenerConsolidadoAsistencias,
} from "./asistencia.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

router.get(
  "/consolidado",
  verifyToken,
  authorizeRoles("formador", "pedagogico", "director"),
  obtenerConsolidadoAsistencias
);

router.get(
  "/",
  verifyToken,
  authorizeRoles("formador", "pedagogico", "director"),
  listarAsistencias
);

router.get(
  "/:proyectoCursoId",
  verifyToken,
  authorizeRoles("formador", "pedagogico", "director"),
  obtenerAsistenciasPorProyectoCurso
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("formador", "pedagogico", "director"),
  registrarAsistencia
);

export default router;