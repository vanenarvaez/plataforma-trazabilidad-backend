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

const docenteForm = document.getElementById("docenteForm");
const mensajeDocente = document.getElementById("mensajeDocente");
const tablaDocentes = document.getElementById("tablaDocentes");
const proyectoSelect = document.getElementById("proyectoId");
const institucionSelect = document.getElementById("institucionId");

const proyectoFiltroDocentes = document.getElementById("proyectoFiltroDocentes");
const buscadorDocentes = document.getElementById("buscadorDocentes");
const btnDescargarCsvDocentes = document.getElementById("btnDescargarCsvDocentes");

const kpiTotalDocentes = document.getElementById("kpiTotalDocentes");
const resumenFiltroDocentes = document.getElementById("resumenFiltroDocentes");
const resumenTextoDocentes = document.getElementById("resumenTextoDocentes");

const proyectoFiltroListado = document.getElementById("proyectoFiltroListado");
const buscadorListadoDocentes = document.getElementById("buscadorListadoDocentes");
const btnLimpiarFiltrosListado = document.getElementById("btnLimpiarFiltrosListado");
const btnDescargarCsvDocentesListado = document.getElementById("btnDescargarCsvDocentesListado");

const buscadorDocenteDetalle = document.getElementById("buscadorDocenteDetalle");
const listaDocentesDetalle = document.getElementById("listaDocentesDetalle");
const docenteDetalleId = document.getElementById("docenteDetalleId");
const btnConsultarDocente = document.getElementById("btnConsultarDocente");
const tablaDetalleDocente = document.getElementById("tablaDetalleDocente");
const tablaCursosDocente = document.getElementById("tablaCursosDocente");

let docentesBase = [];
let proyectosBase = [];
let graficoDocentesProyecto = null;

const coloresCorporativos = [
  "#462cb9",
  "#0098e4",
  "#9e19db",
  "#58f1ff",
  "#d90cf1",
  "#120b2e",
  "#7b5ce0",
  "#39bdf2",
  "#b34ae6",
  "#8af6ff",
];

const pluginEtiquetasTortaDocentes = {
  id: "pluginEtiquetasTortaDocentes",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];

    if (!dataset || !dataset.data || !dataset.data.length) return;

    const total = dataset.data.reduce((acc, item) => acc + Number(item || 0), 0);
    if (!total) return;

    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.font = "bold 12px Arial";
    ctx.fillStyle = "#120b2e";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    meta.data.forEach((slice, index) => {
      const valor = Number(dataset.data[index] || 0);
      if (!valor) return;

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

function mostrarMensajeDocente(texto, tipo = "info") {
  const clases = {
    success: "text-success",
    danger: "text-danger",
    info: "text-muted",
  };

  mensajeDocente.className = `small ${clases[tipo] || "text-muted"}`;
  mensajeDocente.textContent = texto;
}

function etiquetaDocente(docente) {
  return `${docente.nombres || ""} ${docente.apellidos || ""} - ${docente.numeroDocumento || ""}`.trim();
}

async function cargarProyectos() {
  try {
    const response = await fetchConToken(`${API_URL}/proyectos`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data) || !data.length) {
      proyectoSelect.innerHTML = `<option value="">No hay proyectos disponibles</option>`;
      proyectoFiltroDocentes.innerHTML = `<option value="">Todos los proyectos</option>`;
      proyectoFiltroListado.innerHTML = `<option value="">Todos los proyectos</option>`;
      proyectosBase = [];
      return;
    }

    proyectosBase = data;

    proyectoSelect.innerHTML = `<option value="">Seleccione un proyecto</option>`;
    proyectoFiltroDocentes.innerHTML = `<option value="">Todos los proyectos</option>`;
    proyectoFiltroListado.innerHTML = `<option value="">Todos los proyectos</option>`;

    data.forEach((proyecto) => {
      const optionRegistro = document.createElement("option");
      optionRegistro.value = proyecto._id;
      optionRegistro.textContent = proyecto.nombre;
      proyectoSelect.appendChild(optionRegistro);

      const optionFiltro = document.createElement("option");
      optionFiltro.value = proyecto._id;
      optionFiltro.textContent = proyecto.nombre;
      proyectoFiltroDocentes.appendChild(optionFiltro);

      const optionListado = document.createElement("option");
      optionListado.value = proyecto._id;
      optionListado.textContent = proyecto.nombre;
      proyectoFiltroListado.appendChild(optionListado);
    });
  } catch (error) {
    console.error(error);
    proyectoSelect.innerHTML = `<option value="">Error cargando proyectos</option>`;
    proyectoFiltroDocentes.innerHTML = `<option value="">Todos los proyectos</option>`;
    proyectoFiltroListado.innerHTML = `<option value="">Todos los proyectos</option>`;
    proyectosBase = [];
  }
}

async function cargarInstituciones() {
  try {
    const response = await fetchConToken(`${API_URL}/instituciones`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data) || !data.length) {
      institucionSelect.innerHTML = `<option value="">No hay instituciones disponibles</option>`;
      return;
    }

    institucionSelect.innerHTML = `<option value="">Seleccione una institución</option>`;
    data.forEach((institucion) => {
      const option = document.createElement("option");
      option.value = institucion._id;
      option.textContent = institucion.nombre;
      institucionSelect.appendChild(option);
    });
  } catch (error) {
    console.error(error);
    institucionSelect.innerHTML = `<option value="">Error cargando instituciones</option>`;
  }
}

