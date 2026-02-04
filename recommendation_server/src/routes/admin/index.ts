import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validateBody, validateQuery, validateParams } from '@/middlewares/validate.middleware';
import { asyncHandle } from '@/utils/handle-error';
import adminProductController from '@/modules/admin/admin-product.controller';
import adminCategoryController from '@/modules/admin/admin-category.controller';
import adminBrandController from '@/modules/admin/admin-brand.controller';
import adminUserController from '@/modules/admin/admin-user.controller';
import adminReviewController from '@/modules/admin/admin-review.controller';
import { createProductSchema, updateProductSchema } from '@/modules/admin/schema/admin-product.schema';
import { createCategorySchema, updateCategorySchema } from '@/modules/admin/schema/admin-category.schema';
import { createBrandSchema, updateBrandSchema } from '@/modules/admin/schema/admin-brand.schema';
import { updateUserSchema, bulkDeactivateSchema } from '@/modules/admin/schema/admin-user.schema';
import { reviewFilterQuerySchema, bulkApproveSchema } from '@/modules/admin/schema/admin-review.schema';
import { paginationQuerySchema } from '@/modules/admin/schema/pagination-query.schema';
import { bulkOperationSchema } from '@/modules/admin/schema/bulk-operation.schema';
import { idParamSchema } from '@/modules/admin/schema/id-param.schema';

const router = Router();

router.use(requireAdmin());

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Admin router active' });
});

router.get(
  '/products',
  validateQuery(paginationQuerySchema),
  asyncHandle(adminProductController.listProducts)
);

router.get(
  '/products/:id',
  validateParams(idParamSchema),
  asyncHandle(adminProductController.getProduct)
);

router.post(
  '/products',
  validateBody(createProductSchema),
  asyncHandle(adminProductController.createProduct)
);

router.patch(
  '/products/:id',
  validateParams(idParamSchema),
  validateBody(updateProductSchema),
  asyncHandle(adminProductController.updateProduct)
);

router.delete(
  '/products/:id',
  validateParams(idParamSchema),
  asyncHandle(adminProductController.deleteProduct)
);

router.post(
  '/products/bulk-delete',
  validateBody(bulkOperationSchema),
  asyncHandle(adminProductController.bulkDelete)
);

router.get(
  '/categories',
  validateQuery(paginationQuerySchema),
  asyncHandle(adminCategoryController.listCategories)
);

router.get(
  '/categories/tree',
  asyncHandle(adminCategoryController.getCategoryTree)
);

router.get(
  '/categories/:id',
  validateParams(idParamSchema),
  asyncHandle(adminCategoryController.getCategory)
);

router.post(
  '/categories',
  validateBody(createCategorySchema),
  asyncHandle(adminCategoryController.createCategory)
);

router.patch(
  '/categories/:id',
  validateParams(idParamSchema),
  validateBody(updateCategorySchema),
  asyncHandle(adminCategoryController.updateCategory)
);

router.delete(
  '/categories/:id',
  validateParams(idParamSchema),
  asyncHandle(adminCategoryController.deleteCategory)
);

router.get(
  '/brands',
  validateQuery(paginationQuerySchema),
  asyncHandle(adminBrandController.listBrands)
);

router.get(
  '/brands/:id',
  validateParams(idParamSchema),
  asyncHandle(adminBrandController.getBrand)
);

router.post(
  '/brands',
  validateBody(createBrandSchema),
  asyncHandle(adminBrandController.createBrand)
);

router.patch(
  '/brands/:id',
  validateParams(idParamSchema),
  validateBody(updateBrandSchema),
  asyncHandle(adminBrandController.updateBrand)
);

router.delete(
  '/brands/:id',
  validateParams(idParamSchema),
  asyncHandle(adminBrandController.deleteBrand)
);

router.get(
  '/users',
  validateQuery(paginationQuerySchema),
  asyncHandle(adminUserController.listUsers)
);

router.get(
  '/users/:id',
  validateParams(idParamSchema),
  asyncHandle(adminUserController.getUser)
);

router.patch(
  '/users/:id',
  validateParams(idParamSchema),
  validateBody(updateUserSchema),
  asyncHandle(adminUserController.updateUser)
);

router.post(
  '/users/:id/deactivate',
  validateParams(idParamSchema),
  asyncHandle(adminUserController.deactivateUser)
);

router.post(
  '/users/:id/activate',
  validateParams(idParamSchema),
  asyncHandle(adminUserController.activateUser)
);

router.post(
  '/users/bulk-deactivate',
  validateBody(bulkDeactivateSchema),
  asyncHandle(adminUserController.bulkDeactivate)
);

router.get(
  '/reviews',
  validateQuery(reviewFilterQuerySchema),
  asyncHandle(adminReviewController.listReviews)
);

router.get(
  '/reviews/:id',
  validateParams(idParamSchema),
  asyncHandle(adminReviewController.getReview)
);

router.post(
  '/reviews/:id/approve',
  validateParams(idParamSchema),
  asyncHandle(adminReviewController.approveReview)
);

router.post(
  '/reviews/:id/reject',
  validateParams(idParamSchema),
  asyncHandle(adminReviewController.rejectReview)
);

router.delete(
  '/reviews/:id',
  validateParams(idParamSchema),
  asyncHandle(adminReviewController.deleteReview)
);

router.post(
  '/reviews/bulk-approve',
  validateBody(bulkApproveSchema),
  asyncHandle(adminReviewController.bulkApprove)
);

export default router;
