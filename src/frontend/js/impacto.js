const API_URL = "http://localhost:3000/api";

let chartGenero;
let chartEdad;
let chartFormacion;
let chartSatisfaccion;
let chartUtilidad;
let chartRecomendacion;

const filtroGenero = document.getElementById("filtroGenero");
const btnAplicarFiltro = document.getElementById("btnAplicarFiltro");

const corporatePalette = [
  "#462cb9",
  "#0098e4",
  "#9e19db",
  "#58f1ff",
  "#d90cf1",
  "#120b2e",
  "#dfdfdf",
];

btnAplicarFiltro.addEventListener("click", () => {
  cargarImpacto();
});

async function cargarImpacto() {
  try {
    const genero = filtroGenero.value;
    const query = genero ? `?genero=${encodeURIComponent(genero)}` : "";

    const response = await fetch(`${API_URL}/indicadores/publicos${query}`);
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return;
    }

    document.getElementById("kpiProyectos").textContent =
      data.kpis?.totalProyectos || 0;
    document.getElementById("kpiInstituciones").textContent =
      data.kpis?.totalInstituciones || 0;
    document.getElementById("kpiDocentes").textContent =
      data.kpis?.totalDocentes || 0;
    document.getElementById("kpiMunicipios").textContent =
      data.kpis?.totalMunicipios || 0;

    const kpiCertificados = document.getElementById("kpiCertificados");
    if (kpiCertificados) {
      kpiCertificados.textContent = data.kpis?.totalCertificados || 0;
    }

    renderChart(
      "chartGenero",
      chartGenero,
      data.caracterizacion?.genero || {},
      "bar",
      (chart) => (chartGenero = chart)
    );

    renderChart(
      "chartEdad",
      chartEdad,
      data.caracterizacion?.edad || {},
      "bar",
      (chart) => (chartEdad = chart)
    );

    renderChart(
      "chartFormacion",
      chartFormacion,
      data.caracterizacion?.formacion || {},
      "bar",
      (chart) => (chartFormacion = chart)
    );

    renderPromediosChart(
      "chartSatisfaccion",
      chartSatisfaccion,
      data.satisfaccion?.promedios || [],
      (chart) => (chartSatisfaccion = chart)
    );

    renderChart(
      "chartUtilidad",
      chartUtilidad,
      data.satisfaccion?.utilidad || {},
      "pie",
      (chart) => (chartUtilidad = chart)
    );

    renderChart(
      "chartRecomendacion",
      chartRecomendacion,
      data.satisfaccion?.recomendacion || {},
      "pie",
      (chart) => (chartRecomendacion = chart)
    );
  } catch (error) {
    console.error("Error cargando impacto:", error);
  }
}

function renderChart(canvasId, chartInstance, objetoData, tipo, setter) {
  const ctx = document.getElementById(canvasId);

  if (!ctx) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = Object.keys(objetoData);
  const values = Object.values(objetoData);

  const chart = new Chart(ctx, {
    type: tipo,
    data: {
      labels,
      datasets: [
        {
          label: "Cantidad",
          data: values,
          backgroundColor:
            tipo === "pie"
              ? corporatePalette.slice(0, Math.max(labels.length, 1))
              : corporatePalette[0],
          borderColor:
            tipo === "pie"
              ? corporatePalette.slice(0, Math.max(labels.length, 1))
              : corporatePalette[0],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: tipo === "pie",
        },
      },
      scales:
        tipo !== "pie"
          ? {
              y: {
                beginAtZero: true,
              },
            }
          : {},
    },
  });

  setter(chart);
}

function renderPromediosChart(canvasId, chartInstance, dataPromedios, setter) {
  const ctx = document.getElementById(canvasId);

  if (!ctx) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = dataPromedios.map((p) => p.texto);
  const values = dataPromedios.map((p) => p.promedio);

  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Promedio de satisfacción",
          data: values,
          backgroundColor: "#9e19db",
          borderColor: "#462cb9",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      indexAxis: "y",
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 5,
        },
      },
    },
  });

  setter(chart);
}

cargarImpacto();