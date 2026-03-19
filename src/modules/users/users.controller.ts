import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "./models/user.model";

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error al listar usuarios",
      error,
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "El correo ya está registrado",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      nombre,
      email,
      password: hashedPassword,
      rol,
    });

    await newUser.save();

    res.status(201).json({
      message: "Usuario creado correctamente",
      user: {
        id: newUser._id,
        nombre: newUser.nombre,
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