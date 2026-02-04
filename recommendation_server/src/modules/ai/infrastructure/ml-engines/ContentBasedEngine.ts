import {
  IRecommendationEngine,
  RecommendationStrategy,
  RecommendationRequest,
} from '../../domain/services/IRecommendationEngine';
import { Recommendation } from '../../domain/entities/Recommendation';
import { UserPreference } from '../../domain/entities/UserPreference';
import { ProductFeature } from '../../domain/repositories/IProductFeatureRepository';

/**
 * Adapter: Content-Based Recommendation Engine
 *
 * This adapter implements the IRecommendationEngine port using
 * content-based filtering algorithm (feature similarity).
 *
 * Hexagonal Architecture principle: This is swappable with other
 * implementations (collaborative filtering, neural networks, etc.)
 */
export class ContentBasedEngine implements IRecommendationEngine {
  getStrategy(): RecommendationStrategy {
    return RecommendationStrategy.CONTENT_BASED;
  }

  async generateRecommendations(
    request: RecommendationRequest,
    userPreference: UserPreference,
    productFeatures: ProductFeature[]
  ): Promise<Recommendation[]> {
    // Filter products based on user preferences
    const filteredProducts = productFeatures.filter((product) => {
      // Exclude products in exclusion list
      if (request.excludeProductIds?.includes(product.productId)) {
        return false;
      }

      // Apply category filter if specified
      if (request.categoryFilter && product.categoryId !== request.categoryFilter) {
        return false;
      }

      return true;
    });

    // Score products based on user preferences
    const scoredProducts = filteredProducts.map((product) => {
      const score = this.calculateContentScore(product, userPreference);
      const reason = this.generateReason(product, userPreference);

      return Recommendation.create(product.productId, score, reason);
    });

    // Sort by score descending
    scoredProducts.sort((a, b) => b.score.toNumber() - a.score.toNumber());

    // Return top N
    return scoredProducts.slice(0, request.limit);
  }

  async getSimilarProducts(
    productId: number,
    limit: number
  ): Promise<Recommendation[]> {
    // Simplified: would use feature vector similarity in production
    // For now, return empty (to be implemented with actual product features)
    return [];
  }

  /**
   * Calculate content-based score
   * Score based on: category match, brand match, price range, ratings
   */
  private calculateContentScore(
    product: ProductFeature,
    userPreference: UserPreference
  ): number {
    let score = 0;
    let weightSum = 0;

    // Category preference (weight: 0.4)
    if (userPreference.prefersCategory(product.categoryId)) {
      score += 0.4;
    }
    weightSum += 0.4;

    // Brand preference (weight: 0.2)
    if (product.brandId && userPreference.prefersBrand(product.brandId)) {
      score += 0.2;
    }
    weightSum += 0.2;

    // Price range match (weight: 0.2)
    if (userPreference.isInPriceRange(product.price)) {
      score += 0.2;
    }
    weightSum += 0.2;

    // Product quality (weight: 0.2)
    // Normalize rating (0-5 scale to 0-1 scale)
    const ratingScore = (product.avgRating / 5) * 0.2;
    score += ratingScore;
    weightSum += 0.2;

    // Normalize to 0-1 range
    return Math.min(score / weightSum, 1.0);
  }

  /**
   * Generate human-readable reason for recommendation
   */
  private generateReason(
    product: ProductFeature,
    userPreference: UserPreference
  ): string {
    const reasons: string[] = [];

    if (userPreference.prefersCategory(product.categoryId)) {
      reasons.push('matches your preferred category');
    }

    if (product.brandId && userPreference.prefersBrand(product.brandId)) {
      reasons.push('from a brand you like');
    }

    if (userPreference.isInPriceRange(product.price)) {
      reasons.push('within your price range');
    }

    if (product.avgRating >= 4.0) {
      reasons.push('highly rated');
    }

    if (product.purchaseCount > 100) {
      reasons.push('popular choice');
    }

    return reasons.length > 0
      ? reasons.join(', ')
      : 'recommended for you';
  }
}
