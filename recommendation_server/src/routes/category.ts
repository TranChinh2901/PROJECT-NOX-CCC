import { Router } from 'express';
import categoryController from '@/modules/products/category.controller';

const router = Router();

router.get('/tree', categoryController.getCategoryTree);
router.get('/root', categoryController.getRootCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:id', categoryController.getCategoryById);
router.get('/', categoryController.getAllCategories);

export default router;
