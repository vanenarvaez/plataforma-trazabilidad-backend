import { Request, Response } from "express";
import Asistencia from "./models/asistencia.model";
import Docente from "../docentes/models/docente.model";
import ProyectoCurso from "../proyectoCursos/models/proyectoCurso.model";
import Curso from "../cursos/models/curso.model";


// Registrar asistencia
export const registrarAsistencia = async (req: Request, res: Response) => {
  try {
    const { proyectoCursoId, docenteId, moduloNumero, asistio } = req.body;

    // Validar campos obligatorios
    if (
      !proyectoCursoId ||
      !docenteId ||
      moduloNumero === undefined ||
      asistio === undefined
    ) {
      return res.status(400).json({
        message:
          "Los campos proyectoCursoId, docenteId, moduloNumero y asistio son obligatorios",
      });
    }

    // Validar que exista el docente
    const docenteExiste = await Docente.findById(docenteId);
    if (!docenteExiste) {
      return res.status(404).json({
        message: "El docente asociado no existe",
      });
    }

    // Validar que exista la relación proyecto-curso
    const proyectoCursoExiste = await ProyectoCurso.findById(proyectoCursoId);
    if (!proyectoCursoExiste) {
      return res.status(404).json({
        message: "La relación proyecto-curso no existe",
      });
    }

    // Validar que exista el curso relacionado
    const cursoExiste = await Curso.findById(proyectoCursoExiste.cursoId);
    if (!cursoExiste) {
      return res.status(404).json({
        message: "El curso asociado no existe",
      });
    }

    // Validar que el módulo exista dentro del curso
    if (moduloNumero < 1 || moduloNumero > cursoExiste.numeroModulos) {
      return res.status(400).json({
        message: `El módulo debe estar entre 1 y ${cursoExiste.numeroModulos}`,
      });
    }

    // Validar duplicado
    const asistenciaExistente = await Asistencia.findOne({
      proyectoCursoId,
      docenteId,
      moduloNumero,
    });

    if (asistenciaExistente) {
      return res.status(400).json({
        message:
          "Ya existe un registro de asistencia para este docente en ese módulo",
      });
    }

    const nuevaAsistencia = new Asistencia({
      proyectoCursoId,
      docenteId,
      moduloNumero,
      asistio,
    });

    const asistenciaGuardada = await nuevaAsistencia.save();

    res.status(201).json({
      message: "Asistencia registrada correctamente",
      asistencia: asistenciaGuardada,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar asistencia",
      error,
    });
  }
};

// Listar todas las asistencias
export const listarAsistencias = async (_req: Request, res: Response) => {
  try {
    const asistencias = await Asistencia.find()
      .populate("docenteId", "nombres apellidos numeroDocumento")
      .populate("proyectoCursoId");

    res.status(200).json(asistencias);
  } catch (error) {
    res.status(500).json({
      message: "Error al listar asistencias",
      error,
    });
  }
};

// Obtener asistencias por proyectoCursoId
export const obtenerAsistenciasPorProyectoCurso = async (
  req: Request,
  res: Response
) => {
  try {
    const { proyectoCursoId } = req.params;

    const asistencias = await Asistencia.find({ proyectoCursoId })
      .populate("docenteId", "nombres apellidos numeroDocumento")
      .populate("proyectoCursoId");

    res.status(200).json(asistencias);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar asistencias del proyectoCurso",
      error,
    });
  }
};