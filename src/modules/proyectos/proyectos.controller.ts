import { Request, Response } from "express";
import Proyecto from "./models/proyecto.model";
import Curso from "../cursos/models/curso.model";
import ProyectoCurso from "../proyectoCursos/models/proyectoCurso.model";
import Institucion from "../instituciones/models/institucion.model";

export const getProyectos = async (_req: Request, res: Response) => {
  try {
    const proyectos = await Proyecto.find().sort({ createdAt: -1 });

    res.status(200).json(proyectos);
  } catch (error) {
    res.status(500).json({
      message: "Error al listar proyectos",
      error,
    });
  }
};

export const getProyectoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const proyecto = await Proyecto.findById(id);

    if (!proyecto) {
      return res.status(404).json({
        message: "Proyecto no encontrado",
      });
    }

    res.status(200).json(proyecto);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar el proyecto",
      error,
    });
  }
};

export const createProyecto = async (req: Request, res: Response) => {
  try {
    const {
      nombre,
      fuenteFinanciacion,
      cliente,
      fechaInicio,
      fechaFin,
      estado,
      cantidadMunicipios,
      cantidadIE,
      cantidadSedes,
      cantidadDocentes,
      cantidadEstudiantes,
    } = req.body;

    if (!nombre) {
      return res.status(400).json({
        message: "El nombre del proyecto es obligatorio",
      });
    }

    const nuevoProyecto = new Proyecto({
      nombre,
      fuenteFinanciacion,
      cliente,
      fechaInicio,
      fechaFin,
      estado,
      cantidadMunicipios,
      cantidadIE,
      cantidadSedes,
      cantidadDocentes,
      cantidadEstudiantes,
    });

    await nuevoProyecto.save();

    const cursos = await Curso.find();

    if (cursos.length > 0) {
      const relaciones = cursos.map((curso) => ({
        proyectoId: nuevoProyecto._id,
        cursoId: curso._id,
        activo: true,
      }));

      await ProyectoCurso.insertMany(relaciones, { ordered: false }).catch(
        () => undefined
      );
    }

    res.status(201).json({
      message: "Proyecto creado correctamente",
      proyecto: nuevoProyecto,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear proyecto",
      error,
    });
  }
};

export const updateProyecto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const proyectoActualizado = await Proyecto.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!proyectoActualizado) {
      return res.status(404).json({
        message: "Proyecto no encontrado",
      });
    }

    res.status(200).json({
      message: "Proyecto actualizado correctamente",
      proyecto: proyectoActualizado,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar el proyecto",
      error,
    });
  }
};

export const obtenerDetalleProyecto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const proyecto = await Proyecto.findById(id);

    if (!proyecto) {
      return res.status(404).json({
        message: "Proyecto no encontrado",
      });
    }

    const instituciones = await Institucion.find({
      proyectoId: id,
    });

    return res.status(200).json({
      proyecto,
      instituciones,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar detalle del proyecto",
      error,
    });
  }
};