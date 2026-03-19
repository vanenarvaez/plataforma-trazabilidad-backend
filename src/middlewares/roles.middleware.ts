import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.rol;

    if (!userRole) {
      return res.status(403).json({
        message: "Acceso denegado: rol no identificado",
      });
    }

    if (userRole === "admin") {
      return next();
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: "Acceso no autorizado para este rol",
      });
    }

    next();
  };
};