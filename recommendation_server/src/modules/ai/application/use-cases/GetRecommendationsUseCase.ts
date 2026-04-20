import { IRecommendationRepository } from '../../domain/repositories/IRecommendationRepository';
import {
  BehaviorType,
  IUserBehaviorRepository,
  UserBehaviorLog,
} from '../../domain/repositories/IUserBehaviorRepository';
import {
  IProductFeatureRepository,
  ProductFeature,
} from '../../domain/repositories/IProductFeatureRepository';
import { IRecommendationEngine } from '../../domain/services/IRecommendationEngine';
import { RecommendationStrategy } from '../../domain/services/IRecommendationEngine';
import { GetRecommendationsRequestDTO } from '../dto/GetRecommendationsRequest';
import { GetRecommendationsResponseDTO } from '../dto/GetRecommendationsResponse';
import {
  RecommendationDecisionMetadata,
  RecommendationDecisionSource,
} from '../dto/GetRecommendationsResponse';
import { Recommendation } from '../../domain/entities/Recommendation';
import { GetSimilarProductsResponseDTO } from '../dto/GetSimilarProductsResponse';
import { IRecommendationArtifactMetadataProvider } from '../../domain/services/IRecommendationEngine';
import { inspectOfflineRecommendationArtifacts } from '../../infrastructure/runtime/RecommendationArtifactHealth';
import { logRecommendationTrace } from '../../infrastructure/monitoring/RecommendationObservability';

type CandidateResult = {
  recommendations: Recommendation[];
  unavailableReason?: string;
};

type DecisionTreeResolution = {
  recommendations: Recommendation[];
  decision: RecommendationDecisionMetadata;
};

type EligibleItem = {
  productId: number;
};

const HOMEPAGE_VISIBLE_SET_SIZE = 4;

/**
 * Use Case: Get Recommendations
 *
 * This is the core application business logic.
 * It orchestrates domain entities, repositories, and services.
 *
 * Clean Architecture principle: Use cases should not depend on
 * infrastructure details (databases, HTTP, etc.)
 */
export class GetRecommendationsUseCase {
  constructor(
    private readonly recommendationRepository: IRecommendationRepository,
    private readonly userBehaviorRepository: IUserBehaviorRepository,
    private readonly productFeatureRepository: IProductFeatureRepository,
    private readonly contentRecommendationEngine: IRecommendationEngine,
    private readonly offlineRecommendationEngine: IRecommendationEngine &
      Partial<IRecommendationArtifactMetadataProvider>
  ) {}

