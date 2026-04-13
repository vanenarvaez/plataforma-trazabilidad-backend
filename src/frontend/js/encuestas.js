const API_URL = "http://localhost:3000/api";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "../index.html";
}

const buscadorDocente = document.getElementById("buscadorDocente");
const listaSugerenciasDocentes = document.getElementById("listaSugerenciasDocentes");
const docenteIdSeleccionado = document.getElementById("docenteIdSeleccionado");

const proyectoFiltro = document.getElementById("proyectoIdFiltro");
const encuestaFiltro = document.getElementById("encuestaIdFiltro");
const encuestaDetalleSelect = document.getElementById("encuestaDetalleSelect");
const estadoEncuestaFiltro = document.getElementById("estadoEncuestaFiltro");

const btnConsultarRespuestas = document.getElementById("btnConsultarRespuestas");
const btnConsultarProyecto = document.getElementById("btnConsultarProyecto");
const btnDescargarCsvEncuestas = document.getElementById("btnDescargarCsvEncuestas");
const btnLimpiarFiltroProyecto = document.getElementById("btnLimpiarFiltroProyecto");
const btnLimpiarConsultaDocente = document.getElementById("btnLimpiarConsultaDocente");
const btnIrCrearEncuesta = document.getElementById("btnIrCrearEncuesta");

const detalleEncuestaSeleccionada = document.getElementById("detalleEncuestaSeleccionada");
const tablaRespuestas = document.getElementById("tablaRespuestas");
const detalleRespuesta = document.getElementById("detalleRespuesta");
const tablaAvanceEncuestas = document.getElementById("tablaAvanceEncuestas");
const resumenFiltroEncuestas = document.getElementById("resumenFiltroEncuestas");
const alertaAvanceProyecto = document.getElementById("alertaAvanceProyecto");

const kpiTotalDocentes = document.getElementById("kpiTotalDocentes");
const kpiRespondieron = document.getElementById("kpiRespondieron");
const kpiFaltan = document.getElementById("kpiFaltan");
const kpiPorcentajeCumplimiento = document.getElementById("kpiPorcentajeCumplimiento");

const formCrearEncuesta = document.getElementById("formCrearEncuesta");
const encuestaCodigo = document.getElementById("encuestaCodigo");
const encuestaNombre = document.getElementById("encuestaNombre");
const encuestaTipo = document.getElementById("encuestaTipo");
const encuestaDescripcion = document.getElementById("encuestaDescripcion");
const encuestaMensajeInicial = document.getElementById("encuestaMensajeInicial");
const encuestaActiva = document.getElementById("encuestaActiva");
const btnAgregarPregunta = document.getElementById("btnAgregarPregunta");
const btnGuardarEncuesta = document.getElementById("btnGuardarEncuesta");
const btnLimpiarEncuesta = document.getElementById("btnLimpiarEncuesta");
const contenedorPreguntas = document.getElementById("contenedorPreguntas");
const contadorPreguntas = document.getElementById("contadorPreguntas");
const mensajeCrearEncuesta = document.getElementById("mensajeCrearEncuesta");

let respuestasConsultadas = [];
let detalleProyectoActual = [];
let nombreProyectoActual = "";
let nombreEncuestaActual = "Todas las encuestas";
let ultimoProyectoConsultado = "";
let contadorInternoPreguntas = 0;
let docentesBase = [];
let encuestasBase = [];
let proyectosBase = [];
let graficoCumplimientoEncuestas = null;

