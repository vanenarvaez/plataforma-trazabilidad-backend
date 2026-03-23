import { Request, Response } from "express";
import RespuestaEncuesta from "./models/respuestaEncuesta.model";
import Encuesta from "../encuestas/models/encuesta.model";
import Docente from "../docentes/models/docente.model";
import Proyecto from "../proyectos/models/proyecto.model";
import ProyectoCurso from "../proyectoCursos/models/proyectoCurso.model";

// Registrar respuestas
export const registrarRespuestaEncuesta = async (req: Request, res: Response) => {
  try {
    const { encuestaId, docenteId, proyectoId, proyectoCursoId, respuestas } =
      req.body;

    // 1. Validaciones básicas
    if (!encuestaId || !docenteId || !proyectoId || !respuestas) {
      return res.status(400).json({
        message: "encuestaId, docenteId, proyectoId y respuestas son obligatorios",
      });
    }

    // 2. Validar existencia de entidades
    const encuesta = await Encuesta.findById(encuestaId);
    if (!encuesta) {
      return res.status(404).json({ message: "Encuesta no encontrada" });
    }

    const docente = await Docente.findById(docenteId);
    if (!docente) {
      return res.status(404).json({ message: "Docente no encontrado" });
    }

    const proyecto = await Proyecto.findById(proyectoId);
    if (!proyecto) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    if (proyectoCursoId) {
      const proyectoCurso = await ProyectoCurso.findById(proyectoCursoId);
      if (!proyectoCurso) {
        return res.status(404).json({
          message: "ProyectoCurso no encontrado",
        });
      }
    }

    // 3. Validar cantidad de respuestas
    if (respuestas.length !== encuesta.preguntas.length) {
      return res.status(400).json({
        message: "Debe responder todas las preguntas de la encuesta",
      });
    }

    // 4. Guardar respuestas
    const nuevaRespuesta = new RespuestaEncuesta({
      encuestaId,
      docenteId,
      proyectoId,
      proyectoCursoId,
      respuestas,
      completada: true,
    });

    const respuestaGuardada = await nuevaRespuesta.save();

    res.status(201).json({
      message: "Respuestas registradas correctamente",
      respuesta: respuestaGuardada,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar respuestas",
      error,
    });
  }
};

// Listar respuestas por docente
export const listarRespuestasPorDocente = async (req: Request, res: Response) => {
  try {
    const { docenteId } = req.params;

    const respuestas = await RespuestaEncuesta.find({ docenteId })
      .populate("encuestaId", "nombre")
      .sort({ createdAt: -1 });

    res.status(200).json(respuestas);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar respuestas",
      error,
    });
  }
};