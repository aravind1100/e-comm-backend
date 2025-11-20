import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";

import categoryRoutes from "./categoryRoutes.js";
import productRoutes from "./productRoutes.js";
import cartRoutes from "./cartRoutes.js";
import orderRoutes from "./orderRoutes.js";

import wishlistRoutes from "./wishlistRoutes.js";


const router = express.Router();

// Public routes
router.use("/auth", authRoutes);

// Protected routes
router.use("/users", userRoutes);

router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);

router.use("/wishlist", wishlistRoutes);

export default router;