async function fetchConToken(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

function mostrarAlertaAvance(mensaje) {
  alertaAvanceProyecto.textContent = mensaje;
  alertaAvanceProyecto.classList.remove("d-none");
}

function ocultarAlertaAvance() {
  alertaAvanceProyecto.textContent = "";
  alertaAvanceProyecto.classList.add("d-none");
}

function renderizarDetalleEncuesta(encuestaId) {
  if (!encuestaId) {
    detalleEncuestaSeleccionada.innerHTML = `
      <div class="text-muted">Selecciona una encuesta para ver su detalle.</div>
    `;
    return;
  }

  const encuesta = encuestasBase.find((item) => String(item._id) === String(encuestaId));

  if (!encuesta) {
    detalleEncuestaSeleccionada.innerHTML = `
      <div class="text-danger">No fue posible cargar el detalle de la encuesta seleccionada.</div>
    `;
    return;
  }

  detalleEncuestaSeleccionada.innerHTML = `
    <div class="border rounded p-3 bg-light">
      <div class="fw-semibold mb-2">${encuesta.nombre || "Sin nombre"}</div>
      <div><strong>Código:</strong> ${encuesta.codigo || "N/A"}</div>
      <div><strong>Tipo:</strong> ${encuesta.tipo || "N/A"}</div>
      <div><strong>Cantidad preguntas:</strong> ${encuesta.preguntas?.length || 0}</div>
      <div><strong>Estado:</strong> ${encuesta.activa ? "Activa" : "Inactiva"}</div>
    </div>
  `;
}

async function cargarEncuestas() {
  try {
    const response = await fetchConToken(`${API_URL}/encuestas`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      encuestaFiltro.innerHTML = `<option value="todas">Todas las encuestas</option>`;
      encuestaDetalleSelect.innerHTML = `<option value="">No fue posible cargar encuestas</option>`;
      detalleEncuestaSeleccionada.innerHTML = `<div class="text-danger">No fue posible cargar encuestas.</div>`;
      return;
    }

    encuestasBase = data;

    encuestaFiltro.innerHTML = `<option value="todas">Todas las encuestas</option>`;
    encuestaDetalleSelect.innerHTML = `<option value="">Seleccione una encuesta</option>`;

    data.forEach((encuesta) => {
      const optionFiltro = document.createElement("option");
      optionFiltro.value = encuesta._id;
      optionFiltro.textContent = `${encuesta.nombre || "Encuesta"} (${encuesta.codigo || "Sin código"})`;
      encuestaFiltro.appendChild(optionFiltro);

      const optionDetalle = document.createElement("option");
      optionDetalle.value = encuesta._id;
      optionDetalle.textContent = `${encuesta.nombre || "Encuesta"} (${encuesta.codigo || "Sin código"})`;
      encuestaDetalleSelect.appendChild(optionDetalle);
    });

    renderizarDetalleEncuesta("");
  } catch (error) {
    console.error(error);
    encuestaFiltro.innerHTML = `<option value="todas">Todas las encuestas</option>`;
    encuestaDetalleSelect.innerHTML = `<option value="">Error cargando encuestas</option>`;
    detalleEncuestaSeleccionada.innerHTML = `<div class="text-danger">Error cargando encuestas.</div>`;
  }
}

function construirEtiquetaDocente(docente) {
  return `${docente.nombres || ""} ${docente.apellidos || ""} - ${docente.numeroDocumento || ""}`.trim();
}

function renderizarSugerenciasDocentes(docentes) {
  listaSugerenciasDocentes.innerHTML = "";

  docentes.forEach((docente) => {
    const option = document.createElement("option");
    option.value = construirEtiquetaDocente(docente);
    listaSugerenciasDocentes.appendChild(option);
  });
}

async function cargarDocentes() {
  try {
    const response = await fetchConToken(`${API_URL}/docentes`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      docentesBase = [];
      renderizarSugerenciasDocentes([]);
      return;
    }

    docentesBase = data;
    renderizarSugerenciasDocentes(docentesBase);
  } catch (error) {
    console.error(error);
    docentesBase = [];
    renderizarSugerenciasDocentes([]);
  }
}

function actualizarSugerenciasPredictivas() {
  const texto = (buscadorDocente.value || "").trim().toLowerCase();

  if (!texto) {
    docenteIdSeleccionado.value = "";
    renderizarSugerenciasDocentes(docentesBase);
    return;
  }

  const coincidencias = docentesBase.filter((docente) => {
    const etiqueta = construirEtiquetaDocente(docente).toLowerCase();
    return etiqueta.includes(texto);
  });

  renderizarSugerenciasDocentes(coincidencias);

  const coincidenciaExacta = coincidencias.find(
    (docente) => construirEtiquetaDocente(docente).toLowerCase() === texto
  );

  docenteIdSeleccionado.value = coincidenciaExacta ? coincidenciaExacta._id : "";
}

function intentarSeleccionarDocente() {
  const texto = (buscadorDocente.value || "").trim().toLowerCase();

  const docente = docentesBase.find(
    (item) => construirEtiquetaDocente(item).toLowerCase() === texto
  );

  docenteIdSeleccionado.value = docente ? docente._id : "";
}

async function cargarProyectosFiltro() {
  try {
    const response = await fetchConToken(`${API_URL}/proyectos`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data) || !data.length) {
      proyectoFiltro.innerHTML = `<option value="">No hay proyectos disponibles</option>`;
      return;
    }

    proyectosBase = data;

    proyectoFiltro.innerHTML = `
      <option value="">Seleccione un proyecto</option>
      <option value="todos">Todos los proyectos</option>
    `;

    data.forEach((proyecto) => {
      const option = document.createElement("option");
      option.value = proyecto._id;
      option.textContent = proyecto.nombre || "Proyecto sin nombre";
      proyectoFiltro.appendChild(option);
    });
  } catch (error) {
    console.error(error);
    proyectoFiltro.innerHTML = `<option value="">Error cargando proyectos</option>`;
  }
}

