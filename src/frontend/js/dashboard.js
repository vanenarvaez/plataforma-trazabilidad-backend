const API_URL = "http://localhost:3000/api";

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "../index.html";
}

// LOGOUT
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

// Cargar datos
async function cargarDashboard() {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [proyectos, docentes, instituciones, asistencias] =
      await Promise.all([
        fetch(`${API_URL}/proyectos`, { headers }),
        fetch(`${API_URL}/docentes`, { headers }),
        fetch(`${API_URL}/instituciones`, { headers }),
        fetch(`${API_URL}/asistencias`, { headers }),
      ]);

    const dataProyectos = await proyectos.json();
    const dataDocentes = await docentes.json();
    const dataInstituciones = await instituciones.json();
    const dataAsistencias = await asistencias.json();

    document.getElementById("totalProyectos").textContent = dataProyectos.length || 0;
    document.getElementById("totalDocentes").textContent = dataDocentes.length || 0;
    document.getElementById("totalInstituciones").textContent = dataInstituciones.length || 0;
    document.getElementById("totalAsistencias").textContent = dataAsistencias.length || 0;

  } catch (error) {
    console.error("Error cargando dashboard:", error);
  }
}

cargarDashboard();