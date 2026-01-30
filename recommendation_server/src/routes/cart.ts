import { Router } from 'express';
import cartController from '@/modules/cart/cart.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, cartController.getCart);
router.post('/add', authMiddleware, cartController.addToCart);
router.put('/items/:itemId', authMiddleware, cartController.updateCartItem);
router.delete('/items/:itemId', authMiddleware, cartController.removeCartItem);
router.delete('/clear', authMiddleware, cartController.clearCart);

export default router;
