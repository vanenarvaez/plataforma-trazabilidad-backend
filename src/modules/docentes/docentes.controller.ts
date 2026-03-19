import { Request, Response } from "express";
import Docente from "./models/docente.model";

// Crear docente
export const crearDocente = async (req: Request, res: Response) => {
  try {
    const docente = new Docente(req.body);
    const docenteGuardado = await docente.save();

    res.status(201).json({
      message: "Docente registrado correctamente",
      docente: docenteGuardado,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar docente",
      error,
    });
  }
};

// Listar docentes
export const listarDocentes = async (_req: Request, res: Response) => {
  try {
    const docentes = await Docente.find()
      .populate("institucionId", "nombre")
      .populate("proyectoId", "nombre");

    res.status(200).json(docentes);
  } catch (error) {
    res.status(500).json({
      message: "Error al listar docentes",
      error,
    });
  }
};

// Consultar docente por id
export const obtenerDocentePorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const docente = await Docente.findById(id)
      .populate("institucionId", "nombre")
      .populate("proyectoId", "nombre");

    if (!docente) {
      return res.status(404).json({
        message: "Docente no encontrado",
      });
    }

    res.status(200).json(docente);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar docente",
      error,
    });
  }
};

// Actualizar docente
export const actualizarDocente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const docenteActualizado = await Docente.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
      runValidators: true,
    })
      .populate("institucionId", "nombre")
      .populate("proyectoId", "nombre");

    if (!docenteActualizado) {
      return res.status(404).json({
        message: "Docente no encontrado",
      });
    }

    res.status(200).json({
      message: "Docente actualizado correctamente",
      docente: docenteActualizado,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar docente",
      error,
    });
  }
};