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

const institucionForm = document.getElementById("institucionForm");
const mensajeInstitucion = document.getElementById("mensajeInstitucion");
const tablaInstituciones = document.getElementById("tablaInstituciones");
const proyectoSelect = document.getElementById("proyectoId");

const kpiTotalInstituciones = document.getElementById("kpiTotalInstituciones");
const proyectoFiltroInstituciones = document.getElementById("proyectoFiltroInstituciones");
const buscadorInstituciones = document.getElementById("buscadorInstituciones");
const btnLimpiarFiltrosInstituciones = document.getElementById("btnLimpiarFiltrosInstituciones");
const btnDescargarCsvInstituciones = document.getElementById("btnDescargarCsvInstituciones");

const buscadorInstitucionDetalle = document.getElementById("buscadorInstitucionDetalle");
const listaInstituciones = document.getElementById("listaInstituciones");
const institucionDetalleId = document.getElementById("institucionDetalleId");
const btnConsultarInstitucion = document.getElementById("btnConsultarInstitucion");

const tablaDetalleInstitucion = document.getElementById("tablaDetalleInstitucion");
const tablaDocentesInstitucion = document.getElementById("tablaDocentesInstitucion");

let institucionesBase = [];
let proyectosBase = [];

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

function mostrarMensajeInstitucion(texto, tipo = "info") {
  const clases = {
    success: "text-success",
    danger: "text-danger",
    info: "text-muted",
  };

  mensajeInstitucion.className = `small ${clases[tipo] || "text-muted"}`;
  mensajeInstitucion.textContent = texto;
}

function etiquetaInstitucion(inst) {
  return `${inst.nombre || ""} - ${inst.codigoDane || ""}`.trim();
}

async function cargarProyectosEnSelect() {
  try {
    const response = await fetchConToken(`${API_URL}/proyectos`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data) || !data.length) {
      proyectoSelect.innerHTML = `<option value="">No hay proyectos disponibles</option>`;
      proyectoFiltroInstituciones.innerHTML = `<option value="">Todos los proyectos</option>`;
      proyectosBase = [];
      return;
    }

    proyectosBase = data;

    proyectoSelect.innerHTML = `<option value="">Seleccione un proyecto</option>`;
    proyectoFiltroInstituciones.innerHTML = `<option value="">Todos los proyectos</option>`;

    data.forEach((proyecto) => {
      const optionForm = document.createElement("option");
      optionForm.value = proyecto._id;
      optionForm.textContent = proyecto.nombre;
      proyectoSelect.appendChild(optionForm);

      const optionFiltro = document.createElement("option");
      optionFiltro.value = proyecto._id;
      optionFiltro.textContent = proyecto.nombre;
      proyectoFiltroInstituciones.appendChild(optionFiltro);
    });
  } catch (error) {
    console.error("Error cargando proyectos:", error);
    proyectoSelect.innerHTML = `<option value="">Error cargando proyectos</option>`;
    proyectoFiltroInstituciones.innerHTML = `<option value="">Todos los proyectos</option>`;
  }
}