function limpiarVistaAvance(mensaje = "Selecciona un proyecto para consultar el avance") {
  tablaAvanceEncuestas.innerHTML = `
    <tr>
      <td colspan="6" class="text-center">
        ${mensaje}
      </td>
    </tr>
  `;

  kpiTotalDocentes.textContent = "0";
  kpiRespondieron.textContent = "0";
  kpiFaltan.textContent = "0";
  kpiPorcentajeCumplimiento.textContent = "0%";

  resumenFiltroEncuestas.textContent = "Sin resultados consultados";
  btnDescargarCsvEncuestas.disabled = true;

  detalleProyectoActual = [];
  nombreProyectoActual = "";
  nombreEncuestaActual = "Todas las encuestas";
  ultimoProyectoConsultado = "";

  renderizarGraficoCumplimiento(0, 0);
}

  function limpiarFiltrosProyecto() {
      proyectoFiltro.value = "";
      encuestaFiltro.value = "todas";
      estadoEncuestaFiltro.value = "todos";
      ocultarAlertaAvance();
      limpiarVistaAvance();
    }

function obtenerNombreProyectoSeleccionado() {
  const valor = proyectoFiltro.value;

  if (valor === "todos") {
    return "Todos los proyectos";
  }

  const option = proyectoFiltro.options[proyectoFiltro.selectedIndex];
  if (!option || !option.value) return "";
  return option.textContent.trim();
}

function obtenerNombreEncuestaSeleccionada() {
  const option = encuestaFiltro.options[encuestaFiltro.selectedIndex];
  if (!option) return "Todas las encuestas";
  return option.textContent.trim();
}

function normalizarDetalle(detalle) {
  if (!Array.isArray(detalle)) return [];

  return detalle.map((item) => {
    const encuestas = Array.isArray(item.encuestas) ? item.encuestas : [];

    return {
      docenteId: item.docenteId || "",
      numeroDocumento: item.numeroDocumento || "",
      nombres: item.nombres || "",
      apellidos: item.apellidos || "",
      nombreCompleto: `${item.nombres || ""} ${item.apellidos || ""}`.trim(),
      totalRespuestasGeneral: Number(item.totalRespuestas || 0),
      encuestas,
    };
  });
}

function construirDetalleSegunEncuesta(detalleBase, encuestaIdSeleccionada) {
  return detalleBase.map((item) => {
    const esTodas = encuestaIdSeleccionada === "todas";

    let respuestasRelacionadas = item.encuestas || [];

    if (!esTodas) {
      respuestasRelacionadas = respuestasRelacionadas.filter(
        (encuesta) => String(encuesta.encuestaId) === String(encuestaIdSeleccionada)
      );
    }

    const respondioEncuesta = respuestasRelacionadas.length > 0;

    return {
      docenteId: item.docenteId,
      numeroDocumento: item.numeroDocumento,
      nombreCompleto: item.nombreCompleto,
      respondioEncuesta,
      totalRespuestas: respuestasRelacionadas.length,
      estado: respondioEncuesta ? "Respondió" : "Pendiente",
    };
  });
}

function aplicarFiltroDetalle(detalle, estadoFiltro) {
  if (!Array.isArray(detalle)) return [];

  if (estadoFiltro === "respondieron") {
    return detalle.filter((item) => item.respondioEncuesta);
  }

  if (estadoFiltro === "faltan") {
    return detalle.filter((item) => !item.respondioEncuesta);
  }

  return detalle;
}