  /**
   * Execute the use case
   */
  async execute(
    request: GetRecommendationsRequestDTO
  ): Promise<GetRecommendationsResponseDTO> {
    const userId = request.userId;
    const limit = request.limit || 10;
    const excludedProductIds = await this.getExcludedProductIds(
      userId,
      request.excludeProductIds || []
    );
    const offlineArtifactHealth = await inspectOfflineRecommendationArtifacts();
    const offlineFreshnessMinutes = offlineArtifactHealth.freshnessWindowMinutes;
    const offlineServingDisabledReason = this.getOfflineServingDisabledReason(offlineArtifactHealth);

    const activeOfflineResult = await this.getActiveOfflineRecommendations({
      userId,
      limit,
      excludedProductIds,
      freshnessWindowMinutes: offlineFreshnessMinutes,
      offlineServingDisabledReason,
    });
    const finalizedActiveOfflineRecommendations = await this.finalizeHomepageRecommendations(
      activeOfflineResult.recommendations,
      limit
    );

    if (finalizedActiveOfflineRecommendations.length > 0) {
      const strategy = this.getStrategyForSource(activeOfflineResult.decision.source);

      this.logDecision('homepage', activeOfflineResult.decision, {
        cacheStatus: 'hit',
        artifactState: offlineArtifactHealth.state,
        resultCount: finalizedActiveOfflineRecommendations.length,
      });

      return {
        userId,
        recommendations: finalizedActiveOfflineRecommendations.map((r) => r.toJSON()),
        strategy,
        fromCache: true,
        generatedAt:
          finalizedActiveOfflineRecommendations[0]?.createdAt.toISOString() || new Date().toISOString(),
        decision: activeOfflineResult.decision,
      };
    }

    const activeOfflineUnavailableReason =
      activeOfflineResult.recommendations.length > 0
        ? this.combineReasons(
            activeOfflineResult.decision.fallbackReason,
            'offline-cache-invalid-homepage-output'
          )
        : activeOfflineResult.decision.fallbackReason;

    const userPreference = await this.userBehaviorRepository.deriveUserPreferences(userId);
    const candidateProductIds = await this.getCandidateProducts(
      userId,
      request.categoryFilter
    );
    const candidateProductFeatures = await this.productFeatureRepository.getByIds(candidateProductIds);
    const fallbackProducts = await this.productFeatureRepository.getFallbackProducts(
      Math.max(limit * 3, 20),
      request.categoryFilter
    );
    const engineProductFeatures = candidateProductFeatures.length > 0
      ? candidateProductFeatures
      : fallbackProducts;
    const recommendationRequest = {
      userId,
      strategy: this.mapStrategy(request.strategy || 'hybrid'),
      limit,
      excludeProductIds: excludedProductIds,
      categoryFilter: request.categoryFilter,
    };
    const [offlineCandidates, contentCandidates] = await Promise.all([
      offlineServingDisabledReason
        ? Promise.resolve({
            recommendations: [],
            unavailableReason: offlineServingDisabledReason,
          })
        : this.safeGenerateRecommendations(
            this.offlineRecommendationEngine,
            recommendationRequest,
            userPreference,
            engineProductFeatures,
            'offline-artifact-unavailable'
          ),
      this.safeGenerateRecommendations(
        this.contentRecommendationEngine,
        recommendationRequest,
        userPreference,
        engineProductFeatures,
        'content-engine-unavailable'
      ),
    ]);
    const resolution = this.resolveDecisionTree({
      activeOfflineRecommendations: finalizedActiveOfflineRecommendations,
      activeOfflineUnavailableReason,
      offlineCandidates,
      contentCandidates,
      fallbackProducts,
      excludedProductIds,
      limit,
    });
    const finalizedRecommendations = await this.finalizeHomepageRecommendations(
      resolution.recommendations,
      limit,
      [...candidateProductFeatures, ...fallbackProducts]
    );

    if (finalizedRecommendations.length > 0) {
      await this.recommendationRepository.save(
        userId,
        finalizedRecommendations,
        this.getCacheAlgorithmForSource(resolution.decision.source)
      );
    }

    const strategy = this.getStrategyForSource(resolution.decision.source);
    this.logDecision('homepage', resolution.decision, {
      cacheStatus: 'miss',
      artifactState: offlineArtifactHealth.state,
      resultCount: finalizedRecommendations.length,
    });

    return {
      userId,
      recommendations: finalizedRecommendations.map((r) => r.toJSON()),
      strategy,
      fromCache: false,
      generatedAt: new Date().toISOString(),
      decision: resolution.decision,
    };
  }

