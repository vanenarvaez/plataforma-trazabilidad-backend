const API_URL = "http://localhost:3000/api";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "../index.html";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

const asistenciaForm = document.getElementById("asistenciaForm");
const mensajeAsistencia = document.getElementById("mensajeAsistencia");

const proyectoIdRegistro = document.getElementById("proyectoIdRegistro");
const cursoIdRegistro = document.getElementById("cursoIdRegistro");
const buscadorDocenteRegistro = document.getElementById("buscadorDocenteRegistro");
const listaDocentesRegistro = document.getElementById("listaDocentesRegistro");
const docenteIdRegistro = document.getElementById("docenteIdRegistro");
const moduloNumeroRegistro = document.getElementById("moduloNumeroRegistro");
const asistioRegistro = document.getElementById("asistioRegistro");

const formCrearCurso = document.getElementById("formCrearCurso");
const nombreCurso = document.getElementById("nombreCurso");
const numeroModulos = document.getElementById("numeroModulos");
const duracionHoras = document.getElementById("duracionHoras");
const tipoFormacion = document.getElementById("tipoFormacion");
const descripcionCurso = document.getElementById("descripcionCurso");
const mensajeCurso = document.getElementById("mensajeCurso");
const btnLimpiarCurso = document.getElementById("btnLimpiarCurso");
const bloqueCrearCurso = document.getElementById("bloqueCrearCurso");

const btnConsultarConsolidado = document.getElementById("btnConsultarConsolidado");
const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");
const btnDescargarCsvAsistencias = document.getElementById("btnDescargarCsvAsistencias");

const proyectoIdFiltro = document.getElementById("proyectoIdFiltro");
const cursoIdFiltro = document.getElementById("cursoIdFiltro");
const moduloNumeroFiltro = document.getElementById("moduloNumeroFiltro");
const estadoCertificacionFiltro = document.getElementById("estadoCertificacionFiltro");
const estadoAsistenciaModuloFiltro = document.getElementById("estadoAsistenciaModuloFiltro");

const alertaAsistencias = document.getElementById("alertaAsistencias");
const resumenFiltrosAsistencia = document.getElementById("resumenFiltrosAsistencia");

const kpiTotalDocentesAsistencia = document.getElementById("kpiTotalDocentesAsistencia");
const kpiCumplenAsistencia = document.getElementById("kpiCumplenAsistencia");
const kpiCertificados = document.getElementById("kpiCertificados");
const kpiPendientes = document.getElementById("kpiPendientes");

const docenteIdDetalle = document.getElementById("docenteIdDetalle");
const btnConsultarDetalleDocente = document.getElementById("btnConsultarDetalleDocente");
const btnDescargarCsvDetalleDocente = document.getElementById("btnDescargarCsvDetalleDocente");
const tablaDetalleDocente = document.getElementById("tablaDetalleDocente");

let proyectosBase = [];
let cursosBase = [];
let docentesBase = [];
let docentesRegistroActual = [];
let relacionesActivas = [];
let consolidadoActual = [];
let detalleDocenteActual = [];
let graficoAsistenciasModulos = null;
let graficoCertificadosTorta = null;

const pluginEtiquetasBarras = {
  id: "pluginEtiquetasBarras",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar, index) => {
        const valor = dataset.data[index];
        if (valor === null || valor === undefined) return;

        ctx.font = "12px Arial";
        ctx.fillStyle = "#311B92";
        ctx.textAlign = "center";
        ctx.fillText(`${valor}%`, bar.x, bar.y - 8);
      });
    });

    ctx.restore();
  },
};

const pluginEtiquetasTorta = {
  id: "pluginEtiquetasTorta",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];

    if (!dataset || !dataset.data || !dataset.data.length) return;

    const total = dataset.data.reduce((acc, item) => acc + Number(item || 0), 0);
    if (!total) return;

    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.font = "bold 12px Arial";
    ctx.fillStyle = "#311B92";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    meta.data.forEach((slice, index) => {
      const valor = Number(dataset.data[index] || 0);
      const porcentaje = ((valor / total) * 100).toFixed(1);
      const posicion = slice.tooltipPosition();
      ctx.fillText(`${porcentaje}%`, posicion.x, posicion.y);
    });

    ctx.restore();
  },
};

