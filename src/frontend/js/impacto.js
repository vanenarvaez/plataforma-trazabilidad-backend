const API_URL = "http://localhost:3000/api";

const filtroGenero = document.getElementById("filtroGenero");
const filtroEdad = document.getElementById("filtroEdad");
const filtroZona = document.getElementById("filtroZona");

const filtroBloqueSatisfaccion = document.getElementById("filtroBloqueSatisfaccion");
const filtroPreguntaSatisfaccion = document.getElementById("filtroPreguntaSatisfaccion");

const btnAplicarFiltros = document.getElementById("btnAplicarFiltros");
const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");
const btnAplicarSatisfaccion = document.getElementById("btnAplicarSatisfaccion");

const resumenCaracterizacion = document.getElementById("resumenCaracterizacion");
const baseCaracterizacion = document.getElementById("baseCaracterizacion");
const baseSatisfaccion = document.getElementById("baseSatisfaccion");

const bloquesCaracterizacion = document.getElementById("bloquesCaracterizacion");
const bloquesSatisfaccion = document.getElementById("bloquesSatisfaccion");

let charts = {};
let satisfaccionDataGlobal = null;
let caracterizacionDataGlobal = null;

const corporatePalette = [
  "#462cb9",
  "#0098e4",
  "#9e19db",
  "#58f1ff",
  "#7b61ff",
  "#8fdcff",
  "#120b2e",
  "#d90cf1",
];

// Colores fijos para Likert / escalas homogéneas
const likertColors = {
  "1": "#462cb9", // morado oscuro
  "2": "#dfdfdf", // violeta
  "3": "#d90cf1", // fucsia
  "4": "#0098e4", // azul
  "5": "#58f1ff", // aguamarina
};

// Colores fijos para Sí / No
const siNoColors = {
  "sí": "#58f1ff",
  "si": "#58f1ff",
  "no": "#462cb9",
};

function obtenerColorEscala(label, question) {
  const texto = String(label || "").trim();
  const textoPregunta = normalizarTexto(question?.texto || "");
  const tipoRespuesta = normalizarTexto(question?.tipoRespuesta || "");

  // Solo aplicar colores de escala si realmente es una pregunta tipo escala
  const esEscala =
    tipoRespuesta === "likert" ||
    textoPregunta.includes("pertinente") ||
    textoPregunta.includes("obstáculo") ||
    textoPregunta.includes("obstaculo") ||
    textoPregunta.includes("excelente") ||
    textoPregunta.includes("muy bueno") ||
    textoPregunta.includes("aceptable") ||
    textoPregunta.includes("deficiente") ||
    textoPregunta.includes("nada pertinente") ||
    textoPregunta.includes("poco pertinente") ||
    textoPregunta.includes("medianamente pertinente") ||
    textoPregunta.includes("muy pertinente") ||
    textoPregunta.includes("totalmente pertinente");

  if (!esEscala) return null;

  const match = texto.match(/^([1-5])/);
  if (!match) return null;

  const numero = match[1];
  return likertColors[numero] || null;
}

const likertOrder = [
  "1",
  "1. (Deficiente)",
  "1. No representa un obstáculo en mi contexto",
  "1. Nada pertinente",

  "2",
  "2. (Aceptable)",
  "2. Representa un obstáculo leve",
  "2. Poco pertinente",

  "3",
  "3. (Bueno)",
  "3. Representa un obstáculo moderado",
  "3. Medianamente pertinente",

  "4",
  "4. (Muy bueno)",
  "4. Representa un obstáculo significativo",
  "4. Muy pertinente",

  "5",
  "5. (Excelente)",
  "5. Representa un obstáculo crítico",
  "5. Totalmente pertinente",
];

function normalizarTexto(valor) {
  return String(valor || "").trim().toLowerCase();
}

function destroyAllCharts() {
  Object.values(charts).forEach((chart) => {
    if (chart && typeof chart.destroy === "function") {
      chart.destroy();
    }
  });
  charts = {};
}

