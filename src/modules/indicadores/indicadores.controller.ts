import { Request, Response } from "express";
import Proyecto from "../proyectos/models/proyecto.model";
import Institucion from "../instituciones/models/institucion.model";
import Docente from "../docentes/models/docente.model";
import RespuestaEncuesta from "../respuestasEncuesta/models/respuestaEncuesta.model";
import Encuesta from "../encuestas/models/encuesta.model";
import Certificado from "../certificados/models/certificado.model";
import ProyectoCurso from "../proyectoCursos/models/proyectoCurso.model";
import Asistencia from "../asistencias/models/asistencia.model";

function normalizarRespuesta(valor: any) {
  if (Array.isArray(valor)) return valor.map((v) => String(v));
  return String(valor);
}

function contarValores(
  respuestas: any[],
  numeroPregunta: number,
  tipoRespuesta?: string
) {
  const conteo: Record<string, number> = {};
  let basePregunta = 0;

  respuestas.forEach((registro: any) => {
    const item = (registro.respuestas || []).find(
      (p: any) => Number(p.numeroPregunta) === Number(numeroPregunta)
    );

    if (!item) return;

    basePregunta += 1;

    const respuesta = item.respuesta;

    if (Array.isArray(respuesta)) {
      respuesta.forEach((valor: any) => {
        const key = String(valor);
        conteo[key] = (conteo[key] || 0) + 1;
      });
    } else {
      const key = String(respuesta);
      conteo[key] = (conteo[key] || 0) + 1;
    }
  });

  return {
    basePregunta,
    resultados: Object.entries(conteo).map(([opcion, cantidad]) => ({
      opcion,
      cantidad,
      porcentaje:
        basePregunta > 0
          ? Number(((Number(cantidad) / basePregunta) * 100).toFixed(1))
          : 0,
    })),
  };
}

function calcularPromedioLikert(respuestas: any[], numeroPregunta: number) {
  let suma = 0;
  let total = 0;

  respuestas.forEach((registro: any) => {
    const item = (registro.respuestas || []).find(
      (p: any) => Number(p.numeroPregunta) === Number(numeroPregunta)
    );

    if (!item || item.respuesta === undefined || item.respuesta === null) return;

    const texto = String(item.respuesta).trim();
    const match = texto.match(/^(\d+)/);
    const numero = match ? Number(match[1]) : Number(texto);

    if (!isNaN(numero)) {
      suma += numero;
      total += 1;
    }
  });

  return total > 0 ? Number((suma / total).toFixed(2)) : null;
}

function agruparPreguntasPorBloque(encuesta: any, respuestas: any[]) {
  const bloquesMap: Record<
    string,
    {
      nombreBloque: string;
      preguntas: any[];
    }
  > = {};

  (encuesta?.preguntas || []).forEach((pregunta: any) => {
    const nombreBloque = pregunta.bloque?.trim() || "Sin bloque";

    if (!bloquesMap[nombreBloque]) {
      bloquesMap[nombreBloque] = {
        nombreBloque,
        preguntas: [],
      };
    }

    const conteo = contarValores(
      respuestas,
      pregunta.numero,
      pregunta.tipoRespuesta
    );

    const promedio =
      pregunta.tipoRespuesta === "likert"
        ? calcularPromedioLikert(respuestas, pregunta.numero)
        : null;

    bloquesMap[nombreBloque].preguntas.push({
      numero: pregunta.numero,
      texto: pregunta.texto,
      tipoRespuesta: pregunta.tipoRespuesta,
      bloque: nombreBloque,
      basePregunta: conteo.basePregunta,
      promedio,
      resultados: conteo.resultados,
    });
  });

  return Object.values(bloquesMap);
}

