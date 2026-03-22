import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/users.routes";
import proyectosRoutes from "../modules/proyectos/proyectos.routes";
import institucionesRoutes from "../modules/instituciones/instituciones.routes";
import docentesRoutes from "../modules/docentes/docentes.routes";
import cursosRoutes from "../modules/cursos/cursos.routes";
import proyectoCursosRoutes from "../modules/proyectoCursos/proyectoCurso.routes";
import asistenciasRoutes from "../modules/asistencias/asistencias.routes";
import elegibleRoutes from "../modules/elegible/elegible.routes";
import certificadoRoutes from "../modules/certificados/certificado.routes";


const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/proyectos", proyectosRoutes);
router.use("/instituciones", institucionesRoutes);
router.use("/docentes", docentesRoutes);
router.use("/cursos", cursosRoutes);
router.use("/proyecto-cursos", proyectoCursosRoutes);
router.use("/asistencias", asistenciasRoutes);
router.use("/elegible", elegibleRoutes);
router.use("/certificados", certificadoRoutes);


export default router;