function buildCaracterizacionQuery() {
  const params = new URLSearchParams();

  if (filtroGenero.value) params.append("genero", filtroGenero.value);
  if (filtroEdad.value) params.append("edad", filtroEdad.value);
  if (filtroZona.value) params.append("zona", filtroZona.value);

  return params.toString() ? `?${params.toString()}` : "";
}

function normalizarClave(texto) {
  return String(texto || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
}

function esBloqueHorizontal(nombreBloque) {
  const texto = normalizarTexto(nombreBloque);
  return (
    texto.includes("obst") ||
    texto.includes("inter") ||
    texto.includes("expect") ||
    texto.includes("neces")
  );
}

function esPreguntaHorizontal(textoPregunta) {
  const texto = normalizarTexto(textoPregunta);
  return (
    texto.includes("obst") ||
    texto.includes("inter") ||
    texto.includes("expect") ||
    texto.includes("neces") ||
    texto.includes("área") ||
    texto.includes("area")
  );
}

function esPreguntaBarrasVerticales(textoPregunta) {
  const texto = normalizarTexto(textoPregunta);
  return (
    texto.includes("edad") ||
    texto.includes("formación") ||
    texto.includes("formacion") ||
    texto.includes("experiencia") ||
    texto.includes("nivel educativo") ||
    texto.includes("grado")
  );
}

function esPreguntaDona(textoPregunta) {
  const texto = normalizarTexto(textoPregunta);
  return (
    texto.includes("género") ||
    texto.includes("genero") ||
    texto.includes("sexo") ||
    texto.includes("zona")
  );
}

function esPreguntaSiNo(question) {
  if (!question) return false;

  const opciones = (question.resultados || []).map((r) =>
    normalizarTexto(r.opcion)
  );

  return opciones.includes("sí") || opciones.includes("si") || opciones.includes("no");
}

function ordenarResultadosDesc(resultados) {
  return [...(resultados || [])].sort(
    (a, b) => Number(b.cantidad || 0) - Number(a.cantidad || 0)
  );
}

function ordenarResultadosLikert(resultados) {
  const mapa = new Map();

  (resultados || []).forEach((item) => {
    mapa.set(String(item.opcion).trim(), item);
  });

  const ordenados = likertOrder
    .filter((key) => mapa.has(key))
    .map((key) => mapa.get(key));

  return ordenados.length ? ordenados : ordenarResultadosDesc(resultados);
}

function obtenerResultadoMayor(resultados) {
  const ordenados = ordenarResultadosDesc(resultados);
  if (!ordenados.length) return null;

  const top = ordenados[0];
  return `${top.opcion}: ${Number(top.porcentaje || 0).toFixed(1)}%`;
}

function getChartConfig(question, nombreBloque, esSatisfaccion = false) {
  let resultados = question?.resultados || [];

  if (question?.tipoRespuesta === "likert") {
    resultados = ordenarResultadosLikert(resultados);
    return {
      type: "bar",
      indexAxis: "x",
      resultados,
      badge:
        question.promedio !== null && question.promedio !== undefined
          ? `Promedio: ${question.promedio}`
          : null,
    };
  }

  if (esPreguntaSiNo(question)) {
    resultados = ordenarResultadosDesc(resultados);
    return {
      type: "bar",
      indexAxis: "x",
      resultados,
      badge: null,
    };
  }

  if (esBloqueHorizontal(nombreBloque) || esPreguntaHorizontal(question?.texto)) {
    resultados = ordenarResultadosDesc(resultados);
    return {
      type: "bar",
      indexAxis: "y",
      resultados,
      badge: obtenerResultadoMayor(resultados),
    };
  }

  if (esPreguntaDona(question?.texto)) {
    resultados = ordenarResultadosDesc(resultados);
    return {
      type: "doughnut",
      indexAxis: "x",
      resultados,
      badge: null,
    };
  }

  if (esPreguntaBarrasVerticales(question?.texto)) {
    resultados = ordenarResultadosDesc(resultados);
    return {
      type: "bar",
      indexAxis: "x",
      resultados,
      badge: null,
    };
  }

  resultados = ordenarResultadosDesc(resultados);

  return {
    type: esSatisfaccion ? "bar" : "bar",
    indexAxis: "x",
    resultados,
    badge: null,
  };
}

function calcularPorcentajes(question) {
  return (question?.resultados || []).map((item) =>
    Number(item.porcentaje || 0)
  );
}

const percentPlugin = {
  id: "percentPlugin",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[0];
    if (!dataset || !dataset.data || !dataset.data.length) return;

    const rawValues = dataset.data;
    const question = chart.$questionData || null;
    if (!question) return;

    const percents = calcularPorcentajes(question);
    const meta = chart.getDatasetMeta(0);

    ctx.save();
    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    meta.data.forEach((element, index) => {
      const value = Number(rawValues[index] || 0);
      if (!value) return;

      const percentValue = Number(percents[index] || 0);
      const percent = `${percentValue.toFixed(1)}%`;

      if (chart.config.type === "doughnut") {
        const pos = element.tooltipPosition();
        ctx.fillText(percent, pos.x, pos.y);
        return;
      }

      const props = element.getProps(["x", "y", "base"], true);

      if (chart.options.indexAxis === "y") {
        const centerX = (props.x + props.base) / 2;
        const centerY = props.y;
        ctx.fillText(percent, centerX, centerY);
      } else {
        const centerX = props.x;
        const centerY = (props.y + props.base) / 2;
        ctx.fillText(percent, centerX, centerY);
      }
    });

    ctx.restore();
  },
};