export const obtenerIndicadoresPublicos = async (
  req: Request,
  res: Response
) => {
  try {
    const { genero, edad, zona } = req.query;

    const proyectos = await Proyecto.find();
    const instituciones = await Institucion.find();
    const docentes = await Docente.find();

    const totalProyectos = proyectos.length;
    const totalInstituciones = instituciones.length;

    const municipiosUnicos = new Set(
      instituciones.map((i: any) => i.municipio).filter(Boolean)
    );
    const totalMunicipios = municipiosUnicos.size;

    const encuestas = await Encuesta.find({
      codigo: { $in: ["CAR-INIC-01", "SATIS-GRAL-01"] },
    });

    const encuestaCaracterizacion: any = encuestas.find(
      (e: any) => e.codigo === "CAR-INIC-01"
    );
    const encuestaSatisfaccion: any = encuestas.find(
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

    // Opciones disponibles para filtros principales
    const generoOpciones = Array.from(
      new Set(
        respuestasCaracterizacion
          .map((r: any) =>
            (r.respuestas || []).find((p: any) => Number(p.numeroPregunta) === 2)?.respuesta
          )
          .filter(Boolean)
          .map((v: any) => String(v))
      )
    );

    const edadOpciones = Array.from(
      new Set(
        respuestasCaracterizacion
          .map((r: any) =>
            (r.respuestas || []).find((p: any) => Number(p.numeroPregunta) === 1)?.respuesta
          )
          .filter(Boolean)
          .map((v: any) => String(v))
      )
    );

    const zonaOpciones = Array.from(
      new Set(
        respuestasCaracterizacion
          .map((r: any) =>
            (r.respuestas || []).find((p: any) => Number(p.numeroPregunta) === 4)?.respuesta
          )
          .filter(Boolean)
          .map((v: any) => String(v))
      )
    );

    // Filtrado principal de caracterización
    const respuestasCaracterizacionFiltradas = respuestasCaracterizacion.filter(
      (registro: any) => {
        const preguntaGenero = (registro.respuestas || []).find(
          (p: any) => Number(p.numeroPregunta) === 2
        )?.respuesta;

        const preguntaEdad = (registro.respuestas || []).find(
          (p: any) => Number(p.numeroPregunta) === 1
        )?.respuesta;

        const preguntaZona = (registro.respuestas || []).find(
          (p: any) => Number(p.numeroPregunta) === 4
        )?.respuesta;

        const cumpleGenero = genero ? String(preguntaGenero) === String(genero) : true;
        const cumpleEdad = edad ? String(preguntaEdad) === String(edad) : true;
        const cumpleZona = zona ? String(preguntaZona) === String(zona) : true;

        return cumpleGenero && cumpleEdad && cumpleZona;
      }
    );

    const docentesFiltradosIds = Array.from(
      new Set(
        respuestasCaracterizacionFiltradas.map((r: any) =>
          String(r.docenteId?._id || r.docenteId)
        )
      )
    );

    let totalCertificados = 0;

    if (docentesFiltradosIds.length) {
      totalCertificados = await Certificado.countDocuments({
        docenteId: { $in: docentesFiltradosIds },
      });
    }

    const bloquesCaracterizacion = encuestaCaracterizacion
      ? agruparPreguntasPorBloque(
          encuestaCaracterizacion,
          respuestasCaracterizacionFiltradas
        )
      : [];

    const bloquesSatisfaccion = encuestaSatisfaccion
      ? agruparPreguntasPorBloque(encuestaSatisfaccion, respuestasSatisfaccion)
      : [];

    return res.status(200).json({
      filtros: {
        genero: genero || null,
        edad: edad || null,
        zona: zona || null,
      },
      opcionesFiltros: {
        genero: generoOpciones,
        edad: edadOpciones,
        zona: zonaOpciones,
      },
      kpis: {
        totalProyectos,
        totalInstituciones,
        totalDocentesFiltrados: docentesFiltradosIds.length,
        totalMunicipios,
        totalCertificados,
      },
      baseCaracterizacion: respuestasCaracterizacionFiltradas.length,
      baseSatisfaccion: respuestasSatisfaccion.length,
      caracterizacion: {
        bloques: bloquesCaracterizacion,
      },
      satisfaccion: {
        base: respuestasSatisfaccion.length,
        bloques: bloquesSatisfaccion,
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
    const caracterizacionPendiente = totalDocentes - caracterizacionRespondida;

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