  async executeSimilarProducts(
    productId: number,
    limit: number
  ): Promise<GetSimilarProductsResponseDTO> {
    const excludedProductIds = [productId];
    const targetProduct = await this.productFeatureRepository.getById(productId);

    if (!targetProduct) {
      return {
        productId,
        recommendations: [] as GetSimilarProductsResponseDTO['recommendations'],
        strategy: this.getStrategyForSource('hidden'),
        generatedAt: new Date().toISOString(),
        decision: {
          source: 'hidden',
          branch: 'similar_product_source_unavailable',
          fallbackReason: 'source-product-unavailable',
          hidden: true,
        },
      };
    }

    const offlineArtifactHealth = await inspectOfflineRecommendationArtifacts();
    const offlineFreshnessMinutes = offlineArtifactHealth.freshnessWindowMinutes;
    const offlineServingDisabledReason = this.getOfflineServingDisabledReason(offlineArtifactHealth);
    const activeOfflineRecommendations = await this.getActiveOfflineSimilarRecommendations(
      productId,
      limit,
      excludedProductIds,
      offlineFreshnessMinutes,
      offlineServingDisabledReason
    );
    const fallbackProducts = await this.productFeatureRepository.getFallbackProducts(
      Math.max(limit * 3, 20),
      targetProduct?.categoryId
    );
    const finalizedActiveOfflineRecommendations = await this.finalizeSimilarRecommendations(
      activeOfflineRecommendations.recommendations,
      excludedProductIds,
      limit
    );

    if (finalizedActiveOfflineRecommendations.length > 0) {
      const strategy = this.getStrategyForSource(activeOfflineRecommendations.decision.source);
      this.logDecision('similar', activeOfflineRecommendations.decision, {
        cacheStatus: 'hit',
        artifactState: offlineArtifactHealth.state,
        resultCount: finalizedActiveOfflineRecommendations.length,
      });

      return {
        productId,
        recommendations: finalizedActiveOfflineRecommendations.map((r) => r.toJSON()),
        strategy,
        generatedAt: new Date().toISOString(),
        decision: activeOfflineRecommendations.decision,
      };
    }

    const activeOfflineUnavailableReason =
      activeOfflineRecommendations.recommendations.length > 0
        ? this.combineReasons(
            activeOfflineRecommendations.decision.fallbackReason,
            'offline-precomputed-invalid-similar-output'
          )
        : activeOfflineRecommendations.decision.fallbackReason;

    const [offlineCandidates, contentCandidates] = await Promise.all([
      offlineServingDisabledReason
        ? Promise.resolve({
            recommendations: [],
            unavailableReason: offlineServingDisabledReason,
          })
        : this.safeGetSimilarProducts(
            this.offlineRecommendationEngine,
            productId,
            limit,
            excludedProductIds,
            'offline-artifact-unavailable'
          ),
      this.safeGetSimilarProducts(
        this.contentRecommendationEngine,
        productId,
        limit,
        excludedProductIds,
            'content-engine-unavailable'
          ),
    ]);
    const [finalizedOfflineCandidates, finalizedContentCandidates] = await Promise.all([
      this.finalizeSimilarCandidates(offlineCandidates, excludedProductIds, limit),
      this.finalizeSimilarCandidates(contentCandidates, excludedProductIds, limit),
    ]);
    const resolution = this.resolveDecisionTree({
      activeOfflineRecommendations: finalizedActiveOfflineRecommendations,
      activeOfflineUnavailableReason,
      offlineCandidates: finalizedOfflineCandidates,
      contentCandidates: finalizedContentCandidates,
      fallbackProducts,
      excludedProductIds,
      limit,
    });
    const strategy = this.getStrategyForSource(resolution.decision.source);

    this.logDecision('similar', resolution.decision, {
      cacheStatus: 'miss',
      artifactState: offlineArtifactHealth.state,
      resultCount: resolution.recommendations.length,
    });

    return {
      productId,
      recommendations: resolution.recommendations.map((r) => r.toJSON()),
      strategy,
      generatedAt: new Date().toISOString(),
      decision: resolution.decision,
    };
  }

  /**
   * Get candidate products for recommendations
   */
  private async getCandidateProducts(
    userId: number,
    categoryFilter?: number
  ): Promise<number[]> {
    // Get popular products as candidates
    const popularProducts = await this.userBehaviorRepository.getPopularProducts(
      100,
      categoryFilter
    );

    // Get products from user's browsing history
    const userHistory = await this.userBehaviorRepository.getBehaviorHistory(userId, 50);
    const userViewedProducts = userHistory
      .filter((log) => log.productId)
      .map((log) => log.productId!);

    // Combine and deduplicate
    const combined = [...new Set([...popularProducts, ...userViewedProducts])];

    return combined.slice(0, 200); // Limit candidates
  }

  private buildFallbackRecommendations(
    productFeatures: ProductFeature[],
    excludedProductIds: number[],
    limit: number
  ): Recommendation[] {
    const sortedProductFeatures = [...productFeatures]
      .filter((productFeature) => productFeature.productId > 0)
      .sort((left, right) => {
        const leftScore = this.calculateFallbackScore(left);
        const rightScore = this.calculateFallbackScore(right);
        return rightScore - leftScore;
      });

    return this.filterEligibleItems(
      sortedProductFeatures,
      excludedProductIds,
      limit
    ).map((productFeature) =>
      Recommendation.create(
        productFeature.productId,
        this.calculateFallbackScore(productFeature),
        this.generateFallbackReason(productFeature)
      )
    );
  }

  private filterEligibleItems<T extends EligibleItem>(
    items: T[],
    excludedProductIds: number[],
    limit: number
  ): T[] {
    const excludedProductIdSet = new Set(excludedProductIds);
    const seenProductIds = new Set<number>();

    return items
      .filter((productFeature) => !excludedProductIdSet.has(productFeature.productId))
      .filter((item) => {
        if (seenProductIds.has(item.productId)) {
          return false;
        }

        seenProductIds.add(item.productId);
        return true;
      })
      .slice(0, limit);
  }

  private calculateFallbackScore(productFeature: ProductFeature): number {
    const ratingScore = productFeature.avgRating > 0
      ? Math.min(productFeature.avgRating / 5, 1) * 0.55
      : 0.25;
    const reviewScore = Math.min(productFeature.reviewCount / 50, 1) * 0.25;
    const purchaseScore = Math.min(productFeature.purchaseCount / 100, 1) * 0.2;

    return Number(Math.min(ratingScore + reviewScore + purchaseScore, 1).toFixed(6));
  }

