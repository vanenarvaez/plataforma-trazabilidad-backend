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

async function cargarProyectosEnSelect() {
  try {
    const response = await fetch(`${API_URL}/proyectos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.length) {
      proyectoSelect.innerHTML = `<option value="">No hay proyectos disponibles</option>`;
      return;
    }

    proyectoSelect.innerHTML = `<option value="">Seleccione un proyecto</option>`;

    data.forEach((proyecto) => {
      const option = document.createElement("option");
      option.value = proyecto._id;
      option.textContent = proyecto.nombre;
      proyectoSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando proyectos:", error);
    proyectoSelect.innerHTML = `<option value="">Error cargando proyectos</option>`;
  }
}

async function cargarInstituciones() {
  try {
    const response = await fetch(`${API_URL}/instituciones`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      tablaInstituciones.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger">No fue posible cargar las instituciones</td>
        </tr>
      `;
      return;
    }

    if (!data.length) {
      tablaInstituciones.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">No hay instituciones registradas</td>
        </tr>
      `;
      return;
    }

    tablaInstituciones.innerHTML = data
      .map(
        (institucion) => `
          <tr>
            <td>${institucion.nombre || ""}</td>
            <td>${institucion.codigoDane || ""}</td>
            <td>${institucion.departamento || ""}</td>
            <td>${institucion.municipio || ""}</td>
            <td>${institucion.zona || ""}</td>
            <td>${institucion.sector || ""}</td>
            <td>${institucion.proyectoId?.nombre || ""}</td>
          </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error cargando instituciones:", error);
    tablaInstituciones.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">Error de conexión con el servidor</td>
      </tr>
    `;
  }
}

institucionForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  mensajeInstitucion.textContent = "";
  mensajeInstitucion.className = "small";

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
    const response = await fetch(`${API_URL}/instituciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      mensajeInstitucion.textContent = data.message || "No fue posible guardar la institución";
      mensajeInstitucion.classList.add("text-danger");
      return;
    }

    mensajeInstitucion.textContent = "Institución guardada correctamente";
    mensajeInstitucion.classList.add("text-success");

    institucionForm.reset();
    document.getElementById("zona").value = "urbana";
    document.getElementById("sector").value = "oficial";

    cargarInstituciones();
    cargarProyectosEnSelect();
  } catch (error) {
    console.error("Error creando institución:", error);
    mensajeInstitucion.textContent = "Error de conexión con el servidor";
    mensajeInstitucion.classList.add("text-danger");
  }
});

cargarProyectosEnSelect();
cargarInstituciones();