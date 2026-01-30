import { Router } from 'express';
import reviewController from '@/modules/reviews/review.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/product/:productId/helpful/:reviewId', authMiddleware, reviewController.markReviewHelpful);
router.get('/my-reviews', authMiddleware, reviewController.getUserReviews);
router.post('/', authMiddleware, reviewController.createReview);

export default router;
