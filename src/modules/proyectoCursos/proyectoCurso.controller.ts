import { Request, Response } from "express";
import ProyectoCurso from "./models/proyectoCurso.model";
import Proyecto from "../proyectos/models/proyecto.model";
import Curso from "../cursos/models/curso.model";

// Asociar curso a proyecto
export const asignarCursoAProyecto = async (req: Request, res: Response) => {
  try {
    const { proyectoId, cursoId } = req.body;

    // Validar campos obligatorios
    if (!proyectoId || !cursoId) {
      return res.status(400).json({
        message: "Los campos proyectoId y cursoId son obligatorios",
      });
    }

    // Validar que exista el proyecto
    const proyectoExiste = await Proyecto.findById(proyectoId);
    if (!proyectoExiste) {
      return res.status(404).json({
        message: "El proyecto asociado no existe",
      });
    }

    // Validar que exista el curso
    const cursoExiste = await Curso.findById(cursoId);
    if (!cursoExiste) {
      return res.status(404).json({
        message: "El curso asociado no existe",
      });
    }

    // Validar duplicados
    const existe = await ProyectoCurso.findOne({
      proyectoId,
      cursoId,
    });

    if (existe) {
      return res.status(400).json({
        message: "El curso ya está asignado a este proyecto",
      });
    }

    const nuevaRelacion = new ProyectoCurso({
      proyectoId,
      cursoId,
    });

    const guardado = await nuevaRelacion.save();

    res.status(201).json({
      message: "Curso asignado al proyecto correctamente",
      data: guardado,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al asignar curso al proyecto",
      error,
    });
  }
};

// Listar cursos por proyecto
export const obtenerCursosPorProyecto = async (req: Request, res: Response) => {
  try {
    const { proyectoId } = req.params;

    const cursos = await ProyectoCurso.find({ proyectoId })
      .populate("cursoId", "nombreCurso numeroModulos tipoFormacion")
      .populate("proyectoId", "nombre");

    res.status(200).json(cursos);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener cursos del proyecto",
      error,
    });
  }
};