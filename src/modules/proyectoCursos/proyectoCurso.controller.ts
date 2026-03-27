import { Request, Response } from "express";
import ProyectoCurso from "./models/proyectoCurso.model";
import Proyecto from "../proyectos/models/proyecto.model";
import Curso from "../cursos/models/curso.model";

// Asociar curso a proyecto
export const asignarCursoAProyecto = async (req: Request, res: Response) => {
  try {
    const { proyectoId, cursoId, activo } = req.body;

    if (!proyectoId || !cursoId) {
      return res.status(400).json({
        message: "Los campos proyectoId y cursoId son obligatorios",
      });
    }

    const proyectoExiste = await Proyecto.findById(proyectoId);
    if (!proyectoExiste) {
      return res.status(404).json({
        message: "El proyecto asociado no existe",
      });
    }

    const cursoExiste = await Curso.findById(cursoId);
    if (!cursoExiste) {
      return res.status(404).json({
        message: "El curso asociado no existe",
      });
    }

    const existente = await ProyectoCurso.findOne({
      proyectoId,
      cursoId,
    });

    if (existente) {
      existente.activo =
        typeof activo === "boolean" ? activo : existente.activo !== false;
      await existente.save();

      return res.status(200).json({
        message: "La relación proyecto-curso ya existía y fue actualizada",
        data: existente,
      });
    }

    const nuevaRelacion = new ProyectoCurso({
      proyectoId,
      cursoId,
      activo: typeof activo === "boolean" ? activo : true,
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

// Listar relaciones proyecto-curso
export const listarRelacionesProyectoCurso = async (
  req: Request,
  res: Response
) => {
  try {
    const { proyectoId, cursoId, activo } = req.query;

    const filtro: any = {};

    if (proyectoId) {
      filtro.proyectoId = proyectoId;
    }

    if (cursoId) {
      filtro.cursoId = cursoId;
    }

    // Importante:
    // activo=true debe incluir relaciones viejas que no tengan el campo
    if (activo !== undefined) {
      const valorActivo = String(activo) === "true";

      if (valorActivo) {
        filtro.$or = [{ activo: true }, { activo: { $exists: false } }];
      } else {
        filtro.activo = false;
      }
    }

    const relaciones = await ProyectoCurso.find(filtro)
      .populate("proyectoId", "nombre")
      .populate("cursoId", "nombreCurso numeroModulos tipoFormacion activo")
      .sort({ createdAt: -1 });

    res.status(200).json(relaciones);
  } catch (error) {
    res.status(500).json({
      message: "Error al listar relaciones proyecto-curso",
      error,
    });
  }
};

// Listar cursos por proyecto
export const obtenerCursosPorProyecto = async (req: Request, res: Response) => {
  try {
    const { proyectoId } = req.params;
    const { activo } = req.query;

    const filtro: any = { proyectoId };

    if (activo !== undefined) {
      const valorActivo = String(activo) === "true";

      if (valorActivo) {
        filtro.$or = [{ activo: true }, { activo: { $exists: false } }];
      } else {
        filtro.activo = false;
      }
    }

    const cursos = await ProyectoCurso.find(filtro)
      .populate("cursoId", "nombreCurso numeroModulos tipoFormacion activo")
      .populate("proyectoId", "nombre")
      .sort({ createdAt: -1 });

    res.status(200).json(cursos);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener cursos del proyecto",
      error,
    });
  }
};

// Cambiar estado de relación
export const actualizarEstadoProyectoCurso = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== "boolean") {
      return res.status(400).json({
        message: "El campo activo es obligatorio y debe ser booleano",
      });
    }

    const relacion = await ProyectoCurso.findByIdAndUpdate(
      id,
      { activo },
      {
        returnDocument: "after",
        runValidators: true,
      }
    )
      .populate("proyectoId", "nombre")
      .populate("cursoId", "nombreCurso numeroModulos tipoFormacion activo");

    if (!relacion) {
      return res.status(404).json({
        message: "Relación proyecto-curso no encontrada",
      });
    }

    res.status(200).json({
      message: "Estado de la relación actualizado correctamente",
      data: relacion,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar el estado de la relación",
      error,
    });
  }
};