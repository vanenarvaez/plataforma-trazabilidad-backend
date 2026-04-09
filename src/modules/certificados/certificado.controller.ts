import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import Docente from "../docentes/models/docente.model";
import Asistencia from "../asistencias/models/asistencia.model";
import ProyectoCurso from "../proyectoCursos/models/proyectoCurso.model";
import Certificado from "./models/certificado.model";

function obtenerFechaCertificado(asistencias: any[]) {
  const asistenciasValidas = asistencias.filter((a) => a.asistio);

  if (!asistenciasValidas.length) {
    return new Date();
  }

  const ultima = asistenciasValidas.sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  return new Date(ultima.createdAt);
}

function formatearPartesFecha(fecha: Date) {
  const dia = fecha.getDate();
  const mes = fecha.toLocaleString("es-CO", { month: "long" });
  const anio = fecha.getFullYear();

  return { dia, mes, anio };
}

async function construirElegibilidadPorDocumento(numeroDocumento: string) {
  const docente: any = await Docente.findOne({ numeroDocumento });

  if (!docente) {
    return {
      docente: null,
      elegibles: [],
    };
  }

  const relaciones: any[] = await ProyectoCurso.find({
    activo: { $ne: false },
  })
    .populate("cursoId")
    .populate("proyectoId");

  const elegibles = [];

  for (const relacion of relaciones) {
    const curso: any = relacion.cursoId;
    if (!curso) continue;

    const asistencias = await Asistencia.find({
      docenteId: docente._id,
      proyectoCursoId: relacion._id,
      asistio: true,
    });

    const totalModulos = Number(curso.numeroModulos || 0);
    const totalAsistencias = asistencias.length;
    const porcentajeAsistencia =
      totalModulos > 0 ? (totalAsistencias / totalModulos) * 100 : 0;

    if (porcentajeAsistencia >= 80) {
      const fechaCertificado = obtenerFechaCertificado(asistencias);

      elegibles.push({
        docenteId: docente._id,
        proyectoCursoId: relacion._id,
        proyectoId: relacion.proyectoId?._id || null,
        proyectoNombre: relacion.proyectoId?.nombre || "",
        cursoId: curso._id,
        nombreCurso: curso.nombreCurso || "",
        duracionHoras: Number(curso.duracionHoras || 0),
        porcentajeAsistencia: Number(porcentajeAsistencia.toFixed(2)),
        fechaCertificado,
      });
    }
  }

  return {
    docente,
    elegibles,
  };
}