async function fetchConToken(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

function mostrarAlerta(mensaje) {
  alertaAsistencias.textContent = mensaje;
  alertaAsistencias.classList.remove("d-none");
}

function ocultarAlerta() {
  alertaAsistencias.textContent = "";
  alertaAsistencias.classList.add("d-none");
}

function mostrarMensaje(elemento, texto, tipo = "info") {
  const clases = {
    success: "text-success",
    danger: "text-danger",
    info: "text-muted",
  };

  elemento.className = `small ${clases[tipo] || "text-muted"}`;
  elemento.textContent = texto;
}

function escaparHtml(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escaparCsv(valor) {
  if (valor === null || valor === undefined) return "";
  return `"${String(valor).replace(/"/g, '""')}"`;
}

function formatearFecha(fecha) {
  if (!fecha) return "";
  const f = new Date(fecha);
  if (isNaN(f.getTime())) return "";
  return f.toLocaleDateString("es-CO");
}

function llenarSelect(select, items, getValue, getLabel, placeholder = "") {
  select.innerHTML = "";

  if (placeholder !== undefined) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    select.appendChild(option);
  }

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = getValue(item);
    option.textContent = getLabel(item);
    select.appendChild(option);
  });
}

function getProyectoIdDocente(docente) {
  if (!docente) return "";

  if (typeof docente.proyectoId === "string") return docente.proyectoId;
  if (docente.proyectoId && typeof docente.proyectoId === "object") {
    return docente.proyectoId._id || docente.proyectoId.id || "";
  }

  if (typeof docente.proyecto === "string") return docente.proyecto;
  if (docente.proyecto && typeof docente.proyecto === "object") {
    return docente.proyecto._id || docente.proyecto.id || "";
  }

  return "";
}

function construirEtiquetaDocente(docente) {
  return `${docente.nombres || ""} ${docente.apellidos || ""} - ${docente.numeroDocumento || ""}`.trim();
}

function renderizarDatalistDocentes(docentes) {
  listaDocentesRegistro.innerHTML = "";

  docentes.forEach((docente) => {
    const option = document.createElement("option");
    option.value = construirEtiquetaDocente(docente);
    listaDocentesRegistro.appendChild(option);
  });
}

function actualizarBuscadorDocenteRegistro() {
  const texto = (buscadorDocenteRegistro.value || "").trim().toLowerCase();

  if (!texto) {
    docenteIdRegistro.value = "";
    renderizarDatalistDocentes(docentesRegistroActual);
    return;
  }

  const coincidencias = docentesRegistroActual.filter((docente) =>
    construirEtiquetaDocente(docente).toLowerCase().includes(texto)
  );

  renderizarDatalistDocentes(coincidencias);

  const exacta = coincidencias.find(
    (docente) => construirEtiquetaDocente(docente).toLowerCase() === texto
  );

  docenteIdRegistro.value = exacta ? exacta._id : "";
}

function seleccionarDocenteRegistroExacto() {
  const texto = (buscadorDocenteRegistro.value || "").trim().toLowerCase();

  const docente = docentesRegistroActual.find(
    (item) => construirEtiquetaDocente(item).toLowerCase() === texto
  );

  docenteIdRegistro.value = docente ? docente._id : "";
}

function getCursosActivosPorProyecto(proyectoId) {
  const filtradas = relacionesActivas.filter((rel) => {
    if (!rel.proyectoId || !rel.cursoId) return false;
    if (!proyectoId) return true;
    return String(rel.proyectoId._id) === String(proyectoId);
  });

  const mapa = new Map();

  filtradas.forEach((rel) => {
    const curso = rel.cursoId;
    if (!curso) return;
    mapa.set(String(curso._id), curso);
  });

  return Array.from(mapa.values());
}

function getDocentesPorProyecto(proyectoId) {
  if (!proyectoId) return [];
  return docentesBase.filter(
    (docente) => String(getProyectoIdDocente(docente)) === String(proyectoId)
  );
}

function actualizarCursosRegistro() {
  const cursos = getCursosActivosPorProyecto(proyectoIdRegistro.value);

  llenarSelect(
    cursoIdRegistro,
    cursos,
    (item) => item._id,
    (item) => item.nombreCurso,
    cursos.length ? "Seleccione un curso" : "No hay cursos activos para este proyecto"
  );

  cursoIdRegistro.disabled = !proyectoIdRegistro.value || cursos.length === 0;
  moduloNumeroRegistro.innerHTML = `<option value="">Seleccione un curso</option>`;
  moduloNumeroRegistro.disabled = true;
}