  private generateFallbackReason(productFeature: ProductFeature): string {
    if (productFeature.avgRating >= 4) {
      return 'popular and highly rated';
    }

    if (productFeature.reviewCount > 0) {
      return 'popular with shoppers';
    }

    return 'popular product';
  }

  private async getExcludedProductIds(
    userId: number,
    requestExcludedProductIds: number[]
  ): Promise<number[]> {
    const [strongSignalHistory, recentViewHistory] = await Promise.all([
      this.userBehaviorRepository.getBehaviorHistory(userId, 100, [
        BehaviorType.PURCHASE,
        BehaviorType.ADD_TO_CART,
        BehaviorType.WISHLIST,
      ]),
      this.userBehaviorRepository.getBehaviorHistory(userId, 30, [BehaviorType.VIEW]),
    ]);

    const repeatedViewProductIds = this.getRepeatedViewProductIds(recentViewHistory, 2);
    const strongSignalProductIds = strongSignalHistory
      .filter((log) => log.productId)
      .map((log) => log.productId!);

    return [
      ...new Set([
        ...requestExcludedProductIds,
        ...strongSignalProductIds,
        ...repeatedViewProductIds,
      ]),
    ];
  }

  private getRepeatedViewProductIds(logs: UserBehaviorLog[], threshold: number): number[] {
    const productViewCounts = new Map<number, number>();

    for (const log of logs) {
      if (!log.productId) {
        continue;
      }

      productViewCounts.set(log.productId, (productViewCounts.get(log.productId) || 0) + 1);
    }

    return Array.from(productViewCounts.entries())
      .filter(([, count]) => count >= threshold)
      .map(([productId]) => productId);
  }

  private filterRecommendations(
    recommendations: Recommendation[],
    excludedProductIds: number[],
    limit: number
  ): Recommendation[] {
    return this.filterEligibleItems(recommendations, excludedProductIds, limit);
  }

  private async getActiveOfflineRecommendations(params: {
    userId: number;
    limit: number;
    excludedProductIds: number[];
    freshnessWindowMinutes: number;
    offlineServingDisabledReason?: string;
  }): Promise<DecisionTreeResolution> {
    if (params.offlineServingDisabledReason) {
      return {
        recommendations: [],
        decision: {
          source: 'hidden',
          branch: 'active_offline_cache_unavailable',
          fallbackReason: params.offlineServingDisabledReason,
          hidden: true,
        },
      };
    }

    const hasFreshOfflineCache = await this.recommendationRepository.hasFreshRecommendations(
      params.userId,
      params.freshnessWindowMinutes,
      'offline_model'
    );

    if (!hasFreshOfflineCache) {
      return {
        recommendations: [],
        decision: {
          source: 'hidden',
          branch: 'active_offline_cache_unavailable',
          fallbackReason: 'offline-cache-missing-or-stale',
          hidden: true,
        },
      };
    }

    const cachedRecommendations = await this.recommendationRepository.findByUserId(
      params.userId,
      'offline_model'
    );
    const filteredRecommendations = this.filterRecommendations(
      cachedRecommendations,
      params.excludedProductIds,
      params.limit
    );

    if (filteredRecommendations.length === 0) {
      return {
        recommendations: [],
        decision: {
          source: 'hidden',
          branch: 'active_offline_cache_ineligible',
          fallbackReason: 'offline-cache-ineligible',
          hidden: true,
        },
      };
    }

    return {
      recommendations: filteredRecommendations,
      decision: {
        source: 'offline',
        branch: 'active_cached_offline',
        hidden: false,
      },
    };
  }

  private async getActiveOfflineSimilarRecommendations(
    productId: number,
    limit: number,
    excludedProductIds: number[],
    freshnessWindowMinutes: number,
    offlineServingDisabledReason?: string
  ): Promise<DecisionTreeResolution> {
    if (offlineServingDisabledReason) {
      return {
        recommendations: [],
        decision: {
          source: 'hidden',
          branch: 'active_offline_precomputed_unavailable',
          fallbackReason: offlineServingDisabledReason,
          hidden: true,
        },
      };
    }

    const isFresh = await this.isOfflineArtifactFresh(freshnessWindowMinutes);

    if (!isFresh) {
      return {
        recommendations: [],
        decision: {
          source: 'hidden',
          branch: 'active_offline_precomputed_unavailable',
          fallbackReason: 'offline-precomputed-missing-or-stale',
          hidden: true,
        },
      };
    }

    const offlineSimilar = await this.safeGetSimilarProducts(
      this.offlineRecommendationEngine,
      productId,
      limit,
      excludedProductIds,
      'offline-artifact-unavailable'
    );

    if (offlineSimilar.recommendations.length === 0) {
      return {
        recommendations: [],
        decision: {
          source: 'hidden',
          branch: 'active_offline_precomputed_ineligible',
          fallbackReason: offlineSimilar.unavailableReason || 'offline-precomputed-ineligible',
          hidden: true,
        },
      };
    }

    return {
      recommendations: offlineSimilar.recommendations,
      decision: {
        source: 'offline',
        branch: 'active_precomputed_offline',
        hidden: false,
      },
    };
  }

