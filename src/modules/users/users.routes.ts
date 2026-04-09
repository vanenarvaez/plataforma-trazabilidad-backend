import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changeUserPassword,
  resetearPassword,
} from "./users.controller";
import { verifyToken } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/roles.middleware";

const router = Router();

router.get("/", verifyToken, authorizeRoles("admin"), getUsers);

router.get("/:id", verifyToken, authorizeRoles("admin"), getUserById);

router.post("/", verifyToken, authorizeRoles("admin"), createUser);

router.put("/:id", verifyToken, authorizeRoles("admin"), updateUser);

router.put(
  "/:id/password",
  verifyToken,
  authorizeRoles("admin"),
  changeUserPassword
);

router.patch(
  "/:id/reset-password",
  verifyToken,
  authorizeRoles("admin"),
  resetearPassword
);

export default router;