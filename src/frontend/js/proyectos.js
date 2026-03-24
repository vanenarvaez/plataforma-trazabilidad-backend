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

const proyectoForm = document.getElementById("proyectoForm");
const mensajeProyecto = document.getElementById("mensajeProyecto");
const tablaProyectos = document.getElementById("tablaProyectos");

async function cargarProyectos() {
  try {
    const response = await fetch(`${API_URL}/proyectos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      tablaProyectos.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger">No fue posible cargar los proyectos</td>
        </tr>
      `;
      return;
    }

    if (!data.length) {
      tablaProyectos.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">No hay proyectos registrados</td>
        </tr>
      `;
      return;
    }

    tablaProyectos.innerHTML = data
      .map(
        (proyecto) => `
          <tr>
            <td>${proyecto.nombre || ""}</td>
            <td>${proyecto.cliente || ""}</td>
            <td>${proyecto.estado || ""}</td>
            <td>${formatearFecha(proyecto.fechaInicio)}</td>
            <td>${formatearFecha(proyecto.fechaFin)}</td>
          </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error cargando proyectos:", error);
    tablaProyectos.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">Error de conexión con el servidor</td>
      </tr>
    `;
  }
}

function formatearFecha(fecha) {
  if (!fecha) return "";
  const f = new Date(fecha);
  if (isNaN(f.getTime())) return "";
  return f.toLocaleDateString("es-CO");
}

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
    const response = await fetch(`${API_URL}/proyectos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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

    cargarProyectos();
  } catch (error) {
    console.error("Error creando proyecto:", error);
    mensajeProyecto.textContent = "Error de conexión con el servidor";
    mensajeProyecto.classList.add("text-danger");
  }
});

cargarProyectos();