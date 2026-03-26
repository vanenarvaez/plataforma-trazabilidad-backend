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

    if (!encuestaId || !docenteId || !proyectoId || !respuestas) {
      return res.status(400).json({
        message: "encuestaId, docenteId, proyectoId y respuestas son obligatorios",
      });
    }

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

    if (respuestas.length !== encuesta.preguntas.length) {
      return res.status(400).json({
        message: "Debe responder todas las preguntas de la encuesta",
      });
    }

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
      .populate("encuestaId", "nombre codigo tipo")
      .sort({ createdAt: -1 });

    res.status(200).json(respuestas);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar respuestas",
      error,
    });
  }
};

// Listar respuestas por número de documento (ruta pública)
export const listarRespuestasPorDocumento = async (
  req: Request,
  res: Response
) => {
  try {
    const { numeroDocumento } = req.params;

    const docente = await Docente.findOne({ numeroDocumento });

    if (!docente) {
      return res.status(404).json({
        message: "Docente no encontrado",
      });
    }

    const respuestas = await RespuestaEncuesta.find({ docenteId: docente._id })
      .populate("encuestaId", "nombre codigo tipo")
      .sort({ createdAt: -1 });

    res.status(200).json(respuestas);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar respuestas por documento",
      error,
    });
  }
};

// Registrar respuesta encuesta pública
export const registrarRespuestaEncuestaPublica = async (
  req: Request,
  res: Response
) => {
  try {
    const { numeroDocumento, encuestaId, respuestas, observaciones } = req.body;

    if (!numeroDocumento || !encuestaId || !respuestas) {
      return res.status(400).json({
        message: "numeroDocumento, encuestaId y respuestas son obligatorios",
      });
    }

    const encuesta = await Encuesta.findById(encuestaId);
    if (!encuesta || !encuesta.activa) {
      return res.status(404).json({
        message: "Encuesta no encontrada o inactiva",
      });
    }

    const docente = await Docente.findOne({ numeroDocumento });
    if (!docente) {
      return res.status(404).json({
        message: "Docente no encontrado",
      });
    }

    if (respuestas.length !== encuesta.preguntas.length) {
      return res.status(400).json({
        message: "Debe responder todas las preguntas de la encuesta",
      });
    }

    const respuestaExistente = await RespuestaEncuesta.findOne({
      encuestaId,
      docenteId: docente._id,
      proyectoId: docente.proyectoId,
    });

    if (respuestaExistente) {
      return res.status(400).json({
        message: "Esta encuesta ya fue respondida por el docente",
      });
    }

    const nuevaRespuesta = new RespuestaEncuesta({
      encuestaId,
      docenteId: docente._id,
      proyectoId: docente.proyectoId,
      respuestas,
      observaciones:
        observaciones || "Encuesta diligenciada desde la vista pública",
      completada: true,
    });

    const respuestaGuardada = await nuevaRespuesta.save();

    res.status(201).json({
      message: "Encuesta respondida correctamente",
      respuesta: respuestaGuardada,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar respuesta pública de encuesta",
      error,
    });
  }
};

// Resumen de encuestas por proyecto
export const resumenEncuestasPorProyecto = async (
  req: Request,
  res: Response
) => {
  try {
    const { proyectoId } = req.params;

    const docentes = await Docente.find({ proyectoId }).select(
      "_id nombres apellidos numeroDocumento"
    );

    if (!docentes.length) {
      return res.status(200).json({
        proyectoId,
        totalDocentes: 0,
        respondieron: 0,
        faltan: 0,
        detalle: [],
      });
    }

    const docentesIds = docentes.map((d) => d._id);

    const respuestas = await RespuestaEncuesta.find({
      proyectoId,
      docenteId: { $in: docentesIds },
    }).populate("encuestaId", "nombre codigo tipo");

    const docentesConRespuesta = new Set(
      respuestas.map((r) => String(r.docenteId))
    );

    const detalle = docentes.map((docente) => {
      const respuestasDocente = respuestas.filter(
        (r) => String(r.docenteId) === String(docente._id)
      );

      return {
        docenteId: docente._id,
        nombres: docente.nombres,
        apellidos: docente.apellidos,
        numeroDocumento: docente.numeroDocumento,
        respondioEncuesta: respuestasDocente.length > 0,
        totalRespuestas: respuestasDocente.length,
        encuestas: respuestasDocente.map((r) => ({
          encuestaId: r.encuestaId?._id,
          nombreEncuesta: (r.encuestaId as any)?.nombre || "",
          tipoEncuesta: (r.encuestaId as any)?.tipo || "",
          fechaRespuesta: r.fechaRespuesta || r.createdAt,
        })),
      };
    });

    return res.status(200).json({
      proyectoId,
      totalDocentes: docentes.length,
      respondieron: docentesConRespuesta.size,
      faltan: docentes.length - docentesConRespuesta.size,
      detalle,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al consultar resumen de encuestas por proyecto",
      error,
    });
  }
};