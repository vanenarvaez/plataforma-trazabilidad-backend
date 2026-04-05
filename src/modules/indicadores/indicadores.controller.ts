import { Request, Response } from "express";
import Proyecto from "../proyectos/models/proyecto.model";
import Institucion from "../instituciones/models/institucion.model";
import Docente from "../docentes/models/docente.model";
import RespuestaEncuesta from "../respuestasEncuesta/models/respuestaEncuesta.model";
import Encuesta from "../encuestas/models/encuesta.model";
import Certificado from "../certificados/models/certificado.model";
import ProyectoCurso from "../proyectoCursos/models/proyectoCurso.model";
import Asistencia from "../asistencias/models/asistencia.model";

export const obtenerIndicadoresPublicos = async (
  req: Request,
  res: Response
) => {
  try {
    const { genero } = req.query;

    const proyectos = await Proyecto.find();
    const instituciones = await Institucion.find();
    const docentes = await Docente.find();

    const totalProyectos = proyectos.length;
    const totalInstituciones = instituciones.length;
    const totalDocentes = docentes.length;

    const municipiosUnicos = new Set(
      instituciones.map((i: any) => i.municipio).filter(Boolean)
    );
    const totalMunicipios = municipiosUnicos.size;

    const encuestas = await Encuesta.find({
      codigo: { $in: ["CAR-INIC-01", "SATIS-GRAL-01"] },
    });

    const encuestaCaracterizacion = encuestas.find(
      (e: any) => e.codigo === "CAR-INIC-01"
    );
    const encuestaSatisfaccion = encuestas.find(
      (e: any) => e.codigo === "SATIS-GRAL-01"
    );

    let respuestasCaracterizacion: any[] = [];
    let respuestasSatisfaccion: any[] = [];

    if (encuestaCaracterizacion) {
      respuestasCaracterizacion = await RespuestaEncuesta.find({
        encuestaId: encuestaCaracterizacion._id,
      }).populate("docenteId", "nombres apellidos numeroDocumento");
    }

    if (encuestaSatisfaccion) {
      respuestasSatisfaccion = await RespuestaEncuesta.find({
        encuestaId: encuestaSatisfaccion._id,
      }).populate("docenteId", "nombres apellidos numeroDocumento");
    }

    let docentesFiltradosIds: string[] | null = null;

    if (genero && encuestaCaracterizacion) {
      const respuestasGenero = respuestasCaracterizacion.filter((r: any) => {
        const pGenero = r.respuestas?.find(
          (p: any) => Number(p.numeroPregunta) === 2
        );
        return pGenero && pGenero.respuesta === genero;
      });

      docentesFiltradosIds = respuestasGenero.map((r: any) =>
        String(r.docenteId?._id || r.docenteId)
      );

      respuestasCaracterizacion = respuestasCaracterizacion.filter((r: any) =>
        docentesFiltradosIds?.includes(String(r.docenteId?._id || r.docenteId))
      );

      respuestasSatisfaccion = respuestasSatisfaccion.filter((r: any) =>
        docentesFiltradosIds?.includes(String(r.docenteId?._id || r.docenteId))
      );
    }

    const contarRespuestas = (respuestas: any[], numeroPregunta: number) => {
      const conteo: Record<string, number> = {};

      respuestas.forEach((r: any) => {
        const pregunta = r.respuestas?.find(
          (p: any) => Number(p.numeroPregunta) === numeroPregunta
        );

        if (!pregunta) return;

        if (Array.isArray(pregunta.respuesta)) {
          pregunta.respuesta.forEach((valor: string) => {
            conteo[valor] = (conteo[valor] || 0) + 1;
          });
        } else {
          conteo[pregunta.respuesta] = (conteo[pregunta.respuesta] || 0) + 1;
        }
      });

      return conteo;
    };

    const generoData = contarRespuestas(respuestasCaracterizacion, 2);
    const edadData = contarRespuestas(respuestasCaracterizacion, 1);
    const formacionData = contarRespuestas(respuestasCaracterizacion, 3);

    const promediarLikert = (respuestas: any[], numeroPregunta: number) => {
      let suma = 0;
      let total = 0;

      respuestas.forEach((r: any) => {
        const pregunta = r.respuestas?.find(
          (p: any) => Number(p.numeroPregunta) === numeroPregunta
        );

        if (!pregunta || !pregunta.respuesta) return;

        const valor = String(pregunta.respuesta).trim().charAt(0);
        const numero = Number(valor);

        if (!isNaN(numero)) {
          suma += numero;
          total += 1;
        }
      });

      return total > 0 ? Number((suma / total).toFixed(2)) : 0;
    };

    const textosSatisfaccion: Record<number, string> = {
      1: "Estructura del curso en plataforma",
      2: "Actividades propuestas",
      3: "Contenido abordado",
      4: "Recursos y tutoriales compartidos",
      5: "Dominio del tema del formador",
      6: "Interrelación con el formador",
      7: "Calidad de los encuentros sincrónicos",
      8: "Calificación general de la formación",
      9: "Aprendizaje obtenido",
    };

    const satisfaccionPromedios = [];
    for (let i = 1; i <= 9; i++) {
      satisfaccionPromedios.push({
        numeroPregunta: i,
        texto: textosSatisfaccion[i],
        promedio: promediarLikert(respuestasSatisfaccion, i),
      });
    }

    const utilidadData = contarRespuestas(respuestasSatisfaccion, 10);
    const recomendacionData = contarRespuestas(respuestasSatisfaccion, 11);

    let totalCertificados = 0;

    if (docentesFiltradosIds && docentesFiltradosIds.length) {
      totalCertificados = await Certificado.countDocuments({
        docenteId: { $in: docentesFiltradosIds },
      });
    } else if (docentesFiltradosIds && !docentesFiltradosIds.length) {
      totalCertificados = 0;
    } else {
      totalCertificados = await Certificado.countDocuments();
    }

    return res.status(200).json({
      filtros: {
        genero: genero || null,
      },
      kpis: {
        totalProyectos,
        totalInstituciones,
        totalDocentes,
        totalMunicipios,
        totalCertificados,
      },
      caracterizacion: {
        genero: generoData,
        edad: edadData,
        formacion: formacionData,
      },
      satisfaccion: {
        promedios: satisfaccionPromedios,
        utilidad: utilidadData,
        recomendacion: recomendacionData,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener indicadores públicos",
      error,
    });
  }
};

export const obtenerIndicadoresInternosPorProyecto = async (
  req: Request,
  res: Response
) => {
  try {
    const { proyectoId } = req.params;

    const docentes = await Docente.find({ proyectoId }).select(
      "_id nombres apellidos numeroDocumento"
    );

    const totalDocentes = docentes.length;

    if (!docentes.length) {
      return res.status(200).json({
        proyectoId,
        totalDocentes: 0,
        respondieronEncuesta: 0,
        faltanEncuesta: 0,
        cumplenAsistencia: 0,
        certificados: 0,
        detalle: [],
      });
    }

    const docentesIds = docentes.map((d) => d._id);

    const proyectoCursos = await ProyectoCurso.find({ proyectoId }).populate(
      "cursoId",
      "nombreCurso numeroModulos"
    );

    const proyectoCursoIds = proyectoCursos.map((pc) => pc._id);

    const respuestas = await RespuestaEncuesta.find({
      proyectoId,
      docenteId: { $in: docentesIds },
    });

    const asistencias = await Asistencia.find({
      proyectoCursoId: { $in: proyectoCursoIds },
      docenteId: { $in: docentesIds },
      asistio: true,
    });

    const certificados = await Certificado.find({
      proyectoCursoId: { $in: proyectoCursoIds },
      docenteId: { $in: docentesIds },
    });

    const docentesConRespuesta = new Set(
      respuestas.map((r: any) => String(r.docenteId))
    );

    const docentesCertificados = new Set(
      certificados.map((c: any) => String(c.docenteId))
    );

    const detalle = docentes.map((docente) => {
      const respuestasDocente = respuestas.filter(
        (r: any) => String(r.docenteId) === String(docente._id)
      );

      const certificadosDocente = certificados.filter(
        (c: any) => String(c.docenteId) === String(docente._id)
      );

      let cumpleAsistencia = false;

      for (const pc of proyectoCursos) {
        const curso: any = pc.cursoId;
        const totalModulos = Number(curso?.numeroModulos || 0);

        if (!totalModulos) continue;

        const asistenciasDocenteProyectoCurso = asistencias.filter(
          (a: any) =>
            String(a.docenteId) === String(docente._id) &&
            String(a.proyectoCursoId) === String(pc._id)
        );

        const totalAsistio = asistenciasDocenteProyectoCurso.length;
        const porcentaje = (totalAsistio / totalModulos) * 100;

        if (porcentaje >= 80) {
          cumpleAsistencia = true;
          break;
        }
      }

      return {
        docenteId: docente._id,
        nombres: (docente as any).nombres,
        apellidos: (docente as any).apellidos,
        numeroDocumento: (docente as any).numeroDocumento,
        respondioEncuesta: respuestasDocente.length > 0,
        totalRespuestas: respuestasDocente.length,
        cumpleAsistencia,
        certificado: certificadosDocente.length > 0,
      };
    });

    const cumplenAsistencia = detalle.filter((d) => d.cumpleAsistencia).length;

    return res.status(200).json({
      proyectoId,
      totalDocentes,
      respondieronEncuesta: docentesConRespuesta.size,
      faltanEncuesta: totalDocentes - docentesConRespuesta.size,
      cumplenAsistencia,
      certificados: docentesCertificados.size,
      detalle,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener indicadores internos por proyecto",
      error,
    });
  }
};

export const obtenerDashboardInterno = async (
  req: Request,
  res: Response
) => {
  try {
    const { proyectoId } = req.query;

    const filtroDocentes: any = {};
    let proyectoNombre = "Todos los proyectos";

    if (proyectoId && String(proyectoId).trim() !== "") {
      filtroDocentes.proyectoId = proyectoId;
      const proyecto = await Proyecto.findById(proyectoId).select("nombre");
      proyectoNombre = proyecto?.nombre || "Proyecto";
    }

    const docentes = await Docente.find(filtroDocentes).select(
      "_id proyectoId nombres apellidos numeroDocumento"
    );

    const totalDocentes = docentes.length;
    const docentesIds = docentes.map((d: any) => d._id);

    if (!totalDocentes) {
      return res.status(200).json({
        filtro: {
          proyectoId: proyectoId || null,
          proyectoNombre,
        },
        indicadores: {
          totalDocentes: 0,
          certificados: 0,
          pendientesCertificacion: 0,
          caracterizacionRespondida: 0,
          caracterizacionPendiente: 0,
          diagnosticaRespondida: 0,
          diagnosticaPendiente: 0,
        },
        graficos: {
          certificacion: [
            { nombre: "Certificados", valor: 0 },
            { nombre: "Pendientes", valor: 0 },
          ],
          caracterizacion: [
            { nombre: "Respondida", valor: 0 },
            { nombre: "Pendiente", valor: 0 },
          ],
          diagnostica: [
            { nombre: "Respondida", valor: 0 },
            { nombre: "Pendiente", valor: 0 },
          ],
        },
      });
    }

    const certificados = await Certificado.find({
      docenteId: { $in: docentesIds },
    }).select("docenteId");

    const docentesCertificados = new Set(
      certificados.map((c: any) => String(c.docenteId))
    );
    const certificadosCount = docentesCertificados.size;
    const pendientesCertificacion = totalDocentes - certificadosCount;

    const encuestasCaracterizacion = await Encuesta.find({
      tipo: "caracterizacion",
    }).select("_id");

    const encuestasDiagnostica = await Encuesta.find({
      tipo: "diagnostica",
    }).select("_id");

    let respuestasCaracterizacion: any[] = [];
    let respuestasDiagnostica: any[] = [];

    if (encuestasCaracterizacion.length > 0) {
      respuestasCaracterizacion = await RespuestaEncuesta.find({
        encuestaId: { $in: encuestasCaracterizacion.map((e: any) => e._id) },
        docenteId: { $in: docentesIds },
      }).select("docenteId");
    }

    if (encuestasDiagnostica.length > 0) {
      respuestasDiagnostica = await RespuestaEncuesta.find({
        encuestaId: { $in: encuestasDiagnostica.map((e: any) => e._id) },
        docenteId: { $in: docentesIds },
      }).select("docenteId");
    }

    const docentesCaracterizacion = new Set(
      respuestasCaracterizacion.map((r: any) => String(r.docenteId))
    );

    const docentesDiagnostica = new Set(
      respuestasDiagnostica.map((r: any) => String(r.docenteId))
    );

    const caracterizacionRespondida = docentesCaracterizacion.size;
    const caracterizacionPendiente =
      totalDocentes - caracterizacionRespondida;

    const diagnosticaRespondida = docentesDiagnostica.size;
    const diagnosticaPendiente = totalDocentes - diagnosticaRespondida;

    return res.status(200).json({
      filtro: {
        proyectoId: proyectoId || null,
        proyectoNombre,
      },
      indicadores: {
        totalDocentes,
        certificados: certificadosCount,
        pendientesCertificacion,
        caracterizacionRespondida,
        caracterizacionPendiente,
        diagnosticaRespondida,
        diagnosticaPendiente,
      },
      graficos: {
        certificacion: [
          { nombre: "Certificados", valor: certificadosCount },
          { nombre: "Pendientes", valor: pendientesCertificacion },
        ],
        caracterizacion: [
          { nombre: "Respondida", valor: caracterizacionRespondida },
          { nombre: "Pendiente", valor: caracterizacionPendiente },
        ],
        diagnostica: [
          { nombre: "Respondida", valor: diagnosticaRespondida },
          { nombre: "Pendiente", valor: diagnosticaPendiente },
        ],
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener dashboard interno",
      error,
    });
  }
};