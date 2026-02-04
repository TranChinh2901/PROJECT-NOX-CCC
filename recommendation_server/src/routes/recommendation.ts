import { Router } from 'express';
import recommendationController from '../modules/ai/presentation/RecommendationController';

const router = Router();

/**
 * @route   GET /api/recommendations/:userId
 * @desc    Get personalized recommendations for a user
 * @access  Public (should be protected with auth middleware in production)
 * @query   strategy?: 'collaborative' | 'content' | 'hybrid' | 'popularity'
 * @query   limit?: number (default: 10)
 * @query   categoryId?: number (filter by category)
 */
router.get('/:userId', (req, res) => {
  return recommendationController.getRecommendations(req, res);
});

/**
 * @route   POST /api/recommendations/track
 * @desc    Track user behavior for recommendation training
 * @access  Public (should be protected with auth middleware in production)
 * @body    userId: number (required)
 * @body    behaviorType: 'view' | 'add_to_cart' | 'purchase' | 'review' | 'wishlist' | 'search' (required)
 * @body    productId?: number
 * @body    categoryId?: number
 * @body    metadata?: object
 */
router.post('/track', (req, res) => {
  return recommendationController.trackBehavior(req, res);
});

/**
 * @route   GET /api/recommendations/similar/:productId
 * @desc    Get similar products
 * @access  Public
 * @query   limit?: number (default: 10)
 */
router.get('/similar/:productId', (req, res) => {
  return recommendationController.getSimilarProducts(req, res);
});

export default router;
