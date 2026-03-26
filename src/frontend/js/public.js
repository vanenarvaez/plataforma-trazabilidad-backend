const API_URL = "http://localhost:3000/api";

const btnBuscar = document.getElementById("btnBuscar");
const mensaje = document.getElementById("mensaje");
const contenido = document.getElementById("contenido");

let encuestasActivas = [];
let respuestasRegistradas = [];
let numeroDocumentoActual = "";

btnBuscar.addEventListener("click", async () => {
  const numeroDocumento = document.getElementById("numeroDocumento").value.trim();

  mensaje.textContent = "";
  mensaje.className = "mt-3 small";
  contenido.style.display = "none";

  if (!numeroDocumento) {
    mensaje.textContent = "Debes ingresar un número de documento";
    mensaje.classList.add("text-danger");
    return;
  }

  numeroDocumentoActual = numeroDocumento;

  try {
    const [resCert, resResp, resEncuestas] = await Promise.all([
      fetch(`${API_URL}/certificados/consultar/${numeroDocumento}`),
      fetch(`${API_URL}/respuestas-encuesta/documento/${numeroDocumento}`),
      fetch(`${API_URL}/encuestas/publicas`),
    ]);

    const certificados = resCert.ok ? await resCert.json() : [];
    const respuestas = resResp.ok ? await resResp.json() : [];
    const encuestas = resEncuestas.ok ? await resEncuestas.json() : [];

    respuestasRegistradas = Array.isArray(respuestas) ? respuestas : [];
    encuestasActivas = Array.isArray(encuestas) ? encuestas : [];

    renderCertificados(Array.isArray(certificados) ? certificados : []);
    renderEncuestasRespondidas(respuestasRegistradas);
    renderEncuestasPendientes(encuestasActivas, respuestasRegistradas);

    contenido.style.display = "block";

    if (
      (!Array.isArray(certificados) || !certificados.length) &&
      (!Array.isArray(respuestas) || !respuestas.length) &&
      (!Array.isArray(encuestas) || !encuestas.length)
    ) {
      mensaje.textContent = "No se encontró información asociada a ese documento.";
      mensaje.classList.add("text-warning");
    }
  } catch (error) {
    console.error(error);
    mensaje.textContent = "Error consultando información";
    mensaje.classList.add("text-danger");
  }
});

function renderCertificados(certificados) {
  const cont = document.getElementById("certificados");

  if (!certificados.length) {
    cont.innerHTML = "<div class='text-muted'>No hay certificados disponibles.</div>";
    return;
  }

  cont.innerHTML = certificados
    .map(
      (c) => `
      <div class="mb-3 border p-3 rounded bg-light">
        <div><strong>Curso:</strong> ${c.nombreCurso || ""}</div>
        <div><strong>Asistencia:</strong> ${c.porcentajeAsistencia || 0}%</div>
        <a href="http://localhost:3000${c.ruta}" target="_blank" class="btn btn-sm btn-secondary mt-2">
          Ver certificado
        </a>
      </div>
    `
    )
    .join("");
}

