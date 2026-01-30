import { Router } from 'express';
import productController from '@/modules/products/product.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id/related', productController.getRelatedProducts);
router.get('/:id', productController.getProductById);

export default router;