  private async safeGenerateRecommendations(
    engine: IRecommendationEngine,
    request: {
      userId: number;
      strategy: RecommendationStrategy;
      limit: number;
      excludeProductIds: number[];
      categoryFilter?: number;
    },
    userPreference: any,
    productFeatures: ProductFeature[],
    unavailableReason: string
  ): Promise<CandidateResult> {
    try {
      const recommendations = await engine.generateRecommendations(
        request,
        userPreference,
        productFeatures
      );
      const filteredRecommendations = this.filterRecommendations(
        recommendations,
        request.excludeProductIds,
        request.limit
      );

      return {
        recommendations: filteredRecommendations,
        unavailableReason: filteredRecommendations.length > 0 ? undefined : unavailableReason,
      };
    } catch {
      return {
        recommendations: [],
        unavailableReason,
      };
    }
  }

  private async safeGetSimilarProducts(
    engine: IRecommendationEngine,
    productId: number,
    limit: number,
    excludedProductIds: number[],
    unavailableReason: string
  ): Promise<CandidateResult> {
    try {
      const recommendations = await engine.getSimilarProducts(productId, limit);
      const filteredRecommendations = this.filterRecommendations(
        recommendations,
        excludedProductIds,
        limit
      );

      return {
        recommendations: filteredRecommendations,
        unavailableReason: filteredRecommendations.length > 0 ? undefined : unavailableReason,
      };
    } catch {
      return {
        recommendations: [],
        unavailableReason,
      };
    }
  }

  private async finalizeSimilarCandidates(
    candidate: CandidateResult,
    excludedProductIds: number[],
    limit: number
  ): Promise<CandidateResult> {
    const recommendations = await this.finalizeSimilarRecommendations(
      candidate.recommendations,
      excludedProductIds,
      limit
    );

    return {
      recommendations,
      unavailableReason: recommendations.length > 0 ? undefined : candidate.unavailableReason,
    };
  }

  private async finalizeSimilarRecommendations(
    recommendations: Recommendation[],
    excludedProductIds: number[],
    limit: number,
    knownFeatures: ProductFeature[] = []
  ): Promise<Recommendation[]> {
    if (recommendations.length === 0 || limit <= 0) {
      return [];
    }

    const featureByProductId = await this.getRecommendationFeatureMap(
      recommendations,
      knownFeatures
    );

    return this.filterRecommendations(
      recommendations.filter((recommendation) => featureByProductId.has(recommendation.productId)),
      excludedProductIds,
      limit
    );
  }

