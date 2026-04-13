import { Request, Response } from "express";
import Docente from "./models/docente.model";
import Institucion from "../instituciones/models/institucion.model";
import Proyecto from "../proyectos/models/proyecto.model";
import ProyectoCurso from "../proyectoCursos/models/proyectoCurso.model";
import Asistencia from "../asistencias/models/asistencia.model";

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

    const docenteExistente = await Docente.findOne({ numeroDocumento });
    if (docenteExistente) {
      return res.status(400).json({
        message: "Ya existe un docente con ese número de documento",
      });
    }

    const institucionExiste = await Institucion.findById(institucionId);
    if (!institucionExiste) {
      return res.status(404).json({
        message: "La institución asociada no existe",
      });
    }

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

// Ficha consolidada del docente
export const obtenerFichaDocente = async (req: Request, res: Response) => {
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

    const asistencias = await Asistencia.find({ docenteId: docente._id }).populate({
      path: "proyectoCursoId",
      populate: [
        { path: "cursoId", select: "nombreCurso numeroModulos" },
        { path: "proyectoId", select: "nombre" },
      ],
    });

    const mapaCursos = new Map<
      string,
      {
        proyecto: string;
        nombreCurso: string;
        totalModulos: number;
        asistidos: number;
        modulosAsistidos: Set<number>;
      }
    >();

    for (const asistencia of asistencias as any[]) {
      const relacion = asistencia.proyectoCursoId;
      const curso = relacion?.cursoId;

      if (!relacion || !curso) continue;

      // ✅ Agrupar por curso, no por relación proyectoCurso
      const key = String(curso._id);

      if (!mapaCursos.has(key)) {
        mapaCursos.set(key, {
          proyecto: (docente.proyectoId as any)?.nombre || "",
          nombreCurso: curso?.nombreCurso || "",
          totalModulos: Number(curso?.numeroModulos || 0),
          asistidos: 0,
          modulosAsistidos: new Set<number>(),
        });
      }

      const actual = mapaCursos.get(key)!;

      // ✅ Contar cada módulo solo una vez por curso
      if (asistencia.asistio === true && !actual.modulosAsistidos.has(Number(asistencia.moduloNumero))) {
        actual.modulosAsistidos.add(Number(asistencia.moduloNumero));
        actual.asistidos += 1;
      }
    }

    const cursos = Array.from(mapaCursos.values()).map((curso) => {
      const porcentajeAsistencia =
        curso.totalModulos > 0
          ? Math.round((curso.asistidos / curso.totalModulos) * 100)
          : 0;

      return {
        proyecto: curso.proyecto,
        nombreCurso: curso.nombreCurso,
        porcentajeAsistencia,
        certificado: porcentajeAsistencia >= 80,
      };
    });

    const institucion = docente.institucionId as any;
    const proyecto = docente.proyectoId as any;

    return res.status(200).json({
      docente: {
        tipoDocumento: docente.tipoDocumento,
        numeroDocumento: docente.numeroDocumento,
        nombres: docente.nombres,
        apellidos: docente.apellidos,
        email: docente.email,
        telefono: docente.telefono,
        institucion: institucion?.nombre || "",
        proyecto: proyecto?.nombre || "",
        activo: docente.activo,
      },
      cursos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error,
    });
  }
};

export const toggleDocente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const docente = await Docente.findById(id);

    if (!docente) {
      return res.status(404).json({
        message: "Docente no encontrado",
      });
    }

    docente.activo = !docente.activo;
    await docente.save();

    return res.status(200).json({
      message: `Docente ${docente.activo ? "activado" : "inactivado"} correctamente`,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al cambiar el estado del docente",
      error,
    });
  }
};

export const deleteDocente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const docente = await Docente.findByIdAndDelete(id);

    if (!docente) {
      return res.status(404).json({
        message: "Docente no encontrado",
      });
    }

    return res.status(200).json({
      message: "Docente eliminado correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar docente",
      error,
    });
  }
};