function renderEncuestasRespondidas(respuestas) {
  const cont = document.getElementById("encuestasDisponibles");

  if (!respuestas.length) {
    cont.innerHTML = "<div class='text-muted'>No hay encuestas respondidas registradas.</div>";
    return;
  }

  cont.innerHTML = respuestas
    .map((r) => {
      const detalle = (r.respuestas || [])
        .map((item) => {
          const valor = Array.isArray(item.respuesta)
            ? item.respuesta.join(", ")
            : item.respuesta;

          return `
            <li class="mb-1">
              <strong>${item.numeroPregunta}.</strong> ${item.textoPregunta}<br>
              <span class="text-muted">${valor}</span>
            </li>
          `;
        })
        .join("");

      return `
        <div class="mb-3 border p-3 rounded bg-light">
          <div><strong>Encuesta:</strong> ${r.encuestaId?.nombre || "Encuesta"}</div>
          <div><strong>Fecha:</strong> ${formatearFecha(r.fechaRespuesta || r.createdAt)}</div>
          <div><strong>Estado:</strong> ${r.completada ? "Completada" : "Pendiente"}</div>
          <div class="mt-2">
            <strong>Respuestas:</strong>
            <ul class="mt-2 ps-3">
              ${detalle || "<li class='text-muted'>Sin detalle de respuestas</li>"}
            </ul>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderEncuestasPendientes(encuestas, respuestas) {
  const cont = document.getElementById("encuestasPendientes");

  const respondidasIds = respuestas.map((r) => String(r.encuestaId?._id || r.encuestaId));
  const pendientes = encuestas.filter((e) => !respondidasIds.includes(String(e._id)));

  if (!pendientes.length) {
    cont.innerHTML = "<div class='text-success'>No tienes encuestas pendientes.</div>";
    return;
  }

  cont.innerHTML = pendientes
    .map(
      (e) => `
      <div class="mb-3 border p-3 rounded bg-light d-flex justify-content-between align-items-center">
        <div>
          <div><strong>${e.nombre}</strong></div>
          <div class="text-muted small">${e.descripcion || ""}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="cargarFormularioEncuesta('${e._id}')">
          Responder
        </button>
      </div>
    `
    )
    .join("");
}

function cargarFormularioEncuesta(encuestaId) {
  const encuesta = encuestasActivas.find((e) => String(e._id) === String(encuestaId));
  const cont = document.getElementById("formularioEncuesta");

  if (!encuesta) {
    cont.innerHTML = "<div class='text-danger'>No fue posible cargar la encuesta.</div>";
    return;
  }

  const preguntasHtml = encuesta.preguntas
    .map((pregunta) => {
      if (
        pregunta.tipoRespuesta === "opcion_unica" ||
        pregunta.tipoRespuesta === "likert" ||
        pregunta.tipoRespuesta === "si_no"
      ) {
        return `
          <div class="mb-4">
            <label class="form-label fw-semibold">${pregunta.numero}. ${pregunta.texto}</label>
            <select class="form-select" name="pregunta_${pregunta.numero}" data-texto="${pregunta.texto}" required>
              <option value="">Seleccione una opción</option>
              ${pregunta.opciones
                .map((op) => `<option value="${op}">${op}</option>`)
                .join("")}
            </select>
          </div>
        `;
      }

      if (pregunta.tipoRespuesta === "multiple") {
        return `
          <div class="mb-4">
            <label class="form-label fw-semibold">${pregunta.numero}. ${pregunta.texto}</label>
            <div>
              ${pregunta.opciones
                .map(
                  (op, index) => `
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        value="${op}"
                        id="preg_${pregunta.numero}_${index}"
                        name="pregunta_${pregunta.numero}"
                        data-texto="${pregunta.texto}"
                      />
                      <label class="form-check-label" for="preg_${pregunta.numero}_${index}">
                        ${op}
                      </label>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        `;
      }

      return "";
    })
    .join("");

  cont.innerHTML = `
    <div class="mb-3">
      <strong>${encuesta.nombre}</strong><br>
      <small class="text-muted">${encuesta.mensajeInicial || ""}</small>
    </div>

    <form id="formEncuestaPublica">
      ${preguntasHtml}
      <div id="mensajeFormularioPublico" class="small mb-3"></div>
      <button type="submit" class="btn btn-primary">Enviar respuestas</button>
    </form>
  `;

  document
    .getElementById("formEncuestaPublica")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const mensajeForm = document.getElementById("mensajeFormularioPublico");
      mensajeForm.textContent = "";
      mensajeForm.className = "small mb-3";

      const respuestas = [];

      for (const pregunta of encuesta.preguntas) {
        if (pregunta.tipoRespuesta === "multiple") {
          const checks = document.querySelectorAll(
            `input[name="pregunta_${pregunta.numero}"]:checked`
          );
          const valores = Array.from(checks).map((c) => c.value);

          if (!valores.length) {
            mensajeForm.textContent = `Debes responder la pregunta ${pregunta.numero}.`;
            mensajeForm.classList.add("text-danger");
            return;
          }

          respuestas.push({
            numeroPregunta: pregunta.numero,
            textoPregunta: pregunta.texto,
            respuesta: valores,
          });
        } else {
          const campo = document.querySelector(
            `[name="pregunta_${pregunta.numero}"]`
          );

          if (!campo || !campo.value) {
            mensajeForm.textContent = `Debes responder la pregunta ${pregunta.numero}.`;
            mensajeForm.classList.add("text-danger");
            return;
          }

          respuestas.push({
            numeroPregunta: pregunta.numero,
            textoPregunta: pregunta.texto,
            respuesta: campo.value,
          });
        }
      }

      try {
        const response = await fetch(`${API_URL}/respuestas-encuesta/publico`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numeroDocumento: numeroDocumentoActual,
            encuestaId: encuesta._id,
            respuestas,
            observaciones: "Encuesta diligenciada desde la vista pública",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          mensajeForm.textContent = data.message || "No fue posible guardar la encuesta.";
          mensajeForm.classList.add("text-danger");
          return;
        }

        mensajeForm.textContent = "Encuesta enviada correctamente.";
        mensajeForm.classList.add("text-success");

        btnBuscar.click();
      } catch (error) {
        console.error(error);
        mensajeForm.textContent = "Error de conexión con el servidor.";
        mensajeForm.classList.add("text-danger");
      }
    });
}

function formatearFecha(fecha) {
  if (!fecha) return "";
  const f = new Date(fecha);
  if (isNaN(f.getTime())) return "";
  return f.toLocaleDateString("es-CO");
}

window.cargarFormularioEncuesta = cargarFormularioEncuesta;