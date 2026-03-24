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

async function cargarProyectos() {
  try {
    const response = await fetch(`${API_URL}/proyectos`, {
      headers: { Authorization: `Bearer ${token}` },
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
    console.error(error);
    proyectoSelect.innerHTML = `<option value="">Error cargando proyectos</option>`;
  }
}

async function cargarInstituciones() {
  try {
    const response = await fetch(`${API_URL}/instituciones`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok || !data.length) {
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
    const response = await fetch(`${API_URL}/docentes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) {
      tablaDocentes.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger">No fue posible cargar los docentes</td>
        </tr>
      `;
      return;
    }

    if (!data.length) {
      tablaDocentes.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">No hay docentes registrados</td>
        </tr>
      `;
      return;
    }

    tablaDocentes.innerHTML = data.map((docente) => `
      <tr>
        <td>${docente.tipoDocumento || ""} ${docente.numeroDocumento || ""}</td>
        <td>${docente.nombres || ""} ${docente.apellidos || ""}</td>
        <td>${docente.email || ""}</td>
        <td>${docente.telefono || ""}</td>
        <td>${docente.institucionId?.nombre || ""}</td>
        <td>${docente.proyectoId?.nombre || ""}</td>
      </tr>
    `).join("");
  } catch (error) {
    console.error(error);
    tablaDocentes.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">Error de conexión con el servidor</td>
      </tr>
    `;
  }
}

docenteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  mensajeDocente.textContent = "";
  mensajeDocente.className = "small";

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
    const response = await fetch(`${API_URL}/docentes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      mensajeDocente.textContent = data.message || "No fue posible guardar el docente";
      mensajeDocente.classList.add("text-danger");
      return;
    }

    mensajeDocente.textContent = "Docente guardado correctamente";
    mensajeDocente.classList.add("text-success");

    docenteForm.reset();
    document.getElementById("tipoDocumento").value = "CC";
    document.getElementById("activo").checked = true;

    cargarDocentes();
  } catch (error) {
    console.error(error);
    mensajeDocente.textContent = "Error de conexión con el servidor";
    mensajeDocente.classList.add("text-danger");
  }
});

cargarProyectos();
cargarInstituciones();
cargarDocentes();