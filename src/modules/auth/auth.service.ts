import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../users/models/user.model";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const MAX_INTENTOS_FALLIDOS = 3;
const MINUTOS_BLOQUEO = 15;

export const loginUser = async (email: string, password: string) => {
  const emailNormalizado = String(email).trim().toLowerCase();

  const user: any = await User.findOne({ email: emailNormalizado });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (!user.activo) {
    throw new Error("El usuario está inactivo");
  }

  const ahora = new Date();

  if (user.bloqueadoHasta && new Date(user.bloqueadoHasta) > ahora) {
    const fechaBloqueo = new Date(user.bloqueadoHasta);
    throw new Error(
      `Cuenta bloqueada temporalmente hasta ${fechaBloqueo.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    );
  }

  const passwordValido = await bcrypt.compare(password, user.password);

  if (!passwordValido) {
    user.intentosFallidos = Number(user.intentosFallidos || 0) + 1;

    if (user.intentosFallidos >= MAX_INTENTOS_FALLIDOS) {
      const bloqueadoHasta = new Date();
      bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + MINUTOS_BLOQUEO);

      user.bloqueadoHasta = bloqueadoHasta;
      user.intentosFallidos = 0;

      await user.save();

      throw new Error(
        `Cuenta bloqueada temporalmente por ${MINUTOS_BLOQUEO} minutos por múltiples intentos fallidos`
      );
    }

    await user.save();

    throw new Error(
      `Contraseña incorrecta. Intento ${user.intentosFallidos} de ${MAX_INTENTOS_FALLIDOS}`
    );
  }

  // Login correcto: reiniciar bloqueo e intentos
  user.intentosFallidos = 0;
  user.bloqueadoHasta = null;
  await user.save();

  const token = jwt.sign(
    {
      id: user._id,
      rol: user.rol,
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  const userResponse = {
    id: user._id,
    nombre: `${user.nombres} ${user.apellidos}`.trim(),
    nombres: user.nombres,
    apellidos: user.apellidos,
    email: user.email,
    rol: user.rol,
    activo: user.activo,
  };

  return {
    token,
    user: userResponse,
  };
};