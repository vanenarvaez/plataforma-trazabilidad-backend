import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "./models/user.model";

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error al listar usuarios",
      error,
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Error al consultar usuario",
      error,
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { nombres, apellidos, email, password, rol, activo } = req.body;

    if (!nombres || !apellidos || !email || !password || !rol) {
      return res.status(400).json({
        message: "Todos los campos obligatorios deben estar completos",
      });
    }

    // 🔐 Validación de longitud de contraseña (mínimo 4)
    if (String(password).trim().length < 4) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 4 caracteres",
      });
    }

    const existingUser = await User.findOne({
      email: String(email).trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "El correo ya está registrado",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password).trim(), 10);

    const newUser = new User({
      nombres: String(nombres).trim(),
      apellidos: String(apellidos).trim(),
      email: String(email).trim().toLowerCase(),
      password: hashedPassword,
      rol,
      activo: activo !== false,
    });

    await newUser.save();

    res.status(201).json({
      message: "Usuario creado correctamente",
      user: {
        id: newUser._id,
        nombres: newUser.nombres,
        apellidos: newUser.apellidos,
        email: newUser.email,
        rol: newUser.rol,
        activo: newUser.activo,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al crear usuario",
      error,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, email, rol, activo } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    if (email && String(email).trim().toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        email: String(email).trim().toLowerCase(),
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "El correo ya está registrado por otro usuario",
        });
      }
    }

    user.nombres =
      nombres !== undefined ? String(nombres).trim() : user.nombres;
    user.apellidos =
      apellidos !== undefined ? String(apellidos).trim() : user.apellidos;
    user.email =
      email !== undefined ? String(email).trim().toLowerCase() : user.email;
    user.rol = rol !== undefined ? rol : user.rol;
    user.activo = activo !== undefined ? Boolean(activo) : user.activo;

    await user.save();

    res.status(200).json({
      message: "Usuario actualizado correctamente",
      user: {
        id: user._id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        rol: user.rol,
        activo: user.activo,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar usuario",
      error,
    });
  }
};

export const changeUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || String(password).trim().length < 4) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 4 caracteres",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    user.password = await bcrypt.hash(String(password).trim(), 10);
    await user.save();

    res.status(200).json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar contraseña",
      error,
    });
  }
};

export const resetearPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nuevaPassword } = req.body;

    if (!nuevaPassword || String(nuevaPassword).trim().length < 4) {
      return res.status(400).json({
        message: "La nueva contraseña debe tener al menos 4 caracteres",
      });
    }

    const hash = await bcrypt.hash(String(nuevaPassword).trim(), 10);

    const usuario = await User.findByIdAndUpdate(
      id,
      { password: hash },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al resetear contraseña",
      error,
    });
  }
};