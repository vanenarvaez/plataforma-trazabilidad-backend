const API_URL = "http://localhost:3000/api";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "../index.html";
}

const usuarioForm = document.getElementById("usuarioForm");
const mensajeUsuario = document.getElementById("mensajeUsuario");
const tablaUsuarios = document.getElementById("tablaUsuarios");

const usuarioIdEdicion = document.getElementById("usuarioIdEdicion");
const nombresInput = document.getElementById("nombres");
const apellidosInput = document.getElementById("apellidos");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rolInput = document.getElementById("rol");
const activoInput = document.getElementById("activo");

const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");

const buscadorUsuarios = document.getElementById("buscadorUsuarios");
const filtroRolUsuarios = document.getElementById("filtroRolUsuarios");
const filtroEstadoUsuarios = document.getElementById("filtroEstadoUsuarios");

let usuariosBase = [];

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

async function fetchConToken(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

function escaparHtml(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nombreRol(rol) {
  const mapa = {
    admin: "Administrador",
    director: "Director",
    pedagogico: "Líder pedagógico",
    formador: "Formador",
    comercial: "Comercial",
  };
  return mapa[rol] || rol || "";
}

function mostrarMensajeUsuario(texto, tipo = "info") {
  const clases = {
    success: "text-success",
    danger: "text-danger",
    info: "text-muted",
  };

  mensajeUsuario.className = `small ${clases[tipo] || "text-muted"}`;
  mensajeUsuario.textContent = texto;
}

async function cargarUsuarios() {
  try {
    const response = await fetchConToken(`${API_URL}/users`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      usuariosBase = [];
      tablaUsuarios.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger">No fue posible cargar los usuarios</td>
        </tr>
      `;
      return;
    }

    usuariosBase = data;
    aplicarFiltrosUsuarios();
  } catch (error) {
    console.error(error);
    usuariosBase = [];
    tablaUsuarios.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-danger">Error de conexión con el servidor</td>
      </tr>
    `;
  }
}

function obtenerUsuariosFiltrados() {
  const texto = (buscadorUsuarios.value || "").trim().toLowerCase();
  const rol = filtroRolUsuarios.value;
  const estado = filtroEstadoUsuarios.value;

  return usuariosBase.filter((usuario) => {
    const textoUsuario = [
      usuario.nombres || "",
      usuario.apellidos || "",
      usuario.email || "",
      usuario.rol || "",
    ]
      .join(" ")
      .toLowerCase();

    const coincideTexto = texto ? textoUsuario.includes(texto) : true;
    const coincideRol = rol ? usuario.rol === rol : true;
    const coincideEstado =
      estado === "activos"
        ? usuario.activo === true
        : estado === "inactivos"
        ? usuario.activo === false
        : true;

    return coincideTexto && coincideRol && coincideEstado;
  });
}

function renderizarTablaUsuarios(lista) {
  if (!lista.length) {
    tablaUsuarios.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">No hay usuarios con el filtro aplicado</td>
      </tr>
    `;
    return;
  }

  tablaUsuarios.innerHTML = lista
    .map(
      (usuario) => `
        <tr>
          <td>${escaparHtml(`${usuario.nombres || ""} ${usuario.apellidos || ""}`.trim())}</td>
          <td>${escaparHtml(usuario.email || "")}</td>
          <td>${escaparHtml(nombreRol(usuario.rol))}</td>
          <td>${usuario.activo ? "Activo" : "Inactivo"}</td>
          <td>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-primary" onclick="editarUsuario('${usuario._id}')">
                Editar
              </button>
              <button class="btn btn-sm btn-outline-warning" onclick="cambiarEstadoUsuario('${usuario._id}', ${usuario.activo ? "false" : "true"})">
                ${usuario.activo ? "Inactivar" : "Activar"}
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function aplicarFiltrosUsuarios() {
  const filtrados = obtenerUsuariosFiltrados();
  renderizarTablaUsuarios(filtrados);
}

function limpiarFormularioUsuario() {
  usuarioIdEdicion.value = "";
  nombresInput.value = "";
  apellidosInput.value = "";
  emailInput.value = "";
  passwordInput.value = "";
  rolInput.value = "";
  activoInput.checked = true;
  passwordInput.disabled = false;
}

window.editarUsuario = function (id) {
  const usuario = usuariosBase.find((u) => String(u._id) === String(id));
  if (!usuario) return;

  usuarioIdEdicion.value = usuario._id;
  nombresInput.value = usuario.nombres || "";
  apellidosInput.value = usuario.apellidos || "";
  emailInput.value = usuario.email || "";
  rolInput.value = usuario.rol || "";
  activoInput.checked = usuario.activo !== false;

  passwordInput.value = "";
  passwordInput.disabled = true;

  mostrarMensajeUsuario(
    "Editando usuario. La contraseña no cambiará desde este formulario.",
    "info"
  );
};

window.cambiarEstadoUsuario = async function (id, nuevoEstado) {
  try {
    const usuario = usuariosBase.find((u) => String(u._id) === String(id));
    if (!usuario) return;

    const response = await fetchConToken(`${API_URL}/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: usuario.rol,
        activo: nuevoEstado,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      mostrarMensajeUsuario(data.message || "No fue posible cambiar el estado", "danger");
      return;
    }

    mostrarMensajeUsuario("Estado del usuario actualizado correctamente", "success");
    await cargarUsuarios();
  } catch (error) {
    console.error(error);
    mostrarMensajeUsuario("Error de conexión con el servidor", "danger");
  }
};

usuarioForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  mostrarMensajeUsuario("");

  const body = {
    nombres: nombresInput.value.trim(),
    apellidos: apellidosInput.value.trim(),
    email: emailInput.value.trim(),
    rol: rolInput.value,
    activo: activoInput.checked,
  };

  const idEdicion = usuarioIdEdicion.value;

  try {
    let response;
    let data;

    if (idEdicion) {
      response = await fetchConToken(`${API_URL}/users/${idEdicion}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } else {
      response = await fetchConToken(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...body,
          password: passwordInput.value.trim(),
        }),
      });
    }

    data = await response.json();

    if (!response.ok) {
      mostrarMensajeUsuario(data.message || "No fue posible guardar el usuario", "danger");
      return;
    }

    mostrarMensajeUsuario(
      idEdicion ? "Usuario actualizado correctamente" : "Usuario creado correctamente",
      "success"
    );

    limpiarFormularioUsuario();
    await cargarUsuarios();
  } catch (error) {
    console.error(error);
    mostrarMensajeUsuario("Error de conexión con el servidor", "danger");
  }
});

btnCancelarEdicion.addEventListener("click", () => {
  limpiarFormularioUsuario();
  mostrarMensajeUsuario("");
});

buscadorUsuarios.addEventListener("input", aplicarFiltrosUsuarios);
filtroRolUsuarios.addEventListener("change", aplicarFiltrosUsuarios);
filtroEstadoUsuarios.addEventListener("change", aplicarFiltrosUsuarios);

async function inicializarUsuarios() {
  limpiarFormularioUsuario();
  await cargarUsuarios();
}

inicializarUsuarios();