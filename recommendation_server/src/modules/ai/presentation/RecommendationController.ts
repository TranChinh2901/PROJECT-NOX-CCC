import { Request, Response } from 'express';
import { access, stat } from 'fs/promises';
import { container } from '../di/container';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import path from 'path';
import { AppDataSource } from '@/config/database.config';
import { RecommendationCache } from '../entity/recommendation-cache';
import { UserBehaviorLog } from '../entity/user-behavior-log';
import { UserActionType } from '../enum/user-behavior.enum';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

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
  private readonly validStrategies = ['collaborative', 'content', 'hybrid', 'popularity'];

  /**
   * GET /api/recommendations/status
   *
   * Lightweight operational status for the recommendation system.
   */
  async getStatus(_req: Request, res: Response): Promise<Response> {
    try {
      const engineMode = process.env.RECOMMENDATION_ENGINE?.trim().toLowerCase() || 'content_based';
      const configuredModelPath = process.env.RECOMMENDATION_MODEL_PATH || 'exports/recommendation-baseline-model.json';
      const resolvedModelPath = path.isAbsolute(configuredModelPath)
        ? configuredModelPath
        : path.resolve(process.cwd(), configuredModelPath);

      let modelFile = {
        configuredPath: configuredModelPath,
        resolvedPath: resolvedModelPath,
        exists: false,
        sizeBytes: 0,
        updatedAt: null as string | null,
      };

      try {
        await access(resolvedModelPath);
        const fileStats = await stat(resolvedModelPath);
        modelFile = {
          configuredPath: configuredModelPath,
          resolvedPath: resolvedModelPath,
          exists: true,
          sizeBytes: fileStats.size,
          updatedAt: fileStats.mtime.toISOString(),
        };
      } catch {
        modelFile.exists = false;
      }

      const recommendationCacheRepository = AppDataSource.getRepository(RecommendationCache);
      const behaviorLogRepository = AppDataSource.getRepository(UserBehaviorLog);
      const now = new Date();

      const [activeCacheRows, latestCacheEntry, totalBehaviorLogs, impressionLogs, nonImpressionViewLogs] =
        await Promise.all([
          recommendationCacheRepository
            .createQueryBuilder('cache')
            .select('cache.algorithm', 'algorithm')
            .addSelect('COUNT(*)', 'count')
            .where('cache.is_active = :isActive', { isActive: true })
            .andWhere('cache.expires_at >= :now', { now })
            .groupBy('cache.algorithm')
            .getRawMany<{ algorithm: string; count: string }>(),
          recommendationCacheRepository.findOne({
            where: { is_active: true },
            order: { generated_at: 'DESC' },
          }),
          behaviorLogRepository.count(),
          behaviorLogRepository
            .createQueryBuilder('log')
            .where('log.action_type = :viewAction', { viewAction: UserActionType.VIEW })
            .andWhere(
              "JSON_UNQUOTE(JSON_EXTRACT(log.metadata, '$.event')) = :impressionEvent",
              { impressionEvent: 'impression' }
            )
            .getCount(),
          behaviorLogRepository
            .createQueryBuilder('log')
            .where('log.action_type = :viewAction', { viewAction: UserActionType.VIEW })
            .andWhere(
              "(JSON_UNQUOTE(JSON_EXTRACT(log.metadata, '$.event')) IS NULL OR JSON_UNQUOTE(JSON_EXTRACT(log.metadata, '$.event')) != :impressionEvent)",
              { impressionEvent: 'impression' }
            )
            .getCount(),
        ]);

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Recommendation system status retrieved successfully',
        data: {
          engine: {
            mode: engineMode,
            strategy: container.getRecommendationEngine().getStrategy(),
          },
          modelFile,
          cache: {
            activeByAlgorithm: activeCacheRows.map((row) => ({
              algorithm: row.algorithm,
              count: Number(row.count),
            })),
            latestActiveEntry: latestCacheEntry
              ? {
                  id: latestCacheEntry.id,
                  algorithm: latestCacheEntry.algorithm,
                  recommendationType: latestCacheEntry.recommendation_type,
                  userId: latestCacheEntry.user_id ?? null,
                  generatedAt: latestCacheEntry.generated_at.toISOString(),
                  expiresAt: latestCacheEntry.expires_at.toISOString(),
                  isActive: latestCacheEntry.is_active,
                }
              : null,
          },
          behaviorLogs: {
            total: totalBehaviorLogs,
            impressionViews: impressionLogs,
            userInitiatedViews: nonImpressionViewLogs,
          },
          scheduler: {
            enabled: process.env.RECOMMENDATION_PIPELINE_SCHEDULER_ENABLED === 'true',
            runOnStart: process.env.RECOMMENDATION_PIPELINE_RUN_ON_START === 'true',
            refreshIntervalMinutes: Number(process.env.RECOMMENDATION_PIPELINE_REFRESH_INTERVAL_MINUTES || 360),
          },
        },
      }).sendResponse(res);
    } catch (error: any) {
      console.error('Error getting recommendation status:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to get recommendation system status',
      });
    }
  }

  /**
   * GET /api/recommendations/:userId
   *
   * Get personalized recommendations for a user
   */
  async getRecommendations(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Invalid user ID',
        });
      }

      if (req.user && req.user.id !== userId) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: 'You can only access recommendations for your own account',
        });
      }

      const strategy = req.query.strategy as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const categoryFilter = req.query.categoryId
        ? parseInt(req.query.categoryId as string, 10)
        : undefined;

      if (strategy && !this.validStrategies.includes(strategy)) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: `Invalid strategy. Must be one of: ${this.validStrategies.join(', ')}`,
        });
      }

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
  async trackBehavior(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { userId, behaviorType, productId, categoryId, metadata } = req.body;
      const authenticatedUserId = req.user?.id;
      const resolvedUserId = authenticatedUserId ?? userId;

      // Validation
      if (!resolvedUserId || !behaviorType) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'userId and behaviorType are required',
        });
      }

      if (authenticatedUserId && userId && userId !== authenticatedUserId) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: 'You can only track behavior for your own account',
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

      await useCase.execute({
        userId: resolvedUserId,
        behaviorType,
        productId,
        categoryId,
        metadata,
      });

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