  private resolveDecisionTree(params: {
    activeOfflineRecommendations: Recommendation[];
    activeOfflineUnavailableReason?: string;
    offlineCandidates: CandidateResult;
    contentCandidates: CandidateResult;
    fallbackProducts: ProductFeature[];
    excludedProductIds: number[];
    limit: number;
  }): DecisionTreeResolution {
    const fallbackRecommendations = this.buildFallbackRecommendations(
      params.fallbackProducts,
      params.excludedProductIds,
      params.limit
    );

    if (params.activeOfflineRecommendations.length > 0) {
      return {
        recommendations: params.activeOfflineRecommendations,
        decision: {
          source: 'offline',
          branch: 'active_offline_precomputed',
          hidden: false,
        },
      };
    }

    if (
      params.offlineCandidates.recommendations.length > 0 &&
      params.contentCandidates.recommendations.length > 0
    ) {
      return {
        recommendations: this.blendRecommendations(
          params.offlineCandidates.recommendations,
          params.contentCandidates.recommendations,
          params.limit
        ),
        decision: {
          source: 'hybrid',
          branch: 'blend_offline_and_content',
          fallbackReason:
            params.activeOfflineUnavailableReason || 'active-offline-precomputed-unavailable',
          hidden: false,
        },
      };
    }

    if (params.offlineCandidates.recommendations.length > 0) {
      return {
        recommendations: params.offlineCandidates.recommendations,
        decision: {
          source: 'offline',
          branch: 'offline_only',
          fallbackReason: this.combineReasons(
            params.activeOfflineUnavailableReason,
            params.contentCandidates.unavailableReason || 'content-unavailable'
          ),
          hidden: false,
        },
      };
    }

    if (params.contentCandidates.recommendations.length > 0) {
      return {
        recommendations: params.contentCandidates.recommendations,
        decision: {
          source: 'content',
          branch: 'content_only',
          fallbackReason:
            params.offlineCandidates.unavailableReason ||
            params.activeOfflineUnavailableReason ||
            'offline-unavailable',
          hidden: false,
        },
      };
    }

    if (fallbackRecommendations.length > 0) {
      return {
        recommendations: fallbackRecommendations,
        decision: {
          source: 'fallback',
          branch: 'deterministic_popularity_fallback',
          fallbackReason: this.combineReasons(
            params.offlineCandidates.unavailableReason || params.activeOfflineUnavailableReason,
            params.contentCandidates.unavailableReason || 'content-unavailable'
          ),
          hidden: false,
        },
      };
    }

    return {
      recommendations: [],
      decision: {
        source: 'hidden',
        branch: 'hide_module',
        fallbackReason: this.combineReasons(
          params.offlineCandidates.unavailableReason || params.activeOfflineUnavailableReason,
          params.contentCandidates.unavailableReason || 'content-unavailable',
          'fallback-unavailable'
        ),
        hidden: true,
      },
    };
  }

  private blendRecommendations(
    offlineRecommendations: Recommendation[],
    contentRecommendations: Recommendation[],
    limit: number
  ): Recommendation[] {
    const offlineNormalizedScores = this.normalizeRecommendationScores(offlineRecommendations);
    const contentNormalizedScores = this.normalizeRecommendationScores(contentRecommendations);
    const blendedByProductId = new Map<number, { offline?: Recommendation; content?: Recommendation }>();

    for (const recommendation of offlineRecommendations) {
      blendedByProductId.set(recommendation.productId, {
        ...blendedByProductId.get(recommendation.productId),
        offline: recommendation,
      });
    }

    for (const recommendation of contentRecommendations) {
      blendedByProductId.set(recommendation.productId, {
        ...blendedByProductId.get(recommendation.productId),
        content: recommendation,
      });
    }

    return Array.from(blendedByProductId.entries())
      .map(([productId, sources]) => {
        const offlineScore = offlineNormalizedScores.get(productId) || 0;
        const contentScore = contentNormalizedScores.get(productId) || 0;
        const blendedScore = this.roundNormalizedScore(offlineScore * 0.6 + contentScore * 0.4);
        const reason =
          this.combineReasons(sources.offline?.reason, sources.content?.reason) ||
          'blended offline and content recommendation';

        return {
          recommendation: Recommendation.create(productId, blendedScore, reason),
          sourceCount: Number(Boolean(sources.offline)) + Number(Boolean(sources.content)),
          offlineScore,
          contentScore,
        };
      })
      .sort((left, right) => {
        const scoreDelta =
          right.recommendation.score.toNumber() - left.recommendation.score.toNumber();
        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        const sourceCountDelta = right.sourceCount - left.sourceCount;
        if (sourceCountDelta !== 0) {
          return sourceCountDelta;
        }

        const strongestSourceDelta =
          Math.max(right.offlineScore, right.contentScore) -
          Math.max(left.offlineScore, left.contentScore);
        if (strongestSourceDelta !== 0) {
          return strongestSourceDelta;
        }

        const offlineDelta = right.offlineScore - left.offlineScore;
        if (offlineDelta !== 0) {
          return offlineDelta;
        }

        const contentDelta = right.contentScore - left.contentScore;
        if (contentDelta !== 0) {
          return contentDelta;
        }

        return left.recommendation.productId - right.recommendation.productId;
      })
      .slice(0, limit)
      .map(({ recommendation }) => recommendation);
  }

  private normalizeRecommendationScores(recommendations: Recommendation[]): Map<number, number> {
    if (recommendations.length === 0) {
      return new Map();
    }

    const scores = recommendations.map((recommendation) => ({
      productId: recommendation.productId,
      score: this.clampNormalizedScore(recommendation.score.toNumber()),
    }));
    const minScore = scores.reduce((currentMin, { score }) => Math.min(currentMin, score), 1);
    const maxScore = scores.reduce((currentMax, { score }) => Math.max(currentMax, score), 0);

    if (maxScore === minScore) {
      return new Map(
        scores.map(({ productId, score }) => [productId, score > 0 ? 1 : 0])
      );
    }

    return new Map(
      scores.map(({ productId, score }) => [
        productId,
        this.roundNormalizedScore((score - minScore) / (maxScore - minScore)),
      ])
    );
  }