async function cargarInstituciones() {
  try {
    const response = await fetchConToken(`${API_URL}/instituciones`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      institucionesBase = [];
      tablaInstituciones.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger">No fue posible cargar las instituciones</td>
        </tr>
      `;
      actualizarResumenInstituciones([]);
      limpiarDetalleInstitucion();
      llenarBuscadorInstituciones([]);
      return;
    }

    institucionesBase = data;
    llenarBuscadorInstituciones(data);
    aplicarFiltrosInstituciones();
  } catch (error) {
    console.error("Error cargando instituciones:", error);
    institucionesBase = [];
    tablaInstituciones.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">Error de conexión con el servidor</td>
      </tr>
    `;
    actualizarResumenInstituciones([]);
    limpiarDetalleInstitucion();
    llenarBuscadorInstituciones([]);
  }
}

function obtenerInstitucionesFiltradas() {
  const proyectoId = proyectoFiltroInstituciones.value;
  const textoBusqueda = (buscadorInstituciones.value || "").trim().toLowerCase();

  return institucionesBase.filter((institucion) => {
    const coincideProyecto = proyectoId
      ? String(institucion.proyectoId?._id || institucion.proyectoId) === String(proyectoId)
      : true;

    const textoInstitucion = [
      institucion.nombre || "",
      institucion.codigoDane || "",
      institucion.departamento || "",
      institucion.municipio || "",
      institucion.proyectoId?.nombre || "",
    ]
      .join(" ")
      .toLowerCase();

    const coincideBusqueda = textoBusqueda
      ? textoInstitucion.includes(textoBusqueda)
      : true;

    return coincideProyecto && coincideBusqueda;
  });
}

function renderTablaInstituciones(lista) {
  if (!lista.length) {
    tablaInstituciones.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">No hay instituciones con el filtro aplicado</td>
      </tr>
    `;
    return;
  }

  tablaInstituciones.innerHTML = lista
    .map(
      (institucion) => `
        <tr>
          <td>${escaparHtml(institucion.nombre || "")}</td>
          <td>${escaparHtml(institucion.codigoDane || "")}</td>
          <td>${escaparHtml(institucion.departamento || "")}</td>
          <td>${escaparHtml(institucion.municipio || "")}</td>
          <td>${escaparHtml(institucion.zona || "")}</td>
          <td>${escaparHtml(institucion.sector || "")}</td>
          <td>${escaparHtml(institucion.proyectoId?.nombre || "")}</td>
        </tr>
      `
    )
    .join("");
}

function actualizarResumenInstituciones(lista) {
  kpiTotalInstituciones.textContent = String(lista.length);
  btnDescargarCsvInstituciones.disabled = lista.length === 0;
}

function aplicarFiltrosInstituciones() {
  const filtradas = obtenerInstitucionesFiltradas();
  renderTablaInstituciones(filtradas);
  actualizarResumenInstituciones(filtradas);
}

function llenarBuscadorInstituciones(lista) {
  listaInstituciones.innerHTML = "";

  const ordenadas = [...lista].sort((a, b) =>
    etiquetaInstitucion(a).toLowerCase().localeCompare(etiquetaInstitucion(b).toLowerCase())
  );

  ordenadas.forEach((institucion) => {
    const option = document.createElement("option");
    option.value = etiquetaInstitucion(institucion);
    listaInstituciones.appendChild(option);
  });
}

function sincronizarInstitucionDetalleId() {
  const texto = (buscadorInstitucionDetalle.value || "").trim().toLowerCase();

  const institucion = institucionesBase.find((i) => {
    const etiqueta = etiquetaInstitucion(i).toLowerCase();
    const porNombre = String(i.nombre || "").toLowerCase() === texto;
    const porCodigo = String(i.codigoDane || "").toLowerCase() === texto;
    return etiqueta === texto || porNombre || porCodigo;
  });

  institucionDetalleId.value = institucion ? institucion._id : "";
}

function limpiarDetalleInstitucion() {
  tablaDetalleInstitucion.innerHTML = `
    <tr>
      <td colspan="4" class="text-center">Selecciona una institución</td>
    </tr>
  `;

  tablaDocentesInstitucion.innerHTML = `
    <tr>
      <td colspan="4" class="text-center">Consulta una institución para ver sus docentes</td>
    </tr>
  `;
}

function renderDetalleInstitucion(data) {
  if (!data || !data.institucion) {
    limpiarDetalleInstitucion();
    return;
  }

  const i = data.institucion;

  tablaDetalleInstitucion.innerHTML = `
    <tr>
      <td>${escaparHtml(i.nombre || "")}</td>
      <td>${escaparHtml(i.codigoDane || "")}</td>
      <td>${escaparHtml(i.municipio || "")}</td>
      <td>${escaparHtml(i.proyectoId?.nombre || "")}</td>
    </tr>
  `;

  if (!data.docentes || !data.docentes.length) {
    tablaDocentesInstitucion.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">Sin docentes registrados en esta institución</td>
      </tr>
    `;
    return;
  }

  tablaDocentesInstitucion.innerHTML = data.docentes
    .map(
      (d) => `
        <tr>
          <td>${escaparHtml(d.numeroDocumento || "")}</td>
          <td>${escaparHtml(`${d.nombres || ""} ${d.apellidos || ""}`.trim())}</td>
          <td>${escaparHtml(d.email || "")}</td>
          <td>${escaparHtml(d.proyectoId?.nombre || "")}</td>
        </tr>
      `
    )
    .join("");
}

function descargarCsvInstituciones() {
  const institucionesFiltradas = obtenerInstitucionesFiltradas();

  if (!institucionesFiltradas.length) return;

  const encabezados = [
    "Nombre",
    "CodigoDane",
    "Departamento",
    "Municipio",
    "Zona",
    "Sector",
    "Proyecto",
  ];

  const filas = institucionesFiltradas.map((institucion) => [
    institucion.nombre || "",
    institucion.codigoDane || "",
    institucion.departamento || "",
    institucion.municipio || "",
    institucion.zona || "",
    institucion.sector || "",
    institucion.proyectoId?.nombre || "",
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
  enlace.download = `instituciones_filtradas_${fecha}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

institucionForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  mostrarMensajeInstitucion("");

  const body = {
    nombre: document.getElementById("nombre").value.trim(),
    codigoDane: document.getElementById("codigoDane").value.trim(),
    departamento: document.getElementById("departamento").value.trim(),
    municipio: document.getElementById("municipio").value.trim(),
    zona: document.getElementById("zona").value,
    sector: document.getElementById("sector").value,
    proyectoId: document.getElementById("proyectoId").value,
  };

  try {
    const response = await fetchConToken(`${API_URL}/instituciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      mostrarMensajeInstitucion(
        data.message || "No fue posible guardar la institución",
        "danger"
      );
      return;
    }

    mostrarMensajeInstitucion("Institución guardada correctamente", "success");

    institucionForm.reset();
    document.getElementById("zona").value = "urbana";
    document.getElementById("sector").value = "oficial";

    await cargarInstituciones();
    await cargarProyectosEnSelect();
  } catch (error) {
    console.error("Error creando institución:", error);
    mostrarMensajeInstitucion("Error de conexión con el servidor", "danger");
  }
});

