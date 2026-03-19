import { Request, Response } from "express";
import Proyecto from "./models/proyecto.model";

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