function generarPdfCertificado(
  res: Response,
  data: {
    nombreCompleto: string;
    numeroDocumento: string;
    nombreCurso: string;
    duracionHoras: number;
    fecha: Date;
  }
) {
  const { dia, mes, anio } = formatearPartesFecha(data.fecha);

  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 0,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=certificado_${data.numeroDocumento}.pdf`
  );

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  const outerX = 20;
  const outerY = 20;
  const outerW = pageWidth - 40;
  const outerH = pageHeight - 40;

  const innerX = 30;
  const innerY = 30;
  const innerW = pageWidth - 60;
  const innerH = pageHeight - 60;

  // Bordes
  doc
    .lineWidth(1.5)
    .strokeColor("#462cb9")
    .rect(outerX, outerY, outerW, outerH)
    .stroke();

  doc
    .lineWidth(0.8)
    .strokeColor("#9e19db")
    .rect(innerX, innerY, innerW, innerH)
    .stroke();

  // Logo superior derecho dentro del margen interno
  const posiblesLogos = [
    path.join(__dirname, "../../../src/frontend/images/logo4rosado.png"),
    path.join(__dirname, "../../../src/frontend/images/logo2azul.png"),
    path.join(__dirname, "../../../src/frontend/images/logo1morado.png"),
  ];

  const logoPath = posiblesLogos.find((ruta) => fs.existsSync(ruta));

  if (logoPath) {
    try {
      doc.image(logoPath, innerX + innerW - 120, innerY + 12, {
        fit: [90, 45],
        align: "right",
        valign: "top",
      });
    } catch {}
  }

  // Área útil centrada
  const contentX = innerX + 35;
  const contentW = innerW - 70;

  // Título un poco más abajo
  doc
    .font("Helvetica-Bold")
    .fontSize(25)
    .fillColor("#1f1b4d")
    .text("CERTIFICADO DE APROBACIÓN", contentX, 72, {
      width: contentW,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(17)
    .fillColor("#1f1b4d")
    .text("Aulas Amigas certifica que", contentX, 130, {
      width: contentW,
      align: "center",
    });

  // Nombre
  doc
    .font("Helvetica-Bold")
    .fontSize(21)
    .fillColor("#462cb9")
    .text(data.nombreCompleto, contentX, 170, {
      width: contentW,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(15)
    .fillColor("#1f1b4d")
    .text("Identificado(a) con documento de identidad No.", contentX, 228, {
      width: contentW,
      align: "center",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor("#1f1b4d")
    .text(data.numeroDocumento, contentX, 253, {
      width: contentW,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(15)
    .fillColor("#1f1b4d")
    .text("Culminó satisfactoriamente el curso de", contentX, 304, {
      width: contentW,
      align: "center",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(19)
    .fillColor("#462cb9")
    .text(data.nombreCurso, contentX, 332, {
      width: contentW,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(15)
    .fillColor("#1f1b4d")
    .text(`Con una intensidad de ${data.duracionHoras} horas.`, contentX, 385, {
      width: contentW,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(14)
    .fillColor("#1f1b4d")
    .text(
      `El presente certificado se expide en la ciudad de Medellín, a los ${dia} días del mes de ${mes} de ${anio}.`,
      contentX,
      430,
      {
        width: contentW,
        align: "center",
      }
    );

  // Pie en una sola línea visual
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#462cb9")
    .text("Aulas Amigas", contentX, 490, {
      width: contentW,
      align: "center",
    });

  doc
    .font("Helvetica-Oblique")
    .fontSize(12)
    .fillColor("#1f1b4d")
    .text("#Maestros que inspiran", contentX, 510, {
      width: contentW,
      align: "center",
    });

  doc.end();
}

export const generarCertificado = async (req: Request, res: Response) => {
  try {
    const docenteId = String(req.params.docenteId);
    const proyectoCursoId = String(req.params.proyectoCursoId);

    const docente: any = await Docente.findById(docenteId);
    if (!docente) {
      return res.status(404).json({
        message: "Docente no encontrado",
      });
    }

    const proyectoCurso: any = await ProyectoCurso.findById(proyectoCursoId)
      .populate("cursoId")
      .populate("proyectoId");

    if (!proyectoCurso) {
      return res.status(404).json({
        message: "La relación proyecto-curso no existe",
      });
    }

    const curso: any = proyectoCurso.cursoId;
    if (!curso) {
      return res.status(404).json({
        message: "Curso no encontrado",
      });
    }

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

    const totalModulos = Number(curso.numeroModulos || 0);
    const totalAsistencias = asistencias.length;
    const porcentaje =
      totalModulos > 0 ? (totalAsistencias / totalModulos) * 100 : 0;

    if (porcentaje < 80) {
      return res.status(400).json({
        message: "El docente no cumple con el porcentaje mínimo de asistencia",
      });
    }

    const fecha = obtenerFechaCertificado(asistencias);

    generarPdfCertificado(res, {
      nombreCompleto: `${docente.nombres} ${docente.apellidos}`.trim(),
      numeroDocumento: docente.numeroDocumento,
      nombreCurso: curso.nombreCurso || "",
      duracionHoras: Number(curso.duracionHoras || 0),
      fecha,
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
      return res.status(200).json([]);
    }

    return res.status(200).json(certificados);
  } catch (error) {
    return res.status(500).json({
      message: "Error al consultar certificados",
      error,
    });
  }
};

export const listarCertificadosElegiblesPorDocumento = async (
  req: Request,
  res: Response
) => {
  try {
    const numeroDocumento = String(req.params.numeroDocumento);

    const { docente, elegibles } = await construirElegibilidadPorDocumento(
      numeroDocumento
    );

    if (!docente) {
      return res.status(404).json({
        message: "Docente no encontrado",
      });
    }

    return res.status(200).json({
      docente: {
        id: docente._id,
        nombres: docente.nombres,
        apellidos: docente.apellidos,
        numeroDocumento: docente.numeroDocumento,
      },
      certificados: elegibles,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al consultar certificados elegibles",
      error,
    });
  }
};

export const generarCertificadoPublico = async (
  req: Request,
  res: Response
) => {
  try {
    const numeroDocumento = String(req.params.numeroDocumento);
    const proyectoCursoId = String(req.params.proyectoCursoId);

    const { docente, elegibles } = await construirElegibilidadPorDocumento(
      numeroDocumento
    );

    if (!docente) {
      return res.status(404).json({
        message: "Docente no encontrado",
      });
    }

    const certificadoElegible = elegibles.find(
      (item) => String(item.proyectoCursoId) === String(proyectoCursoId)
    );

    if (!certificadoElegible) {
      return res.status(400).json({
        message: "No existe un certificado elegible para ese curso",
      });
    }

    generarPdfCertificado(res, {
      nombreCompleto: `${docente.nombres} ${docente.apellidos}`.trim(),
      numeroDocumento: docente.numeroDocumento,
      nombreCurso: certificadoElegible.nombreCurso,
      duracionHoras: certificadoElegible.duracionHoras,
      fecha: new Date(certificadoElegible.fechaCertificado),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al generar certificado público",
      error,
    });
  }
};