  private async finalizeHomepageRecommendations(
    recommendations: Recommendation[],
    limit: number,
    knownFeatures: ProductFeature[] = []
  ): Promise<Recommendation[]> {
    if (recommendations.length === 0 || limit <= 0) {
      return [];
    }

    const featureByProductId = await this.getHomepageFeatureMap(recommendations, knownFeatures);
    const validRecommendations = this.filterRecommendations(
      recommendations.filter((recommendation) => featureByProductId.has(recommendation.productId)),
      [],
      limit
    );

    if (validRecommendations.length <= 1) {
      return validRecommendations;
    }

    const visibleSetSize = Math.min(
      HOMEPAGE_VISIBLE_SET_SIZE,
      limit,
      validRecommendations.length
    );

    if (visibleSetSize <= 1) {
      return validRecommendations;
    }

    const diversifiedVisibleSet = this.selectDiversifiedHomepageVisibleSet(
      validRecommendations,
      featureByProductId,
      visibleSetSize
    );
    const selectedProductIds = new Set(
      diversifiedVisibleSet.map((recommendation) => recommendation.productId)
    );
    const remainingRecommendations = validRecommendations.filter(
      (recommendation) => !selectedProductIds.has(recommendation.productId)
    );

    return [...diversifiedVisibleSet, ...remainingRecommendations].slice(0, limit);
  }

  private async getHomepageFeatureMap(
    recommendations: Recommendation[],
    knownFeatures: ProductFeature[]
  ): Promise<Map<number, ProductFeature>> {
    return this.getRecommendationFeatureMap(recommendations, knownFeatures);
  }

  private async getRecommendationFeatureMap(
    recommendations: Recommendation[],
    knownFeatures: ProductFeature[]
  ): Promise<Map<number, ProductFeature>> {
    const featureByProductId = new Map(
      knownFeatures.map((productFeature) => [productFeature.productId, productFeature])
    );
    const missingProductIds = recommendations
      .map((recommendation) => recommendation.productId)
      .filter((productId) => !featureByProductId.has(productId));

    if (missingProductIds.length === 0) {
      return featureByProductId;
    }

    const fetchedFeatures =
      (await this.productFeatureRepository.getByIds(Array.from(new Set(missingProductIds)))) || [];

    for (const productFeature of fetchedFeatures) {
      featureByProductId.set(productFeature.productId, productFeature);
    }

    return featureByProductId;
  }

  private selectDiversifiedHomepageVisibleSet(
    recommendations: Recommendation[],
    featureByProductId: Map<number, ProductFeature>,
    visibleSetSize: number
  ): Recommendation[] {
    const selected: Recommendation[] = [];
    const remaining = [...recommendations];

    while (selected.length < visibleSetSize && remaining.length > 0) {
      let bestIndex = 0;
      let bestPenalty = this.getHomepageDiversityPenalty(
        selected,
        remaining[0],
        featureByProductId
      );

      for (let index = 1; index < remaining.length; index += 1) {
        const candidatePenalty = this.getHomepageDiversityPenalty(
          selected,
          remaining[index],
          featureByProductId
        );

        if (this.comparePenaltyTuples(candidatePenalty, bestPenalty) < 0) {
          bestIndex = index;
          bestPenalty = candidatePenalty;
        }
      }

      selected.push(remaining.splice(bestIndex, 1)[0]);
    }

    return selected;
  }

  private getHomepageDiversityPenalty(
    selected: Recommendation[],
    candidate: Recommendation,
    featureByProductId: Map<number, ProductFeature>
  ): [number, number, number, number] {
    const candidateFeature = featureByProductId.get(candidate.productId);
    const previousFeature = selected.length
      ? featureByProductId.get(selected[selected.length - 1].productId)
      : undefined;
    const selectedCategoryIds = new Set<number>();
    const selectedBrandIds = new Set<number>();

    for (const recommendation of selected) {
      const feature = featureByProductId.get(recommendation.productId);
      if (!feature) {
        continue;
      }

      if (feature.categoryId > 0) {
        selectedCategoryIds.add(feature.categoryId);
      }

      if (feature.brandId !== null && feature.brandId > 0) {
        selectedBrandIds.add(feature.brandId);
      }
    }

    const candidateCategoryId = candidateFeature?.categoryId ?? 0;
    const candidateBrandId = candidateFeature?.brandId ?? null;

    return [
      Number(
        Boolean(
          previousFeature &&
            candidateBrandId !== null &&
            previousFeature.brandId !== null &&
            previousFeature.brandId === candidateBrandId
        )
      ),
      Number(Boolean(previousFeature && previousFeature.categoryId === candidateCategoryId)),
      Number(Boolean(candidateBrandId !== null && selectedBrandIds.has(candidateBrandId))),
      Number(Boolean(candidateCategoryId > 0 && selectedCategoryIds.has(candidateCategoryId))),
    ];
  }

