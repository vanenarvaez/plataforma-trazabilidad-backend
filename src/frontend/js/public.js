const API_URL = `${window.location.origin}/api`;

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
    // 1. Primero validar si el docente existe consultando certificados elegibles
    const resCertElegibles = await fetch(
      `${API_URL}/certificados/elegibles/${numeroDocumento}`
    );

    // Si no existe el docente, detener todo aquí
    if (resCertElegibles.status === 404) {
      mensaje.textContent =
        "Lo sentimos, no se encuentra registrado en nuestra base de datos, por favor contacte a su formador.";
      mensaje.classList.add("text-danger");

      // Limpiar contenedores por seguridad
      document.getElementById("certificados").innerHTML = "";
      document.getElementById("encuestasDisponibles").innerHTML = "";
      document.getElementById("encuestasPendientes").innerHTML = "";

      return;
    }

    const certificadosElegibles = resCertElegibles.ok
      ? await resCertElegibles.json()
      : { certificados: [] };

    // 2. Solo si el docente existe, consultar lo demás
    const [resResp, resEncuestas] = await Promise.all([
      fetch(`${API_URL}/respuestas-encuesta/documento/${numeroDocumento}`),
      fetch(`${API_URL}/encuestas/publicas`),
    ]);

    const respuestas = resResp.ok ? await resResp.json() : [];
    const encuestas = resEncuestas.ok ? await resEncuestas.json() : [];

    respuestasRegistradas = Array.isArray(respuestas) ? respuestas : [];
    encuestasActivas = Array.isArray(encuestas) ? encuestas : [];

    renderCertificados(
      certificadosElegibles?.certificados || [],
      numeroDocumento
    );
    renderEncuestasRespondidas(respuestasRegistradas);
    renderEncuestasPendientes(encuestasActivas, respuestasRegistradas);

    contenido.style.display = "block";

    if (
      (!Array.isArray(certificadosElegibles?.certificados) ||
        !certificadosElegibles.certificados.length) &&
      (!Array.isArray(respuestas) || !respuestas.length) &&
      (!Array.isArray(encuestas) || !encuestas.length)
    ) {
      mensaje.textContent =
        "No se encontró información asociada a este docente.";
      mensaje.classList.add("text-warning");
    }
  } catch (error) {
    console.error(error);
    mensaje.textContent = "Error consultando información";
    mensaje.classList.add("text-danger");
  }
});

function renderCertificados(certificados, numeroDocumento) {
  const cont = document.getElementById("certificados");

  if (!certificados.length) {
    cont.innerHTML = "<div class='text-muted'>No hay certificados disponibles.</div>";
    return;
  }

  cont.innerHTML = `
    <div class="row g-3 align-items-end">
      <div class="col-md-9">
        <label class="form-label">Selecciona el certificado</label>
        <select id="selectCertificado" class="form-select">
          <option value="">Seleccione un curso certificado</option>
          ${certificados
            .map(
              (c) => `
                <option value="${c.proyectoCursoId}">
                  ${c.nombreCurso} - ${c.porcentajeAsistencia}% asistencia
                </option>
              `
            )
            .join("")}
        </select>
      </div>

      <div class="col-md-3">
        <button id="btnDescargarCertificado" class="btn btn-secondary w-100" disabled>
          Descargar
        </button>
      </div>
    </div>

    <div id="detalleCertificado" class="mt-3 small text-muted">
      Selecciona un curso para descargar el certificado.
    </div>
  `;

  const selectCertificado = document.getElementById("selectCertificado");
  const btnDescargarCertificado = document.getElementById("btnDescargarCertificado");
  const detalleCertificado = document.getElementById("detalleCertificado");

  selectCertificado.addEventListener("change", () => {
    const seleccionado = certificados.find(
      (c) => String(c.proyectoCursoId) === String(selectCertificado.value)
    );

    btnDescargarCertificado.disabled = !seleccionado;

    if (!seleccionado) {
      detalleCertificado.innerHTML =
        "Selecciona un curso para descargar el certificado.";
      return;
    }

    detalleCertificado.innerHTML = `
      <div><strong>Curso:</strong> ${seleccionado.nombreCurso || ""}</div>
      <div><strong>Asistencia:</strong> ${seleccionado.porcentajeAsistencia || 0}%</div>
      <div><strong>Intensidad:</strong> ${seleccionado.duracionHoras || 0} horas</div>
    `;
  });

  btnDescargarCertificado.addEventListener("click", () => {
    const proyectoCursoId = selectCertificado.value;
    if (!proyectoCursoId) return;

    window.open(
      `${API_URL}/certificados/publico/${numeroDocumento}/${proyectoCursoId}`,
      "_blank"
    );
  });
}

