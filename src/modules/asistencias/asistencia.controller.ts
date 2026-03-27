import { Request, Response } from "express";
import Asistencia from "./models/asistencia.model";
import Docente from "../docentes/models/docente.model";
import ProyectoCurso from "../proyectoCursos/models/proyectoCurso.model";
import Curso from "../cursos/models/curso.model";
import Certificado from "../certificados/models/certificado.model";

// Helper: relación activa también incluye documentos viejos sin campo activo
const filtroRelacionActiva = {
  $or: [{ activo: true }, { activo: { $exists: false } }],
};

// Registrar asistencia
export const registrarAsistencia = async (req: Request, res: Response) => {
  try {
    const { proyectoCursoId, proyectoId, cursoId, docenteId, moduloNumero, asistio } =
      req.body;

    if (!docenteId || moduloNumero === undefined || asistio === undefined) {
      return res.status(400).json({
        message:
          "Los campos docenteId, moduloNumero y asistio son obligatorios",
      });
    }

    const docenteExiste = await Docente.findById(docenteId);
    if (!docenteExiste) {
      return res.status(404).json({
        message: "El docente asociado no existe",
      });
    }

    let relacionProyectoCurso: any = null;

    if (proyectoCursoId) {
      relacionProyectoCurso = await ProyectoCurso.findOne({
        _id: proyectoCursoId,
        ...filtroRelacionActiva,
      });
    } else if (proyectoId && cursoId) {
      relacionProyectoCurso = await ProyectoCurso.findOne({
        proyectoId,
        cursoId,
        ...filtroRelacionActiva,
      });

      // Si no existe la relación, se crea automáticamente activa
      if (!relacionProyectoCurso) {
        const cursoExiste = await Curso.findById(cursoId);
        if (!cursoExiste) {
          return res.status(404).json({
            message: "El curso asociado no existe",
          });
        }

        relacionProyectoCurso = await ProyectoCurso.create({
          proyectoId,
          cursoId,
          activo: true,
        });
      }
    } else {
      return res.status(400).json({
        message:
          "Debes enviar proyectoCursoId o la combinación proyectoId + cursoId",
      });
    }

    if (!relacionProyectoCurso) {
      return res.status(404).json({
        message: "La relación proyecto-curso no existe o está inactiva",
      });
    }

    const cursoExiste = await Curso.findById(relacionProyectoCurso.cursoId);
    if (!cursoExiste) {
      return res.status(404).json({
        message: "El curso asociado no existe",
      });
    }

    if (moduloNumero < 1 || moduloNumero > cursoExiste.numeroModulos) {
      return res.status(400).json({
        message: `El módulo debe estar entre 1 y ${cursoExiste.numeroModulos}`,
      });
    }

    const asistenciaExistente = await Asistencia.findOne({
      proyectoCursoId: relacionProyectoCurso._id,
      docenteId,
      moduloNumero,
    });

    if (asistenciaExistente) {
      return res.status(400).json({
        message:
          "Ya existe un registro de asistencia para este docente en ese módulo",
      });
    }

    const nuevaAsistencia = new Asistencia({
      proyectoCursoId: relacionProyectoCurso._id,
      docenteId,
      moduloNumero,
      asistio,
    });

    const asistenciaGuardada = await nuevaAsistencia.save();

    res.status(201).json({
      message: "Asistencia registrada correctamente",
      asistencia: asistenciaGuardada,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar asistencia",
      error,
    });
  }
};

// Listar todas las asistencias de relaciones activas
export const listarAsistencias = async (_req: Request, res: Response) => {
  try {
    const asistencias = await Asistencia.find()
      .populate("docenteId", "nombres apellidos numeroDocumento proyectoId")
      .populate({
        path: "proyectoCursoId",
        match: filtroRelacionActiva,
        populate: [
          { path: "proyectoId", select: "nombre" },
          { path: "cursoId", select: "nombreCurso numeroModulos activo" },
        ],
      });

    const filtradas = asistencias.filter((item: any) => item.proyectoCursoId);

    res.status(200).json(filtradas);
  } catch (error) {
    res.status(500).json({
      message: "Error al listar asistencias",
      error,
    });
  }
};

