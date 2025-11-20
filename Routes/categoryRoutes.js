import express from 'express';
import { createCategory, getCategories, getCategory, updateCategory, deleteCategory } from '../Controllers/category.controller.js';
import { protect, admin } from "../Middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategory);

// Protected admin routes
router.use(protect,admin);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;