function construirColores(labels, question, config) {
  const backgroundColors = [];
  const borderColors = [];

  labels.forEach((label, index) => {
    const labelNorm = normalizarTexto(label);

    // 1) Escalas tipo Likert / pertinencia / obstáculos / intereses
    // Detecta el número inicial (1,2,3,4,5) aunque el texto cambie
    const colorEscala = obtenerColorEscala(label, question);

    if (colorEscala) {
      backgroundColors.push(colorEscala);
      borderColors.push(colorEscala);
      return;
    }

    // 2) Preguntas Sí / No
    if (esPreguntaSiNo(question)) {
      const color = siNoColors[labelNorm] || "#7b61ff";
      backgroundColors.push(color);
      borderColors.push(color);
      return;
    }

    // 3) Donas (género, zona, etc.)
    if (config.type === "doughnut") {
      const color = corporatePalette[index % corporatePalette.length];
      backgroundColors.push(color);
      borderColors.push(color);
      return;
    }

    // 4) Color por defecto
    backgroundColors.push(corporatePalette[0]);
    borderColors.push(corporatePalette[0]);
  });

  return { backgroundColors, borderColors };
}

function renderChart(canvasId, question, nombreBloque, esSatisfaccion = false) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const config = getChartConfig(question, nombreBloque, esSatisfaccion);
  const labels = config.resultados.map((item) => item.opcion);
  const values = config.resultados.map((item) => Number(item.cantidad || 0));
  const percentages = calcularPorcentajes({
    resultados: config.resultados,
  });

  const { backgroundColors, borderColors } = construirColores(
    labels,
    question,
    config
  );

  const chart = new Chart(canvas.getContext("2d"), {
    type: config.type,
    data: {
      labels,
      datasets: [
        {
          label: "Respuestas",
          data: values,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: config.indexAxis,
      plugins: {
        legend: {
          display: config.type === "doughnut",
          position: "bottom",
          labels: {
            color: "#120b2e",
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Number(context.raw || 0);
              const percent = percentages[context.dataIndex] || 0;
              return `${context.label}: ${value} (${percent}%)`;
            },
          },
        },
      },
      scales:
        config.type === "doughnut"
          ? {}
          : {
            x:
              config.indexAxis === "x"
                ? {
                  beginAtZero: true,
                  ticks: {
                    precision: 0,
                    autoSkip: false,
                    maxRotation: 0,
                    minRotation: 0,
                    color: "#4b4b4b",
                  },
                  grid: {
                    color: "#e9e9e9",
                  },
                }
                : {
                  ticks: {
                    color: "#4b4b4b",
                    autoSkip: false,
                  },
                  grid: {
                    color: "#e9e9e9",
                  },
                },
            y:
              config.indexAxis === "x"
                ? {
                  beginAtZero: true,
                  ticks: {
                    precision: 0,
                    color: "#4b4b4b",
                  },
                  grid: {
                    color: "#e9e9e9",
                  },
                }
                : {
                  beginAtZero: true,
                  ticks: {
                    precision: 0,
                    color: "#4b4b4b",
                  },
                  grid: {
                    color: "#e9e9e9",
                  },
                },
          },
    },
    plugins: [percentPlugin],
  });

  chart.$questionData = question;
  charts[canvasId] = chart;
}