  private comparePenaltyTuples(
    left: [number, number, number, number],
    right: [number, number, number, number]
  ): number {
    for (let index = 0; index < left.length; index += 1) {
      const delta = left[index] - right[index];
      if (delta !== 0) {
        return delta;
      }
    }

    return 0;
  }

  private clampNormalizedScore(score: number): number {
    if (!Number.isFinite(score) || score <= 0) {
      return 0;
    }

    if (score >= 1) {
      return 1;
    }

    return score;
  }

  private roundNormalizedScore(score: number): number {
    return Number(this.clampNormalizedScore(score).toFixed(6));
  }

  private async isOfflineArtifactFresh(maxAgeMinutes: number): Promise<boolean> {
    if (typeof this.offlineRecommendationEngine.isArtifactFresh !== 'function') {
      return false;
    }

    try {
      return await this.offlineRecommendationEngine.isArtifactFresh(maxAgeMinutes);
    } catch {
      return false;
    }
  }

  private getOfflineServingDisabledReason(artifactHealth: {
    state: 'healthy' | 'stale' | 'missing' | 'invalid';
    rollback: { forced: boolean };
  }): string | undefined {
    if (artifactHealth.rollback.forced) {
      return 'offline-rollback-forced';
    }

    switch (artifactHealth.state) {
      case 'healthy':
        return undefined;
      case 'stale':
        return 'offline-artifact-stale';
      case 'missing':
        return 'offline-artifact-missing';
      case 'invalid':
      default:
        return 'offline-artifact-invalid';
    }
  }

  private getStrategyForSource(source: RecommendationDecisionSource): string {
    switch (source) {
      case 'offline':
        return RecommendationStrategy.COLLABORATIVE_FILTERING;
      case 'hybrid':
        return RecommendationStrategy.HYBRID;
      case 'content':
        return RecommendationStrategy.CONTENT_BASED;
      case 'fallback':
      case 'hidden':
      default:
        return RecommendationStrategy.POPULARITY;
    }
  }

  private getCacheAlgorithmForSource(source: RecommendationDecisionSource): string {
    switch (source) {
      case 'offline':
        return 'offline_model';
      case 'hybrid':
        return 'hybrid';
      case 'content':
        return 'content_based';
      case 'fallback':
      case 'hidden':
      default:
        return 'fallback';
    }
  }

  private combineReasons(...reasons: Array<string | undefined>): string | undefined {
    const uniqueReasons = Array.from(
      new Set(reasons.filter((reason): reason is string => Boolean(reason?.trim())))
    );

    if (uniqueReasons.length === 0) {
      return undefined;
    }

    return uniqueReasons.join('; ');
  }

  private logDecision(
    surface: 'homepage' | 'similar',
    decision: RecommendationDecisionMetadata,
    telemetry: {
      cacheStatus: 'hit' | 'miss';
      artifactState: 'healthy' | 'stale' | 'missing' | 'invalid';
      resultCount: number;
    }
  ): void {
    logRecommendationTrace({
      surface,
      source: decision.source,
      branch: decision.branch,
      fallbackReason: decision.fallbackReason,
      cacheStatus: telemetry.cacheStatus,
      artifactState: telemetry.artifactState,
      resultCount: telemetry.resultCount,
    });
  }

  /**
   * Map DTO strategy to domain strategy
   */
  private mapStrategy(strategy: string): RecommendationStrategy {
    const strategyMap: Record<string, RecommendationStrategy> = {
      collaborative: RecommendationStrategy.COLLABORATIVE_FILTERING,
      content: RecommendationStrategy.CONTENT_BASED,
      hybrid: RecommendationStrategy.HYBRID,
      popularity: RecommendationStrategy.POPULARITY,
    };

    return strategyMap[strategy] || RecommendationStrategy.HYBRID;
  }
}
