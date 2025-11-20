import express from 'express';
import { protect} from "../Middleware/authMiddleware.js";
import { createOrder, getOrderById, getUserOrders } from '../controllers/order.controller.js';

const router = express.Router();

router.use(protect);

// Customer routes
router.post('/', createOrder);
router.get('/user', getUserOrders);
router.get('/:id', getOrderById);



export default router;