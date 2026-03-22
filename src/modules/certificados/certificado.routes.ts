import { Router } from "express";
import {
  generarCertificado,
  consultarCertificadoPorDocumento,
} from "./certificado.controller";
import { verifyToken } from "../../middlewares/auth.middleware";

const router = Router();

// Consulta por documento
router.get("/consultar/:numeroDocumento", consultarCertificadoPorDocumento);

// Generación de certificado
router.get("/:docenteId/:proyectoCursoId", verifyToken, generarCertificado);

export default router;