function actualizarDocentesRegistro() {
  docentesRegistroActual = getDocentesPorProyecto(proyectoIdRegistro.value);

  buscadorDocenteRegistro.value = "";
  docenteIdRegistro.value = "";
  renderizarDatalistDocentes(docentesRegistroActual);

  buscadorDocenteRegistro.disabled =
    !proyectoIdRegistro.value || docentesRegistroActual.length === 0;
}

function actualizarModulosRegistro() {
  moduloNumeroRegistro.innerHTML = `<option value="">Seleccione un módulo</option>`;
  moduloNumeroRegistro.disabled = true;

  if (!cursoIdRegistro.value) return;

  const curso = cursosBase.find((item) => String(item._id) === String(cursoIdRegistro.value));
  const totalModulos = Number(curso?.numeroModulos || 0);

  for (let i = 1; i <= totalModulos; i += 1) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `Módulo ${i}`;
    moduloNumeroRegistro.appendChild(option);
  }

  moduloNumeroRegistro.disabled = totalModulos === 0;
}

function actualizarCursosFiltro() {
  const cursos = getCursosActivosPorProyecto(proyectoIdFiltro.value);

  llenarSelect(
    cursoIdFiltro,
    cursos,
    (item) => item._id,
    (item) => item.nombreCurso,
    "Todos los cursos"
  );

  moduloNumeroFiltro.innerHTML = `<option value="">Todos</option>`;
  moduloNumeroFiltro.disabled = true;
  estadoAsistenciaModuloFiltro.value = "todos";
  estadoAsistenciaModuloFiltro.disabled = true;
}

function actualizarModulosFiltro() {
  moduloNumeroFiltro.innerHTML = `<option value="">Todos</option>`;
  moduloNumeroFiltro.disabled = true;
  estadoAsistenciaModuloFiltro.value = "todos";
  estadoAsistenciaModuloFiltro.disabled = true;

  if (!cursoIdFiltro.value) return;

  const curso = cursosBase.find((item) => String(item._id) === String(cursoIdFiltro.value));
  const totalModulos = Number(curso?.numeroModulos || 0);

  for (let i = 1; i <= totalModulos; i += 1) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `Módulo ${i}`;
    moduloNumeroFiltro.appendChild(option);
  }

  moduloNumeroFiltro.disabled = totalModulos === 0;
}

function actualizarEstadoModuloFiltro() {
  estadoAsistenciaModuloFiltro.value = "todos";
  estadoAsistenciaModuloFiltro.disabled = !moduloNumeroFiltro.value;
}

function limpiarVistaConsolidado() {
  kpiTotalDocentesAsistencia.textContent = "0";
  kpiCumplenAsistencia.textContent = "0";
  kpiCertificados.textContent = "0";
  kpiPendientes.textContent = "0";
  resumenFiltrosAsistencia.textContent = "Sin resultados consultados";
  btnDescargarCsvAsistencias.disabled = true;
  consolidadoActual = [];

  renderizarGraficoBarras([]);
  renderizarGraficoTorta(0, 0);
}

function limpiarDetalleDocente(mensaje = "Selecciona un docente para consultar el detalle") {
  tablaDetalleDocente.innerHTML = `
    <tr>
      <td colspan="5" class="text-center">${escaparHtml(mensaje)}</td>
    </tr>
  `;
  detalleDocenteActual = [];
  btnDescargarCsvDetalleDocente.disabled = true;
}

function actualizarIndicadores(indicadores) {
  kpiTotalDocentesAsistencia.textContent = String(indicadores.totalDocentes || 0);
  kpiCumplenAsistencia.textContent = String(indicadores.cumplenAsistencia || 0);
  kpiCertificados.textContent = String(indicadores.certificados || 0);
  kpiPendientes.textContent = String(indicadores.pendientes || 0);
}

