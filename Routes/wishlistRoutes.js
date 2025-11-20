import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../Controllers/wishlist.controller.js';
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/add', addToWishlist);
router.delete('/remove/:productId', removeFromWishlist);

export default router;