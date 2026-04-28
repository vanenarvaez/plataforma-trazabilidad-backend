const API_URL = `${window.location.origin}/api`;
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "../index.html";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

const proyectoForm = document.getElementById("proyectoForm");
const mensajeProyecto = document.getElementById("mensajeProyecto");
const tablaProyectos = document.getElementById("tablaProyectos");
const totalProyectos = document.getElementById("totalProyectos");
const buscador = document.getElementById("buscadorProyectos");
const btnCsv = document.getElementById("btnCsvProyectos");

const buscadorDetalle = document.getElementById("buscadorProyectoDetalle");
const listaProyectosDetalle = document.getElementById("listaProyectosDetalle");
const proyectoDetalleId = document.getElementById("proyectoDetalleId");
const btnDetalle = document.getElementById("btnDetalleProyecto");

const detalleProyecto = document.getElementById("detalleProyecto");
const tablaInstituciones = document.getElementById("tablaInstitucionesProyecto");

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

function formatearFecha(fecha) {
  if (!fecha) return "";
  const f = new Date(fecha);
  if (isNaN(f.getTime())) return "";
  return f.toLocaleDateString("es-CO");
}

function etiquetaProyecto(proyecto) {
  return `${proyecto.nombre || ""}`.trim();
}

async function cargarProyectos() {
  try {
    const response = await fetchConToken(`${API_URL}/proyectos`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      proyectosBase = [];
      tablaProyectos.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger">No fue posible cargar los proyectos</td>
        </tr>
      `;
      totalProyectos.textContent = "0";
      llenarBuscadorDetalle([]);
      limpiarDetalleProyecto();
      return;
    }

    proyectosBase = data;
    render(data);
    llenarBuscadorDetalle(data);
  } catch (error) {
    console.error("Error cargando proyectos:", error);
    proyectosBase = [];
    tablaProyectos.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">Error de conexión con el servidor</td>
      </tr>
    `;
    totalProyectos.textContent = "0";
    llenarBuscadorDetalle([]);
    limpiarDetalleProyecto();
  }
}

function render(lista) {
  const user = getUser();

  totalProyectos.textContent = String(lista.length);

  if (!lista.length) {
    tablaProyectos.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No hay proyectos registrados</td>
      </tr>
    `;
    return;
  }

  tablaProyectos.innerHTML = lista.map((p) => `
    <tr>
      <td>${escaparHtml(p.nombre || "")}</td>
      <td>${escaparHtml(p.cliente || "")}</td>
      <td>${escaparHtml(p.estado || "")}</td>
      <td>${p.activo ? "Activo" : "Inactivo"}</td>
      <td>${formatearFecha(p.fechaInicio)}</td>
      <td>${formatearFecha(p.fechaFin)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="editarProyecto('${p._id}')">Editar</button>
        <button class="btn btn-sm btn-outline-warning" onclick="toggleActivo('${p._id}', ${p.activo})">
          ${p.activo ? "Inactivar" : "Activar"}
        </button>

        ${
          user?.rol === "admin"
            ? `<button class="btn btn-sm btn-outline-danger" onclick="eliminarProyecto('${p._id}')">Eliminar</button>`
            : ""
        }
      </td>
    </tr>
  `).join("");
}

function obtenerProyectosFiltrados() {
  const texto = (buscador.value || "").trim().toLowerCase();

  return proyectosBase.filter((p) =>
    String(p.nombre || "").toLowerCase().includes(texto)
  );
}

function aplicarFiltroProyectos() {
  const filtrados = obtenerProyectosFiltrados();
  render(filtrados);
}

function descargarCsvProyectos() {
  const filtrados = obtenerProyectosFiltrados();

  if (!filtrados.length) return;

  const encabezados = ["Nombre", "Cliente", "Estado", "FechaInicio", "FechaFin"];
  const filas = filtrados.map((p) => [
    p.nombre || "",
    p.cliente || "",
    p.estado || "",
    formatearFecha(p.fechaInicio),
    formatearFecha(p.fechaFin),
  ]);

  const contenido = [
    encabezados.map(escaparCsv).join(","),
    ...filas.map((fila) => fila.map(escaparCsv).join(",")),
  ].join("\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);

  a.href = url;
  a.download = `proyectos_${fecha}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function llenarBuscadorDetalle(lista) {
  listaProyectosDetalle.innerHTML = "";

  const ordenados = [...lista].sort((a, b) =>
    etiquetaProyecto(a).toLowerCase().localeCompare(etiquetaProyecto(b).toLowerCase())
  );

  ordenados.forEach((proyecto) => {
    const option = document.createElement("option");
    option.value = etiquetaProyecto(proyecto);
    listaProyectosDetalle.appendChild(option);
  });
}

function sincronizarProyectoDetalleId() {
  const texto = (buscadorDetalle.value || "").trim().toLowerCase();

  const proyecto = proyectosBase.find((p) => {
    const nombre = String(p.nombre || "").toLowerCase();
    return nombre === texto;
  });

  proyectoDetalleId.value = proyecto ? proyecto._id : "";
}

function limpiarDetalleProyecto() {
  detalleProyecto.innerHTML = `
    <tr>
      <td colspan="3" class="text-center">Consulta un proyecto</td>
    </tr>
  `;

  tablaInstituciones.innerHTML = `
    <tr>
      <td colspan="2" class="text-center">Sin datos</td>
    </tr>
  `;
}

function renderDetalle(data) {
  if (!data || !data.proyecto) {
    limpiarDetalleProyecto();
    return;
  }

  detalleProyecto.innerHTML = `
    <tr>
      <td>${escaparHtml(data.proyecto.nombre || "")}</td>
      <td>${escaparHtml(data.proyecto.cliente || "")}</td>
      <td>${escaparHtml(data.proyecto.estado || "")}</td>
    </tr>
  `;

  if (!data.instituciones || !data.instituciones.length) {
    tablaInstituciones.innerHTML = `
      <tr>
        <td colspan="2" class="text-center">Sin instituciones</td>
      </tr>
    `;
    return;
  }

  tablaInstituciones.innerHTML = data.instituciones.map((i) => `
    <tr>
      <td>${escaparHtml(i.nombre || "")}</td>
      <td>${escaparHtml(i.municipio || "")}</td>
    </tr>
  `).join("");
}

async function eliminarProyecto(id) {
  if (!confirm("¿Seguro que deseas eliminar este proyecto?")) return;

  await fetchConToken(`${API_URL}/proyectos/${id}`, {
    method: "DELETE",
  });

  cargarProyectos();
}

async function toggleActivo(id, activo) {
  await fetchConToken(`${API_URL}/proyectos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activo: !activo }),
  });

  cargarProyectos();
}

window.editarProyecto = function (id) {
  const proyecto = proyectosBase.find((p) => String(p._id) === String(id));
  if (!proyecto) return;

  proyectoIdEdicion.value = proyecto._id;
  document.getElementById("nombre").value = proyecto.nombre || "";
  document.getElementById("fuenteFinanciacion").value = proyecto.fuenteFinanciacion || "";
  document.getElementById("cliente").value = proyecto.cliente || "";
  document.getElementById("fechaInicio").value = formatearFecha(proyecto.fechaInicio);
  document.getElementById("fechaFin").value = formatearFecha(proyecto.fechaFin);
  document.getElementById("estado").value = proyecto.estado || "planeacion";
  document.getElementById("cantidadMunicipios").value = proyecto.cantidadMunicipios ?? "";
  document.getElementById("cantidadIE").value = proyecto.cantidadIE ?? "";
  document.getElementById("cantidadSedes").value = proyecto.cantidadSedes ?? "";
  document.getElementById("cantidadDocentes").value = proyecto.cantidadDocentes ?? "";
  document.getElementById("cantidadEstudiantes").value = proyecto.cantidadEstudiantes ?? "";

  btnGuardarProyecto.textContent = "Actualizar proyecto";
  mensajeProyecto.textContent = "Editando proyecto seleccionado";
  mensajeProyecto.className = "small text-primary";

  window.scrollTo({ top: 0, behavior: "smooth" });
};



proyectoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  mensajeProyecto.textContent = "";
  mensajeProyecto.className = "small";

  const body = {
    nombre: document.getElementById("nombre").value.trim(),
    fuenteFinanciacion: document.getElementById("fuenteFinanciacion").value.trim(),
    cliente: document.getElementById("cliente").value.trim(),
    fechaInicio: document.getElementById("fechaInicio").value || null,
    fechaFin: document.getElementById("fechaFin").value || null,
    estado: document.getElementById("estado").value,
    cantidadMunicipios: Number(document.getElementById("cantidadMunicipios").value) || 0,
    cantidadIE: Number(document.getElementById("cantidadIE").value) || 0,
    cantidadSedes: Number(document.getElementById("cantidadSedes").value) || 0,
    cantidadDocentes: Number(document.getElementById("cantidadDocentes").value) || 0,
    cantidadEstudiantes: Number(document.getElementById("cantidadEstudiantes").value) || 0,
  };

  try {
    const response = await fetchConToken(`${API_URL}/proyectos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      mensajeProyecto.textContent = data.message || "No fue posible guardar el proyecto";
      mensajeProyecto.classList.add("text-danger");
      return;
    }

    mensajeProyecto.textContent = "Proyecto guardado correctamente";
    mensajeProyecto.classList.add("text-success");

    proyectoForm.reset();
    document.getElementById("estado").value = "planeacion";

    await cargarProyectos();
  } catch (error) {
    console.error("Error creando proyecto:", error);
    mensajeProyecto.textContent = "Error de conexión con el servidor";
    mensajeProyecto.classList.add("text-danger");
  }
});

buscador.addEventListener("input", aplicarFiltroProyectos);
btnCsv.addEventListener("click", descargarCsvProyectos);

buscadorDetalle.addEventListener("input", sincronizarProyectoDetalleId);
buscadorDetalle.addEventListener("change", sincronizarProyectoDetalleId);
buscadorDetalle.addEventListener("blur", sincronizarProyectoDetalleId);

btnDetalle.addEventListener("click", async () => {
  sincronizarProyectoDetalleId();
  const id = proyectoDetalleId.value;

  if (!id) {
    limpiarDetalleProyecto();
    return;
  }

  try {
    const res = await fetchConToken(`${API_URL}/proyectos/${id}/detalle`);
    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      limpiarDetalleProyecto();
      return;
    }

    renderDetalle(data);
  } catch (error) {
    console.error("Error consultando detalle del proyecto:", error);
    limpiarDetalleProyecto();
  }
});

async function inicializar() {
  await cargarProyectos();
  limpiarDetalleProyecto();
}

inicializar();