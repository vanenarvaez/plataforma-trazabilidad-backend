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
const tablaAsistencias = document.getElementById("tablaAsistencias");
const proyectoCursoSelect = document.getElementById("proyectoCursoId");
const docenteSelect = document.getElementById("docenteId");
const btnRecargarAsistencias = document.getElementById("btnRecargarAsistencias");

async function cargarProyectoCursos() {
    try {
        const response = await fetch(`${API_URL}/proyectos`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const proyectos = await response.json();

        if (!response.ok || !proyectos.length) {
            proyectoCursoSelect.innerHTML = `<option value="">No hay proyectos disponibles</option>`;
            return;
        }

        const opciones = [];

        for (const proyecto of proyectos) {
            const relResponse = await fetch(`${API_URL}/proyecto-cursos/${proyecto._id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const relaciones = await relResponse.json();

            if (relResponse.ok && relaciones.length) {
                relaciones.forEach((rel) => {
                    opciones.push({
                        id: rel._id,
                        texto: `${rel.proyectoId?.nombre || "Proyecto"} - ${rel.cursoId?.nombreCurso || "Curso"}`,
                    });
                });
            }
        }

        if (!opciones.length) {
            proyectoCursoSelect.innerHTML = `<option value="">No hay relaciones curso-proyecto disponibles</option>`;
            return;
        }

        proyectoCursoSelect.innerHTML = `<option value="">Seleccione una formación</option>`;
        opciones.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.texto;
            proyectoCursoSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando proyecto-cursos:", error);
        proyectoCursoSelect.innerHTML = `<option value="">Error cargando relaciones</option>`;
    }
}

async function cargarDocentes() {
    try {
        const response = await fetch(`${API_URL}/docentes`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok || !data.length) {
            docenteSelect.innerHTML = `<option value="">No hay docentes disponibles</option>`;
            return;
        }

        docenteSelect.innerHTML = `<option value="">Seleccione un docente</option>`;
        data.forEach((docente) => {
            const option = document.createElement("option");
            option.value = docente._id;
            option.textContent = `${docente.nombres} ${docente.apellidos} - ${docente.numeroDocumento}`;
            docenteSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando docentes:", error);
        docenteSelect.innerHTML = `<option value="">Error cargando docentes</option>`;
    }
}

async function cargarAsistencias() {
    try {
        const response = await fetch(`${API_URL}/asistencias`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            tablaAsistencias.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger">No fue posible cargar las asistencias</td>
        </tr>
      `;
            return;
        }

        if (!data.length) {
            tablaAsistencias.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">No hay asistencias registradas</td>
        </tr>
      `;
            return;
        }

        tablaAsistencias.innerHTML = data.map((item) => {
            const nombreDocente = item.docenteId
                ? `${item.docenteId.nombres || ""} ${item.docenteId.apellidos || ""}`
                : "";

            const documento = item.docenteId?.numeroDocumento || "";

            const proyectoNombre =
                item.proyectoCursoId?.proyectoId?.nombre || "Proyecto";

            const cursoNombre =
                item.proyectoCursoId?.cursoId?.nombreCurso || "Curso";

            const proyectoCurso = `${proyectoNombre} - ${cursoNombre}`;

            const modulo = item.moduloNumero || "";
            const asistio = item.asistio ? "Sí" : "No";
            const fecha = formatearFecha(item.fechaRegistro || item.createdAt);

            return `
    <tr>
      <td>${nombreDocente}</td>
      <td>${documento}</td>
      <td>${proyectoCurso}</td>
      <td>${modulo}</td>
      <td>${asistio}</td>
      <td>${fecha}</td>
    </tr>
  `;
        }).join("");
    } catch (error) {
        console.error("Error cargando asistencias:", error);
        tablaAsistencias.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">Error de conexión con el servidor</td>
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

asistenciaForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    mensajeAsistencia.textContent = "";
    mensajeAsistencia.className = "small";

    const body = {
        proyectoCursoId: document.getElementById("proyectoCursoId").value,
        docenteId: document.getElementById("docenteId").value,
        moduloNumero: Number(document.getElementById("moduloNumero").value),
        asistio: document.getElementById("asistio").checked,
    };

    try {
        const response = await fetch(`${API_URL}/asistencias`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            mensajeAsistencia.textContent = data.message || "No fue posible registrar la asistencia";
            mensajeAsistencia.classList.add("text-danger");
            return;
        }

        mensajeAsistencia.textContent = "Asistencia registrada correctamente";
        mensajeAsistencia.classList.add("text-success");

        asistenciaForm.reset();
        document.getElementById("asistio").checked = true;

        cargarAsistencias();
    } catch (error) {
        console.error("Error registrando asistencia:", error);
        mensajeAsistencia.textContent = "Error de conexión con el servidor";
        mensajeAsistencia.classList.add("text-danger");
    }
});

btnRecargarAsistencias.addEventListener("click", cargarAsistencias);

cargarProyectoCursos();
cargarDocentes();
cargarAsistencias();