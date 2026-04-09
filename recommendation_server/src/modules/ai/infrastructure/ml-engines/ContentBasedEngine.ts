import {
  IRecommendationEngine,
  RecommendationStrategy,
  RecommendationRequest,
} from '../../domain/services/IRecommendationEngine';
import { Recommendation } from '../../domain/entities/Recommendation';
import { UserPreference } from '../../domain/entities/UserPreference';
import {
  IProductFeatureRepository,
  ProductFeature,
} from '../../domain/repositories/IProductFeatureRepository';

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
  constructor(
    private readonly productFeatureRepository: IProductFeatureRepository
  ) {}

  getStrategy(): RecommendationStrategy {
    return RecommendationStrategy.CONTENT_BASED;
  }

  async generateRecommendations(
    request: RecommendationRequest,
    userPreference: UserPreference,
    productFeatures: ProductFeature[]
  ): Promise<Recommendation[]> {
    const filteredProducts = productFeatures.filter((product) => {
      if (request.excludeProductIds?.includes(product.productId)) {
        return false;
      }
      if (request.categoryFilter && product.categoryId !== request.categoryFilter) {
        return false;
      }

      return true;
    });

    const scoredProducts = filteredProducts.map((product) => {
      const score = this.calculateContentScore(product, userPreference);
      const reason = this.generateReason(product, userPreference);

      return Recommendation.create(product.productId, score, reason);
    });

    scoredProducts.sort((a, b) => b.score.toNumber() - a.score.toNumber());

    return scoredProducts.slice(0, request.limit);
  }

  async getSimilarProducts(
    productId: number,
    limit: number
  ): Promise<Recommendation[]> {
    const targetProduct = await this.productFeatureRepository.getById(productId);

    if (!targetProduct) {
      return [];
    }

    const similarProducts = await this.productFeatureRepository.findSimilar(
      productId,
      Math.max(limit * 3, limit)
    );

    const scoredProducts = similarProducts
      .map((product) => {
        const score = this.calculateSimilarityScore(targetProduct, product);
        const reason = this.generateSimilarityReason(targetProduct, product);

        return Recommendation.create(product.productId, score, reason);
      })
      .sort((a, b) => b.score.toNumber() - a.score.toNumber());

    return scoredProducts.slice(0, limit);
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

  private calculateSimilarityScore(
    targetProduct: ProductFeature,
    candidateProduct: ProductFeature
  ): number {
    let score = 0;

    if (targetProduct.categoryId === candidateProduct.categoryId) {
      score += 0.45;
    }

    if (
      targetProduct.brandId &&
      candidateProduct.brandId &&
      targetProduct.brandId === candidateProduct.brandId
    ) {
      score += 0.2;
    }

    score += this.calculatePriceSimilarity(targetProduct.price, candidateProduct.price) * 0.2;

    if (candidateProduct.avgRating > 0) {
      score += Math.min(candidateProduct.avgRating / 5, 1) * 0.1;
    }

    if (candidateProduct.reviewCount > 0) {
      score += Math.min(candidateProduct.reviewCount / 50, 1) * 0.05;
    }

    return Math.min(score, 1);
  }

  private calculatePriceSimilarity(targetPrice: number, candidatePrice: number): number {
    if (targetPrice <= 0 || candidatePrice <= 0) {
      return 0;
    }

    const differenceRatio =
      Math.abs(targetPrice - candidatePrice) / Math.max(targetPrice, candidatePrice);
    return Math.max(0, 1 - differenceRatio);
  }

  private generateSimilarityReason(
    targetProduct: ProductFeature,
    candidateProduct: ProductFeature
  ): string {
    const reasons: string[] = [];

    if (targetProduct.categoryId === candidateProduct.categoryId) {
      reasons.push('same category');
    }

    if (
      targetProduct.brandId &&
      candidateProduct.brandId &&
      targetProduct.brandId === candidateProduct.brandId
    ) {
      reasons.push('same brand');
    }

    if (this.calculatePriceSimilarity(targetProduct.price, candidateProduct.price) >= 0.85) {
      reasons.push('similar price range');
    }

    if (candidateProduct.avgRating >= 4) {
      reasons.push('highly rated');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'similar product';
  }
}
