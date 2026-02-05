import { Request, Response } from 'express';
import { container } from '../di/container';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';

/**
 * Presentation Layer: Recommendation Controller
 *
 * Thin controller that:
 * 1. Handles HTTP concerns (request/response)
 * 2. Delegates to use cases
 * 3. Maps domain responses to HTTP responses
 *
 * Clean Architecture principle:
 * Controllers should be thin and not contain business logic.
 */
export class RecommendationController {
  /**
   * GET /api/recommendations/:userId
   *
   * Get personalized recommendations for a user
   */
  async getRecommendations(req: Request, res: Response): Promise<Response> {
    try {
      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Invalid user ID',
        });
      }

      const strategy = req.query.strategy as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const categoryFilter = req.query.categoryId
        ? parseInt(req.query.categoryId as string, 10)
        : undefined;

      // Get use case from DI container
      const useCase = container.getRecommendationsUseCase();

      // Execute use case
      const result = await useCase.execute({
        userId,
        strategy: strategy as any,
        limit,
        categoryFilter,
      });

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Recommendations retrieved successfully',
        data: result,
      }).sendResponse(res);
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get recommendations',
      });
    }
  }

  /**
   * POST /api/recommendations/track
   *
   * Track user behavior for recommendation training
   */
  async trackBehavior(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, behaviorType, productId, categoryId, metadata } = req.body;

      // Validation
      if (!userId || !behaviorType) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'userId and behaviorType are required',
        });
      }

      const validBehaviorTypes = ['view', 'add_to_cart', 'purchase', 'review', 'wishlist', 'search'];
      if (!validBehaviorTypes.includes(behaviorType)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: `Invalid behaviorType. Must be one of: ${validBehaviorTypes.join(', ')}`,
        });
      }

      // Get use case from DI container
      const useCase = container.getTrackUserBehaviorUseCase();

      // Execute use case (async, don't await for better performance)
      useCase
        .execute({
          userId,
          behaviorType,
          productId,
          categoryId,
          metadata,
        })
        .catch((error) => {
          console.error('Error tracking behavior:', error);
        });

      // Return immediately (fire and forget)
      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Behavior tracked successfully',
      }).sendResponse(res);
    } catch (error: any) {
      console.error('Error tracking behavior:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to track behavior',
      });
    }
  }

  /**
   * GET /api/recommendations/similar/:productId
   *
   * Get similar products (for product detail page)
   */
  async getSimilarProducts(req: Request, res: Response): Promise<Response> {
    try {
      const productId = parseInt(req.params.productId, 10);

      if (isNaN(productId)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Invalid product ID',
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      // Get recommendation engine from DI container
      const engine = container.getRecommendationEngine();

      // Get similar products
      const recommendations = await engine.getSimilarProducts(productId, limit);

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Similar products retrieved successfully',
        data: {
          productId,
          recommendations: recommendations.map((r) => r.toJSON()),
        },
      }).sendResponse(res);
    } catch (error: any) {
      console.error('Error getting similar products:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get similar products',
      });
    }
  }
}

// Export singleton controller instance (for route binding)
export default new RecommendationController();
