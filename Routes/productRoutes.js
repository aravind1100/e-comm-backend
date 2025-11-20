import express from 'express';
import { createProduct, getProducts, getProduct, updateProduct, deleteProduct } from '../Controllers/product.controller.js';
import { protect, admin } from "../Middleware/authMiddleware.js";

const router = express.Router();


// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected admin routes
router.use(protect, admin);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;