function llenarFiltrosCaracterizacion(opciones) {
  const cargar = (select, values, labelTodos) => {
    const actual = select.value;
    select.innerHTML = `<option value="">${labelTodos}</option>`;

    (values || []).forEach((item) => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      select.appendChild(option);
    });

    if ([...select.options].some((o) => o.value === actual)) {
      select.value = actual;
    }
  };

  cargar(filtroGenero, opciones?.genero || [], "Todos");
  cargar(filtroEdad, opciones?.edad || [], "Todos");
  cargar(filtroZona, opciones?.zona || [], "Todos");
}

function actualizarKpis(data) {
  document.getElementById("kpiProyectos").textContent =
    data.kpis?.totalProyectos || 0;
  document.getElementById("kpiInstituciones").textContent =
    data.kpis?.totalInstituciones || 0;
  document.getElementById("kpiDocentes").textContent =
    data.kpis?.totalDocentesFiltrados || 0;
  document.getElementById("kpiMunicipios").textContent =
    data.kpis?.totalMunicipios || 0;
  document.getElementById("kpiCertificados").textContent =
    data.kpis?.totalCertificados || 0;
}

function actualizarResumenCaracterizacion(data) {
  const filtros = data?.filtros || {};
  resumenCaracterizacion.innerHTML = `
    Género: ${filtros.genero || "Todos"} |
    Edad: ${filtros.edad || "Todas"} |
    Zona: ${filtros.zona || "Todas"} |
    Total mostrado: ${data?.kpis?.totalDocentesFiltrados ?? 0}
  `;

  baseCaracterizacion.textContent = `Base o muestra: ${data?.baseCaracterizacion || 0
    } respuestas`;
}

function renderBloquesCaracterizacion(data) {
  caracterizacionDataGlobal = data;
  bloquesCaracterizacion.innerHTML = "";

  const bloques = data?.bloques || [];

  if (!bloques.length) {
    bloquesCaracterizacion.innerHTML = `
      <div class="text-muted">No hay resultados de caracterización para los filtros aplicados.</div>
    `;
    return;
  }

  bloques.forEach((bloque, bloqueIndex) => {
    const bloqueId = `car_bloque_${bloqueIndex}_${normalizarClave(
      bloque.nombreBloque
    )}`;
    const horizontal = esBloqueHorizontal(bloque.nombreBloque);
    const colClass = horizontal ? "col-md-6" : "col-md-4";

    const bloqueHtml = `
      <div class="card border shadow-sm p-4 mb-4">
        <h5 class="text-brand mb-3">${bloque.nombreBloque}</h5>
        <div class="row g-4">
          ${(bloque.preguntas || [])
        .map((pregunta, preguntaIndex) => {
          const canvasId = `${bloqueId}_preg_${preguntaIndex}`;
          const config = getChartConfig(
            pregunta,
            bloque.nombreBloque,
            false
          );

          return `
                <div class="${colClass}">
                  <div class="card border h-100">
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div class="fw-semibold">${pregunta.texto}</div>
                        ${config.badge
              ? `<span class="badge text-bg-light border">${config.badge}</span>`
              : ""
            }
                      </div>
                      <div style="height: ${horizontal ? "260px" : "240px"};">
                        <canvas id="${canvasId}"></canvas>
                      </div>
                    </div>
                  </div>
                </div>
              `;
        })
        .join("")}
        </div>
      </div>
    `;

    bloquesCaracterizacion.insertAdjacentHTML("beforeend", bloqueHtml);

    (bloque.preguntas || []).forEach((pregunta, preguntaIndex) => {
      const canvasId = `${bloqueId}_preg_${preguntaIndex}`;
      renderChart(canvasId, pregunta, bloque.nombreBloque, false);
    });
  });
}

