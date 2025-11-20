import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../Controllers/cart.controller.js';
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/item/:itemId', updateCartItem);
router.delete('/item/:itemId', removeFromCart);
router.delete('/clear', clearCart);

export default router;