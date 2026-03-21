import { Request, Response } from "express";
import Docente from "./models/docente.model";
import Institucion from "../instituciones/models/institucion.model";
import Proyecto from "../proyectos/models/proyecto.model";

// Crear docente
export const crearDocente = async (req: Request, res: Response) => {
  try {
    const {
      tipoDocumento,
      numeroDocumento,
      nombres,
      apellidos,
      email,
      telefono,
      institucionId,
      proyectoId,
      activo,
    } = req.body;

    // Validar campos obligatorios
    if (
      !tipoDocumento ||
      !numeroDocumento ||
      !nombres ||
      !apellidos ||
      !institucionId ||
      !proyectoId
    ) {
      return res.status(400).json({
        message:
          "Los campos tipoDocumento, numeroDocumento, nombres, apellidos, institucionId y proyectoId son obligatorios",
      });
    }

    // Validar que no exista otro docente con el mismo número de documento
    const docenteExistente = await Docente.findOne({ numeroDocumento });
    if (docenteExistente) {
      return res.status(400).json({
        message: "Ya existe un docente con ese número de documento",
      });
    }

    // Validar que exista la institución
    const institucionExiste = await Institucion.findById(institucionId);
    if (!institucionExiste) {
      return res.status(404).json({
        message: "La institución asociada no existe",
      });
    }

    // Validar que exista el proyecto
    const proyectoExiste = await Proyecto.findById(proyectoId);
    if (!proyectoExiste) {
      return res.status(404).json({
        message: "El proyecto asociado no existe",
      });
    }

    const docente = new Docente({
      tipoDocumento,
      numeroDocumento,
      nombres,
      apellidos,
      email,
      telefono,
      institucionId,
      proyectoId,
      activo,
    });

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