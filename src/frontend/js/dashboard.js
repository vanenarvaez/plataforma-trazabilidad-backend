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

const filtroProyectoDashboard = document.getElementById("filtroProyectoDashboard");

const kpiTotalDocentes = document.getElementById("kpiTotalDocentes");
const kpiCertificados = document.getElementById("kpiCertificados");
const kpiPendientesCertificacion = document.getElementById("kpiPendientesCertificacion");
const kpiCaracterizacionRespondida = document.getElementById("kpiCaracterizacionRespondida");
const kpiCaracterizacionPendiente = document.getElementById("kpiCaracterizacionPendiente");
const kpiDiagnosticaRespondida = document.getElementById("kpiDiagnosticaRespondida");
const kpiDiagnosticaPendiente = document.getElementById("kpiDiagnosticaPendiente");
const kpiProyectoActual = document.getElementById("kpiProyectoActual");

let graficoCertificacion = null;
let graficoCaracterizacion = null;
let graficoDiagnostica = null;

const coloresCorporativos = [
  "#462cb9",
  "#0098e4",
  "#9e19db",
  "#58f1ff",
  "#d90cf1",
  "#120b2e",
];

const pluginEtiquetasPorcentaje = {
  id: "pluginEtiquetasPorcentaje",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];

    if (!dataset || !dataset.data || !dataset.data.length) return;

    const total = dataset.data.reduce((acc, item) => acc + Number(item || 0), 0);
    if (!total) return;

    const meta = chart.getDatasetMeta(0);

    ctx.save();
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#120b2e";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    meta.data.forEach((slice, index) => {
      const valor = Number(dataset.data[index] || 0);
      if (!valor) return;

      const porcentaje = ((valor / total) * 100).toFixed(1) + "%";
      const posicion = slice.tooltipPosition();

      ctx.fillText(porcentaje, posicion.x, posicion.y);
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

async function cargarProyectosDashboard() {
  try {
    const response = await fetchConToken(`${API_URL}/proyectos`);
    const data = await response.json();

    filtroProyectoDashboard.innerHTML = `<option value="">Todos los proyectos</option>`;

    if (response.ok && Array.isArray(data)) {
      data.forEach((proyecto) => {
        const option = document.createElement("option");
        option.value = proyecto._id;
        option.textContent = proyecto.nombre;
        filtroProyectoDashboard.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error cargando proyectos para dashboard:", error);
  }
}

function actualizarKPIs(data) {
  const indicadores = data.indicadores || {};

  kpiTotalDocentes.textContent = indicadores.totalDocentes || 0;
  kpiCertificados.textContent = indicadores.certificados || 0;
  kpiPendientesCertificacion.textContent = indicadores.pendientesCertificacion || 0;
  kpiCaracterizacionRespondida.textContent = indicadores.caracterizacionRespondida || 0;
  kpiCaracterizacionPendiente.textContent = indicadores.caracterizacionPendiente || 0;
  kpiDiagnosticaRespondida.textContent = indicadores.diagnosticaRespondida || 0;
  kpiDiagnosticaPendiente.textContent = indicadores.diagnosticaPendiente || 0;
  kpiProyectoActual.textContent = data.filtro?.proyectoNombre || "Todos los proyectos";
}

function destruirGrafico(instancia) {
  if (instancia) instancia.destroy();
}

function crearGraficoDona(canvasId, etiquetas, valores) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  return new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: etiquetas,
      datasets: [
        {
          data: valores,
          backgroundColor: [
            coloresCorporativos[0],
            coloresCorporativos[1],
            coloresCorporativos[2],
            coloresCorporativos[3],
          ],
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
    plugins: [pluginEtiquetasPorcentaje],
  });
}

function renderizarGraficos(data) {
  destruirGrafico(graficoCertificacion);
  destruirGrafico(graficoCaracterizacion);
  destruirGrafico(graficoDiagnostica);

  const certificacion = data.graficos?.certificacion || [];
  const caracterizacion = data.graficos?.caracterizacion || [];
  const diagnostica = data.graficos?.diagnostica || [];

  graficoCertificacion = crearGraficoDona(
    "graficoCertificacion",
    certificacion.map((i) => i.nombre),
    certificacion.map((i) => i.valor)
  );

  graficoCaracterizacion = crearGraficoDona(
    "graficoCaracterizacion",
    caracterizacion.map((i) => i.nombre),
    caracterizacion.map((i) => i.valor)
  );

  graficoDiagnostica = crearGraficoDona(
    "graficoDiagnostica",
    diagnostica.map((i) => i.nombre),
    diagnostica.map((i) => i.valor)
  );
}

async function cargarDashboardInterno() {
  try {
    const proyectoId = filtroProyectoDashboard.value;
    const query = proyectoId ? `?proyectoId=${encodeURIComponent(proyectoId)}` : "";
    const response = await fetchConToken(`${API_URL}/indicadores/internos/dashboard${query}`);
    const data = await response.json();

    if (!response.ok) {
      console.error("No fue posible cargar dashboard interno:", data);
      return;
    }

    actualizarKPIs(data);
    renderizarGraficos(data);
  } catch (error) {
    console.error("Error cargando dashboard:", error);
  }
}

filtroProyectoDashboard.addEventListener("change", cargarDashboardInterno);

async function inicializarDashboard() {
  await cargarProyectosDashboard();
  await cargarDashboardInterno();
}

inicializarDashboard();