function renderizarGraficoBarras(grafico) {
  const canvas = document.getElementById("graficoAsistenciasModulos");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (graficoAsistenciasModulos) {
    graficoAsistenciasModulos.destroy();
  }

  graficoAsistenciasModulos = new Chart(ctx, {
    type: "bar",
    data: {
      labels: grafico.map((item) => `Módulo ${item.moduloNumero}`),
      datasets: [
        {
          label: "% asistencia",
          data: grafico.map((item) => item.porcentaje),
          backgroundColor: "#5E35B1",
          borderColor: "#311B92",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw}%`,
          },
        },
      },
    },
    plugins: [pluginEtiquetasBarras],
  });
}

function renderizarGraficoTorta(certificados, noCertificados) {
  const canvas = document.getElementById("graficoCertificadosTorta");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (graficoCertificadosTorta) {
    graficoCertificadosTorta.destroy();
  }

  graficoCertificadosTorta = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Certificados", "No certificados"],
      datasets: [
        {
          data: [certificados, noCertificados],
          backgroundColor: ["#5E35B1", "#C5B3F7"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
      },
    },
    plugins: [pluginEtiquetasTorta],
  });
}

function actualizarResumenFiltros(data) {
  const proyecto = proyectoIdFiltro.options[proyectoIdFiltro.selectedIndex]?.text || "Todos los proyectos";
  const curso = cursoIdFiltro.options[cursoIdFiltro.selectedIndex]?.text || "Todos los cursos";
  const modulo = moduloNumeroFiltro.value ? `Módulo ${moduloNumeroFiltro.value}` : "Todos";
  const certificacion = estadoCertificacionFiltro.options[estadoCertificacionFiltro.selectedIndex]?.text || "Todos";
  const asistenciaModulo = estadoAsistenciaModuloFiltro.disabled
    ? "No aplica"
    : estadoAsistenciaModuloFiltro.options[estadoAsistenciaModuloFiltro.selectedIndex]?.text || "Todos";

  resumenFiltrosAsistencia.textContent =
    `Proyecto: ${proyecto} | Curso: ${curso} | ${modulo} | Certificación: ${certificacion} | Asistencia módulo: ${asistenciaModulo} | Registros: ${data.detalle.length}`;
}

async function consultarConsolidado() {
  try {
    ocultarAlerta();

    const params = new URLSearchParams();

    if (proyectoIdFiltro.value) {
      params.append("proyectoId", proyectoIdFiltro.value);
    }

    if (cursoIdFiltro.value) {
      params.append("cursoId", cursoIdFiltro.value);
    }

    if (moduloNumeroFiltro.value) {
      params.append("moduloNumero", moduloNumeroFiltro.value);
    }

    if (estadoCertificacionFiltro.value) {
      params.append("estadoCertificacion", estadoCertificacionFiltro.value);
    }

    if (!estadoAsistenciaModuloFiltro.disabled && estadoAsistenciaModuloFiltro.value) {
      params.append("estadoAsistenciaModulo", estadoAsistenciaModuloFiltro.value);
    }

    const response = await fetchConToken(`${API_URL}/asistencias/consolidado?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      mostrarAlerta(data.message || "No fue posible consultar el consolidado.");
      limpiarVistaConsolidado();
      return;
    }

    consolidadoActual = data.detalle || [];
    actualizarIndicadores(data.indicadores || {});
    renderizarGraficoBarras(data.graficoModulos || []);
    renderizarGraficoTorta(
      data.indicadores?.certificados || 0,
      data.indicadores?.pendientes || 0
    );
    actualizarResumenFiltros(data);
    btnDescargarCsvAsistencias.disabled = consolidadoActual.length === 0;
  } catch (error) {
    console.error(error);
    mostrarAlerta("Error de conexión con el servidor.");
    limpiarVistaConsolidado();
  }
}

async function consultarDetalleDocente() {
  try {
    if (!docenteIdDetalle.value) {
      limpiarDetalleDocente("Debes seleccionar un docente");
      return;
    }

    const response = await fetchConToken(`${API_URL}/asistencias`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      limpiarDetalleDocente("No fue posible consultar el detalle del docente");
      return;
    }

    const filtrado = data.filter(
      (item) => String(item.docenteId?._id) === String(docenteIdDetalle.value)
    );

    detalleDocenteActual = filtrado;

    if (!filtrado.length) {
      limpiarDetalleDocente("No hay asistencias registradas para este docente");
      return;
    }

    tablaDetalleDocente.innerHTML = filtrado
      .map((item) => `
        <tr>
          <td>${escaparHtml(item.proyectoCursoId?.proyectoId?.nombre || "")}</td>
          <td>${escaparHtml(item.proyectoCursoId?.cursoId?.nombreCurso || "")}</td>
          <td>Módulo ${escaparHtml(item.moduloNumero)}</td>
          <td>${item.asistio ? "Sí" : "No"}</td>
          <td>${escaparHtml(formatearFecha(item.createdAt))}</td>
        </tr>
      `)
      .join("");

    btnDescargarCsvDetalleDocente.disabled = false;
  } catch (error) {
    console.error(error);
    limpiarDetalleDocente("Error de conexión con el servidor");
  }
}

function descargarCsvConsolidado() {
  if (!consolidadoActual.length) return;

  const encabezados = [
    "Docente",
    "Documento",
    "Proyecto",
    "Curso",
    "ModuloConsultado",
    "AsistenciaModulo",
    "PorcentajeAsistencia",
    "CumpleAsistencia",
    "Certificado",
    "Estado",
  ];

  const filas = consolidadoActual.map((item) => [
    item.nombreCompleto || "",
    item.numeroDocumento || "",
    item.proyectoNombre || "",
    item.cursoNombre || "",
    item.moduloFiltrado ? `Módulo ${item.moduloFiltrado}` : "Todos",
    item.moduloFiltrado ? (item.asistioModuloFiltrado ? "Si" : "No") : "N/A",
    `${item.porcentajeAsistencia || 0}%`,
    item.cumpleAsistencia ? "Si" : "No",
    item.certificado ? "Si" : "No",
    item.estadoGeneral || "",
  ]);

  const contenido = [
    encabezados.map(escaparCsv).join(","),
    ...filas.map((fila) => fila.map(escaparCsv).join(",")),
  ].join("\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);

  enlace.href = url;
  enlace.download = `consolidado_asistencias_${fecha}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

function descargarCsvDetalle() {
  if (!detalleDocenteActual.length) return;

  const encabezados = ["Proyecto", "Curso", "Modulo", "Asistio", "FechaRegistro"];

  const filas = detalleDocenteActual.map((item) => [
    item.proyectoCursoId?.proyectoId?.nombre || "",
    item.proyectoCursoId?.cursoId?.nombreCurso || "",
    `Módulo ${item.moduloNumero || ""}`,
    item.asistio ? "Si" : "No",
    formatearFecha(item.createdAt),
  ]);

  const contenido = [
    encabezados.map(escaparCsv).join(","),
    ...filas.map((fila) => fila.map(escaparCsv).join(",")),
  ].join("\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);

  enlace.href = url;
  enlace.download = `detalle_docente_asistencias_${fecha}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

function limpiarFiltros() {
  proyectoIdFiltro.value = "";
  cursoIdFiltro.value = "";
  moduloNumeroFiltro.value = "";
  estadoCertificacionFiltro.value = "todos";
  estadoAsistenciaModuloFiltro.value = "todos";
  ocultarAlerta();
  actualizarCursosFiltro();
  actualizarModulosFiltro();
  actualizarEstadoModuloFiltro();
  limpiarVistaConsolidado();
}

function limpiarFormularioCurso() {
  formCrearCurso.reset();
  mostrarMensaje(mensajeCurso, "");
}

async function cargarProyectos() {
  const response = await fetchConToken(`${API_URL}/proyectos`);
  const data = await response.json();

  if (!response.ok || !Array.isArray(data)) {
    proyectosBase = [];
    return;
  }

  proyectosBase = data;

  llenarSelect(
    proyectoIdRegistro,
    proyectosBase,
    (item) => item._id,
    (item) => item.nombre,
    "Seleccione un proyecto"
  );

  llenarSelect(
    proyectoIdFiltro,
    proyectosBase,
    (item) => item._id,
    (item) => item.nombre,
    "Todos los proyectos"
  );
}

async function cargarCursos() {
  const response = await fetchConToken(`${API_URL}/cursos`);
  const data = await response.json();

  if (!response.ok || !Array.isArray(data)) {
    cursosBase = [];
    return;
  }

  cursosBase = data;
}

async function cargarDocentes() {
  const response = await fetchConToken(`${API_URL}/docentes`);
  const data = await response.json();

  if (!response.ok || !Array.isArray(data)) {
    docentesBase = [];
    return;
  }

  docentesBase = data;

  llenarSelect(
    docenteIdDetalle,
    docentesBase,
    (item) => item._id,
    (item) => `${item.nombres} ${item.apellidos} - ${item.numeroDocumento}`,
    "Seleccione un docente"
  );
}

async function cargarRelacionesActivas() {
  const response = await fetchConToken(`${API_URL}/proyecto-cursos?activo=true`);
  const data = await response.json();

  if (!response.ok || !Array.isArray(data)) {
    relacionesActivas = [];
    return;
  }

  relacionesActivas = data.filter(
    (item) => item.proyectoId && item.cursoId && item.activo !== false
  );
}

asistenciaForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    seleccionarDocenteRegistroExacto();

    if (
      !proyectoIdRegistro.value ||
      !cursoIdRegistro.value ||
      !docenteIdRegistro.value ||
      !moduloNumeroRegistro.value
    ) {
      mostrarMensaje(
        mensajeAsistencia,
        "Debes seleccionar proyecto, curso, docente y módulo.",
        "danger"
      );
      return;
    }

    const response = await fetchConToken(`${API_URL}/asistencias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proyectoId: proyectoIdRegistro.value,
        cursoId: cursoIdRegistro.value,
        docenteId: docenteIdRegistro.value,
        moduloNumero: Number(moduloNumeroRegistro.value),
        asistio: asistioRegistro.checked,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      mostrarMensaje(
        mensajeAsistencia,
        data.message || "No fue posible registrar la asistencia.",
        "danger"
      );
      return;
    }

    mostrarMensaje(mensajeAsistencia, "Asistencia registrada correctamente.", "success");
    asistenciaForm.reset();
    buscadorDocenteRegistro.value = "";
    docenteIdRegistro.value = "";
    asistioRegistro.checked = true;
    actualizarCursosRegistro();
    actualizarDocentesRegistro();
    actualizarModulosRegistro();
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajeAsistencia, "Error de conexión con el servidor.", "danger");
  }
});

formCrearCurso.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const body = {
      nombreCurso: nombreCurso.value.trim(),
      numeroModulos: Number(numeroModulos.value),
      duracionHoras: Number(duracionHoras.value),
      tipoFormacion: tipoFormacion.value,
      descripcion: descripcionCurso.value.trim(),
      activo: true,
    };

    if (
      !body.nombreCurso ||
      !body.numeroModulos ||
      !body.duracionHoras ||
      !body.tipoFormacion
    ) {
      mostrarMensaje(
        mensajeCurso,
        "Nombre, número de módulos, duración y tipo de formación son obligatorios.",
        "danger"
      );
      return;
    }

    const response = await fetchConToken(`${API_URL}/cursos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      mostrarMensaje(
        mensajeCurso,
        data.message || "No fue posible crear la formación.",
        "danger"
      );
      return;
    }

    mostrarMensaje(mensajeCurso, "Formación creada correctamente.", "success");
    formCrearCurso.reset();

    await cargarCursos();
    await cargarRelacionesActivas();
    actualizarCursosRegistro();
    actualizarCursosFiltro();
  } catch (error) {
    console.error(error);
    mostrarMensaje(mensajeCurso, "Error de conexión con el servidor.", "danger");
  }
});

proyectoIdRegistro.addEventListener("change", () => {
  actualizarCursosRegistro();
  actualizarDocentesRegistro();
  actualizarModulosRegistro();
});

cursoIdRegistro.addEventListener("change", actualizarModulosRegistro);

proyectoIdFiltro.addEventListener("change", () => {
  actualizarCursosFiltro();
  actualizarModulosFiltro();
  actualizarEstadoModuloFiltro();
});

cursoIdFiltro.addEventListener("change", () => {
  actualizarModulosFiltro();
  actualizarEstadoModuloFiltro();
});

moduloNumeroFiltro.addEventListener("change", actualizarEstadoModuloFiltro);

buscadorDocenteRegistro.addEventListener("input", actualizarBuscadorDocenteRegistro);
buscadorDocenteRegistro.addEventListener("change", seleccionarDocenteRegistroExacto);
buscadorDocenteRegistro.addEventListener("blur", seleccionarDocenteRegistroExacto);

btnConsultarConsolidado.addEventListener("click", consultarConsolidado);
btnLimpiarFiltros.addEventListener("click", limpiarFiltros);
btnDescargarCsvAsistencias.addEventListener("click", descargarCsvConsolidado);
btnConsultarDetalleDocente.addEventListener("click", consultarDetalleDocente);
btnDescargarCsvDetalleDocente.addEventListener("click", descargarCsvDetalle);
btnLimpiarCurso.addEventListener("click", limpiarFormularioCurso);

function aplicarRestriccionesPorRolAsistencias() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) return;

  if (user.rol === "formador" && bloqueCrearCurso) {
    bloqueCrearCurso.style.display = "none";
  }
}

async function inicializar() {
  limpiarVistaConsolidado();
  limpiarDetalleDocente();
  aplicarRestriccionesPorRolAsistencias();

  try {
    await Promise.all([
      cargarProyectos(),
      cargarCursos(),
      cargarDocentes(),
      cargarRelacionesActivas(),
    ]);

    actualizarCursosRegistro();
    actualizarDocentesRegistro();
    actualizarCursosFiltro();
    actualizarModulosFiltro();
    actualizarEstadoModuloFiltro();
  } catch (error) {
    console.error(error);
  }
}

inicializar();
