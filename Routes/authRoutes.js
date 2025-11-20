import express from "express";
import {
  signup,
  login,
} from "../Controllers/authController.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many attempts, please try again later",
});

const router = express.Router();

// Public routes (no authentication required)
router.post("/signup", signup);
router.post("/login", authLimiter, login);


export default router;
