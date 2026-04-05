import { Router } from "express";
import {
  obtenerIndicadoresPublicos,
  obtenerIndicadoresInternosPorProyecto,
  obtenerDashboardInterno,
} from "./indicadores.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

router.get("/publicos", obtenerIndicadoresPublicos);

router.get(
  "/internos/dashboard",
  verifyToken,
  authorizeRoles("admin", "director", "pedagogico", "formador", "comercial"),
  obtenerDashboardInterno
);

router.get(
  "/internos/proyecto/:proyectoId",
  verifyToken,
  authorizeRoles("admin", "director", "pedagogico"),
  obtenerIndicadoresInternosPorProyecto
);

export default router;