proyectoFiltroInstituciones.addEventListener("change", aplicarFiltrosInstituciones);
buscadorInstituciones.addEventListener("input", aplicarFiltrosInstituciones);
btnLimpiarFiltrosInstituciones.addEventListener("click", () => {
  proyectoFiltroInstituciones.value = "";
  buscadorInstituciones.value = "";
  aplicarFiltrosInstituciones();
});
btnDescargarCsvInstituciones.addEventListener("click", descargarCsvInstituciones);

buscadorInstitucionDetalle.addEventListener("input", sincronizarInstitucionDetalleId);
buscadorInstitucionDetalle.addEventListener("change", sincronizarInstitucionDetalleId);
buscadorInstitucionDetalle.addEventListener("blur", sincronizarInstitucionDetalleId);

btnConsultarInstitucion.addEventListener("click", async () => {
  sincronizarInstitucionDetalleId();
  const id = institucionDetalleId.value;

  if (!id) {
    limpiarDetalleInstitucion();
    return;
  }

  try {
    const response = await fetchConToken(`${API_URL}/instituciones/${id}/detalle`);
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      limpiarDetalleInstitucion();
      return;
    }

    renderDetalleInstitucion(data);
  } catch (error) {
    console.error("Error consultando detalle:", error);
    limpiarDetalleInstitucion();
  }
});

async function inicializar() {
  await Promise.all([cargarProyectosEnSelect(), cargarInstituciones()]);
  limpiarDetalleInstitucion();
}

inicializar();