function renderizarTablaAvance(detalleFiltrado, nombreEncuesta) {
  if (!detalleFiltrado.length) {
    tablaAvanceEncuestas.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No hay resultados con el filtro aplicado</td>
      </tr>
    `;
    return;
  }

  tablaAvanceEncuestas.innerHTML = detalleFiltrado
    .map(
      (item) => `
        <tr>
          <td>${item.numeroDocumento}</td>
          <td>${item.nombreCompleto}</td>
          <td>${nombreEncuesta}</td>
          <td>${item.respondioEncuesta ? "Sí" : "No"}</td>
          <td>${item.totalRespuestas}</td>
          <td>${item.estado}</td>
        </tr>
      `
    )
    .join("");
}

function actualizarResumenFiltro(totalFiltrado, totalGeneral, estadoFiltro, nombreEncuesta) {
  let textoEstado = "Todos";

  if (estadoFiltro === "respondieron") {
    textoEstado = "Respondieron";
  } else if (estadoFiltro === "faltan") {
    textoEstado = "Faltan";
  }

  resumenFiltroEncuestas.textContent = `Encuesta: ${nombreEncuesta} | Estado: ${textoEstado} | Mostrando ${totalFiltrado} de ${totalGeneral}`;
}

function actualizarIndicadores(detalleEncuesta) {
  const totalDocentes = detalleEncuesta.length;
  const respondieron = detalleEncuesta.filter((item) => item.respondioEncuesta).length;
  const faltan = totalDocentes - respondieron;
  const porcentaje = totalDocentes > 0 ? ((respondieron / totalDocentes) * 100).toFixed(1) : "0.0";

  kpiTotalDocentes.textContent = String(totalDocentes);
  kpiRespondieron.textContent = String(respondieron);
  kpiFaltan.textContent = String(faltan);
  kpiPorcentajeCumplimiento.textContent = `${porcentaje}%`;

  renderizarGraficoCumplimiento(respondieron, faltan);
}

function renderizarGraficoCumplimiento(respondieron, faltan) {
  const canvas = document.getElementById("graficoCumplimientoEncuestas");
  if (!canvas) return;

  const contexto = canvas.getContext("2d");

  if (graficoCumplimientoEncuestas) {
    graficoCumplimientoEncuestas.destroy();
  }

  graficoCumplimientoEncuestas = new Chart(contexto, {
    type: "pie",
    data: {
      labels: ["Respondieron", "Pendientes"],
      datasets: [
        {
          data: [respondieron, faltan],
          backgroundColor: ["#6f42c1", "#d6d8db"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

function aplicarFiltroEnPantalla() {
  const estadoFiltro = estadoEncuestaFiltro.value || "todos";
  const encuestaIdSeleccionada = encuestaFiltro.value || "todas";
  const nombreEncuesta = obtenerNombreEncuestaSeleccionada();

  const detallePorEncuesta = construirDetalleSegunEncuesta(
    detalleProyectoActual,
    encuestaIdSeleccionada
  );

  const detalleFiltrado = aplicarFiltroDetalle(detallePorEncuesta, estadoFiltro);

  renderizarTablaAvance(detalleFiltrado, nombreEncuesta);
  actualizarResumenFiltro(
    detalleFiltrado.length,
    detallePorEncuesta.length,
    estadoFiltro,
    nombreEncuesta
  );
  actualizarIndicadores(detallePorEncuesta);

  nombreEncuestaActual = nombreEncuesta;
  btnDescargarCsvEncuestas.disabled = detalleFiltrado.length === 0;
}

async function consultarAvanceProyecto() {
  const proyectoId = proyectoFiltro.value;
  const encuestaIdSeleccionada = encuestaFiltro.value || "todas";

  ocultarAlertaAvance();

  if (!proyectoId) {
    mostrarAlertaAvance("Debes seleccionar un proyecto.");
    limpiarVistaAvance("Debes seleccionar un proyecto");
    return;
  }

  if (proyectoId === "todos" && encuestaIdSeleccionada === "todas") {
    const mensaje = "Para consultar todos los proyectos debes seleccionar una encuesta específica.";
    mostrarAlertaAvance(mensaje);
    limpiarVistaAvance(mensaje);
    return;
  }

  if (proyectoId === "todos") {
    await consultarAvanceTodosLosProyectos(encuestaIdSeleccionada);
    return;
  }

  try {
    const response = await fetchConToken(
      `${API_URL}/respuestas-encuesta/proyecto/${proyectoId}`
    );
    const data = await response.json();

    if (!response.ok) {
      mostrarAlertaAvance("No fue posible consultar el avance.");
      limpiarVistaAvance("No fue posible consultar el avance");
      return;
    }

    detalleProyectoActual = normalizarDetalle(data.detalle || []);
    nombreProyectoActual = obtenerNombreProyectoSeleccionado();
    ultimoProyectoConsultado = proyectoId;

    aplicarFiltroEnPantalla();
  } catch (error) {
    console.error(error);
    mostrarAlertaAvance("Error de conexión con el servidor.");
    limpiarVistaAvance("Error de conexión con el servidor");
  }
}

async function consultarAvanceTodosLosProyectos(encuestaIdSeleccionada) {
  try {
    const consultas = await Promise.all(
      proyectosBase.map(async (proyecto) => {
        try {
          const response = await fetchConToken(
            `${API_URL}/respuestas-encuesta/proyecto/${proyecto._id}`
          );
          const data = await response.json();

          if (!response.ok) {
            return [];
          }

          const detalleNormalizado = normalizarDetalle(data.detalle || []);

          return detalleNormalizado.map((item) => ({
            ...item,
            claveUnica: `${proyecto._id}_${item.docenteId || item.numeroDocumento}`,
          }));
        } catch (error) {
          console.error(error);
          return [];
        }
      })
    );

    const detalleConsolidado = consultas.flat();

    detalleProyectoActual = detalleConsolidado;
    nombreProyectoActual = "Todos los proyectos";
    ultimoProyectoConsultado = "todos";

    const nombreEncuesta = obtenerNombreEncuestaSeleccionada();
    const detallePorEncuesta = construirDetalleSegunEncuesta(
      detalleProyectoActual,
      encuestaIdSeleccionada
    );
    const estadoFiltro = estadoEncuestaFiltro.value || "todos";
    const detalleFiltrado = aplicarFiltroDetalle(detallePorEncuesta, estadoFiltro);

    renderizarTablaAvance(detalleFiltrado, nombreEncuesta);
    actualizarResumenFiltro(
      detalleFiltrado.length,
      detallePorEncuesta.length,
      estadoFiltro,
      nombreEncuesta
    );
    actualizarIndicadores(detallePorEncuesta);

    nombreEncuestaActual = nombreEncuesta;
    btnDescargarCsvEncuestas.disabled = detalleFiltrado.length === 0;
  } catch (error) {
    console.error(error);
    mostrarAlertaAvance("No fue posible consultar el consolidado de todos los proyectos.");
    limpiarVistaAvance("No fue posible consultar el consolidado de todos los proyectos");
  }
}

function escaparCsv(valor) {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor).replace(/"/g, '""');
  return `"${texto}"`;
}

function descargarCsvEncuestas() {
  const estadoFiltro = estadoEncuestaFiltro.value || "todos";
  const encuestaIdSeleccionada = encuestaFiltro.value || "todas";
  const detallePorEncuesta = construirDetalleSegunEncuesta(
    detalleProyectoActual,
    encuestaIdSeleccionada
  );
  const detalleFiltrado = aplicarFiltroDetalle(detallePorEncuesta, estadoFiltro);

  if (!ultimoProyectoConsultado || !detalleFiltrado.length) {
    return;
  }

  const encabezados = [
    "Proyecto",
    "Encuesta",
    "Documento",
    "Docente",
    "Respondio",
    "TotalRespuestas",
    "EstadoEncuesta",
  ];

  const filas = detalleFiltrado.map((item) => [
    nombreProyectoActual,
    nombreEncuestaActual,
    item.numeroDocumento,
    item.nombreCompleto,
    item.respondioEncuesta ? "Si" : "No",
    item.totalRespuestas,
    item.estado,
  ]);

  const contenidoCsv = [
    encabezados.map(escaparCsv).join(","),
    ...filas.map((fila) => fila.map(escaparCsv).join(",")),
  ].join("\n");

  const blob = new Blob([contenidoCsv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);

  const nombreProyectoLimpio = (nombreProyectoActual || "proyecto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const nombreEncuestaLimpio = (nombreEncuestaActual || "todas")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const nombreFiltro =
    estadoFiltro === "respondieron"
      ? "respondieron"
      : estadoFiltro === "faltan"
        ? "faltan"
        : "todos";

  enlace.href = url;
  enlace.download = `encuestas_${nombreProyectoLimpio}_${nombreEncuestaLimpio}_${nombreFiltro}_${fecha}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

function mostrarMensajeCrearEncuesta(texto, tipo = "info") {
  const clases = {
    success: "text-success",
    danger: "text-danger",
    info: "text-muted",
  };

  mensajeCrearEncuesta.className = `mt-3 small ${clases[tipo] || "text-muted"}`;
  mensajeCrearEncuesta.textContent = texto;
}

function actualizarContadorPreguntas() {
  const total = contenedorPreguntas.querySelectorAll(".pregunta-item").length;
  contadorPreguntas.textContent = `${total} ${total === 1 ? "pregunta" : "preguntas"}`;
}

function necesitaOpciones(tipoRespuesta) {
  return ["opcion_unica", "multiple", "likert"].includes(tipoRespuesta);
}

function crearBloquePregunta(valores = {}) {
  contadorInternoPreguntas += 1;

  const wrapper = document.createElement("div");
  wrapper.className = "card border pregunta-item";

  wrapper.innerHTML = `
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="mb-0 text-brand">Pregunta <span class="numero-pregunta-visual"></span></h6>
        <button type="button" class="btn btn-outline-danger btn-sm btnEliminarPregunta">
          Eliminar
        </button>
      </div>

      <div class="row g-3">
        <div class="col-md-3">
          <label class="form-label">Bloque</label>
          <input type="text" class="form-control pregunta-bloque" placeholder="Ej: Datos generales" value="${valores.bloque || ""}" />
        </div>

        <div class="col-md-3">
          <label class="form-label">Tipo de respuesta</label>
          <select class="form-select pregunta-tipo" required>
            <option value="texto" ${valores.tipoRespuesta === "texto" ? "selected" : ""}>Texto</option>
            <option value="numero" ${valores.tipoRespuesta === "numero" ? "selected" : ""}>Número</option>
            <option value="si_no" ${valores.tipoRespuesta === "si_no" ? "selected" : ""}>Sí / No</option>
            <option value="opcion_unica" ${valores.tipoRespuesta === "opcion_unica" ? "selected" : ""}>Opción única</option>
            <option value="multiple" ${valores.tipoRespuesta === "multiple" ? "selected" : ""}>Múltiple</option>
            <option value="likert" ${valores.tipoRespuesta === "likert" ? "selected" : ""}>Likert</option>
          </select>
        </div>

        <div class="col-md-3">
          <label class="form-label">Obligatoria</label>
          <select class="form-select pregunta-obligatoria">
            <option value="true" ${valores.obligatoria !== false ? "selected" : ""}>Sí</option>
            <option value="false" ${valores.obligatoria === false ? "selected" : ""}>No</option>
          </select>
        </div>

        <div class="col-md-12">
          <label class="form-label">Texto de la pregunta</label>
          <textarea class="form-control pregunta-texto" rows="2" placeholder="Escribe la pregunta" required>${valores.texto || ""}</textarea>
        </div>

        <div class="col-md-12 contenedor-opciones" style="display: none;">
          <label class="form-label">Opciones (una por línea)</label>
          <textarea class="form-control pregunta-opciones" rows="4" placeholder="Opción 1&#10;Opción 2&#10;Opción 3">${Array.isArray(valores.opciones) ? valores.opciones.join("\n") : ""}</textarea>
          <div class="form-text">
            Requerido para tipo opción única, múltiple y likert.
          </div>
        </div>
      </div>
    </div>
  `;

  contenedorPreguntas.appendChild(wrapper);

  const btnEliminar = wrapper.querySelector(".btnEliminarPregunta");
  const selectTipo = wrapper.querySelector(".pregunta-tipo");

  btnEliminar.addEventListener("click", () => {
    wrapper.remove();
    renumerarPreguntasVisuales();
    actualizarContadorPreguntas();
  });

  selectTipo.addEventListener("change", () => {
    actualizarVisibilidadOpciones(wrapper);
  });

  actualizarVisibilidadOpciones(wrapper);
  renumerarPreguntasVisuales();
  actualizarContadorPreguntas();
}

function renumerarPreguntasVisuales() {
  const items = contenedorPreguntas.querySelectorAll(".pregunta-item");
  items.forEach((item, idx) => {
    const etiqueta = item.querySelector(".numero-pregunta-visual");
    if (etiqueta) {
      etiqueta.textContent = idx + 1;
    }
  });
}

function actualizarVisibilidadOpciones(wrapper) {
  const tipo = wrapper.querySelector(".pregunta-tipo").value;
  const contenedor = wrapper.querySelector(".contenedor-opciones");

  if (necesitaOpciones(tipo)) {
    contenedor.style.display = "block";
  } else {
    contenedor.style.display = "none";
  }
}

function obtenerPreguntasFormulario() {
  const items = contenedorPreguntas.querySelectorAll(".pregunta-item");
  const preguntas = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const bloque = item.querySelector(".pregunta-bloque").value.trim();
    const texto = item.querySelector(".pregunta-texto").value.trim();
    const tipoRespuesta = item.querySelector(".pregunta-tipo").value;
    const obligatoria = item.querySelector(".pregunta-obligatoria").value === "true";
    const opcionesTexto = item.querySelector(".pregunta-opciones").value.trim();

    if (!texto) {
      throw new Error(`La pregunta ${i + 1} no tiene texto.`);
    }

    let opciones = [];
    if (necesitaOpciones(tipoRespuesta)) {
      opciones = opcionesTexto
        .split("\n")
        .map((opcion) => opcion.trim())
        .filter(Boolean);

      if (!opciones.length) {
        throw new Error(`La pregunta ${i + 1} requiere al menos una opción.`);
      }
    }

    preguntas.push({
      numero: i + 1,
      bloque,
      texto,
      tipoRespuesta,
      opciones,
      obligatoria,
    });
  }

  if (!preguntas.length) {
    throw new Error("Debes agregar al menos una pregunta.");
  }

  return preguntas;
}

function limpiarFormularioEncuesta(limpiarMensaje = true) {
  formCrearEncuesta.reset();
  encuestaActiva.value = "true";
  contenedorPreguntas.innerHTML = "";
  contadorInternoPreguntas = 0;
  crearBloquePregunta();

  if (limpiarMensaje) {
    mostrarMensajeCrearEncuesta("");
  }
}

function irABloqueCrearEncuesta() {
  const collapseElement = document.getElementById("collapseCrearEncuesta");

  if (collapseElement) {
    const collapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
    collapse.show();
  }

  const bloque = document.getElementById("collapseCrearEncuesta");
  if (bloque) {
    setTimeout(() => {
      bloque.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }
}

async function crearEncuesta(event) {
  event.preventDefault();

  try {
    const codigo = encuestaCodigo.value.trim();
    const nombre = encuestaNombre.value.trim();
    const tipo = encuestaTipo.value;
    const descripcion = encuestaDescripcion.value.trim();
    const mensajeInicial = encuestaMensajeInicial.value.trim();
    const activa = encuestaActiva.value === "true";
    const preguntas = obtenerPreguntasFormulario();

    if (!codigo || !nombre || !tipo) {
      mostrarMensajeCrearEncuesta("Código, nombre y tipo son obligatorios.", "danger");
      return;
    }

    const payload = {
      codigo,
      nombre,
      tipo,
      descripcion,
      mensajeInicial,
      activa,
      preguntas,
    };

    btnGuardarEncuesta.disabled = true;
    btnGuardarEncuesta.textContent = "Guardando...";

    const response = await fetchConToken(`${API_URL}/encuestas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      mostrarMensajeCrearEncuesta(
        data?.message || "No fue posible crear la encuesta.",
        "danger"
      );
      return;
    }

    limpiarFormularioEncuesta(false);
    mostrarMensajeCrearEncuesta("Encuesta creada correctamente.", "success");
    await cargarEncuestas();
  } catch (error) {
    console.error(error);
    mostrarMensajeCrearEncuesta(error.message || "Error creando la encuesta.", "danger");
  } finally {
    btnGuardarEncuesta.disabled = false;
    btnGuardarEncuesta.textContent = "Guardar encuesta";
  }
}

btnConsultarProyecto.addEventListener("click", consultarAvanceProyecto);

btnLimpiarFiltroProyecto.addEventListener("click", limpiarFiltrosProyecto);
btnLimpiarConsultaDocente.addEventListener("click", limpiarConsultaDocente);
btnIrCrearEncuesta.addEventListener("click", irABloqueCrearEncuesta);

estadoEncuestaFiltro.addEventListener("change", () => {
  if (!ultimoProyectoConsultado) return;
  aplicarFiltroEnPantalla();
});

encuestaFiltro.addEventListener("change", () => {
  ocultarAlertaAvance();
  if (!ultimoProyectoConsultado) return;
  aplicarFiltroEnPantalla();
});

proyectoFiltro.addEventListener("change", () => {
  ocultarAlertaAvance();
});

encuestaDetalleSelect.addEventListener("change", (event) => {
  renderizarDetalleEncuesta(event.target.value);
});

btnDescargarCsvEncuestas.addEventListener("click", descargarCsvEncuestas);

btnConsultarRespuestas.addEventListener("click", async () => {
  intentarSeleccionarDocente();
  const docenteId = docenteIdSeleccionado.value;

  detalleRespuesta.innerHTML =
    "Aquí se mostrará el detalle de la respuesta seleccionada.";

  if (!docenteId) {
    tablaRespuestas.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">Debes seleccionar un docente válido desde las sugerencias</td>
      </tr>
    `;
    return;
  }

  try {
    const response = await fetchConToken(
      `${API_URL}/respuestas-encuesta/${docenteId}`
    );
    const data = await response.json();

    if (!response.ok || !Array.isArray(data) || !data.length) {
      respuestasConsultadas = [];
      tablaRespuestas.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">No hay respuestas registradas para este docente</td>
        </tr>
      `;
      return;
    }

    respuestasConsultadas = data;

    tablaRespuestas.innerHTML = data
      .map(
        (item, index) => `
          <tr>
            <td>${item.encuestaId?.nombre || ""}</td>
            <td>${formatearFecha(item.fechaRespuesta || item.createdAt)}</td>
            <td>${item.completada ? "Sí" : "No"}</td>
            <td>${item.observaciones || ""}</td>
            <td>
              <button class="btn btn-sm btn-secondary" onclick="verDetalleRespuesta(${index})">
                Ver detalle
              </button>
            </td>
          </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error(error);
    tablaRespuestas.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">Error de conexión con el servidor</td>
      </tr>
    `;
  }
});

function verDetalleRespuesta(index) {
  const item = respuestasConsultadas[index];

  if (!item) {
    detalleRespuesta.innerHTML = "No fue posible cargar el detalle.";
    return;
  }

  const respuestasHtml = (item.respuestas || [])
    .map((r) => {
      const valor = Array.isArray(r.respuesta)
        ? r.respuesta.join(", ")
        : r.respuesta;

      return `
        <div class="mb-3">
          <div class="fw-semibold">${r.numeroPregunta}. ${r.textoPregunta}</div>
          <div class="text-muted">${valor || ""}</div>
        </div>
      `;
    })
    .join("");

  detalleRespuesta.innerHTML = `
    <div class="border rounded p-3 bg-light">
      <div class="mb-3">
        <strong>Encuesta:</strong> ${item.encuestaId?.nombre || ""}
      </div>
      <div class="mb-3">
        <strong>Fecha:</strong> ${formatearFecha(item.fechaRespuesta || item.createdAt)}
      </div>
      <div class="mb-3">
        <strong>Observaciones:</strong> ${item.observaciones || "Sin observaciones"}
      </div>
      <hr />
      ${respuestasHtml || "<div class='text-muted'>No hay respuestas registradas.</div>"}
    </div>
  `;
}

function limpiarConsultaDocente() {
  buscadorDocente.value = "";
  docenteIdSeleccionado.value = "";
  respuestasConsultadas = [];

  tablaRespuestas.innerHTML = `
    <tr>
      <td colspan="5" class="text-center">Selecciona un docente para consultar respuestas</td>
    </tr>
  `;

  detalleRespuesta.innerHTML =
    "Aquí se mostrará el detalle de la respuesta seleccionada.";

  renderizarSugerenciasDocentes(docentesBase);
}

function formatearFecha(fecha) {
  if (!fecha) return "";
  const f = new Date(fecha);
  if (isNaN(f.getTime())) return "";
  return f.toLocaleDateString("es-CO");
}

window.verDetalleRespuesta = verDetalleRespuesta;

btnAgregarPregunta.addEventListener("click", () => crearBloquePregunta());
btnLimpiarEncuesta.addEventListener("click", () => limpiarFormularioEncuesta(true));
formCrearEncuesta.addEventListener("submit", crearEncuesta);

buscadorDocente.addEventListener("input", actualizarSugerenciasPredictivas);
buscadorDocente.addEventListener("change", intentarSeleccionarDocente);
buscadorDocente.addEventListener("blur", intentarSeleccionarDocente);

limpiarVistaAvance();
crearBloquePregunta();
cargarEncuestas();
cargarDocentes();
cargarProyectosFiltro();