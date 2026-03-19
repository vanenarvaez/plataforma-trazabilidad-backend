import { Request, Response } from "express";
import Institucion from "./models/institucion.model";

export const getInstituciones = async (_req: Request, res: Response) => {
  try {
    const instituciones = await Institucion.find()
      .populate("proyectoId", "nombre")
      .sort({ createdAt: -1 });

    res.status(200).json(instituciones);
  } catch (error) {
    res.status(500).json({
      message: "Error al listar instituciones",
      error,
    });
  }
};

export const createInstitucion = async (req: Request, res: Response) => {
  try {
    const {
      nombre,
      codigoDane,
      departamento,
      municipio,
      zona,
      sector,
      proyectoId,
    } = req.body;

    if (!nombre || !proyectoId) {
      return res.status(400).json({
        message: "El nombre y el proyectoId son obligatorios",
      });
    }

    const nuevaInstitucion = new Institucion({
      nombre,
      codigoDane,
      departamento,
      municipio,
      zona,
      sector,
      proyectoId,
    });

    await nuevaInstitucion.save();

    res.status(201).json({
      message: "Institución creada correctamente",
      institucion: nuevaInstitucion,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear institución",
      error,
    });
  }
};