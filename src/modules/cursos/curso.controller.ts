import { Request, Response } from "express";
import Curso from "./models/curso.model";
import Proyecto from "../proyectos/models/proyecto.model";
import ProyectoCurso from "../proyectoCursos/models/proyectoCurso.model";

// Crear curso
export const crearCurso = async (req: Request, res: Response) => {
  try {
    const curso = new Curso(req.body);
    const cursoGuardado = await curso.save();

    const proyectos = await Proyecto.find();

    if (proyectos.length > 0) {
      const relaciones = proyectos.map((proyecto) => ({
        proyectoId: proyecto._id,
        cursoId: cursoGuardado._id,
        activo: true,
      }));

      await ProyectoCurso.insertMany(relaciones, { ordered: false }).catch(
        () => undefined
      );
    }

    res.status(201).json({
      message: "Curso registrado correctamente",
      curso: cursoGuardado,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar curso",
      error,
    });
  }
};

// Listar cursos
export const listarCursos = async (_req: Request, res: Response) => {
  try {
    const cursos = await Curso.find().sort({ createdAt: -1 });

    res.status(200).json(cursos);
  } catch (error) {
    res.status(500).json({
      message: "Error al listar cursos",
      error,
    });
  }
};

// Consultar curso por id
export const obtenerCursoPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const curso = await Curso.findById(id);

    if (!curso) {
      return res.status(404).json({
        message: "Curso no encontrado",
      });
    }

    res.status(200).json(curso);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar curso",
      error,
    });
  }
};

// Actualizar curso
export const actualizarCurso = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cursoActualizado = await Curso.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!cursoActualizado) {
      return res.status(404).json({
        message: "Curso no encontrado",
      });
    }

    res.status(200).json({
      message: "Curso actualizado correctamente",
      curso: cursoActualizado,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar curso",
      error,
    });
  }
};