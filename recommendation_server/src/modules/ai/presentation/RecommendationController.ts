import { Request, Response } from 'express';
import { container } from '../di/container';
import { AppResponse } from '@/common/success.response';
import { HttpStatusCode } from '@/constants/status-code';
import { AppDataSource } from '@/config/database.config';
import { RecommendationCache } from '../entity/recommendation-cache';
import { UserBehaviorLog } from '../entity/user-behavior-log';
import { UserActionType } from '../enum/user-behavior.enum';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';
import {
  getConfiguredRecommendationEngineMode,
  inspectOfflineRecommendationArtifacts,
} from '../infrastructure/runtime/RecommendationArtifactHealth';

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

  private buildPublicStatusResponse(offlineArtifactHealth: Awaited<
    ReturnType<typeof inspectOfflineRecommendationArtifacts>
  >,
  configuredEngineMode: ReturnType<typeof getConfiguredRecommendationEngineMode>,
  effectiveEngineMode: ReturnType<typeof getConfiguredRecommendationEngineMode>,
  activeCacheRows: Array<{ algorithm: string; count: string }>,
  staleCacheRows: Array<{ algorithm: string; count: string }>,
  latestCacheEntry: RecommendationCache | null,
  totalBehaviorLogs: number,
  impressionLogs: number,
  nonImpressionViewLogs: number) {
    return {
      engine: {
        configuredMode: configuredEngineMode,
        effectiveMode: effectiveEngineMode,
        strategy:
          effectiveEngineMode === 'offline_model' ? 'collaborative_filtering' : 'content_based',
        rollback: {
          active: offlineArtifactHealth.rollback.active,
          forced: offlineArtifactHealth.rollback.forced,
          preferredMode: offlineArtifactHealth.rollback.preferredMode,
        },
        readiness: {
          state: offlineArtifactHealth.state === 'healthy' ? 'ready' : 'degraded',
          reasons: offlineArtifactHealth.reasons,
        },
      },
      modelFile: {
        exists: offlineArtifactHealth.exists,
        sizeBytes: offlineArtifactHealth.sizeBytes,
        updatedAt: offlineArtifactHealth.updatedAt,
        metadataGeneratedAt: offlineArtifactHealth.metadataGeneratedAt,
        freshnessWindowMinutes: offlineArtifactHealth.freshnessWindowMinutes,
        ageMinutes: offlineArtifactHealth.ageMinutes,
        state: offlineArtifactHealth.state,
        isFresh: offlineArtifactHealth.isFresh,
        reasons: offlineArtifactHealth.reasons,
      },
      artifactCoverage: offlineArtifactHealth.coverage,
      cacheSummary: {
        exists: offlineArtifactHealth.cacheSummary.exists,
        generatedAt: offlineArtifactHealth.cacheSummary.generatedAt,
        ageMinutes: offlineArtifactHealth.cacheSummary.ageMinutes,
        algorithm: offlineArtifactHealth.cacheSummary.algorithm,
        ttlHours: offlineArtifactHealth.cacheSummary.ttlHours,
        userCount: offlineArtifactHealth.cacheSummary.userCount,
        insertedEntries: offlineArtifactHealth.cacheSummary.insertedEntries,
        userCoverageRatio: offlineArtifactHealth.cacheSummary.userCoverageRatio,
        productsWithSimilarItems: offlineArtifactHealth.cacheSummary.productsWithSimilarItems,
        similarItemCoverageRatio: offlineArtifactHealth.cacheSummary.similarItemCoverageRatio,
      },
      cache: {
        activeByAlgorithm: activeCacheRows.map((row) => ({
          algorithm: row.algorithm,
          count: Number(row.count),
        })),
        staleByAlgorithm: staleCacheRows.map((row) => ({
          algorithm: row.algorithm,
          count: Number(row.count),
        })),
        latestActiveEntry: latestCacheEntry
          ? {
              algorithm: latestCacheEntry.algorithm,
              recommendationType: latestCacheEntry.recommendation_type,
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
        refreshIntervalMinutes: Number(
          process.env.RECOMMENDATION_PIPELINE_REFRESH_INTERVAL_MINUTES || 360
        ),
        offlineFreshnessWindowMinutes: offlineArtifactHealth.freshnessWindowMinutes,
        forcedContentFallback: offlineArtifactHealth.rollback.forced,
      },
    };
  }

  /**
   * GET /api/recommendations/status
   *
   * Lightweight operational status for the recommendation system.
   */
  async getStatus(_req: Request, res: Response): Promise<Response> {
    try {
      const configuredEngineMode = getConfiguredRecommendationEngineMode();
      const offlineArtifactHealth = await inspectOfflineRecommendationArtifacts();
      const effectiveEngineMode = offlineArtifactHealth.rollback.active
        ? offlineArtifactHealth.rollback.preferredMode
        : configuredEngineMode;

      const recommendationCacheRepository = AppDataSource.getRepository(RecommendationCache);
      const behaviorLogRepository = AppDataSource.getRepository(UserBehaviorLog);
      const now = new Date();

      const [
        activeCacheRows,
        staleCacheRows,
        latestCacheEntry,
        totalBehaviorLogs,
        impressionLogs,
        nonImpressionViewLogs,
      ] =
        await Promise.all([
          recommendationCacheRepository
            .createQueryBuilder('cache')
            .select('cache.algorithm', 'algorithm')
            .addSelect('COUNT(*)', 'count')
            .where('cache.is_active = :isActive', { isActive: true })
            .andWhere('cache.expires_at >= :now', { now })
            .groupBy('cache.algorithm')
            .getRawMany<{ algorithm: string; count: string }>(),
          recommendationCacheRepository
            .createQueryBuilder('cache')
            .select('cache.algorithm', 'algorithm')
            .addSelect('COUNT(*)', 'count')
            .where('cache.is_active = :isActive', { isActive: true })
            .andWhere('cache.expires_at < :now', { now })
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
        data: this.buildPublicStatusResponse(
          offlineArtifactHealth,
          configuredEngineMode,
          effectiveEngineMode,
          activeCacheRows,
          staleCacheRows,
          latestCacheEntry,
          totalBehaviorLogs,
          impressionLogs,
          nonImpressionViewLogs
        ),
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

      const useCase = container.getRecommendationsUseCase();

      const result = await useCase.executeSimilarProducts(productId, limit);

      return new AppResponse({
        statusCode: HttpStatusCode.OK,
        message: 'Similar products retrieved successfully',
        data: result,
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
