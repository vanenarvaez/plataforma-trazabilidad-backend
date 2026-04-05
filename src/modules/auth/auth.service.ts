import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../users/models/user.model";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (!user.activo) {
    throw new Error("El usuario está inactivo");
  }

  const passwordValido = await bcrypt.compare(password, user.password);

  if (!passwordValido) {
    throw new Error("Contraseña incorrecta");
  }

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