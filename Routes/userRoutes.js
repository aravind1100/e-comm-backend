// routes/userRoutes.js
import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateEmail,
  getCurrentUser
} from "../Controllers/user.controller.js";
import { protect, admin } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.get("/me",protect, getCurrentUser);
router.get("/", protect, admin, getAllUsers);
router.get("/:id", protect, getUserById);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);
router.put("/email/update/:id", protect, updateEmail);

export default router;