// Obtener asistencias por proyectoCursoId
export const obtenerAsistenciasPorProyectoCurso = async (
  req: Request,
  res: Response
) => {
  try {
    const { proyectoCursoId } = req.params;

    const asistencias = await Asistencia.find({ proyectoCursoId })
      .populate("docenteId", "nombres apellidos numeroDocumento")
      .populate({
        path: "proyectoCursoId",
        match: filtroRelacionActiva,
        populate: [
          { path: "proyectoId", select: "nombre" },
          { path: "cursoId", select: "nombreCurso numeroModulos activo" },
        ],
      });

    const filtradas = asistencias.filter((item: any) => item.proyectoCursoId);

    res.status(200).json(filtradas);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar asistencias del proyectoCurso",
      error,
    });
  }
};

export const obtenerConsolidadoAsistencias = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      proyectoId,
      cursoId,
      moduloNumero,
      estadoCertificacion,
      estadoAsistenciaModulo,
    } = req.query;

    const filtroRelaciones: any = {
      ...filtroRelacionActiva,
    };

    if (proyectoId) {
      filtroRelaciones.proyectoId = proyectoId;
    }

    if (cursoId) {
      filtroRelaciones.cursoId = cursoId;
    }

    const relacionesActivas = await ProyectoCurso.find(filtroRelaciones)
      .populate("proyectoId", "nombre")
      .populate("cursoId", "nombreCurso numeroModulos activo");

    const relacionIds = relacionesActivas.map((rel) => String(rel._id));

    if (!relacionIds.length) {
      return res.status(200).json({
        detalle: [],
        indicadores: {
          totalDocentes: 0,
          cumplenAsistencia: 0,
          certificados: 0,
          pendientes: 0,
        },
        graficoModulos: [],
      });
    }

    const asistencias = await Asistencia.find({
      proyectoCursoId: { $in: relacionIds },
    })
      .populate("docenteId", "nombres apellidos numeroDocumento proyectoId")
      .populate({
        path: "proyectoCursoId",
        populate: [
          { path: "proyectoId", select: "nombre" },
          { path: "cursoId", select: "nombreCurso numeroModulos activo" },
        ],
      });

    const certificados = await Certificado.find({
      proyectoCursoId: { $in: relacionIds },
    });

    const certificadosSet = new Set(
      certificados.map(
        (item) => `${String(item.docenteId)}_${String(item.proyectoCursoId)}`
      )
    );

    const mapa = new Map<string, any>();

    asistencias.forEach((item: any) => {
      if (!item.proyectoCursoId || !item.docenteId) return;

      const relacion = item.proyectoCursoId;
      const proyecto = relacion.proyectoId;
      const curso = relacion.cursoId;
      const docente = item.docenteId;

      if (!curso || !proyecto) return;

      const key = `${String(docente._id)}_${String(relacion._id)}`;

      if (!mapa.has(key)) {
        mapa.set(key, {
          docenteId: String(docente._id),
          proyectoCursoId: String(relacion._id),
          proyectoId: String(proyecto._id),
          cursoId: String(curso._id),
          nombreCompleto: `${docente.nombres || ""} ${docente.apellidos || ""}`.trim(),
          numeroDocumento: docente.numeroDocumento || "",
          proyectoNombre: proyecto.nombre || "",
          cursoNombre: curso.nombreCurso || "",
          totalModulos: Number(curso.numeroModulos || 0),
          modulosMap: new Map<number, boolean>(),
        });
      }

      mapa.get(key).modulosMap.set(Number(item.moduloNumero), Boolean(item.asistio));
    });

    let detalle = Array.from(mapa.values()).map((item) => {
      const modulos = [];

      for (let i = 1; i <= item.totalModulos; i += 1) {
        modulos.push({
          moduloNumero: i,
          asistio: item.modulosMap.has(i) ? item.modulosMap.get(i) : false,
        });
      }

      const asistenciasPositivas = modulos.filter((m) => m.asistio).length;
      const porcentajeAsistencia =
        item.totalModulos > 0
          ? Number(((asistenciasPositivas / item.totalModulos) * 100).toFixed(2))
          : 0;

      const cumpleAsistencia = porcentajeAsistencia >= 80;
      const certificado = certificadosSet.has(
        `${item.docenteId}_${item.proyectoCursoId}`
      );

      const moduloSeleccionado = moduloNumero ? Number(moduloNumero) : null;
      const moduloInfo = moduloSeleccionado
        ? modulos.find((m) => m.moduloNumero === moduloSeleccionado) || {
            moduloNumero: moduloSeleccionado,
            asistio: false,
          }
        : null;

      return {
        docenteId: item.docenteId,
        proyectoCursoId: item.proyectoCursoId,
        proyectoId: item.proyectoId,
        cursoId: item.cursoId,
        nombreCompleto: item.nombreCompleto,
        numeroDocumento: item.numeroDocumento,
        proyectoNombre: item.proyectoNombre,
        cursoNombre: item.cursoNombre,
        totalModulos: item.totalModulos,
        porcentajeAsistencia,
        cumpleAsistencia,
        certificado,
        estadoGeneral: certificado
          ? "Certificado"
          : cumpleAsistencia
          ? "Cumple asistencia"
          : "Pendiente",
        moduloFiltrado: moduloInfo ? moduloInfo.moduloNumero : null,
        asistioModuloFiltrado: moduloInfo ? Boolean(moduloInfo.asistio) : null,
        modulos,
      };
    });

    if (estadoCertificacion === "certificados") {
      detalle = detalle.filter((item) => item.certificado);
    }

    if (estadoCertificacion === "no_certificados") {
      detalle = detalle.filter((item) => !item.certificado);
    }

    if (moduloNumero && estadoAsistenciaModulo === "asistio") {
      detalle = detalle.filter((item) => item.asistioModuloFiltrado === true);
    }

    if (moduloNumero && estadoAsistenciaModulo === "no_asistio") {
      detalle = detalle.filter((item) => item.asistioModuloFiltrado === false);
    }

    const totalDocentes = detalle.length;
    const cumplenAsistencia = detalle.filter((item) => item.cumpleAsistencia).length;
    const certificadosCount = detalle.filter((item) => item.certificado).length;
    const pendientes = detalle.filter((item) => !item.certificado).length;

    let graficoModulos: any[] = [];

    if (detalle.length > 0) {
      const maximoModulos = detalle.reduce(
        (max, item) => Math.max(max, item.totalModulos || 0),
        0
      );

      const modulosAGraficar = moduloNumero
        ? [Number(moduloNumero)]
        : Array.from({ length: maximoModulos }, (_, i) => i + 1);

      graficoModulos = modulosAGraficar.map((numeroModulo) => {
        const docentesConAsistencia = detalle.filter((item) => {
          const modulo = item.modulos.find(
            (m: any) => m.moduloNumero === numeroModulo
          );
          return modulo?.asistio === true;
        }).length;

        const porcentaje =
          totalDocentes > 0
            ? Number(((docentesConAsistencia / totalDocentes) * 100).toFixed(2))
            : 0;

        return {
          moduloNumero: numeroModulo,
          porcentaje,
        };
      });
    }

    return res.status(200).json({
      detalle,
      indicadores: {
        totalDocentes,
        cumplenAsistencia,
        certificados: certificadosCount,
        pendientes,
      },
      graficoModulos,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al consultar el consolidado de asistencias",
      error,
    });
  }
};