function llenarFiltrosSatisfaccion(data) {
  satisfaccionDataGlobal = data;

  const bloqueActual = filtroBloqueSatisfaccion.value;
  const preguntaActual = filtroPreguntaSatisfaccion.value;

  filtroBloqueSatisfaccion.innerHTML = `<option value="">Todos</option>`;
  (data?.bloques || []).forEach((bloque) => {
    const option = document.createElement("option");
    option.value = bloque.nombreBloque;
    option.textContent = bloque.nombreBloque;
    filtroBloqueSatisfaccion.appendChild(option);
  });

  if (
    [...filtroBloqueSatisfaccion.options].some((o) => o.value === bloqueActual)
  ) {
    filtroBloqueSatisfaccion.value = bloqueActual;
  }

  const preguntasDisponibles = [];
  (data?.bloques || []).forEach((bloque) => {
    if (
      !filtroBloqueSatisfaccion.value ||
      bloque.nombreBloque === filtroBloqueSatisfaccion.value
    ) {
      (bloque.preguntas || []).forEach((pregunta) => {
        preguntasDisponibles.push({
          numero: pregunta.numero,
          texto: pregunta.texto,
        });
      });
    }
  });

  filtroPreguntaSatisfaccion.innerHTML = `<option value="">Todas</option>`;
  preguntasDisponibles.forEach((pregunta) => {
    const option = document.createElement("option");
    option.value = String(pregunta.numero);
    option.textContent = `P${pregunta.numero} - ${pregunta.texto}`;
    filtroPreguntaSatisfaccion.appendChild(option);
  });

  if (
    [...filtroPreguntaSatisfaccion.options].some(
      (o) => o.value === preguntaActual
    )
  ) {
    filtroPreguntaSatisfaccion.value = preguntaActual;
  }
}

function actualizarResumenSatisfaccion() {
  const base = satisfaccionDataGlobal?.base || 0;
  const bloques = satisfaccionDataGlobal?.bloques || [];

  let bloquesVisibles = bloques;
  if (filtroBloqueSatisfaccion.value) {
    bloquesVisibles = bloques.filter(
      (bloque) => bloque.nombreBloque === filtroBloqueSatisfaccion.value
    );
  }

  let totalPreguntas = 0;
  bloquesVisibles.forEach((bloque) => {
    const preguntas = (bloque.preguntas || []).filter(
      (pregunta) =>
        !filtroPreguntaSatisfaccion.value ||
        String(pregunta.numero) === String(filtroPreguntaSatisfaccion.value)
    );
    totalPreguntas += preguntas.length;
  });

  document.getElementById("kpiBaseSatisfaccion").textContent = base;
  document.getElementById("kpiBloquesSatisfaccion").textContent =
    bloquesVisibles.length;
  document.getElementById("kpiPreguntasSatisfaccion").textContent =
    totalPreguntas;
}

