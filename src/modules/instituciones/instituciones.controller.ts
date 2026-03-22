import { Request, Response } from "express";
import Institucion from "./models/institucion.model";
import Proyecto from "../proyectos/models/proyecto.model";

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

export const getInstitucionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const institucion = await Institucion.findById(id).populate(
      "proyectoId",
      "nombre"
    );

    if (!institucion) {
      return res.status(404).json({
        message: "Institución no encontrada",
      });
    }

    res.status(200).json(institucion);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar la institución",
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

    const proyectoExiste = await Proyecto.findById(proyectoId);
    if (!proyectoExiste) {
      return res.status(404).json({
        message: "El proyecto asociado no existe",
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

export const updateInstitucion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { proyectoId } = req.body;

    if (proyectoId) {
      const proyectoExiste = await Proyecto.findById(proyectoId);
      if (!proyectoExiste) {
        return res.status(404).json({
          message: "El proyecto asociado no existe",
        });
      }
    }

    const institucionActualizada = await Institucion.findByIdAndUpdate(
      id,
      req.body,
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).populate("proyectoId", "nombre");

    if (!institucionActualizada) {
      return res.status(404).json({
        message: "Institución no encontrada",
      });
    }

    res.status(200).json({
      message: "Institución actualizada correctamente",
      institucion: institucionActualizada,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar la institución",
      error,
    });
  }
};