async function cargarDocentes() {
  try {
    const response = await fetchConToken(`${API_URL}/docentes`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      docentesBase = [];
      tablaDocentes.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger">No fue posible cargar los docentes</td>
        </tr>
      `;
      limpiarDetalleDocente();
      actualizarResumenYGraficos([]);
      llenarBuscadorDetalle([]);
      return;
    }

    docentesBase = data;
    llenarBuscadorDetalle(data);
    aplicarFiltrosDocentes();
  } catch (error) {
    console.error(error);
    docentesBase = [];
    tablaDocentes.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">Error de conexión con el servidor</td>
      </tr>
    `;
    limpiarDetalleDocente();
    actualizarResumenYGraficos([]);
    llenarBuscadorDetalle([]);
  }
}

function obtenerDocentesFiltradosResumen() {
  const proyectoId = proyectoFiltroDocentes.value;
  const textoBusqueda = (buscadorDocentes.value || "").trim().toLowerCase();

  return docentesBase.filter((docente) => {
    const coincideProyecto = proyectoId
      ? String(docente.proyectoId?._id || docente.proyectoId) === String(proyectoId)
      : true;

    const textoDocente = [
      docente.tipoDocumento || "",
      docente.numeroDocumento || "",
      docente.nombres || "",
      docente.apellidos || "",
      docente.email || "",
      docente.telefono || "",
      docente.institucionId?.nombre || "",
      docente.proyectoId?.nombre || "",
    ]
      .join(" ")
      .toLowerCase();

    const coincideBusqueda = textoBusqueda ? textoDocente.includes(textoBusqueda) : true;

    return coincideProyecto && coincideBusqueda;
  });
}

function obtenerDocentesFiltradosListado() {
  const proyectoId = proyectoFiltroListado.value;
  const textoBusqueda = (buscadorListadoDocentes.value || "").trim().toLowerCase();

  return docentesBase.filter((docente) => {
    const coincideProyecto = proyectoId
      ? String(docente.proyectoId?._id || docente.proyectoId) === String(proyectoId)
      : true;

    const textoDocente = [
      docente.tipoDocumento || "",
      docente.numeroDocumento || "",
      docente.nombres || "",
      docente.apellidos || "",
      docente.email || "",
      docente.telefono || "",
      docente.institucionId?.nombre || "",
      docente.proyectoId?.nombre || "",
    ]
      .join(" ")
      .toLowerCase();

    const coincideBusqueda = textoBusqueda ? textoDocente.includes(textoBusqueda) : true;

    return coincideProyecto && coincideBusqueda;
  });
}

function renderizarTablaDocentes(docentes) {
  if (!docentes.length) {
    tablaDocentes.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">No hay docentes con el filtro aplicado</td>
      </tr>
    `;
    return;
  }

  tablaDocentes.innerHTML = docentes
    .map(
      (docente) => `
        <tr>
          <td>${escaparHtml(docente.tipoDocumento || "")} ${escaparHtml(docente.numeroDocumento || "")}</td>
          <td>${escaparHtml(docente.nombres || "")} ${escaparHtml(docente.apellidos || "")}</td>
          <td>${escaparHtml(docente.email || "")}</td>
          <td>${escaparHtml(docente.telefono || "")}</td>
          <td>${escaparHtml(docente.institucionId?.nombre || "")}</td>
          <td>${escaparHtml(docente.proyectoId?.nombre || "")}</td>
          <td>${docente.activo === false ? "Inactivo" : "Activo"}</td>
        </tr>
      `
    )
    .join("");
}

function actualizarResumenYGraficos(docentesFiltrados) {
  const total = docentesFiltrados.length;
  kpiTotalDocentes.textContent = String(total);
  btnDescargarCsvDocentes.disabled = total === 0;
  btnDescargarCsvDocentesListado.disabled = docentesBase.length === 0;

  const proyectoSeleccionadoTexto =
    proyectoFiltroDocentes.options[proyectoFiltroDocentes.selectedIndex]?.text ||
    "Todos los proyectos";

  resumenFiltroDocentes.textContent = `Proyecto: ${proyectoSeleccionadoTexto} | Resultados: ${total}`;

  const textoBusqueda = (buscadorDocentes.value || "").trim();
  resumenTextoDocentes.innerHTML = `
    <div><strong>Proyecto:</strong> ${escaparHtml(proyectoSeleccionadoTexto)}</div>
    <div><strong>Búsqueda:</strong> ${escaparHtml(textoBusqueda || "Sin búsqueda")}</div>
    <div><strong>Total mostrado:</strong> ${total}</div>
  `;

  const distribucion = new Map();

  docentesFiltrados.forEach((docente) => {
    const nombreProyecto = docente.proyectoId?.nombre || "Sin proyecto";
    distribucion.set(nombreProyecto, (distribucion.get(nombreProyecto) || 0) + 1);
  });

  const etiquetas = Array.from(distribucion.keys());
  const valores = Array.from(distribucion.values());

  renderizarGraficoDocentes(etiquetas, valores);
}

function renderizarGraficoDocentes(labels, data) {
  const canvas = document.getElementById("graficoDocentesProyecto");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (graficoDocentesProyecto) {
    graficoDocentesProyecto.destroy();
  }

  graficoDocentesProyecto = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, index) => coloresCorporativos[index % coloresCorporativos.length]),
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const valor = context.raw || 0;
              const porcentaje = total ? ((valor / total) * 100).toFixed(1) : "0.0";
              return `${context.label}: ${valor} (${porcentaje}%)`;
            },
          },
        },
      },
    },
    plugins: [pluginEtiquetasTortaDocentes],
  });
}

function aplicarFiltrosDocentes() {
  const docentesResumen = obtenerDocentesFiltradosResumen();
  const docentesListado = obtenerDocentesFiltradosListado();

  actualizarResumenYGraficos(docentesResumen);
  renderizarTablaDocentes(docentesListado);
}

function descargarCsvDesdeLista(docentes, nombreArchivo) {
  if (!docentes.length) return;

  const encabezados = [
    "TipoDocumento",
    "NumeroDocumento",
    "Nombres",
    "Apellidos",
    "Correo",
    "Telefono",
    "Institucion",
    "Proyecto",
    "Activo",
  ];

  const filas = docentes.map((docente) => [
    docente.tipoDocumento || "",
    docente.numeroDocumento || "",
    docente.nombres || "",
    docente.apellidos || "",
    docente.email || "",
    docente.telefono || "",
    docente.institucionId?.nombre || "",
    docente.proyectoId?.nombre || "",
    docente.activo === false ? "No" : "Si",
  ]);

  const contenido = [
    encabezados.map(escaparCsv).join(","),
    ...filas.map((fila) => fila.map(escaparCsv).join(",")),
  ].join("\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

function descargarCsvDocentesResumen() {
  const docentesFiltrados = obtenerDocentesFiltradosResumen();
  const fecha = new Date().toISOString().slice(0, 10);
  descargarCsvDesdeLista(docentesFiltrados, `docentes_resumen_${fecha}.csv`);
}

function descargarCsvDocentesListado() {
  const docentesFiltrados = obtenerDocentesFiltradosListado();
  const fecha = new Date().toISOString().slice(0, 10);
  descargarCsvDesdeLista(docentesFiltrados, `docentes_listado_${fecha}.csv`);
}

function llenarBuscadorDetalle(docentes) {
  listaDocentesDetalle.innerHTML = "";

  const ordenados = [...docentes].sort((a, b) => {
    const nombreA = etiquetaDocente(a).toLowerCase();
    const nombreB = etiquetaDocente(b).toLowerCase();
    return nombreA.localeCompare(nombreB);
  });

  ordenados.forEach((docente) => {
    const option = document.createElement("option");
    option.value = etiquetaDocente(docente);
    listaDocentesDetalle.appendChild(option);
  });
}

function sincronizarDocenteDetalleId() {
  const texto = (buscadorDocenteDetalle.value || "").trim().toLowerCase();

  const docente = docentesBase.find((d) => {
    const etiqueta = etiquetaDocente(d).toLowerCase();
    const porDocumento = String(d.numeroDocumento || "").toLowerCase() === texto;
    return etiqueta === texto || porDocumento;
  });

  docenteDetalleId.value = docente ? docente._id : "";
}

function renderizarDetalleDocenteCompleto(data) {
  if (!data || !data.docente) {
    limpiarDetalleDocente();
    return;
  }

  const d = data.docente;

  tablaDetalleDocente.innerHTML = `
    <tr>
      <td>${escaparHtml(d.tipoDocumento || "")} ${escaparHtml(d.numeroDocumento || "")}</td>
      <td>${escaparHtml(d.nombres || "")} ${escaparHtml(d.apellidos || "")}</td>
      <td>${escaparHtml(d.email || "")}</td>
      <td>${escaparHtml(d.telefono || "")}</td>
      <td>${escaparHtml(d.institucion || "")}</td>
      <td>${escaparHtml(d.proyecto || "")}</td>
      <td>${d.activo ? "Activo" : "Inactivo"}</td>
    </tr>
  `;

  if (data.cursos && data.cursos.length) {
    tablaCursosDocente.innerHTML = data.cursos
      .map(
        (c) => `
          <tr>
            <td>${escaparHtml(c.proyecto || "")}</td>
            <td>${escaparHtml(c.nombreCurso || "")}</td>
            <td>${Number(c.porcentajeAsistencia || 0)}%</td>
            <td>${c.certificado ? "Sí" : "No"}</td>
          </tr>
        `
      )
      .join("");
  } else {
    tablaCursosDocente.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">El docente no tiene cursos asociados</td>
      </tr>
    `;
  }
}

function limpiarDetalleDocente() {
  tablaDetalleDocente.innerHTML = `
    <tr>
      <td colspan="7" class="text-center">Selecciona un docente para ver el detalle</td>
    </tr>
  `;

  tablaCursosDocente.innerHTML = `
    <tr>
      <td colspan="4" class="text-center">Consulta un docente para ver sus cursos</td>
    </tr>
  `;
}

docenteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  mostrarMensajeDocente("");

  const body = {
    tipoDocumento: document.getElementById("tipoDocumento").value,
    numeroDocumento: document.getElementById("numeroDocumento").value.trim(),
    nombres: document.getElementById("nombres").value.trim(),
    apellidos: document.getElementById("apellidos").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    institucionId: document.getElementById("institucionId").value,
    proyectoId: document.getElementById("proyectoId").value,
    activo: document.getElementById("activo").checked,
  };

  try {
    const response = await fetchConToken(`${API_URL}/docentes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      mostrarMensajeDocente(
        data.message || "No fue posible guardar el docente",
        "danger"
      );
      return;
    }

    mostrarMensajeDocente("Docente guardado correctamente", "success");

    docenteForm.reset();
    document.getElementById("tipoDocumento").value = "CC";
    document.getElementById("activo").checked = true;

    await cargarDocentes();
  } catch (error) {
    console.error(error);
    mostrarMensajeDocente("Error de conexión con el servidor", "danger");
  }
});

proyectoFiltroDocentes.addEventListener("change", aplicarFiltrosDocentes);
buscadorDocentes.addEventListener("input", aplicarFiltrosDocentes);

proyectoFiltroListado.addEventListener("change", aplicarFiltrosDocentes);
buscadorListadoDocentes.addEventListener("input", aplicarFiltrosDocentes);

btnLimpiarFiltrosListado.addEventListener("click", () => {
  proyectoFiltroListado.value = "";
  buscadorListadoDocentes.value = "";
  aplicarFiltrosDocentes();
});

btnDescargarCsvDocentes.addEventListener("click", descargarCsvDocentesResumen);
btnDescargarCsvDocentesListado.addEventListener("click", descargarCsvDocentesListado);

buscadorDocenteDetalle.addEventListener("input", sincronizarDocenteDetalleId);
buscadorDocenteDetalle.addEventListener("change", sincronizarDocenteDetalleId);
buscadorDocenteDetalle.addEventListener("blur", sincronizarDocenteDetalleId);

btnConsultarDocente.addEventListener("click", async () => {
  sincronizarDocenteDetalleId();
  const docenteId = docenteDetalleId.value;

  if (!docenteId) {
    limpiarDetalleDocente();
    return;
  }

  try {
    const response = await fetchConToken(`${API_URL}/docentes/${docenteId}/ficha`);
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      limpiarDetalleDocente();
      return;
    }

    renderizarDetalleDocenteCompleto(data);
  } catch (error) {
    console.error(error);
    limpiarDetalleDocente();
  }
});

async function inicializar() {
  await Promise.all([cargarProyectos(), cargarInstituciones(), cargarDocentes()]);
  limpiarDetalleDocente();
}

inicializar();