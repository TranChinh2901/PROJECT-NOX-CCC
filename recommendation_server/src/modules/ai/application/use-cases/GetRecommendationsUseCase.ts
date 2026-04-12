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
import { Recommendation } from '../../domain/entities/Recommendation';

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
    private readonly recommendationEngine: IRecommendationEngine
  ) {}

  /**
   * Execute the use case
   */
  async execute(
    request: GetRecommendationsRequestDTO
  ): Promise<GetRecommendationsResponseDTO> {
    const userId = request.userId;
    const strategy = this.mapStrategy(request.strategy || 'hybrid');
    const limit = request.limit || 10;
    const cacheMaxAgeMinutes = 60;
    const excludedProductIds = await this.getExcludedProductIds(
      userId,
      request.excludeProductIds || []
    );

    // 1. Check cache first
    const hasFreshCache = await this.recommendationRepository.hasFreshRecommendations(
      userId,
      cacheMaxAgeMinutes
    );

    if (hasFreshCache) {
      const cachedRecommendations = await this.recommendationRepository.findByUserId(userId);
      const filteredCachedRecommendations = this.filterRecommendations(
        cachedRecommendations,
        excludedProductIds,
        limit
      );

      if (filteredCachedRecommendations.length > 0) {
        return {
          userId,
          recommendations: filteredCachedRecommendations.map((r) => r.toJSON()),
          strategy: this.recommendationEngine.getStrategy(),
          fromCache: true,
          generatedAt:
            filteredCachedRecommendations[0]?.createdAt.toISOString() || new Date().toISOString(),
        };
      }
    }

    // 2. Get user preferences from behavior history
    const userPreference = await this.userBehaviorRepository.deriveUserPreferences(userId);

    // 3. Get product features for candidate products
    const candidateProductIds = await this.getCandidateProducts(
      userId,
      request.categoryFilter
    );
    let productFeatures = await this.productFeatureRepository.getByIds(candidateProductIds);

    if (productFeatures.length === 0) {
      productFeatures = await this.productFeatureRepository.getFallbackProducts(
        Math.max(limit * 3, 20),
        request.categoryFilter
      );
    }

    // 4. Generate recommendations using ML engine
    const generatedRecommendations = await this.recommendationEngine.generateRecommendations(
      {
        userId,
        strategy,
        limit,
        excludeProductIds: excludedProductIds,
        categoryFilter: request.categoryFilter,
      },
      userPreference,
      productFeatures
    );
    let recommendations = this.filterRecommendations(
      generatedRecommendations,
      excludedProductIds,
      limit
    );

    if (recommendations.length === 0) {
      recommendations = this.buildFallbackRecommendations(
        productFeatures,
        excludedProductIds,
        limit
      );
    }

    // 5. Cache the results
    await this.recommendationRepository.save(userId, recommendations);

    // 6. Return response
    return {
      userId,
      recommendations: recommendations.map((r) => r.toJSON()),
      strategy: this.recommendationEngine.getStrategy(),
      fromCache: false,
      generatedAt: new Date().toISOString(),
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
    const excludedProductIdSet = new Set(excludedProductIds);

    return productFeatures
      .filter((productFeature) => !excludedProductIdSet.has(productFeature.productId))
      .sort((left, right) => {
        const leftScore = this.calculateFallbackScore(left);
        const rightScore = this.calculateFallbackScore(right);
        return rightScore - leftScore;
      })
      .slice(0, limit)
      .map((productFeature) =>
        Recommendation.create(
          productFeature.productId,
          this.calculateFallbackScore(productFeature),
          this.generateFallbackReason(productFeature)
        )
      );
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
    const excludedProductIdSet = new Set(excludedProductIds);

    return recommendations
      .filter((recommendation) => !excludedProductIdSet.has(recommendation.productId))
      .slice(0, limit);
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
