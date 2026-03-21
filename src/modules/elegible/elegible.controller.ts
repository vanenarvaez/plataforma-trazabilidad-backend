import { Request, Response } from "express";
import Asistencia from "../asistencias/models/asistencia.model";
import ProyectoCurso from "../proyectoCursos/models/proyectoCurso.model";
import Curso from "../cursos/models/curso.model";
import Docente from "../docentes/models/docente.model";

export const validarElegibilidad = async (req: Request, res: Response) => {
  try {
    const { docenteId, proyectoCursoId } = req.params;

    // Validar que exista el docente
    const docente = await Docente.findById(docenteId);
    if (!docente) {
      return res.status(404).json({
        message: "Docente no encontrado",
      });
    }

    // Validar que exista la relación proyecto-curso
    const proyectoCurso = await ProyectoCurso.findById(proyectoCursoId);
    if (!proyectoCurso) {
      return res.status(404).json({
        message: "Relación proyecto-curso no encontrada",
      });
    }

    // Obtener el curso real
    const curso = await Curso.findById(proyectoCurso.cursoId);
    if (!curso) {
      return res.status(404).json({
        message: "Curso no encontrado",
      });
    }

    // Contar asistencias positivas del docente en ese proyectoCurso
    const asistencias = await Asistencia.find({
      docenteId,
      proyectoCursoId,
      asistio: true,
    });

    const totalAsistencias = asistencias.length;
    const totalModulos = curso.numeroModulos;

    const porcentajeAsistencia =
      totalModulos > 0 ? (totalAsistencias / totalModulos) * 100 : 0;

    const elegible = porcentajeAsistencia >= 80;

    res.status(200).json({
      docente: {
        id: docente._id,
        nombres: docente.nombres,
        apellidos: docente.apellidos,
        numeroDocumento: docente.numeroDocumento,
      },
      curso: {
        id: curso._id,
        nombreCurso: curso.nombreCurso,
        numeroModulos: curso.numeroModulos,
      },
      proyectoCursoId,
      totalAsistencias,
      totalModulos,
      porcentajeAsistencia: Number(porcentajeAsistencia.toFixed(2)),
      elegible,
      regla: "El docente es elegible con asistencia mayor o igual al 80%",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al validar elegibilidad",
      error,
    });
  }
};