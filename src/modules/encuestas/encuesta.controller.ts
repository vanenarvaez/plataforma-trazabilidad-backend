import { Request, Response } from "express";
import Encuesta from "./models/encuesta.model";

// Crear encuesta
export const crearEncuesta = async (req: Request, res: Response) => {
  try {
    const { codigo, nombre, tipo, preguntas } = req.body;

    if (!codigo || !nombre || !tipo || !preguntas || preguntas.length === 0) {
      return res.status(400).json({
        message: "Los campos codigo, nombre, tipo y preguntas son obligatorios",
      });
    }

    const encuestaExistente = await Encuesta.findOne({ codigo });
    if (encuestaExistente) {
      return res.status(400).json({
        message: "Ya existe una encuesta con ese código",
      });
    }

    const nuevaEncuesta = new Encuesta(req.body);
    const encuestaGuardada = await nuevaEncuesta.save();

    res.status(201).json({
      message: "Encuesta creada correctamente",
      encuesta: encuestaGuardada,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear encuesta",
      error,
    });
  }
};

// Listar encuestas
export const listarEncuestas = async (_req: Request, res: Response) => {
  try {
    const encuestas = await Encuesta.find().sort({ createdAt: -1 });

    res.status(200).json(encuestas);
  } catch (error) {
    res.status(500).json({
      message: "Error al listar encuestas",
      error,
    });
  }
};

// Consultar encuesta por id
export const obtenerEncuestaPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const encuesta = await Encuesta.findById(id);

    if (!encuesta) {
      return res.status(404).json({
        message: "Encuesta no encontrada",
      });
    }

    res.status(200).json(encuesta);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar encuesta",
      error,
    });
  }
};