function renderBloquesSatisfaccion() {
  bloquesSatisfaccion.innerHTML = "";

  if (!satisfaccionDataGlobal?.bloques?.length) {
    bloquesSatisfaccion.innerHTML = `
      <div class="text-muted">No hay resultados de satisfacción disponibles.</div>
    `;
    baseSatisfaccion.textContent = `Base o muestra: 0 respuestas`;
    actualizarResumenSatisfaccion();
    return;
  }

  let bloques = satisfaccionDataGlobal.bloques;

  if (filtroBloqueSatisfaccion.value) {
    bloques = bloques.filter(
      (bloque) => bloque.nombreBloque === filtroBloqueSatisfaccion.value
    );
  }

  if (filtroPreguntaSatisfaccion.value) {
    bloques = bloques
      .map((bloque) => ({
        ...bloque,
        preguntas: (bloque.preguntas || []).filter(
          (pregunta) =>
            String(pregunta.numero) ===
            String(filtroPreguntaSatisfaccion.value)
        ),
      }))
      .filter((bloque) => bloque.preguntas.length > 0);
  }

  baseSatisfaccion.textContent = `Base o muestra: ${satisfaccionDataGlobal.base || 0
    } respuestas`;
  actualizarResumenSatisfaccion();

  if (!bloques.length) {
    bloquesSatisfaccion.innerHTML = `
      <div class="text-muted">No hay preguntas para el filtro de satisfacción seleccionado.</div>
    `;
    return;
  }

  bloques.forEach((bloque, bloqueIndex) => {
    const bloqueId = `sat_bloque_${bloqueIndex}_${normalizarClave(
      bloque.nombreBloque
    )}`;

    const bloqueHtml = `
      <div class="card border shadow-sm p-4 mb-4">
        <h5 class="text-brand mb-3">${bloque.nombreBloque}</h5>
        <div class="row g-4">
          ${(bloque.preguntas || [])
        .map((pregunta, preguntaIndex) => {
          const canvasId = `${bloqueId}_preg_${preguntaIndex}`;
          const config = getChartConfig(
            pregunta,
            bloque.nombreBloque,
            true
          );

          return `
                <div class="col-md-6">
                  <div class="card border h-100">
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div class="fw-semibold">${pregunta.texto}</div>
                        ${config.badge
              ? `<span class="badge text-bg-light border">${config.badge}</span>`
              : ""
            }
                      </div>
                      <div style="height: 260px;">
                        <canvas id="${canvasId}"></canvas>
                      </div>
                    </div>
                  </div>
                </div>
              `;
        })
        .join("")}
        </div>
      </div>
    `;

    bloquesSatisfaccion.insertAdjacentHTML("beforeend", bloqueHtml);

    (bloque.preguntas || []).forEach((pregunta, preguntaIndex) => {
      const canvasId = `${bloqueId}_preg_${preguntaIndex}`;
      renderChart(canvasId, pregunta, bloque.nombreBloque, true);
    });
  });
}

async function cargarImpacto() {
  try {
    destroyAllCharts();

    const query = buildCaracterizacionQuery();
    const response = await fetch(`${API_URL}/indicadores/publicos${query}`);
    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return;
    }

    llenarFiltrosCaracterizacion(data.opcionesFiltros);
    actualizarKpis(data);
    actualizarResumenCaracterizacion(data);
    renderBloquesCaracterizacion(data.caracterizacion);
    llenarFiltrosSatisfaccion(data.satisfaccion);
    renderBloquesSatisfaccion();
  } catch (error) {
    console.error("Error cargando impacto:", error);
  }
}

btnAplicarFiltros.addEventListener("click", cargarImpacto);

btnLimpiarFiltros.addEventListener("click", () => {
  filtroGenero.value = "";
  filtroEdad.value = "";
  filtroZona.value = "";
  cargarImpacto();
});

btnAplicarSatisfaccion.addEventListener("click", () => {
  destroyAllCharts();
  renderBloquesCaracterizacion(caracterizacionDataGlobal || { bloques: [] });
  renderBloquesSatisfaccion();
});

filtroBloqueSatisfaccion.addEventListener("change", () => {
  llenarFiltrosSatisfaccion(satisfaccionDataGlobal);
});

cargarImpacto();