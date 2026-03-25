import { Router } from 'express';
import cartController from '@/modules/cart/cart.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { asyncHandle } from '@/utils/handle-error';

const router = Router();

router.get('/', authMiddleware(), asyncHandle(cartController.getCart));
router.post('/add', authMiddleware(), asyncHandle(cartController.addToCart));
router.put('/items/:itemId', authMiddleware(), asyncHandle(cartController.updateCartItem));
router.delete('/items/bulk', authMiddleware(), asyncHandle(cartController.bulkRemoveItems));
router.delete('/items/:itemId', authMiddleware(), asyncHandle(cartController.removeCartItem));
router.delete('/clear', authMiddleware(), asyncHandle(cartController.clearCart));

export default router;
