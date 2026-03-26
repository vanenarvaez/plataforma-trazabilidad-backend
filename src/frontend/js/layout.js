function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

function aplicarPermisosPorRol() {
  const user = getUser();

  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  const nombreUsuario = document.getElementById("nombreUsuario");
  const rolUsuario = document.getElementById("rolUsuario");

  if (nombreUsuario) {
    nombreUsuario.textContent = user.nombre || "Usuario";
  }

  if (rolUsuario) {
    rolUsuario.textContent = user.rol || "Sin rol";
  }

  const links = document.querySelectorAll("[data-roles]");

  links.forEach((link) => {
    const rolesPermitidos = link.dataset.roles.split(",").map((r) => r.trim());
    if (!rolesPermitidos.includes(user.rol)) {
      link.style.display = "none";
    }
  });
}