import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Docente from "../docentes/models/docente.model";
import Asistencia from "../asistencias/models/asistencia.model";
import ProyectoCurso from "../proyectoCursos/models/proyectoCurso.model";
import Curso from "../cursos/models/curso.model";
import Certificado from "./models/certificado.model";

export const generarCertificado = async (req: Request, res: Response) => {
  try {
    const docenteId = String(req.params.docenteId);
    const proyectoCursoId = String(req.params.proyectoCursoId);

    // 1. Buscar docente
    const docente = await Docente.findById(docenteId);
    if (!docente) {
      return res.status(404).json({
        message: "Docente no encontrado",
      });
    }

    // 2. Buscar relación proyecto-curso
    const proyectoCurso = await ProyectoCurso.findById(proyectoCursoId);
    if (!proyectoCurso) {
      return res.status(404).json({
        message: "La relación proyecto-curso no existe",
      });
    }

    // 3. Buscar curso
    const curso = await Curso.findById(proyectoCurso.cursoId);
    if (!curso) {
      return res.status(404).json({
        message: "Curso no encontrado",
      });
    }

    // 4. Buscar asistencias válidas del docente en ese proyectoCurso
    const asistencias = await Asistencia.find({
      docenteId,
      proyectoCursoId,
      asistio: true,
    });

    if (asistencias.length === 0) {
      return res.status(400).json({
        message: "El docente no tiene asistencias registradas para esta formación",
      });
    }

    // 5. Calcular porcentaje real
    const totalModulos = curso.numeroModulos;
    const totalAsistencias = asistencias.length;
    const porcentaje = (totalAsistencias / totalModulos) * 100;

    if (porcentaje < 80) {
      return res.status(400).json({
        message: "El docente no cumple con el porcentaje mínimo de asistencia",
      });
    }

    // 6. Preparar carpeta y archivo
    const nombreArchivo = `certificado-${docente.numeroDocumento}-${proyectoCursoId}.pdf`;
    const rutaCarpeta = path.join(__dirname, "../../../uploads/certificados");
    const rutaArchivo = path.join(rutaCarpeta, nombreArchivo);

    if (!fs.existsSync(rutaCarpeta)) {
      fs.mkdirSync(rutaCarpeta, { recursive: true });
    }

    // 7. Generar PDF
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(rutaArchivo);

    doc.pipe(stream);

    doc.fontSize(20).text("CERTIFICADO", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(
      `Se certifica que ${docente.nombres} ${docente.apellidos}, identificado(a) con documento número ${docente.numeroDocumento},`
    );

    doc.moveDown();

    doc.text(
      `ha cumplido satisfactoriamente con el ${porcentaje.toFixed(
        2
      )}% de asistencia en el curso "${curso.nombreCurso}".`
    );

    doc.moveDown();
    doc.text("Cumple con el criterio mínimo para certificación.", {
      align: "center",
    });

    doc.moveDown();
    doc.text("Aulas Amigas S.A.S.", { align: "center" });

    doc.end();

    stream.on("finish", async () => {
      try {
        const nombreCompleto = `${docente.nombres} ${docente.apellidos}`;

        const certificadoGuardado = await Certificado.create({
          docenteId: docente._id,
          proyectoCursoId: proyectoCurso._id,
          numeroDocumento: docente.numeroDocumento,
          nombreCompleto,
          nombreCurso: curso.nombreCurso,
          porcentajeAsistencia: Number(porcentaje.toFixed(2)),
          archivo: nombreArchivo,
          ruta: `/uploads/certificados/${nombreArchivo}`,
          estado: "generado",
        });

        return res.status(200).json({
          message: "Certificado generado correctamente",
          certificado: certificadoGuardado,
        });
      } catch (error) {
        return res.status(500).json({
          message:
            "Certificado generado, pero ocurrió un error al guardarlo en base de datos",
          error,
        });
      }
    });

    stream.on("error", (error) => {
      return res.status(500).json({
        message: "Error al guardar el certificado",
        error,
      });
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al generar certificado",
      error,
    });
  }
};

export const consultarCertificadoPorDocumento = async (
  req: Request,
  res: Response
) => {
  try {
    const numeroDocumento = String(req.params.numeroDocumento);

    const certificados = await Certificado.find({ numeroDocumento }).sort({
      createdAt: -1,
    });

    if (certificados.length === 0) {
      return res.status(404).json({
        message: "No se encontraron certificados para este documento",
      });
    }

    return res.status(200).json(certificados);
  } catch (error) {
    return res.status(500).json({
      message: "Error al consultar certificados",
      error,
    });
  }
};