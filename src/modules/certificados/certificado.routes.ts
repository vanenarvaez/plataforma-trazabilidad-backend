import { Router } from "express";
import {
  generarCertificado,
  consultarCertificadoPorDocumento,
  listarCertificadosElegiblesPorDocumento,
  generarCertificadoPublico,
} from "./certificado.controller";
import { verifyToken } from "../../middlewares/auth.middleware";

const router = Router();

// Consulta certificados ya guardados por documento
router.get("/consultar/:numeroDocumento", consultarCertificadoPorDocumento);

// Lista certificados elegibles por documento (público)
router.get("/elegibles/:numeroDocumento", listarCertificadosElegiblesPorDocumento);

// Genera certificado público por documento y proyectoCurso
router.get("/publico/:numeroDocumento/:proyectoCursoId", generarCertificadoPublico);

// Generación protegida desde módulos internos
router.get("/:docenteId/:proyectoCursoId", verifyToken, generarCertificado);

export default router;