import { Request, Response } from "express";
import ProyectoCurso from "./models/proyectoCurso.model";

// Asociar curso a proyecto
export const asignarCursoAProyecto = async (req: Request, res: Response) => {
  try {
    const { proyectoId, cursoId } = req.body;

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