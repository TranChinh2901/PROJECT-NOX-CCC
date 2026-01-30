import { Router } from 'express';
import orderController from '@/modules/orders/order.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, orderController.createOrder);
router.get('/', authMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.post('/:id/cancel', authMiddleware, orderController.cancelOrder);

export default router;
