import { IRecommendationRepository } from '../../domain/repositories/IRecommendationRepository';
import { IUserBehaviorRepository } from '../../domain/repositories/IUserBehaviorRepository';
import { IProductFeatureRepository } from '../../domain/repositories/IProductFeatureRepository';
import { IRecommendationEngine } from '../../domain/services/IRecommendationEngine';
import { RecommendationStrategy } from '../../domain/services/IRecommendationEngine';
import { GetRecommendationsRequestDTO } from '../dto/GetRecommendationsRequest';
import { GetRecommendationsResponseDTO } from '../dto/GetRecommendationsResponse';

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

    // 1. Check cache first
    const hasFreshCache = await this.recommendationRepository.hasFreshRecommendations(
      userId,
      cacheMaxAgeMinutes
    );

    if (hasFreshCache) {
      const cachedRecommendations = await this.recommendationRepository.findByUserId(userId);

      return {
        userId,
        recommendations: cachedRecommendations.map((r) => r.toJSON()),
        strategy: this.recommendationEngine.getStrategy(),
        fromCache: true,
        generatedAt: cachedRecommendations[0]?.createdAt.toISOString() || new Date().toISOString(),
      };
    }

    // 2. Get user preferences from behavior history
    const userPreference = await this.userBehaviorRepository.deriveUserPreferences(userId);

    // 3. Get product features for candidate products
    const candidateProductIds = await this.getCandidateProducts(
      userId,
      request.categoryFilter
    );
    const productFeatures = await this.productFeatureRepository.getByIds(candidateProductIds);

    // 4. Generate recommendations using ML engine
    const recommendations = await this.recommendationEngine.generateRecommendations(
      {
        userId,
        strategy,
        limit,
        excludeProductIds: request.excludeProductIds || [],
        categoryFilter: request.categoryFilter,
      },
      userPreference,
      productFeatures
    );

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