function renderEncuestasRespondidas(respuestas) {
  const cont = document.getElementById("encuestasDisponibles");

  if (!respuestas.length) {
    cont.innerHTML = "<div class='text-muted'>No hay encuestas respondidas registradas.</div>";
    return;
  }

  cont.innerHTML = respuestas
    .map((r) => {
      return `
        <div class="mb-3 border p-3 rounded bg-light">
          <div><strong>Encuesta:</strong> ${r.encuestaId?.nombre || "Encuesta"}</div>
          <div><strong>Código:</strong> ${r.encuestaId?.codigo || ""}</div>
          <div><strong>Tipo:</strong> ${r.encuestaId?.tipo || ""}</div>
          <div><strong>Fecha:</strong> ${formatearFecha(r.fechaRespuesta || r.createdAt)}</div>
          <div><strong>Estado:</strong> ${r.completada ? "Completada" : "Pendiente"}</div>
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
      <div class="mb-3 border p-3 rounded bg-light">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div><strong>${e.nombre}</strong></div>
            <div class="text-muted small">${e.descripcion || ""}</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="cargarFormularioEncuesta('${e._id}')">
            Responder
          </button>
        </div>
        <div id="formulario_pendiente_${e._id}" class="mt-3"></div>
      </div>
    `
    )
    .join("");
}

function cargarFormularioEncuesta(encuestaId) {
  const encuesta = encuestasActivas.find((e) => String(e._id) === String(encuestaId));
  const cont = document.getElementById(`formulario_pendiente_${encuestaId}`);

  if (!encuesta || !cont) {
    return;
  }

  document.querySelectorAll("[id^='formulario_pendiente_']").forEach((div) => {
    if (div.id !== `formulario_pendiente_${encuestaId}`) {
      div.innerHTML = "";
    }
  });

  const preguntasHtml = (encuesta.preguntas || [])
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
              ${(pregunta.opciones || [])
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
              ${(pregunta.opciones || [])
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
    <div class="mt-3 border-top pt-3">
      <div class="mb-3">
        <strong>${encuesta.nombre}</strong><br>
        <small class="text-muted">${encuesta.mensajeInicial || ""}</small>
      </div>

      <form id="formEncuestaPublica_${encuestaId}">
        ${preguntasHtml}
        <div id="mensajeFormularioPublico_${encuestaId}" class="small mb-3"></div>
        <button type="submit" class="btn btn-primary">Enviar respuestas</button>
      </form>
    </div>
  `;

  document
    .getElementById(`formEncuestaPublica_${encuestaId}`)
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const mensajeForm = document.getElementById(`mensajeFormularioPublico_${encuestaId}`);
      mensajeForm.textContent = "";
      mensajeForm.className = "small mb-3";

      const respuestas = [];

      for (const pregunta of encuesta.preguntas || []) {
        if (pregunta.tipoRespuesta === "multiple") {
          const checks = document.querySelectorAll(
            `#formEncuestaPublica_${encuestaId} input[name="pregunta_${pregunta.numero}"]:checked`
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
            `#formEncuestaPublica_${encuestaId} [name="pregunta_${pregunta.numero}"]`
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